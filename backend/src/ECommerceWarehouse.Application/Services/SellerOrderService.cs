using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.Contracts.Services;
using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Order;
using ECommerceWarehouse.Domain.Constants;
using ECommerceWarehouse.Domain.Entities.Order;
using ECommerceWarehouse.Domain.Exceptions;
using FluentValidation;

namespace ECommerceWarehouse.Application.Services;

public class SellerOrderService : ISellerOrderService
{
    private readonly IOrderRepository _orderRepository;
    private readonly IInventoryLedgerService _inventoryLedgerService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUser _currentUser;
    private readonly IValidator<SellerOrderQueryDto> _queryValidator;
    private readonly IValidator<CancelSellerOrderRequestDto> _cancelValidator;

    public SellerOrderService(
        IOrderRepository orderRepository,
        IInventoryLedgerService inventoryLedgerService,
        IUnitOfWork unitOfWork,
        ICurrentUser currentUser,
        IValidator<SellerOrderQueryDto> queryValidator,
        IValidator<CancelSellerOrderRequestDto> cancelValidator)
    {
        _orderRepository = orderRepository;
        _inventoryLedgerService = inventoryLedgerService;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _queryValidator = queryValidator;
        _cancelValidator = cancelValidator;
    }

    public async Task<PagedResult<SellerOrderListItemDto>> GetMySellerOrdersAsync(
        SellerOrderQueryDto query,
        CancellationToken cancellationToken = default)
    {
        await _queryValidator.ValidateAndThrowAsync(query, cancellationToken);
        var sellerId = await RequireSellerIdAsync(cancellationToken);
        return await _orderRepository.GetSellerOrdersPagedAsync(sellerId, query, cancellationToken);
    }

    public async Task<SellerOrderDetailDto> GetMySellerOrderByIdAsync(
        long sellerOrderId,
        CancellationToken cancellationToken = default)
    {
        var sellerId = await RequireSellerIdAsync(cancellationToken);
        return await _orderRepository.GetSellerOrderDetailAsync(sellerId, sellerOrderId, cancellationToken)
            ?? throw new NotFoundException("SellerOrder", sellerOrderId);
    }

