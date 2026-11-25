using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Order;
using ECommerceWarehouse.Domain.Entities.Customer;
using ECommerceWarehouse.Domain.Entities.Order;
using ECommerceWarehouse.Domain.Entities.Warehouse;

namespace ECommerceWarehouse.Application.Contracts.Persistence;

public interface IOrderRepository
{
    Task<Order?> GetByIdempotencyKeyAsync(long customerId, string idempotencyKey, CancellationToken cancellationToken = default);
    Task<UserAddress?> GetCustomerAddressAsync(long customerId, long addressId, CancellationToken cancellationToken = default);
    Task<List<CartItem>> GetCartItemsForCheckoutAsync(long customerId, IReadOnlyCollection<long>? cartItemIds, CancellationToken cancellationToken = default);

    /// <summary>
    /// Tìm các bản ghi tồn kho bán được tại kho sàn (WarehouseType = 'Platform', IsSellable = true, IsActive = true) cho một biến thể.
    /// </summary>
    Task<List<Inventory>> GetSellablePlatformInventoriesAsync(long variantId, CancellationToken cancellationToken = default);

    Task AddOrderAsync(Order order, CancellationToken cancellationToken = default);
    Task AddStockReservationAsync(StockReservation reservation, CancellationToken cancellationToken = default);
    Task AddStatusHistoryAsync(OrderStatusHistory history, CancellationToken cancellationToken = default);
    Task AddPaymentAsync(Payment payment, CancellationToken cancellationToken = default);
    void RemoveCartItems(IEnumerable<CartItem> items);

    Task<PagedResult<OrderListItemDto>> GetCustomerOrdersPagedAsync(long customerId, OrderQueryDto query, CancellationToken cancellationToken = default);
    Task<OrderDetailDto?> GetOrderDetailForCustomerAsync(long customerId, long orderId, CancellationToken cancellationToken = default);
    Task<PagedResult<OrderListItemDto>> GetAdminOrdersPagedAsync(AdminOrderQueryDto query, CancellationToken cancellationToken = default);
    Task<OrderDetailDto?> GetAdminOrderDetailAsync(long orderId, CancellationToken cancellationToken = default);
    Task<Order?> GetOrderWithDetailsForUpdateAsync(long orderId, CancellationToken cancellationToken = default);
    Task<List<StockReservation>> GetActiveReservationsByOrderItemsAsync(IReadOnlyCollection<long> orderItemIds, CancellationToken cancellationToken = default);

    Task<PagedResult<SellerOrderListItemDto>> GetSellerOrdersPagedAsync(long sellerId, SellerOrderQueryDto query, CancellationToken cancellationToken = default);
    Task<SellerOrderDetailDto?> GetSellerOrderDetailAsync(long sellerId, long sellerOrderId, CancellationToken cancellationToken = default);
    Task<SellerOrder?> GetSellerOrderWithOrderAsync(long sellerOrderId, CancellationToken cancellationToken = default);

    Task<List<Order>> GetExpiredPendingOrdersAsync(DateTime utcNow, CancellationToken cancellationToken = default);
}
