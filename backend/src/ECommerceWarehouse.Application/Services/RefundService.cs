using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.Contracts.Services;
using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Order;
using ECommerceWarehouse.Domain.Constants;
using ECommerceWarehouse.Domain.Exceptions;
using FluentValidation;

namespace ECommerceWarehouse.Application.Services;

public class RefundService : IRefundService
{
    private readonly IRefundRepository _refundRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUser _currentUser;
    private readonly IValidator<RefundQueryDto> _queryValidator;
    private readonly IValidator<RejectRefundRequestDto> _rejectValidator;

    public RefundService(
        IRefundRepository refundRepository,
        IUnitOfWork unitOfWork,
        ICurrentUser currentUser,
        IValidator<RefundQueryDto> queryValidator,
        IValidator<RejectRefundRequestDto> rejectValidator)
    {
        _refundRepository = refundRepository;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _queryValidator = queryValidator;
        _rejectValidator = rejectValidator;
    }

    public async Task<PagedResult<RefundDto>> GetRefundsAsync(
        RefundQueryDto query,
        CancellationToken cancellationToken = default)
    {
        await _queryValidator.ValidateAndThrowAsync(query, cancellationToken);
        return await _refundRepository.GetPagedAsync(query, cancellationToken);
    }

    public async Task<RefundDto> ApproveAsync(long refundId, CancellationToken cancellationToken = default)
    {
        var adminId = RequireCurrentUserId();
        var refund = await _refundRepository.GetByIdWithDetailsAsync(refundId, cancellationToken)
            ?? throw new NotFoundException("Refund", refundId);

        if (refund.RefundStatus != RefundStatuses.Pending)
        {
            throw new BusinessException(
                ErrorCodes.InvalidStatusTransition,
                $"Chỉ có thể duyệt yêu cầu hoàn tiền ở trạng thái Pending (hiện tại: '{refund.RefundStatus}').",
                409);
        }

        await _unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            var payment = await _refundRepository.GetPaymentForUpdateAsync(refund.PaymentId, ct)
                ?? throw new NotFoundException("Payment", refund.PaymentId);

            var totalNonRejected = await _refundRepository.GetTotalNonRejectedRefundsForPaymentAsync(payment.PaymentId, ct);
            if (totalNonRejected > payment.Amount)
            {
                throw new BusinessException(
                    ErrorCodes.RefundExceedsPaid,
                    $"Tổng hoàn tiền ({totalNonRejected:N0}) vượt quá số đã thanh toán ({payment.Amount:N0}).",
                    409);
            }

            refund.RefundStatus = RefundStatuses.Approved;
            refund.ApprovedBy = adminId;

            await _unitOfWork.SaveChangesAsync(ct);
        }, cancellationToken);

        return await _refundRepository.GetDtoByIdAsync(refund.RefundId, cancellationToken)
            ?? throw new NotFoundException("Refund", refund.RefundId);
    }

    public async Task<RefundDto> RejectAsync(
        long refundId,
        RejectRefundRequestDto request,
        CancellationToken cancellationToken = default)
    {
        await _rejectValidator.ValidateAndThrowAsync(request, cancellationToken);
        var adminId = RequireCurrentUserId();

        var refund = await _refundRepository.GetByIdWithDetailsAsync(refundId, cancellationToken)
            ?? throw new NotFoundException("Refund", refundId);

        if (refund.RefundStatus != RefundStatuses.Pending && refund.RefundStatus != RefundStatuses.Approved)
        {
            throw new BusinessException(
                ErrorCodes.InvalidStatusTransition,
                $"Không thể từ chối hoàn tiền ở trạng thái '{refund.RefundStatus}'.",
                409);
        }

        refund.RefundStatus = RefundStatuses.Rejected;
        refund.Reason = request.Reason.Trim();
        refund.ApprovedBy = adminId;
        refund.ProcessedAt = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await _refundRepository.GetDtoByIdAsync(refund.RefundId, cancellationToken)
            ?? throw new NotFoundException("Refund", refund.RefundId);
    }

    public async Task<RefundDto> CompleteAsync(long refundId, CancellationToken cancellationToken = default)
    {
        var adminId = RequireCurrentUserId();
        var refund = await _refundRepository.GetByIdWithDetailsAsync(refundId, cancellationToken)
            ?? throw new NotFoundException("Refund", refundId);

        if (refund.RefundStatus != RefundStatuses.Approved)
        {
            throw new BusinessException(
                ErrorCodes.InvalidStatusTransition,
                $"Chỉ có thể hoàn tất yêu cầu hoàn tiền đã Approved (hiện tại: '{refund.RefundStatus}').",
                409);
        }

        var now = DateTime.UtcNow;
        await _unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            var payment = await _refundRepository.GetPaymentForUpdateAsync(refund.PaymentId, ct)
                ?? throw new NotFoundException("Payment", refund.PaymentId);

            var totalNonRejected = await _refundRepository.GetTotalNonRejectedRefundsForPaymentAsync(payment.PaymentId, ct);
            if (totalNonRejected > payment.Amount)
            {
                throw new BusinessException(
                    ErrorCodes.RefundExceedsPaid,
                    $"Tổng hoàn tiền ({totalNonRejected:N0}) vượt quá số đã thanh toán ({payment.Amount:N0}).",
                    409);
            }

            refund.RefundStatus = RefundStatuses.Completed;
            refund.ApprovedBy ??= adminId;
            refund.ProcessedAt = now;

            payment.PaymentStatus = totalNonRejected >= payment.Amount
                ? PaymentStatuses.Refunded
                : PaymentStatuses.PartiallyRefunded;
            payment.UpdatedAt = now;

            if (refund.ReturnRequest != null)
            {
                refund.ReturnRequest.Status = ReturnStatuses.Completed;
                refund.ReturnRequest.UpdatedAt = now;

                if (refund.ReturnRequest.SellerOrder != null)
                {
                    refund.ReturnRequest.SellerOrder.Status = SellerOrderStatuses.Returned;
                    refund.ReturnRequest.SellerOrder.UpdatedAt = now;
                }
            }

            await _unitOfWork.SaveChangesAsync(ct);
        }, cancellationToken);

        return await _refundRepository.GetDtoByIdAsync(refund.RefundId, cancellationToken)
            ?? throw new NotFoundException("Refund", refund.RefundId);
    }

    private long RequireCurrentUserId()
    {
        return _currentUser.UserId ?? throw BusinessException.Unauthorized();
    }
}
