using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.Contracts.Services;
using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Shipping;
using ECommerceWarehouse.Domain.Constants;
using ECommerceWarehouse.Domain.Entities.Order;
using ECommerceWarehouse.Domain.Entities.Review;
using ECommerceWarehouse.Domain.Exceptions;
using FluentValidation;

namespace ECommerceWarehouse.Application.Services;

public class ShipmentService : IShipmentService
{
    private readonly IShipmentRepository _shipmentRepository;
    private readonly IOrderRepository _orderRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUser _currentUser;
    private readonly IValidator<ShipmentQueryDto> _queryValidator;
    private readonly IValidator<CreateShipmentRequestDto> _createValidator;
    private readonly IValidator<UpdateShipmentStatusRequestDto> _updateStatusValidator;

    public ShipmentService(
        IShipmentRepository shipmentRepository,
        IOrderRepository orderRepository,
        IUnitOfWork unitOfWork,
        ICurrentUser currentUser,
        IValidator<ShipmentQueryDto> queryValidator,
        IValidator<CreateShipmentRequestDto> createValidator,
        IValidator<UpdateShipmentStatusRequestDto> updateStatusValidator)
    {
        _shipmentRepository = shipmentRepository;
        _orderRepository = orderRepository;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _queryValidator = queryValidator;
        _createValidator = createValidator;
        _updateStatusValidator = updateStatusValidator;
    }

    public async Task<List<CarrierDto>> GetActiveCarriersAsync(CancellationToken cancellationToken = default)
        => await _shipmentRepository.GetActiveCarriersAsync(cancellationToken);

    public async Task<PagedResult<ShipmentDto>> GetShipmentsAsync(
        ShipmentQueryDto query,
        CancellationToken cancellationToken = default)
    {
        await _queryValidator.ValidateAndThrowAsync(query, cancellationToken);
        return await _shipmentRepository.GetPagedAsync(query, cancellationToken);
    }

