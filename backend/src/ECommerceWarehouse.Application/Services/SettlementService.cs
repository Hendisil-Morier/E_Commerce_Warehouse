using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.Contracts.Services;
using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Seller;
using ECommerceWarehouse.Domain.Constants;
using ECommerceWarehouse.Domain.Entities.Seller;
using ECommerceWarehouse.Domain.Exceptions;
using FluentValidation;

namespace ECommerceWarehouse.Application.Services;

public class SettlementService : ISettlementService
{
    private readonly ISettlementRepository _settlementRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUser _currentUser;
    private readonly IValidator<GenerateSettlementRequestDto> _generateValidator;
    private readonly IValidator<MarkSettlementPaidRequestDto> _markPaidValidator;
    private readonly IValidator<UpdateSellerCommissionRequestDto> _commissionValidator;

    public SettlementService(
        ISettlementRepository settlementRepository,
        IUnitOfWork unitOfWork,
        ICurrentUser currentUser,
        IValidator<GenerateSettlementRequestDto> generateValidator,
        IValidator<MarkSettlementPaidRequestDto> markPaidValidator,
        IValidator<UpdateSellerCommissionRequestDto> commissionValidator)
    {
        _settlementRepository = settlementRepository;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _generateValidator = generateValidator;
        _markPaidValidator = markPaidValidator;
        _commissionValidator = commissionValidator;
    }

    public Task<PagedResult<SettlementListItemDto>> GetSettlementsAsync(
        SettlementQueryDto query,
        CancellationToken cancellationToken = default)
        => _settlementRepository.GetPagedAsync(query, cancellationToken);

    public async Task<SettlementDetailDto> GetSettlementByIdAsync(long settlementId, CancellationToken cancellationToken = default)
        => await _settlementRepository.GetDetailDtoAsync(settlementId, cancellationToken)
            ?? throw new NotFoundException("SellerSettlement", settlementId);

