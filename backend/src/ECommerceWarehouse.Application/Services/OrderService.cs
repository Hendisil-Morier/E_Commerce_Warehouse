using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.Contracts.Services;
using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Order;
using ECommerceWarehouse.Domain.Constants;
using ECommerceWarehouse.Domain.Entities.Order;
using ECommerceWarehouse.Domain.Entities.Warehouse;
using ECommerceWarehouse.Domain.Enums;
using ECommerceWarehouse.Domain.Exceptions;
using FluentValidation;

namespace ECommerceWarehouse.Application.Services;

public class OrderService : IOrderService
{
    private readonly IOrderRepository _orderRepository;
    private readonly IInventoryLedgerService _inventoryLedgerService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUser _currentUser;
    private readonly IValidator<CheckoutRequestDto> _checkoutValidator;
    private readonly IValidator<CancelOrderRequestDto> _cancelValidator;
    private readonly IValidator<OrderQueryDto> _queryValidator;
    private readonly IValidator<CreatePaymentRequestDto> _paymentValidator;

    public OrderService(
        IOrderRepository orderRepository,
        IInventoryLedgerService inventoryLedgerService,
        IUnitOfWork unitOfWork,
        ICurrentUser currentUser,
        IValidator<CheckoutRequestDto> checkoutValidator,
        IValidator<CancelOrderRequestDto> cancelValidator,
        IValidator<OrderQueryDto> queryValidator,
        IValidator<CreatePaymentRequestDto> paymentValidator)
    {
        _orderRepository = orderRepository;
        _inventoryLedgerService = inventoryLedgerService;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _checkoutValidator = checkoutValidator;
        _cancelValidator = cancelValidator;
        _queryValidator = queryValidator;
        _paymentValidator = paymentValidator;
    }

    public async Task<OrderDetailDto> CheckoutAsync(
        string idempotencyKey,
        CheckoutRequestDto request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(idempotencyKey))
        {
            throw new BusinessException(
                ErrorCodes.ValidationError,
                "Header 'Idempotency-Key' là bắt buộc khi đặt hàng.",
                400);
        }

        var normalizedKey = idempotencyKey.Trim();
        if (normalizedKey.Length > 100)
        {
            throw new BusinessException(
                ErrorCodes.ValidationError,
                "Idempotency-Key không được vượt quá 100 ký tự.",
                400);
        }

        await _checkoutValidator.ValidateAndThrowAsync(request, cancellationToken);
        var customerId = RequireCurrentUserId();

        // 1. Idempotency check: trả lại đơn đã tạo trước đó nếu trùng Idempotency-Key
        var existingOrder = await _orderRepository.GetByIdempotencyKeyAsync(customerId, normalizedKey, cancellationToken);
        if (existingOrder != null)
        {
            return await _orderRepository.GetOrderDetailForCustomerAsync(customerId, existingOrder.OrderId, cancellationToken)
                ?? throw new NotFoundException("Order", existingOrder.OrderId);
        }

        // 2. Kiểm tra địa chỉ giao hàng thuộc chính Customer
        var address = await _orderRepository.GetCustomerAddressAsync(customerId, request.AddressId, cancellationToken)
            ?? throw new NotFoundException("UserAddress", request.AddressId);

        // 3. Đọc dòng giỏ hàng và kiểm tra sản phẩm/shop/seller từ DB
        var cartItems = await _orderRepository.GetCartItemsForCheckoutAsync(customerId, request.CartItemIds, cancellationToken);
        if (cartItems.Count == 0)
        {
            throw new BusinessException(
                ErrorCodes.BusinessRuleViolation,
                "Giỏ hàng trống hoặc không tìm thấy sản phẩm được chọn để đặt hàng.",
                409);
        }

        foreach (var item in cartItems)
        {
            var variant = item.Variant;
            var product = variant.Product;
            var shop = product.Shop;
            var seller = shop.Seller;

            if (!variant.IsActive ||
                product.ProductStatus != Domain.Enums.ProductStatus.Active ||
                !shop.IsActive ||
                seller.Status != SellerStatus.Approved)
            {
                throw new BusinessException(
                    ErrorCodes.ProductNotAvailable,
                    $"Sản phẩm '{product.ProductName} - {variant.VariantName}' hiện không còn bán.",
                    409);
            }
        }

