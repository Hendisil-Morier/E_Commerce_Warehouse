using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Order;
using ECommerceWarehouse.Application.DTOs.Shipping;
using ECommerceWarehouse.Domain.Constants;
using ECommerceWarehouse.Domain.Entities.Customer;
using ECommerceWarehouse.Domain.Entities.Order;
using ECommerceWarehouse.Domain.Entities.Warehouse;
using ECommerceWarehouse.Infrastructure.Data;
using ECommerceWarehouse.Infrastructure.Extensions;
using Microsoft.EntityFrameworkCore;

namespace ECommerceWarehouse.Infrastructure.Repositories;

public class OrderRepository : IOrderRepository
{
    private readonly ApplicationDbContext _context;

    public OrderRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Order?> GetByIdempotencyKeyAsync(
        long customerId,
        string idempotencyKey,
        CancellationToken cancellationToken = default)
        => await _context.Orders
            .AsNoTracking()
            .FirstOrDefaultAsync(
                o => o.CustomerId == customerId && o.IdempotencyKey == idempotencyKey,
                cancellationToken);

    public async Task<UserAddress?> GetCustomerAddressAsync(
        long customerId,
        long addressId,
        CancellationToken cancellationToken = default)
        => await _context.UserAddresses
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.UserId == customerId && a.AddressId == addressId, cancellationToken);

    public async Task<List<CartItem>> GetCartItemsForCheckoutAsync(
        long customerId,
        IReadOnlyCollection<long>? cartItemIds,
        CancellationToken cancellationToken = default)
    {
        var query = _context.CartItems
            .Include(ci => ci.Cart)
            .Include(ci => ci.Variant)
                .ThenInclude(v => v.Product)
                    .ThenInclude(p => p.Shop)
                        .ThenInclude(s => s.Seller)
            .Where(ci => ci.Cart.UserId == customerId);

        if (cartItemIds != null && cartItemIds.Count > 0)
        {
            query = query.Where(ci => cartItemIds.Contains(ci.CartItemId));
        }

        return await query.ToListAsync(cancellationToken);
    }

    public async Task<List<Inventory>> GetSellablePlatformInventoriesAsync(
        long variantId,
        CancellationToken cancellationToken = default)
        => await _context.Inventories
            .AsNoTracking()
            .Include(i => i.Location)
                .ThenInclude(l => l.Warehouse)
            .Where(i =>
                i.VariantId == variantId &&
                i.Location.Warehouse.WarehouseType == WarehouseTypes.Platform &&
                i.Location.Warehouse.IsActive &&
                i.Location.IsSellable &&
                i.Location.IsActive &&
                (i.QuantityOnHand - i.QuantityReserved) > 0)
            .OrderByDescending(i => i.QuantityOnHand - i.QuantityReserved)
            .ToListAsync(cancellationToken);

    public async Task AddOrderAsync(Order order, CancellationToken cancellationToken = default)
        => await _context.Orders.AddAsync(order, cancellationToken);

    public async Task AddStockReservationAsync(StockReservation reservation, CancellationToken cancellationToken = default)
        => await _context.StockReservations.AddAsync(reservation, cancellationToken);

    public async Task AddStatusHistoryAsync(OrderStatusHistory history, CancellationToken cancellationToken = default)
        => await _context.OrderStatusHistories.AddAsync(history, cancellationToken);

    public async Task AddPaymentAsync(Payment payment, CancellationToken cancellationToken = default)
        => await _context.Payments.AddAsync(payment, cancellationToken);

    public void RemoveCartItems(IEnumerable<CartItem> items)
        => _context.CartItems.RemoveRange(items);

    public async Task<PagedResult<OrderListItemDto>> GetCustomerOrdersPagedAsync(
        long customerId,
        OrderQueryDto query,
        CancellationToken cancellationToken = default)
    {
        var baseQuery = _context.Orders
            .AsNoTracking()
            .Include(o => o.SellerOrders)
                .ThenInclude(so => so.Items)
            .Include(o => o.Payments)
            .Where(o => o.CustomerId == customerId);

        if (!string.IsNullOrWhiteSpace(query.Status))
        {
            baseQuery = baseQuery.Where(o => o.OrderStatus == query.Status);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLower();
            baseQuery = baseQuery.Where(o => o.OrderCode.ToLower().Contains(search));
        }

        var projected = baseQuery
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new OrderListItemDto
            {
                OrderId = o.OrderId,
                OrderCode = o.OrderCode,
                Subtotal = o.Subtotal,
                ShippingFee = o.ShippingFee,
                DiscountAmount = o.DiscountAmount,
                TotalAmount = o.TotalAmount,
                OrderStatus = o.OrderStatus,
                PaymentMethod = o.Payments.OrderByDescending(p => p.CreatedAt).Select(p => p.PaymentMethod).FirstOrDefault() ?? PaymentMethods.COD,
                PaymentStatus = o.Payments.OrderByDescending(p => p.CreatedAt).Select(p => p.PaymentStatus).FirstOrDefault() ?? PaymentStatuses.Pending,
                ExpiresAt = o.ExpiresAt,
                CreatedAt = o.CreatedAt,
                SellerOrderCount = o.SellerOrders.Count,
                TotalItemCount = o.SellerOrders.SelectMany(so => so.Items).Sum(i => i.Quantity)
            });

        return await projected.ToPagedResultAsync(query, cancellationToken);
    }

    public async Task<PagedResult<OrderListItemDto>> GetAdminOrdersPagedAsync(
        AdminOrderQueryDto query,
        CancellationToken cancellationToken = default)
    {
        var baseQuery = _context.Orders
            .AsNoTracking()
            .Include(o => o.Customer)
            .Include(o => o.SellerOrders)
                .ThenInclude(so => so.Items)
            .Include(o => o.Payments)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Status))
        {
            baseQuery = baseQuery.Where(o => o.OrderStatus == query.Status);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLower();
            baseQuery = baseQuery.Where(o =>
                o.OrderCode.ToLower().Contains(search) ||
                o.RecipientName.ToLower().Contains(search) ||
                o.Customer.Email.ToLower().Contains(search));
        }

        if (query.From.HasValue)
        {
            baseQuery = baseQuery.Where(o => o.CreatedAt >= query.From.Value);
        }

        if (query.To.HasValue)
        {
            baseQuery = baseQuery.Where(o => o.CreatedAt <= query.To.Value);
        }

        var projected = baseQuery
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new OrderListItemDto
            {
                OrderId = o.OrderId,
                OrderCode = o.OrderCode,
                Subtotal = o.Subtotal,
                ShippingFee = o.ShippingFee,
                DiscountAmount = o.DiscountAmount,
                TotalAmount = o.TotalAmount,
                OrderStatus = o.OrderStatus,
                PaymentMethod = o.Payments.OrderByDescending(p => p.CreatedAt).Select(p => p.PaymentMethod).FirstOrDefault() ?? PaymentMethods.COD,
                PaymentStatus = o.Payments.OrderByDescending(p => p.CreatedAt).Select(p => p.PaymentStatus).FirstOrDefault() ?? PaymentStatuses.Pending,
                ExpiresAt = o.ExpiresAt,
                CreatedAt = o.CreatedAt,
                SellerOrderCount = o.SellerOrders.Count,
                TotalItemCount = o.SellerOrders.SelectMany(so => so.Items).Sum(i => i.Quantity)
            });

        return await projected.ToPagedResultAsync(query, cancellationToken);
    }

    public async Task<OrderDetailDto?> GetAdminOrderDetailAsync(
        long orderId,
        CancellationToken cancellationToken = default)
    {
        var order = await _context.Orders
            .AsNoTracking()
            .Include(o => o.SellerOrders).ThenInclude(so => so.Seller)
            .Include(o => o.SellerOrders).ThenInclude(so => so.Warehouse)
            .Include(o => o.SellerOrders).ThenInclude(so => so.Items)
            .Include(o => o.SellerOrders).ThenInclude(so => so.Shipments).ThenInclude(s => s.Carrier)
            .Include(o => o.SellerOrders).ThenInclude(so => so.Shipments).ThenInclude(s => s.TrackingEvents)
            .Include(o => o.Payments)
            .Include(o => o.StatusHistories)
            .FirstOrDefaultAsync(o => o.OrderId == orderId, cancellationToken);

        return order == null ? null : MapOrderDetail(order);
    }

    public async Task<OrderDetailDto?> GetOrderDetailForCustomerAsync(
        long customerId,
        long orderId,
        CancellationToken cancellationToken = default)
    {
        var order = await _context.Orders
            .AsNoTracking()
            .Include(o => o.SellerOrders)
                .ThenInclude(so => so.Seller)
            .Include(o => o.SellerOrders)
                .ThenInclude(so => so.Warehouse)
            .Include(o => o.SellerOrders)
                .ThenInclude(so => so.Items)
            .Include(o => o.SellerOrders)
                .ThenInclude(so => so.Shipments)
                    .ThenInclude(s => s.Carrier)
            .Include(o => o.SellerOrders)
                .ThenInclude(so => so.Shipments)
                    .ThenInclude(s => s.TrackingEvents)
            .Include(o => o.Payments)
            .Include(o => o.StatusHistories)
            .FirstOrDefaultAsync(o => o.OrderId == orderId && o.CustomerId == customerId, cancellationToken);

        return order == null ? null : MapOrderDetail(order);
    }

    private static OrderDetailDto MapOrderDetail(Order order)
    {

        return new OrderDetailDto
        {
            OrderId = order.OrderId,
            OrderCode = order.OrderCode,
            IdempotencyKey = order.IdempotencyKey,
            RecipientName = order.RecipientName,
            RecipientPhone = order.RecipientPhone,
            ShippingProvince = order.ShippingProvince,
            ShippingDistrict = order.ShippingDistrict,
            ShippingWard = order.ShippingWard,
            ShippingStreetAddress = order.ShippingStreetAddress,
            Subtotal = order.Subtotal,
            ShippingFee = order.ShippingFee,
            DiscountAmount = order.DiscountAmount,
            TotalAmount = order.TotalAmount,
            OrderStatus = order.OrderStatus,
            ExpiresAt = order.ExpiresAt,
            CancelReason = order.CancelReason,
            CancelledAt = order.CancelledAt,
            Note = order.Note,
            CreatedAt = order.CreatedAt,
            UpdatedAt = order.UpdatedAt,
            SellerOrders = order.SellerOrders.Select(so => new OrderSellerOrderDto
            {
                SellerOrderId = so.SellerOrderId,
                SellerId = so.SellerId,
                SellerBusinessName = so.Seller.BusinessName,
                WarehouseId = so.WarehouseId,
                WarehouseName = so.Warehouse?.WarehouseName,
                WarehouseAddress = so.Warehouse?.Address,
                Subtotal = so.Subtotal,
                Status = so.Status,
                CancelReason = so.CancelReason,
                CancelledAt = so.CancelledAt,
                Shipment = so.Shipments
                    .OrderByDescending(s => s.CreatedAt)
                    .Select(s => new OrderShipmentDto
                    {
                        ShipmentId = s.ShipmentId,
                        CarrierCode = s.Carrier != null ? s.Carrier.CarrierCode : null,
                        CarrierName = s.Carrier != null ? s.Carrier.CarrierName : null,
                        TrackingNumber = s.TrackingNumber,
                        ShippingStatus = s.ShippingStatus,
                        CodAmount = s.CodAmount,
                        FailedReason = s.FailedReason,
                        ShippedAt = s.ShippedAt,
                        DeliveredAt = s.DeliveredAt,
                        CreatedAt = s.CreatedAt,
                        TrackingEvents = s.TrackingEvents
                            .OrderByDescending(e => e.EventTime)
                            .Select(e => new ShipmentTrackingEventDto
                            {
                                EventId = e.EventId,
                                ShipmentId = e.ShipmentId,
                                Milestone = e.Milestone,
                                Title = e.Title,
                                Description = e.Description,
                                LocationName = e.LocationName,
                                Latitude = e.Latitude,
                                Longitude = e.Longitude,
                                EventTime = e.EventTime
                            }).ToList()
                    })
                    .FirstOrDefault(),
                Items = so.Items.Select(i => new OrderItemDto
                {
                    OrderItemId = i.OrderItemId,
                    VariantId = i.VariantId,
                    ProductName = i.ProductNameSnapshot,
                    SKU = i.SKUSnapshot,
                    UnitPrice = i.UnitPrice,
                    Quantity = i.Quantity,
                    LineTotal = i.LineTotal
                }).ToList()
            }).ToList(),
            Payments = order.Payments.Select(p => new PaymentDto
            {
                PaymentId = p.PaymentId,
                OrderId = p.OrderId,
                PaymentMethod = p.PaymentMethod,
                Amount = p.Amount,
                PaymentStatus = p.PaymentStatus,
                TransactionCode = p.TransactionCode,
                PaidAt = p.PaidAt,
                CreatedAt = p.CreatedAt
            }).ToList(),
            StatusHistories = order.StatusHistories
                .OrderByDescending(h => h.CreatedAt)
                .Select(h => new OrderStatusHistoryDto
                {
                    HistoryId = h.HistoryId,
                    SellerOrderId = h.SellerOrderId,
                    FromStatus = h.FromStatus,
                    ToStatus = h.ToStatus,
                    Reason = h.Reason,
                    ChangedBy = h.ChangedBy,
                    CreatedAt = h.CreatedAt
                }).ToList()
        };
    }

    public async Task<Order?> GetOrderWithDetailsForUpdateAsync(
        long orderId,
        CancellationToken cancellationToken = default)
        => await _context.Orders
            .Include(o => o.SellerOrders)
                .ThenInclude(so => so.Items)
            .Include(o => o.Payments)
            .FirstOrDefaultAsync(o => o.OrderId == orderId, cancellationToken);

    public async Task<List<StockReservation>> GetActiveReservationsByOrderItemsAsync(
        IReadOnlyCollection<long> orderItemIds,
        CancellationToken cancellationToken = default)
    {
        if (orderItemIds.Count == 0) return [];
        return await _context.StockReservations
            .Where(r => orderItemIds.Contains(r.OrderItemId) && r.Status == ReservationStatuses.Active)
            .ToListAsync(cancellationToken);
    }

    public async Task<PagedResult<SellerOrderListItemDto>> GetSellerOrdersPagedAsync(
        long sellerId,
        SellerOrderQueryDto query,
        CancellationToken cancellationToken = default)
    {
        var baseQuery = _context.SellerOrders
            .AsNoTracking()
            .Include(so => so.Order)
                .ThenInclude(o => o.Customer)
            .Include(so => so.Order)
                .ThenInclude(o => o.Payments)
            .Include(so => so.Warehouse)
            .Include(so => so.Items)
            .Where(so => so.SellerId == sellerId);

        if (!string.IsNullOrWhiteSpace(query.Status))
        {
            baseQuery = baseQuery.Where(so => so.Status == query.Status);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLower();
            baseQuery = baseQuery.Where(so =>
                so.Order.OrderCode.ToLower().Contains(search) ||
                so.Order.RecipientName.ToLower().Contains(search));
        }

        var projected = baseQuery
            .OrderByDescending(so => so.CreatedAt)
            .Select(so => new SellerOrderListItemDto
            {
                SellerOrderId = so.SellerOrderId,
                OrderId = so.OrderId,
                OrderCode = so.Order.OrderCode,
                CustomerName = so.Order.RecipientName,
                WarehouseId = so.WarehouseId,
                WarehouseName = so.Warehouse != null ? so.Warehouse.WarehouseName : null,
                Subtotal = so.Subtotal,
                Status = so.Status,
                OrderStatus = so.Order.OrderStatus,
                PaymentMethod = so.Order.Payments.OrderByDescending(p => p.CreatedAt).Select(p => p.PaymentMethod).FirstOrDefault() ?? PaymentMethods.COD,
                PaymentStatus = so.Order.Payments.OrderByDescending(p => p.CreatedAt).Select(p => p.PaymentStatus).FirstOrDefault() ?? PaymentStatuses.Pending,
                ItemCount = so.Items.Sum(i => i.Quantity),
                CreatedAt = so.CreatedAt
            });

        return await projected.ToPagedResultAsync(query, cancellationToken);
    }

    public async Task<SellerOrderDetailDto?> GetSellerOrderDetailAsync(
        long sellerId,
        long sellerOrderId,
        CancellationToken cancellationToken = default)
    {
        var so = await _context.SellerOrders
            .AsNoTracking()
            .Include(x => x.Order)
                .ThenInclude(o => o.Payments)
            .Include(x => x.Order)
                .ThenInclude(o => o.StatusHistories)
            .Include(x => x.Warehouse)
            .Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.SellerOrderId == sellerOrderId && x.SellerId == sellerId, cancellationToken);

        if (so == null) return null;

        var payment = so.Order.Payments.OrderByDescending(p => p.CreatedAt).FirstOrDefault();

        return new SellerOrderDetailDto
        {
            SellerOrderId = so.SellerOrderId,
            OrderId = so.OrderId,
            OrderCode = so.Order.OrderCode,
            SellerId = so.SellerId,
            WarehouseId = so.WarehouseId,
            WarehouseName = so.Warehouse?.WarehouseName,
            Subtotal = so.Subtotal,
            Status = so.Status,
            OrderStatus = so.Order.OrderStatus,
            CancelReason = so.CancelReason,
            CancelledAt = so.CancelledAt,
            RecipientName = so.Order.RecipientName,
            RecipientPhone = so.Order.RecipientPhone,
            ShippingProvince = so.Order.ShippingProvince,
            ShippingDistrict = so.Order.ShippingDistrict,
            ShippingWard = so.Order.ShippingWard,
            ShippingStreetAddress = so.Order.ShippingStreetAddress,
            PaymentMethod = payment?.PaymentMethod ?? PaymentMethods.COD,
            PaymentStatus = payment?.PaymentStatus ?? PaymentStatuses.Pending,
            CreatedAt = so.CreatedAt,
            UpdatedAt = so.UpdatedAt,
            Items = so.Items.Select(i => new OrderItemDto
            {
                OrderItemId = i.OrderItemId,
                VariantId = i.VariantId,
                ProductName = i.ProductNameSnapshot,
                SKU = i.SKUSnapshot,
                UnitPrice = i.UnitPrice,
                Quantity = i.Quantity,
                LineTotal = i.LineTotal
            }).ToList(),
            StatusHistories = so.Order.StatusHistories
                .Where(h => h.SellerOrderId == null || h.SellerOrderId == so.SellerOrderId)
                .OrderByDescending(h => h.CreatedAt)
                .Select(h => new OrderStatusHistoryDto
                {
                    HistoryId = h.HistoryId,
                    SellerOrderId = h.SellerOrderId,
                    FromStatus = h.FromStatus,
                    ToStatus = h.ToStatus,
                    Reason = h.Reason,
                    ChangedBy = h.ChangedBy,
                    CreatedAt = h.CreatedAt
                }).ToList()
        };
    }

    public async Task<SellerOrder?> GetSellerOrderWithOrderAsync(
        long sellerOrderId,
        CancellationToken cancellationToken = default)
        => await _context.SellerOrders
            .Include(so => so.Items)
            .Include(so => so.Order)
                .ThenInclude(o => o.SellerOrders)
            .Include(so => so.Order)
                .ThenInclude(o => o.Payments)
            .FirstOrDefaultAsync(so => so.SellerOrderId == sellerOrderId, cancellationToken);

    public async Task<List<Order>> GetExpiredPendingOrdersAsync(
        DateTime utcNow,
        CancellationToken cancellationToken = default)
        => await _context.Orders
            .Include(o => o.SellerOrders)
                .ThenInclude(so => so.Items)
            .Where(o =>
                o.OrderStatus == OrderStatuses.PendingPayment &&
                o.ExpiresAt != null &&
                o.ExpiresAt < utcNow)
            .ToListAsync(cancellationToken);
}