    public async Task<SettlementDetailDto> GenerateSettlementAsync(
        GenerateSettlementRequestDto request,
        CancellationToken cancellationToken = default)
    {
        await _generateValidator.ValidateAndThrowAsync(request, cancellationToken);
        var adminId = _currentUser.UserId ?? throw BusinessException.Unauthorized();

        var seller = await _settlementRepository.GetSellerForUpdateAsync(request.SellerId, cancellationToken)
            ?? throw new NotFoundException("Seller", request.SellerId);

        var eligibleOrders = await _settlementRepository.GetEligibleOrdersForSellerAsync(
            request.SellerId, request.PeriodStart, request.PeriodEnd, cancellationToken);

        if (eligibleOrders.Count == 0)
        {
            throw new BusinessException(
                ErrorCodes.BusinessRuleViolation,
                "Không có đơn hàng đủ điều kiện đối soát trong khoảng thời gian đã chọn.",
                409);
        }

        var rate = seller.CommissionRate;
        var items = new List<SellerSettlementItem>();
        decimal totalGross = 0m;
        decimal totalRefund = 0m;
        decimal totalCommission = 0m;
        decimal totalNet = 0m;

        foreach (var order in eligibleOrders)
        {
            var refundDeduction = Math.Min(order.Subtotal, order.NonRejectedRefundAmount);
            var taxable = Math.Max(0m, order.Subtotal - refundDeduction);
            var commission = Math.Round(taxable * (rate / 100m), 2, MidpointRounding.AwayFromZero);
            var net = taxable - commission;

            totalGross += order.Subtotal;
            totalRefund += refundDeduction;
            totalCommission += commission;
            totalNet += net;

            items.Add(new SellerSettlementItem
            {
                SellerOrderId = order.SellerOrderId,
                GrossAmount = order.Subtotal,
                RefundAmount = refundDeduction,
                CommissionAmount = commission,
                NetAmount = net
            });
        }

        var now = DateTime.UtcNow;
        var settlement = new SellerSettlement
        {
            SellerId = seller.SellerId,
            SettlementCode = $"STL-{now:yyyyMMddHHmmss}-{Guid.NewGuid().ToString("N")[..4].ToUpperInvariant()}",
            PeriodStart = request.PeriodStart,
            PeriodEnd = request.PeriodEnd,
            GrossAmount = totalGross,
            RefundDeductionAmount = totalRefund,
            CommissionRateSnapshot = rate,
            CommissionAmount = totalCommission,
            NetPayoutAmount = totalNet,
            Status = SettlementStatuses.Pending,
            Note = request.Note?.Trim(),
            CreatedBy = adminId,
            CreatedAt = now,
            Items = items
        };

        await _settlementRepository.AddAsync(settlement, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await GetSettlementByIdAsync(settlement.SettlementId, cancellationToken);
    }

    public async Task<SettlementDetailDto> ApproveSettlementAsync(long settlementId, CancellationToken cancellationToken = default)
    {
        var adminId = _currentUser.UserId ?? throw BusinessException.Unauthorized();
        var settlement = await _settlementRepository.GetByIdAsync(settlementId, cancellationToken)
            ?? throw new NotFoundException("SellerSettlement", settlementId);

        if (settlement.Status != SettlementStatuses.Pending)
        {
            throw new BusinessException(
                ErrorCodes.InvalidStatusTransition,
                $"Chỉ có thể duyệt phiếu đối soát ở trạng thái Pending (hiện tại: '{settlement.Status}').",
                409);
        }

        settlement.Status = SettlementStatuses.Approved;
        settlement.ApprovedBy = adminId;
        settlement.ApprovedAt = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return await GetSettlementByIdAsync(settlement.SettlementId, cancellationToken);
    }

    public async Task<SettlementDetailDto> MarkPaidAsync(
        long settlementId,
        MarkSettlementPaidRequestDto request,
        CancellationToken cancellationToken = default)
    {
        await _markPaidValidator.ValidateAndThrowAsync(request, cancellationToken);
        _ = _currentUser.UserId ?? throw BusinessException.Unauthorized();

        var settlement = await _settlementRepository.GetByIdAsync(settlementId, cancellationToken)
            ?? throw new NotFoundException("SellerSettlement", settlementId);

        if (settlement.Status != SettlementStatuses.Approved)
        {
            throw new BusinessException(
                ErrorCodes.InvalidStatusTransition,
                $"Chỉ có thể xác nhận chi trả cho phiếu ở trạng thái Approved (hiện tại: '{settlement.Status}').",
                409);
        }

        settlement.Status = SettlementStatuses.Paid;
        settlement.PaymentReference = request.PaymentReference.Trim();
        if (!string.IsNullOrWhiteSpace(request.Note))
        {
            settlement.Note = request.Note.Trim();
        }
        settlement.PaidAt = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return await GetSettlementByIdAsync(settlement.SettlementId, cancellationToken);
    }

    public async Task<decimal> UpdateSellerCommissionRateAsync(
        long sellerId,
        UpdateSellerCommissionRequestDto request,
        CancellationToken cancellationToken = default)
    {
        await _commissionValidator.ValidateAndThrowAsync(request, cancellationToken);
        var seller = await _settlementRepository.GetSellerForUpdateAsync(sellerId, cancellationToken)
            ?? throw new NotFoundException("Seller", sellerId);

        seller.CommissionRate = Math.Round(request.CommissionRate, 2, MidpointRounding.AwayFromZero);
        seller.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return seller.CommissionRate;
    }

    public async Task<SellerFinanceSummaryDto> GetMyFinanceSummaryAsync(CancellationToken cancellationToken = default)
    {
        var sellerId = await RequireSellerIdAsync(cancellationToken);
        return await _settlementRepository.GetSellerFinanceSummaryAsync(sellerId, cancellationToken);
    }

    public async Task<PagedResult<SettlementListItemDto>> GetMySettlementsAsync(
        SettlementQueryDto query,
        CancellationToken cancellationToken = default)
    {
        var sellerId = await RequireSellerIdAsync(cancellationToken);
        query.SellerId = sellerId;
        return await _settlementRepository.GetPagedAsync(query, cancellationToken);
    }

    public async Task<SettlementDetailDto> GetMySettlementByIdAsync(long settlementId, CancellationToken cancellationToken = default)
    {
        var sellerId = await RequireSellerIdAsync(cancellationToken);
        var detail = await _settlementRepository.GetDetailDtoAsync(settlementId, cancellationToken);
        if (detail == null || detail.SellerId != sellerId)
        {
            throw new NotFoundException("SellerSettlement", settlementId);
        }

        return detail;
    }

    private async Task<long> RequireSellerIdAsync(CancellationToken cancellationToken)
        => await _currentUser.GetSellerIdAsync(cancellationToken)
            ?? throw new BusinessException(ErrorCodes.SellerNotApproved, "Tài khoản chưa có hồ sơ Seller hợp lệ.", 403);
}