        // 4. Phân bổ kho sàn (Platform) cho từng SellerOrder TRƯỚC khi giữ chỗ
        var sellerGroups = cartItems
            .GroupBy(ci => ci.Variant.Product.Shop.SellerId)
            .ToList();

        var plannedAllocations = new List<(
            long SellerId,
            long WarehouseId,
            decimal SellerSubtotal,
            List<(Domain.Entities.Customer.CartItem CartItem, List<(Inventory Inv, int Qty)> Bins)> Lines)>();

        foreach (var group in sellerGroups)
        {
            // Lấy tất cả kho Platform có tồn bán được cho các item trong nhóm seller này
            var itemInventories = new Dictionary<long, List<Inventory>>();
            foreach (var cartItem in group)
            {
                var bins = await _orderRepository.GetSellablePlatformInventoriesAsync(cartItem.VariantId, cancellationToken);
                itemInventories[cartItem.CartItemId] = bins;
            }

            // Chọn 1 kho Platform có thể đáp ứng đủ tồn cho toàn bộ dòng hàng của SellerOrder này
            var candidateWarehouseIds = itemInventories.Values
                .SelectMany(list => list.Select(i => i.WarehouseId))
                .Distinct()
                .ToList();

            long? chosenWarehouseId = null;
            var chosenLineBins = new List<(Domain.Entities.Customer.CartItem CartItem, List<(Inventory Inv, int Qty)> Bins)>();

            foreach (var whId in candidateWarehouseIds)
            {
                var tempLines = new List<(Domain.Entities.Customer.CartItem, List<(Inventory, int)>)>();
                var allSatisfied = true;

                foreach (var cartItem in group)
                {
                    var binsInWh = itemInventories[cartItem.CartItemId]
                        .Where(i => i.WarehouseId == whId)
                        .OrderByDescending(i => i.QuantityOnHand - i.QuantityReserved)
                        .ToList();

                    var remaining = cartItem.Quantity;
                    var picked = new List<(Inventory, int)>();

                    foreach (var bin in binsInWh)
                    {
                        if (remaining <= 0) break;
                        var avail = bin.QuantityOnHand - bin.QuantityReserved;
                        if (avail <= 0) continue;

                        var take = Math.Min(remaining, avail);
                        picked.Add((bin, take));
                        remaining -= take;
                    }

                    if (remaining > 0)
                    {
                        allSatisfied = false;
                        break;
                    }

                    tempLines.Add((cartItem, picked));
                }

                if (allSatisfied)
                {
                    chosenWarehouseId = whId;
                    chosenLineBins = tempLines;
                    break;
                }
            }

            if (!chosenWarehouseId.HasValue)
            {
                throw new BusinessException(
                    ErrorCodes.InsufficientStock,
                    "Một hoặc nhiều sản phẩm trong đơn không đủ tồn kho khả dụng tại kho sàn.",
                    409);
            }

            var sellerSubtotal = group.Sum(ci => ci.Variant.Price * ci.Quantity);
            plannedAllocations.Add((group.Key, chosenWarehouseId.Value, sellerSubtotal, chosenLineBins));
        }

        // 5. Tạo Order, SellerOrders, OrderItems, giữ chỗ nguyên tử & ghi sổ cái trong 1 Transaction
        var isCod = request.PaymentMethod == PaymentMethods.COD;
        var now = DateTime.UtcNow;
        var orderSubtotal = plannedAllocations.Sum(g => g.SellerSubtotal);
        const decimal shippingFee = 0m;
        const decimal discountAmount = 0m;

        var order = new Order
        {
            CustomerId = customerId,
            OrderCode = GenerateOrderCode(),
            IdempotencyKey = normalizedKey,
            RecipientName = address.RecipientName,
            RecipientPhone = address.PhoneNumber,
            ShippingProvince = address.Province,
            ShippingDistrict = address.District,
            ShippingWard = address.Ward,
            ShippingStreetAddress = address.StreetAddress,
            Subtotal = orderSubtotal,
            ShippingFee = shippingFee,
            DiscountAmount = discountAmount,
            TotalAmount = orderSubtotal + shippingFee - discountAmount,
            OrderStatus = isCod ? OrderStatuses.Confirmed : OrderStatuses.PendingPayment,
            ExpiresAt = isCod ? null : now.AddMinutes(15),
            Note = request.Note?.Trim(),
            CreatedAt = now
        };

