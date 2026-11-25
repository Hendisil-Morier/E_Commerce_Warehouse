using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.Contracts.Services;
using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Order;
using ECommerceWarehouse.Application.DTOs.Shipping;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Application.Validators.Shipping;
using ECommerceWarehouse.Domain.Constants;
using ECommerceWarehouse.Domain.Entities.Customer;
using ECommerceWarehouse.Domain.Entities.Order;
using ECommerceWarehouse.Domain.Entities.Review;
using ECommerceWarehouse.Domain.Entities.Warehouse;
using ECommerceWarehouse.Domain.Exceptions;

namespace ECommerceWarehouse.UnitTests.Services;

public class ShipmentServiceTests
{
    private sealed class StubUnitOfWork : IUnitOfWork
    {
        public IGenericRepository<T> Repository<T>() where T : class => throw new NotImplementedException();
        public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) => Task.FromResult(1);
        public Task ExecuteInTransactionAsync(Func<CancellationToken, Task> operation, CancellationToken cancellationToken = default)
            => operation(cancellationToken);
        public void Dispose() { }
    }

    private sealed class StubCurrentUser : ICurrentUser
    {
        public long? UserId { get; set; } = 30;
        public IReadOnlyList<string> Roles { get; set; } = [RoleNames.WarehouseStaff];
        public long? SellerId => null;
        public bool IsAuthenticated => UserId.HasValue;
        public bool IsInRole(string role) => Roles.Contains(role);
        public Task<long?> GetSellerIdAsync(CancellationToken cancellationToken = default) => Task.FromResult<long?>(null);
    }

    private sealed class StubShipmentRepo : IShipmentRepository
    {
        public List<Carrier> Carriers { get; } = [new() { CarrierId = 1, CarrierCode = "GHN", CarrierName = "Giao Hàng Nhanh", IsActive = true }];
        public List<SellerOrder> SellerOrders { get; } = [];
        public List<Shipment> Shipments { get; } = [];

        public Task<List<CarrierDto>> GetActiveCarriersAsync(CancellationToken cancellationToken = default)
            => Task.FromResult(Carriers.Select(c => new CarrierDto { CarrierId = c.CarrierId, CarrierCode = c.CarrierCode, CarrierName = c.CarrierName, IsActive = c.IsActive }).ToList());

        public Task<Carrier?> GetCarrierByIdAsync(int carrierId, CancellationToken cancellationToken = default)
            => Task.FromResult(Carriers.FirstOrDefault(c => c.CarrierId == carrierId));

        public Task<PagedResult<ShipmentDto>> GetPagedAsync(ShipmentQueryDto query, CancellationToken cancellationToken = default)
            => Task.FromResult(PagedResult<ShipmentDto>.Create([], query.NormalizedPage, query.NormalizedPageSize, 0));

        public Task<Shipment?> GetByIdWithOrderAsync(long shipmentId, CancellationToken cancellationToken = default)
            => Task.FromResult(Shipments.FirstOrDefault(s => s.ShipmentId == shipmentId));

        public Task<ShipmentDto?> GetDtoByIdAsync(long shipmentId, CancellationToken cancellationToken = default)
        {
            var s = Shipments.FirstOrDefault(x => x.ShipmentId == shipmentId);
            if (s == null) return Task.FromResult<ShipmentDto?>(null);
            return Task.FromResult<ShipmentDto?>(new ShipmentDto
            {
                ShipmentId = s.ShipmentId,
                SellerOrderId = s.SellerOrderId,
                TrackingNumber = s.TrackingNumber,
                ShippingStatus = s.ShippingStatus,
                CodAmount = s.CodAmount
            });
        }

        public Task<ShipmentDto?> GetByTrackingForCustomerAsync(long customerId, string trackingNumber, CancellationToken cancellationToken = default)
        {
            var s = Shipments.FirstOrDefault(x => x.TrackingNumber == trackingNumber && x.SellerOrder.Order.CustomerId == customerId);
            if (s == null) return Task.FromResult<ShipmentDto?>(null);
            return Task.FromResult<ShipmentDto?>(new ShipmentDto { ShipmentId = s.ShipmentId, TrackingNumber = s.TrackingNumber, ShippingStatus = s.ShippingStatus });
        }

        public Task<SellerOrder?> GetSellerOrderForShipmentAsync(long sellerOrderId, CancellationToken cancellationToken = default)
            => Task.FromResult(SellerOrders.FirstOrDefault(so => so.SellerOrderId == sellerOrderId));

        public Task<bool> TrackingNumberExistsAsync(int carrierId, string trackingNumber, CancellationToken cancellationToken = default)
            => Task.FromResult(Shipments.Any(s => s.CarrierId == carrierId && s.TrackingNumber == trackingNumber));

        public Task AddShipmentAsync(Shipment shipment, CancellationToken cancellationToken = default)
        {
            shipment.ShipmentId = Shipments.Count + 1;
            Shipments.Add(shipment);
            return Task.CompletedTask;
        }
    }

    private sealed class StubOrderRepo : IOrderRepository
    {
        public Task<Order?> GetByIdempotencyKeyAsync(long customerId, string idempotencyKey, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<UserAddress?> GetCustomerAddressAsync(long customerId, long addressId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<List<CartItem>> GetCartItemsForCheckoutAsync(long customerId, IReadOnlyCollection<long>? cartItemIds, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<List<Inventory>> GetSellablePlatformInventoriesAsync(long variantId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task AddOrderAsync(Order order, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task AddStockReservationAsync(StockReservation reservation, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task AddStatusHistoryAsync(OrderStatusHistory history, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task AddPaymentAsync(Payment payment, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public void RemoveCartItems(IEnumerable<CartItem> items) { }
        public Task<PagedResult<OrderListItemDto>> GetCustomerOrdersPagedAsync(long customerId, OrderQueryDto query, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<OrderDetailDto?> GetOrderDetailForCustomerAsync(long customerId, long orderId, CancellationToken cancellationToken = default) => throw new NotImplementedException();

        public Task<PagedResult<OrderListItemDto>> GetAdminOrdersPagedAsync(AdminOrderQueryDto query, CancellationToken cancellationToken = default) => throw new NotImplementedException();

        public Task<OrderDetailDto?> GetAdminOrderDetailAsync(long orderId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<Order?> GetOrderWithDetailsForUpdateAsync(long orderId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<List<StockReservation>> GetActiveReservationsByOrderItemsAsync(IReadOnlyCollection<long> orderItemIds, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<PagedResult<SellerOrderListItemDto>> GetSellerOrdersPagedAsync(long sellerId, SellerOrderQueryDto query, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<SellerOrderDetailDto?> GetSellerOrderDetailAsync(long sellerId, long sellerOrderId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<SellerOrder?> GetSellerOrderWithOrderAsync(long sellerOrderId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<List<Order>> GetExpiredPendingOrdersAsync(DateTime utcNow, CancellationToken cancellationToken = default) => throw new NotImplementedException();
    }

    private static (ShipmentService Service, StubShipmentRepo Repo, StubCurrentUser User) CreateSut()
    {
        var repo = new StubShipmentRepo();
        var user = new StubCurrentUser();

        var service = new ShipmentService(
            repo,
            new StubOrderRepo(),
            new StubUnitOfWork(),
            user,
            new ShipmentQueryValidator(),
            new CreateShipmentRequestValidator(),
            new UpdateShipmentStatusRequestValidator());

        return (service, repo, user);
    }

    [Fact]
    public async Task CreateShipmentAsync_ShippedSellerOrder_CreatesPreparingShipment()
    {
        var (service, repo, _) = CreateSut();
        var order = new Order { OrderId = 1, CustomerId = 100, OrderCode = "ORD-1", Payments = [new Payment { PaymentMethod = PaymentMethods.COD }] };
        repo.SellerOrders.Add(new SellerOrder { SellerOrderId = 10, OrderId = 1, Subtotal = 250_000m, Status = SellerOrderStatuses.Shipped, Order = order });

        var dto = await service.CreateShipmentAsync(10, new CreateShipmentRequestDto { CarrierId = 1, TrackingNumber = "GHN-12345" });

        Assert.Equal(ShippingStatuses.Preparing, dto.ShippingStatus);
        Assert.Equal(250_000m, dto.CodAmount);
    }

    [Fact]
    public async Task UpdateShipmentStatusAsync_InTransitToDelivered_MarksSellerOrderDeliveredAndOrderCompleted()
    {
        var (service, repo, _) = CreateSut();
        var order = new Order { OrderId = 1, CustomerId = 100, OrderCode = "ORD-1", OrderStatus = OrderStatuses.Shipped };
        var so = new SellerOrder { SellerOrderId = 10, OrderId = 1, Status = SellerOrderStatuses.Shipped, Order = order };
        order.SellerOrders.Add(so);
        repo.Shipments.Add(new Shipment { ShipmentId = 1, SellerOrderId = 10, TrackingNumber = "GHN-123", ShippingStatus = ShippingStatuses.InTransit, SellerOrder = so });

        var updated = await service.UpdateShipmentStatusAsync(1, new UpdateShipmentStatusRequestDto { Status = ShippingStatuses.Delivered });

        Assert.Equal(ShippingStatuses.Delivered, updated.ShippingStatus);
        Assert.Equal(SellerOrderStatuses.Delivered, so.Status);
        Assert.Equal(OrderStatuses.Completed, order.OrderStatus);
    }

    [Fact]
    public async Task TrackByNumberForCustomerAsync_OtherCustomerShipment_ThrowsNotFoundException()
    {
        var (service, repo, user) = CreateSut();
        user.UserId = 100;
        var order = new Order { OrderId = 1, CustomerId = 999, OrderCode = "ORD-OTHER" };
        var so = new SellerOrder { SellerOrderId = 10, OrderId = 1, Order = order };
        repo.Shipments.Add(new Shipment { ShipmentId = 1, SellerOrderId = 10, TrackingNumber = "GHN-SECRET", SellerOrder = so });

        await Assert.ThrowsAsync<NotFoundException>(() => service.TrackByNumberForCustomerAsync("GHN-SECRET"));
    }
}