    public async Task<SellerOrderDetailDto> ConfirmSellerOrderAsync(
        long sellerOrderId,
        CancellationToken cancellationToken = default)
    {
        var sellerId = await RequireSellerIdAsync(cancellationToken);
        var userId = _currentUser.UserId ?? throw BusinessException.Unauthorized();

        var sellerOrder = await _orderRepository.GetSellerOrderWithOrderAsync(sellerOrderId, cancellationToken);
        if (sellerOrder == null || sellerOrder.SellerId != sellerId)
        {
            throw new NotFoundException("SellerOrder", sellerOrderId);
        }

        if (sellerOrder.Status != SellerOrderStatuses.Pending)
        {
            throw new BusinessException(
                ErrorCodes.InvalidStatusTransition,
                $"Chỉ có thể xác nhận đơn con ở trạng thái Pending (hiện tại: '{sellerOrder.Status}').",
                409);
        }

        if (sellerOrder.Order.OrderStatus == OrderStatuses.Cancelled ||
            sellerOrder.Order.OrderStatus == OrderStatuses.Expired)
        {
            throw new BusinessException(
                ErrorCodes.InvalidStatusTransition,
                $"Không thể xác nhận vì đơn tổng đang ở trạng thái '{sellerOrder.Order.OrderStatus}'.",
                409);
        }

        var now = DateTime.UtcNow;
        await _unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            sellerOrder.Status = SellerOrderStatuses.Confirmed;
            sellerOrder.UpdatedAt = now;

            await _orderRepository.AddStatusHistoryAsync(new OrderStatusHistory
            {
                OrderId = sellerOrder.OrderId,
                SellerOrderId = sellerOrder.SellerOrderId,
                FromStatus = SellerOrderStatuses.Pending,
                ToStatus = SellerOrderStatuses.Confirmed,
                Reason = "Seller xác nhận đơn con",
                ChangedBy = userId,
                CreatedAt = now
            }, ct);

            var nextOrderStatus = OrderStatusCalculator.ComputeAggregateOrderStatus(sellerOrder.Order);
            if (nextOrderStatus != sellerOrder.Order.OrderStatus)
            {
                var prevOrderStatus = sellerOrder.Order.OrderStatus;
                sellerOrder.Order.OrderStatus = nextOrderStatus;
                sellerOrder.Order.UpdatedAt = now;

                await _orderRepository.AddStatusHistoryAsync(new OrderStatusHistory
                {
                    OrderId = sellerOrder.OrderId,
                    FromStatus = prevOrderStatus,
                    ToStatus = nextOrderStatus,
                    Reason = "Đồng bộ trạng thái tổng hợp từ đơn con",
                    ChangedBy = userId,
                    CreatedAt = now
                }, ct);
            }

            await _unitOfWork.SaveChangesAsync(ct);
        }, cancellationToken);

        return await _orderRepository.GetSellerOrderDetailAsync(sellerId, sellerOrderId, cancellationToken)
            ?? throw new NotFoundException("SellerOrder", sellerOrderId);
    }

    public async Task<SellerOrderDetailDto> CancelSellerOrderAsync(
        long sellerOrderId,
        CancelSellerOrderRequestDto request,
        CancellationToken cancellationToken = default)
    {
        await _cancelValidator.ValidateAndThrowAsync(request, cancellationToken);
        var sellerId = await RequireSellerIdAsync(cancellationToken);
        var userId = _currentUser.UserId ?? throw BusinessException.Unauthorized();

        var sellerOrder = await _orderRepository.GetSellerOrderWithOrderAsync(sellerOrderId, cancellationToken);
        if (sellerOrder == null || sellerOrder.SellerId != sellerId)
        {
            throw new NotFoundException("SellerOrder", sellerOrderId);
        }

        if (SellerOrderStatuses.NonCancellable.Contains(sellerOrder.Status))
        {
            throw new BusinessException(
                ErrorCodes.InvalidStatusTransition,
                $"Không thể hủy đơn con ở trạng thái '{sellerOrder.Status}'.",
                409);
        }

        var now = DateTime.UtcNow;
        var reason = request.Reason.Trim();

        await _unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            var itemIds = sellerOrder.Items.Select(i => i.OrderItemId).ToList();
            var activeReservations = await _orderRepository.GetActiveReservationsByOrderItemsAsync(itemIds, ct);

            foreach (var reservation in activeReservations)
            {
                await _inventoryLedgerService.ReleaseReservationAsync(
                    reservation.LocationId,
                    reservation.VariantId,
                    reservation.Quantity,
                    reservation.OrderItemId,
                    userId,
                    $"Seller hủy đơn con #{sellerOrder.SellerOrderId}: {reason}",
                    ct);

                reservation.Status = ReservationStatuses.Released;
                reservation.ResolvedAt = now;
            }

            var prevSoStatus = sellerOrder.Status;
            sellerOrder.Status = SellerOrderStatuses.Cancelled;
            sellerOrder.CancelReason = reason;
            sellerOrder.CancelledAt = now;
            sellerOrder.UpdatedAt = now;

            await _orderRepository.AddStatusHistoryAsync(new OrderStatusHistory
            {
                OrderId = sellerOrder.OrderId,
                SellerOrderId = sellerOrder.SellerOrderId,
                FromStatus = prevSoStatus,
                ToStatus = SellerOrderStatuses.Cancelled,
                Reason = reason,
                ChangedBy = userId,
                CreatedAt = now
            }, ct);

            var nextOrderStatus = OrderStatusCalculator.ComputeAggregateOrderStatus(sellerOrder.Order);
            if (nextOrderStatus != sellerOrder.Order.OrderStatus)
            {
                var prevOrderStatus = sellerOrder.Order.OrderStatus;
                sellerOrder.Order.OrderStatus = nextOrderStatus;
                sellerOrder.Order.UpdatedAt = now;
                if (nextOrderStatus == OrderStatuses.Cancelled)
                {
                    sellerOrder.Order.CancelReason = reason;
                    sellerOrder.Order.CancelledAt = now;
                }

                await _orderRepository.AddStatusHistoryAsync(new OrderStatusHistory
                {
                    OrderId = sellerOrder.OrderId,
                    FromStatus = prevOrderStatus,
                    ToStatus = nextOrderStatus,
                    Reason = $"Đồng bộ từ đơn con #{sellerOrder.SellerOrderId} bị hủy",
                    ChangedBy = userId,
                    CreatedAt = now
                }, ct);
            }

            await _unitOfWork.SaveChangesAsync(ct);
        }, cancellationToken);

        return await _orderRepository.GetSellerOrderDetailAsync(sellerId, sellerOrderId, cancellationToken)
            ?? throw new NotFoundException("SellerOrder", sellerOrderId);
    }

    private async Task<long> RequireSellerIdAsync(CancellationToken cancellationToken)
    {
        return await _currentUser.GetSellerIdAsync(cancellationToken)
            ?? throw BusinessException.Forbidden("Tài khoản hiện tại chưa có hồ sơ Seller.");
    }
}