        await _unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            var itemToBinsMap = new List<(OrderItem Item, List<(Inventory Inv, int Qty)> Bins)>();

            foreach (var group in plannedAllocations)
            {
                var sellerOrder = new SellerOrder
                {
                    SellerId = group.SellerId,
                    WarehouseId = group.WarehouseId,
                    Subtotal = group.SellerSubtotal,
                    Status = SellerOrderStatuses.Pending,
                    CreatedAt = now
                };

                foreach (var (cartItem, bins) in group.Lines)
                {
                    var orderItem = new OrderItem
                    {
                        VariantId = cartItem.VariantId,
                        ProductNameSnapshot = cartItem.Variant.Product.ProductName,
                        SKUSnapshot = cartItem.Variant.SKU,
                        UnitPrice = cartItem.Variant.Price,
                        Quantity = cartItem.Quantity
                    };
                    sellerOrder.Items.Add(orderItem);
                    itemToBinsMap.Add((orderItem, bins));
                }

                order.SellerOrders.Add(sellerOrder);
            }

            await _orderRepository.AddOrderAsync(order, ct);
            await _unitOfWork.SaveChangesAsync(ct);

            // Giữ chỗ nguyên tử & ghi StockMovements cho từng OrderItem
            foreach (var (orderItem, bins) in itemToBinsMap)
            {
                foreach (var (bin, qty) in bins)
                {
                    await _inventoryLedgerService.ReserveStockAtomicAsync(
                        bin.InventoryId,
                        qty,
                        orderItem.OrderItemId,
                        customerId,
                        $"Giữ chỗ cho đơn hàng {order.OrderCode}",
                        ct);

                    await _orderRepository.AddStockReservationAsync(new StockReservation
                    {
                        OrderItemId = orderItem.OrderItemId,
                        WarehouseId = bin.WarehouseId,
                        LocationId = bin.LocationId,
                        VariantId = bin.VariantId,
                        Quantity = qty,
                        Status = ReservationStatuses.Active,
                        ExpiresAt = order.ExpiresAt,
                        CreatedAt = now
                    }, ct);
                }
            }

            // Tạo Payment (COD xác nhận ngay ở bước đặt hàng; Online ở trạng thái Pending)
            await _orderRepository.AddPaymentAsync(new Payment
            {
                OrderId = order.OrderId,
                PaymentMethod = request.PaymentMethod,
                Amount = order.TotalAmount,
                PaymentStatus = isCod ? PaymentStatuses.Paid : PaymentStatuses.Pending,
                PaidAt = isCod ? now : null,
                CreatedAt = now
            }, ct);

            await _orderRepository.AddStatusHistoryAsync(new OrderStatusHistory
            {
                OrderId = order.OrderId,
                FromStatus = null,
                ToStatus = order.OrderStatus,
                Reason = $"Khách hàng đặt đơn ({request.PaymentMethod})",
                ChangedBy = customerId,
                CreatedAt = now
            }, ct);

