using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.Contracts.Services;
using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Warehouse;
using ECommerceWarehouse.Domain.Constants;
using ECommerceWarehouse.Domain.Entities.Order;
using ECommerceWarehouse.Domain.Exceptions;
using FluentValidation;

namespace ECommerceWarehouse.Application.Services;

public class IssueService : IIssueService
{
    private readonly IInventoryIssueRepository _issueRepository;
    private readonly IOrderRepository _orderRepository;
    private readonly IInventoryLedgerService _inventoryLedgerService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUser _currentUser;
    private readonly IValidator<IssueQueryDto> _queryValidator;
    private readonly IValidator<ScanIssueLineRequestDto> _scanValidator;

    public IssueService(
        IInventoryIssueRepository issueRepository,
        IOrderRepository orderRepository,
        IInventoryLedgerService inventoryLedgerService,
        IUnitOfWork unitOfWork,
        ICurrentUser currentUser,
        IValidator<IssueQueryDto> queryValidator,
        IValidator<ScanIssueLineRequestDto> scanValidator)
    {
        _issueRepository = issueRepository;
        _orderRepository = orderRepository;
        _inventoryLedgerService = inventoryLedgerService;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _queryValidator = queryValidator;
        _scanValidator = scanValidator;
    }

    public async Task<PagedResult<IssueDto>> GetIssuesAsync(
        IssueQueryDto query,
        CancellationToken cancellationToken = default)
    {
        await _queryValidator.ValidateAndThrowAsync(query, cancellationToken);
        return await _issueRepository.GetPagedAsync(query, cancellationToken);
    }

    public async Task<IssueDto> GetIssueByIdAsync(long issueId, CancellationToken cancellationToken = default)
    {
        return await _issueRepository.GetDtoByIdAsync(issueId, cancellationToken)
            ?? throw new NotFoundException("InventoryIssue", issueId);
    }

    public async Task<IssueDto> ApproveAsync(long issueId, CancellationToken cancellationToken = default)
    {
        var userId = RequireCurrentUserId();
        var issue = await _issueRepository.GetByIdWithDetailsAsync(issueId, cancellationToken)
            ?? throw new NotFoundException("InventoryIssue", issueId);

        if (issue.Status != IssueStatuses.Draft)
        {
            throw new BusinessException(
                ErrorCodes.InvalidStatusTransition,
                $"Chỉ có thể duyệt phiếu xuất ở trạng thái Draft (hiện tại: '{issue.Status}').",
                409);
        }

        if (issue.CreatedBy == userId)
        {
            throw new BusinessException(
                ErrorCodes.SelfApprovalNotAllowed,
                "Người tạo phiếu xuất không được tự duyệt chính phiếu đó.",
                409);
        }

        issue.Status = IssueStatuses.Approved;
        issue.ApprovedBy = userId;
        issue.ApprovedAt = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await _issueRepository.GetDtoByIdAsync(issue.IssueId, cancellationToken)
            ?? throw new NotFoundException("InventoryIssue", issue.IssueId);
    }