    public async Task<ShipmentDto> CreateShipmentAsync(
        long sellerOrderId,
        CreateShipmentRequestDto request,
        CancellationToken cancellationToken = default)
    {
        await _createValidator.ValidateAndThrowAsync(request, cancellationToken);
        RequireCurrentUserId();

        var sellerOrder = await _shipmentRepository.GetSellerOrderForShipmentAsync(sellerOrderId, cancellationToken)
            ?? throw new NotFoundException("SellerOrder", sellerOrderId);

        if (sellerOrder.Status != SellerOrderStatuses.ReadyToShip &&
            sellerOrder.Status != SellerOrderStatuses.Shipped)
        {
            throw new BusinessException(
                ErrorCodes.InvalidStatusTransition,
                $"Chỉ có thể tạo vận đơn khi đơn con ở trạng thái ReadyToShip hoặc Shipped (hiện tại: '{sellerOrder.Status}').",
                409);
        }

        var carrier = await _shipmentRepository.GetCarrierByIdAsync(request.CarrierId, cancellationToken)
            ?? throw new NotFoundException("Carrier", request.CarrierId);

        if (!carrier.IsActive)
        {
            throw new BusinessException(
                ErrorCodes.BusinessRuleViolation,
                $"Hãng vận chuyển '{carrier.CarrierName}' hiện đang ngừng hoạt động.",
                409);
        }

        var trackingNumber = request.TrackingNumber.Trim();
        if (await _shipmentRepository.TrackingNumberExistsAsync(carrier.CarrierId, trackingNumber, cancellationToken))
        {
            throw new BusinessException(
                ErrorCodes.ConcurrencyConflict,
                $"Mã vận đơn '{trackingNumber}' đã tồn tại ở hãng {carrier.CarrierName}.",
                409);
        }

        var isCod = sellerOrder.Order.Payments.Any(p => p.PaymentMethod == PaymentMethods.COD);
        var shipment = new Shipment
        {
            SellerOrderId = sellerOrder.SellerOrderId,
            CarrierId = carrier.CarrierId,
            TrackingNumber = trackingNumber,
            ShippingStatus = ShippingStatuses.Preparing,
            CodAmount = request.CodAmount ?? (isCod ? sellerOrder.Subtotal : 0m),
            CreatedAt = DateTime.UtcNow
        };

        await _shipmentRepository.AddShipmentAsync(shipment, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await _shipmentRepository.GetDtoByIdAsync(shipment.ShipmentId, cancellationToken)
            ?? throw new NotFoundException("Shipment", shipment.ShipmentId);
    }

    public async Task<ShipmentDto> UpdateShipmentStatusAsync(
        long shipmentId,
        UpdateShipmentStatusRequestDto request,
        CancellationToken cancellationToken = default)
    {
        await _updateStatusValidator.ValidateAndThrowAsync(request, cancellationToken);
        var userId = RequireCurrentUserId();

        var shipment = await _shipmentRepository.GetByIdWithOrderAsync(shipmentId, cancellationToken)
            ?? throw new NotFoundException("Shipment", shipmentId);

        var current = shipment.ShippingStatus;
        var next = request.Status;

        var isValidTransition = (current, next) switch
        {
            (ShippingStatuses.Preparing, ShippingStatuses.PickedUp) => true,
            (ShippingStatuses.PickedUp, ShippingStatuses.InTransit) => true,
            (ShippingStatuses.PickedUp, ShippingStatuses.Delivered) => true,
            (ShippingStatuses.PickedUp, ShippingStatuses.Failed) => true,
            (ShippingStatuses.InTransit, ShippingStatuses.Delivered) => true,
            (ShippingStatuses.InTransit, ShippingStatuses.Failed) => true,
            (ShippingStatuses.Failed, ShippingStatuses.Returned) => true,
            _ => false
        };

        if (!isValidTransition)
        {
            throw new BusinessException(
                ErrorCodes.InvalidStatusTransition,
                $"Không thể chuyển trạng thái vận đơn từ '{current}' sang '{next}'.",
                409);
        }

        var now = DateTime.UtcNow;
        await _unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            shipment.ShippingStatus = next;
            shipment.UpdatedAt = now;

            if (next == ShippingStatuses.PickedUp)
            {
                shipment.ShippedAt = now;
            }
            else if (next == ShippingStatuses.Delivered)
            {
                shipment.DeliveredAt = now;
                var prevSo = shipment.SellerOrder.Status;
                shipment.SellerOrder.Status = SellerOrderStatuses.Delivered;
                shipment.SellerOrder.UpdatedAt = now;

                await _orderRepository.AddStatusHistoryAsync(new OrderStatusHistory
                {
                    OrderId = shipment.SellerOrder.OrderId,
                    SellerOrderId = shipment.SellerOrder.SellerOrderId,
                    FromStatus = prevSo,
                    ToStatus = SellerOrderStatuses.Delivered,
                    Reason = $"Giao hàng thành công ({shipment.TrackingNumber})",
                    ChangedBy = userId,
                    CreatedAt = now
                }, ct);

                var nextOrderStatus = OrderStatusCalculator.ComputeAggregateOrderStatus(shipment.SellerOrder.Order);
                if (nextOrderStatus != shipment.SellerOrder.Order.OrderStatus)
                {
                    var prevOrder = shipment.SellerOrder.Order.OrderStatus;
                    shipment.SellerOrder.Order.OrderStatus = nextOrderStatus;
                    shipment.SellerOrder.Order.UpdatedAt = now;

                    await _orderRepository.AddStatusHistoryAsync(new OrderStatusHistory
                    {
                        OrderId = shipment.SellerOrder.OrderId,
                        FromStatus = prevOrder,
                        ToStatus = nextOrderStatus,
                        Reason = "Đồng bộ khi vận đơn giao thành công",
                        ChangedBy = userId,
                        CreatedAt = now
                    }, ct);
                }
            }
            else if (next == ShippingStatuses.Failed)
            {
                shipment.FailedReason = request.FailedReason?.Trim();
                var prevSo = shipment.SellerOrder.Status;
                shipment.SellerOrder.Status = SellerOrderStatuses.DeliveryFailed;
                shipment.SellerOrder.UpdatedAt = now;

                await _orderRepository.AddStatusHistoryAsync(new OrderStatusHistory
                {
                    OrderId = shipment.SellerOrder.OrderId,
                    SellerOrderId = shipment.SellerOrder.SellerOrderId,
                    FromStatus = prevSo,
                    ToStatus = SellerOrderStatuses.DeliveryFailed,
                    Reason = shipment.FailedReason ?? "Giao hàng thất bại",
                    ChangedBy = userId,
                    CreatedAt = now
                }, ct);
            }

            await _unitOfWork.SaveChangesAsync(ct);
        }, cancellationToken);

        return await _shipmentRepository.GetDtoByIdAsync(shipment.ShipmentId, cancellationToken)
            ?? throw new NotFoundException("Shipment", shipment.ShipmentId);
    }

    public async Task<ShipmentDto> TrackByNumberForCustomerAsync(
        string trackingNumber,
        CancellationToken cancellationToken = default)
    {
        var customerId = RequireCurrentUserId();
        var trimmed = trackingNumber?.Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
        {
            throw new BusinessException(ErrorCodes.ValidationError, "Mã vận đơn không được để trống.", 400);
        }

        return await _shipmentRepository.GetByTrackingForCustomerAsync(customerId, trimmed, cancellationToken)
            ?? throw new NotFoundException("Shipment", trimmed);
    }

    private long RequireCurrentUserId()
    {
        return _currentUser.UserId ?? throw BusinessException.Unauthorized();
    }
}