            _orderRepository.RemoveCartItems(cartItems);
            await _unitOfWork.SaveChangesAsync(ct);
        }, cancellationToken);

        return await _orderRepository.GetOrderDetailForCustomerAsync(customerId, order.OrderId, cancellationToken)
            ?? throw new NotFoundException("Order", order.OrderId);
    }

    public async Task<PagedResult<OrderListItemDto>> GetMyOrdersAsync(
        OrderQueryDto query,
        CancellationToken cancellationToken = default)
    {
        await _queryValidator.ValidateAndThrowAsync(query, cancellationToken);
        var customerId = RequireCurrentUserId();
        return await _orderRepository.GetCustomerOrdersPagedAsync(customerId, query, cancellationToken);
    }

    public async Task<OrderDetailDto> GetMyOrderByIdAsync(
        long orderId,
        CancellationToken cancellationToken = default)
    {
        var customerId = RequireCurrentUserId();
        return await _orderRepository.GetOrderDetailForCustomerAsync(customerId, orderId, cancellationToken)
            ?? throw new NotFoundException("Order", orderId);
    }

    public async Task<OrderDetailDto> CancelMyOrderAsync(
        long orderId,
        CancelOrderRequestDto request,
        CancellationToken cancellationToken = default)
    {
        await _cancelValidator.ValidateAndThrowAsync(request, cancellationToken);
        var customerId = RequireCurrentUserId();

        var order = await _orderRepository.GetOrderWithDetailsForUpdateAsync(orderId, cancellationToken);
        if (order == null || order.CustomerId != customerId)
        {
            throw new NotFoundException("Order", orderId);
        }

        if (order.OrderStatus == OrderStatuses.Cancelled || order.OrderStatus == OrderStatuses.Expired)
        {
            throw new BusinessException(
                ErrorCodes.InvalidStatusTransition,
                $"Đơn hàng đang ở trạng thái '{order.OrderStatus}', không thể hủy thêm lần nữa.",
                409);
        }

        if (order.SellerOrders.Any(so => SellerOrderStatuses.NonCancellable.Contains(so.Status) && so.Status != SellerOrderStatuses.Cancelled))
        {
            throw new BusinessException(
                ErrorCodes.InvalidStatusTransition,
                "Không thể hủy đơn hàng khi có đơn con đã bàn giao vận chuyển.",
                409);
        }

        var now = DateTime.UtcNow;
        var reason = request.Reason.Trim();

        await _unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            var orderItemIds = order.SellerOrders.SelectMany(so => so.Items).Select(i => i.OrderItemId).ToList();
            var activeReservations = await _orderRepository.GetActiveReservationsByOrderItemsAsync(orderItemIds, ct);

            foreach (var reservation in activeReservations)
            {
                await _inventoryLedgerService.ReleaseReservationAsync(
                    reservation.LocationId,
                    reservation.VariantId,
                    reservation.Quantity,
                    reservation.OrderItemId,
                    customerId,
                    $"Khách hủy đơn {order.OrderCode}: {reason}",
                    ct);

                reservation.Status = ReservationStatuses.Released;
                reservation.ResolvedAt = now;
            }

            foreach (var so in order.SellerOrders.Where(s => s.Status != SellerOrderStatuses.Cancelled))
            {
                var prevSoStatus = so.Status;
                so.Status = SellerOrderStatuses.Cancelled;
                so.CancelReason = reason;
                so.CancelledAt = now;
                so.UpdatedAt = now;

                await _orderRepository.AddStatusHistoryAsync(new OrderStatusHistory
                {
                    OrderId = order.OrderId,
                    SellerOrderId = so.SellerOrderId,
                    FromStatus = prevSoStatus,
                    ToStatus = SellerOrderStatuses.Cancelled,
                    Reason = reason,
                    ChangedBy = customerId,
                    CreatedAt = now
                }, ct);
            }

            var prevOrderStatus = order.OrderStatus;
            order.OrderStatus = OrderStatuses.Cancelled;
            order.CancelReason = reason;
            order.CancelledAt = now;
            order.UpdatedAt = now;

            await _orderRepository.AddStatusHistoryAsync(new OrderStatusHistory
            {
                OrderId = order.OrderId,
                FromStatus = prevOrderStatus,
                ToStatus = OrderStatuses.Cancelled,
                Reason = reason,
                ChangedBy = customerId,
                CreatedAt = now
            }, ct);

            await _unitOfWork.SaveChangesAsync(ct);
        }, cancellationToken);

        return await _orderRepository.GetOrderDetailForCustomerAsync(customerId, order.OrderId, cancellationToken)
            ?? throw new NotFoundException("Order", order.OrderId);
    }

    public async Task<PaymentDto> CreateCodPaymentAsync(
        long orderId,
        CreatePaymentRequestDto request,
        CancellationToken cancellationToken = default)
    {
        await _paymentValidator.ValidateAndThrowAsync(request, cancellationToken);
        var customerId = RequireCurrentUserId();

        var order = await _orderRepository.GetOrderWithDetailsForUpdateAsync(orderId, cancellationToken);
        if (order == null || order.CustomerId != customerId)
        {
            throw new NotFoundException("Order", orderId);
        }

        if (order.OrderStatus == OrderStatuses.Cancelled || order.OrderStatus == OrderStatuses.Expired)
        {
            throw new BusinessException(
                ErrorCodes.InvalidStatusTransition,
                $"Không thể thanh toán đơn hàng đang ở trạng thái '{order.OrderStatus}'.",
                409);
        }

        if (order.Payments.Any(p => p.PaymentStatus == PaymentStatuses.Paid))
        {
            throw new BusinessException(
                ErrorCodes.PaymentAlreadyProcessed,
                "Đơn hàng này đã được thanh toán.",
                409);
        }

        var now = DateTime.UtcNow;
        var isCod = request.PaymentMethod == PaymentMethods.COD;

        var payment = new Payment
        {
            OrderId = order.OrderId,
            PaymentMethod = request.PaymentMethod,
            Amount = order.TotalAmount,
            PaymentStatus = isCod ? PaymentStatuses.Paid : PaymentStatuses.Pending,
            PaidAt = isCod ? now : null,
            CreatedAt = now
        };

        await _unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            await _orderRepository.AddPaymentAsync(payment, ct);
            if (isCod && order.OrderStatus == OrderStatuses.PendingPayment)
            {
                order.OrderStatus = OrderStatuses.Confirmed;
                order.ExpiresAt = null;
                order.UpdatedAt = now;
                await _orderRepository.AddStatusHistoryAsync(new OrderStatusHistory
                {
                    OrderId = order.OrderId,
                    FromStatus = OrderStatuses.PendingPayment,
                    ToStatus = OrderStatuses.Confirmed,
                    Reason = "Xác nhận thanh toán COD",
                    ChangedBy = customerId,
                    CreatedAt = now
                }, ct);
            }
            await _unitOfWork.SaveChangesAsync(ct);
        }, cancellationToken);

        return new PaymentDto
        {
            PaymentId = payment.PaymentId,
            OrderId = payment.OrderId,
            PaymentMethod = payment.PaymentMethod,
            Amount = payment.Amount,
            PaymentStatus = payment.PaymentStatus,
            TransactionCode = payment.TransactionCode,
            PaidAt = payment.PaidAt,
            CreatedAt = payment.CreatedAt
        };
    }

    public async Task<int> ExpireOverdueOrdersAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var expiredOrders = await _orderRepository.GetExpiredPendingOrdersAsync(now, cancellationToken);
        if (expiredOrders.Count == 0) return 0;

        var count = 0;
        foreach (var order in expiredOrders)
        {
            await _unitOfWork.ExecuteInTransactionAsync(async ct =>
            {
                var itemIds = order.SellerOrders.SelectMany(so => so.Items).Select(i => i.OrderItemId).ToList();
                var reservations = await _orderRepository.GetActiveReservationsByOrderItemsAsync(itemIds, ct);

                foreach (var res in reservations)
                {
                    await _inventoryLedgerService.ReleaseReservationAsync(
                        res.LocationId,
                        res.VariantId,
                        res.Quantity,
                        res.OrderItemId,
                        null,
                        $"Tự động nhả giữ chỗ do đơn {order.OrderCode} quá hạn thanh toán",
                        ct);

                    res.Status = ReservationStatuses.Expired;
                    res.ResolvedAt = now;
                }

                foreach (var so in order.SellerOrders.Where(s => s.Status == SellerOrderStatuses.Pending))
                {
                    so.Status = SellerOrderStatuses.Cancelled;
                    so.CancelReason = "Đơn hàng hết hạn thanh toán";
                    so.CancelledAt = now;
                    so.UpdatedAt = now;
                }

                var prevStatus = order.OrderStatus;
                order.OrderStatus = OrderStatuses.Expired;
                order.UpdatedAt = now;

                await _orderRepository.AddStatusHistoryAsync(new OrderStatusHistory
                {
                    OrderId = order.OrderId,
                    FromStatus = prevStatus,
                    ToStatus = OrderStatuses.Expired,
                    Reason = "Hệ thống tự động hủy đơn quá hạn thanh toán",
                    ChangedBy = null,
                    CreatedAt = now
                }, ct);

                await _unitOfWork.SaveChangesAsync(ct);
            }, cancellationToken);

            count++;
        }

        return count;
    }

    private long RequireCurrentUserId()
    {
        return _currentUser.UserId ?? throw BusinessException.Unauthorized();
    }

    private static string GenerateOrderCode()
    {
        var stamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
        var suffix = Guid.NewGuid().ToString("N")[..6].ToUpperInvariant();
        return $"ORD-{stamp}-{suffix}";
    }
}