    public async Task<IssueDto> StartPickingAsync(long issueId, CancellationToken cancellationToken = default)
    {
        var userId = RequireCurrentUserId();
        var issue = await _issueRepository.GetByIdWithDetailsAsync(issueId, cancellationToken)
            ?? throw new NotFoundException("InventoryIssue", issueId);

        if (issue.Status != IssueStatuses.Approved)
        {
            throw new BusinessException(
                ErrorCodes.InvalidStatusTransition,
                $"Chỉ có thể bắt đầu soạn hàng từ trạng thái Approved (hiện tại: '{issue.Status}').",
                409);
        }

        var now = DateTime.UtcNow;
        await _unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            issue.Status = IssueStatuses.Picking;

            if (issue.SellerOrder != null && issue.SellerOrder.Status == SellerOrderStatuses.Confirmed)
            {
                issue.SellerOrder.Status = SellerOrderStatuses.Preparing;
                issue.SellerOrder.UpdatedAt = now;

                await _orderRepository.AddStatusHistoryAsync(new OrderStatusHistory
                {
                    OrderId = issue.SellerOrder.OrderId,
                    SellerOrderId = issue.SellerOrder.SellerOrderId,
                    FromStatus = SellerOrderStatuses.Confirmed,
                    ToStatus = SellerOrderStatuses.Preparing,
                    Reason = $"Kho bắt đầu soạn hàng ({issue.IssueCode})",
                    ChangedBy = userId,
                    CreatedAt = now
                }, ct);
            }

            await _unitOfWork.SaveChangesAsync(ct);
        }, cancellationToken);

        return await _issueRepository.GetDtoByIdAsync(issue.IssueId, cancellationToken)
            ?? throw new NotFoundException("InventoryIssue", issue.IssueId);
    }

    public async Task<IssueDto> ScanLineAsync(
        long issueId,
        long lineId,
        ScanIssueLineRequestDto request,
        CancellationToken cancellationToken = default)
    {
        await _scanValidator.ValidateAndThrowAsync(request, cancellationToken);
        RequireCurrentUserId();

        var issue = await _issueRepository.GetByIdWithDetailsAsync(issueId, cancellationToken)
            ?? throw new NotFoundException("InventoryIssue", issueId);

        if (issue.Status != IssueStatuses.Picking)
        {
            throw new BusinessException(
                ErrorCodes.InvalidStatusTransition,
                $"Chỉ được quét mã lấy hàng khi phiếu xuất đang ở trạng thái Picking (hiện tại: '{issue.Status}').",
                409);
        }

        var line = issue.Details.FirstOrDefault(d => d.IssueDetailId == lineId)
            ?? throw new NotFoundException("IssueDetail", lineId);

        var code = request.Code.Trim();
        var matchesSku = string.Equals(line.Variant.SKU, code, StringComparison.OrdinalIgnoreCase);
        var matchesBarcode = !string.IsNullOrWhiteSpace(line.Variant.Barcode) &&
                             string.Equals(line.Variant.Barcode, code, StringComparison.OrdinalIgnoreCase);

        if (!matchesSku && !matchesBarcode)
        {
            throw new BusinessException(
                ErrorCodes.ValidationError,
                $"Mã quét '{code}' không khớp với SKU ({line.Variant.SKU}) hoặc Barcode của dòng hàng.",
                400);
        }

        if (line.PickedQuantity + request.Quantity > line.Quantity)
        {
            throw new BusinessException(
                ErrorCodes.BusinessRuleViolation,
                $"Số lượng quét vượt quá yêu cầu (đã lấy: {line.PickedQuantity}, cần: {line.Quantity}).",
                409);
        }

        line.PickedQuantity += request.Quantity;
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await _issueRepository.GetDtoByIdAsync(issue.IssueId, cancellationToken)
            ?? throw new NotFoundException("InventoryIssue", issue.IssueId);
    }

    public async Task<IssueDto> PackAsync(long issueId, CancellationToken cancellationToken = default)
    {
        var userId = RequireCurrentUserId();
        var issue = await _issueRepository.GetByIdWithDetailsAsync(issueId, cancellationToken)
            ?? throw new NotFoundException("InventoryIssue", issueId);

        if (issue.Status != IssueStatuses.Picking)
        {
            throw new BusinessException(
                ErrorCodes.InvalidStatusTransition,
                $"Chỉ có thể đóng gói khi phiếu đang ở trạng thái Picking (hiện tại: '{issue.Status}').",
                409);
        }

        if (issue.Details.Any(d => d.PickedQuantity < d.Quantity))
        {
            throw new BusinessException(
                ErrorCodes.BusinessRuleViolation,
                "Chưa lấy đủ số lượng cho tất cả các dòng hàng, không thể đóng gói.",
                409);
        }

        var now = DateTime.UtcNow;
        await _unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            issue.Status = IssueStatuses.Packed;

            if (issue.SellerOrder != null &&
                (issue.SellerOrder.Status == SellerOrderStatuses.Preparing ||
                 issue.SellerOrder.Status == SellerOrderStatuses.Confirmed))
            {
                var prevStatus = issue.SellerOrder.Status;
                issue.SellerOrder.Status = SellerOrderStatuses.ReadyToShip;
                issue.SellerOrder.UpdatedAt = now;

                await _orderRepository.AddStatusHistoryAsync(new OrderStatusHistory
                {
                    OrderId = issue.SellerOrder.OrderId,
                    SellerOrderId = issue.SellerOrder.SellerOrderId,
                    FromStatus = prevStatus,
                    ToStatus = SellerOrderStatuses.ReadyToShip,
                    Reason = $"Kho đã đóng gói xong ({issue.IssueCode})",
                    ChangedBy = userId,
                    CreatedAt = now
                }, ct);
            }

            await _unitOfWork.SaveChangesAsync(ct);
        }, cancellationToken);

        return await _issueRepository.GetDtoByIdAsync(issue.IssueId, cancellationToken)
            ?? throw new NotFoundException("InventoryIssue", issue.IssueId);
    }

    public async Task<IssueDto> DispatchAsync(long issueId, CancellationToken cancellationToken = default)
    {
        var userId = RequireCurrentUserId();
        var issue = await _issueRepository.GetByIdWithDetailsAsync(issueId, cancellationToken)
            ?? throw new NotFoundException("InventoryIssue", issueId);

        if (issue.Status != IssueStatuses.Packed)
        {
            throw new BusinessException(
                ErrorCodes.InvalidStatusTransition,
                $"Chỉ có thể xuất kho khi phiếu đang ở trạng thái Packed (hiện tại: '{issue.Status}').",
                409);
        }

        if (IssueTypes.RequireApproval.Contains(issue.IssueType) && !issue.ApprovedBy.HasValue)
        {
            throw new BusinessException(
                ErrorCodes.BusinessRuleViolation,
                $"Phiếu xuất loại '{issue.IssueType}' bắt buộc phải có người duyệt trước khi xuất kho.",
                409);
        }

        var now = DateTime.UtcNow;
        await _unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            foreach (var detail in issue.Details)
            {
                await _inventoryLedgerService.DispatchReservedStockAsync(
                    detail.LocationId,
                    detail.VariantId,
                    detail.Quantity,
                    issue.IssueId,
                    userId,
                    $"Xuất kho theo phiếu {issue.IssueCode}",
                    ct);

                if (detail.Reservation != null && detail.Reservation.Status == ReservationStatuses.Active)
                {
                    detail.Reservation.Status = ReservationStatuses.Consumed;
                    detail.Reservation.ResolvedAt = now;
                }
            }

            issue.Status = IssueStatuses.Dispatched;
            issue.DispatchedBy = userId;
            issue.DispatchedAt = now;

            if (issue.SellerOrder != null)
            {
                var prevSoStatus = issue.SellerOrder.Status;
                issue.SellerOrder.Status = SellerOrderStatuses.Shipped;
                issue.SellerOrder.UpdatedAt = now;

                await _orderRepository.AddStatusHistoryAsync(new OrderStatusHistory
                {
                    OrderId = issue.SellerOrder.OrderId,
                    SellerOrderId = issue.SellerOrder.SellerOrderId,
                    FromStatus = prevSoStatus,
                    ToStatus = SellerOrderStatuses.Shipped,
                    Reason = $"Kho đã xuất hàng ({issue.IssueCode})",
                    ChangedBy = userId,
                    CreatedAt = now
                }, ct);

                var nextOrderStatus = OrderStatusCalculator.ComputeAggregateOrderStatus(issue.SellerOrder.Order);
                if (nextOrderStatus != issue.SellerOrder.Order.OrderStatus)
                {
                    var prevOrderStatus = issue.SellerOrder.Order.OrderStatus;
                    issue.SellerOrder.Order.OrderStatus = nextOrderStatus;
                    issue.SellerOrder.Order.UpdatedAt = now;

                    await _orderRepository.AddStatusHistoryAsync(new OrderStatusHistory
                    {
                        OrderId = issue.SellerOrder.OrderId,
                        FromStatus = prevOrderStatus,
                        ToStatus = nextOrderStatus,
                        Reason = $"Đồng bộ từ phiếu xuất {issue.IssueCode}",
                        ChangedBy = userId,
                        CreatedAt = now
                    }, ct);
                }
            }

            await _unitOfWork.SaveChangesAsync(ct);
        }, cancellationToken);

        return await _issueRepository.GetDtoByIdAsync(issue.IssueId, cancellationToken)
            ?? throw new NotFoundException("InventoryIssue", issue.IssueId);
    }

    private long RequireCurrentUserId()
    {
        return _currentUser.UserId ?? throw BusinessException.Unauthorized();
    }
}
