using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.Contracts.Services;
using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Order;
using ECommerceWarehouse.Application.DTOs.Warehouse;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Application.Validators.Order;
using ECommerceWarehouse.Domain.Constants;
using ECommerceWarehouse.Domain.Entities.Catalog;
using ECommerceWarehouse.Domain.Entities.Customer;
using ECommerceWarehouse.Domain.Entities.Order;
using ECommerceWarehouse.Domain.Entities.Seller;
using ECommerceWarehouse.Domain.Entities.Warehouse;
using ECommerceWarehouse.Domain.Enums;
using ECommerceWarehouse.Domain.Exceptions;

namespace ECommerceWarehouse.UnitTests.Services;

public class OrderServiceTests
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
        public long? UserId { get; set; } = 100;
        public IReadOnlyList<string> Roles { get; set; } = [RoleNames.Customer];
        public long? SellerId => null;
        public bool IsAuthenticated => UserId.HasValue;
        public bool IsInRole(string role) => Roles.Contains(role);
        public Task<long?> GetSellerIdAsync(CancellationToken cancellationToken = default) => Task.FromResult<long?>(null);
    }

    private sealed class SpyInventoryLedger : IInventoryLedgerService
    {
        public List<(long InventoryId, int Qty, long RefId)> ReservedCalls { get; } = [];
        public List<(long LocationId, long VariantId, int Qty)> ReleasedCalls { get; } = [];
        public bool ForceInsufficientStock { get; set; }

        public Task IncreaseOnHandAsync(long warehouseId, long locationId, long variantId, int quantity, string movementType, string referenceType, long referenceId, long? createdBy, string? note = null, CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task ReserveStockAtomicAsync(long inventoryId, int quantity, long referenceId, long? createdBy, string? note = null, CancellationToken cancellationToken = default)
        {
            if (ForceInsufficientStock)
                throw new BusinessException(ErrorCodes.InsufficientStock, "Không đủ tồn.", 409);

            ReservedCalls.Add((inventoryId, quantity, referenceId));
            return Task.CompletedTask;
        }

        public Task ReleaseReservationAsync(long locationId, long variantId, int quantity, long referenceId, long? createdBy, string? note = null, CancellationToken cancellationToken = default)
        {
            ReleasedCalls.Add((locationId, variantId, quantity));
            return Task.CompletedTask;
        }

        public Task DispatchReservedStockAsync(long locationId, long variantId, int quantity, long referenceId, long? createdBy, string? note = null, CancellationToken cancellationToken = default)
            => Task.CompletedTask;
        public Task TransferAdjustmentAsync(long warehouseId, long sourceLocationId, long destinationLocationId, long variantId, int quantity, string referenceType, long referenceId, long? createdBy, string? note = null, CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task<PagedResult<InventoryItemDto>> GetInventoryAsync(InventoryQueryDto query, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<VariantAvailabilityDto> GetVariantAvailabilityAsync(long variantId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<PagedResult<StockMovementDto>> GetStockMovementsAsync(StockMovementQueryDto query, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<List<StockReconciliationItemDto>> GetReconciliationDiscrepanciesAsync(CancellationToken cancellationToken = default) => throw new NotImplementedException();
    }

    private sealed class InMemoryOrderRepo : IOrderRepository
    {
        public List<UserAddress> Addresses { get; } = [];
        public List<CartItem> CartItems { get; } = [];
        public List<Inventory> Inventories { get; } = [];
        public List<Order> Orders { get; } = [];
        public List<StockReservation> Reservations { get; } = [];
        public List<OrderStatusHistory> Histories { get; } = [];
        public List<Payment> Payments { get; } = [];

        public Task<Order?> GetByIdempotencyKeyAsync(long customerId, string idempotencyKey, CancellationToken cancellationToken = default)
            => Task.FromResult(Orders.FirstOrDefault(o => o.CustomerId == customerId && o.IdempotencyKey == idempotencyKey));

        public Task<UserAddress?> GetCustomerAddressAsync(long customerId, long addressId, CancellationToken cancellationToken = default)
            => Task.FromResult(Addresses.FirstOrDefault(a => a.UserId == customerId && a.AddressId == addressId));

        public Task<List<CartItem>> GetCartItemsForCheckoutAsync(long customerId, IReadOnlyCollection<long>? cartItemIds, CancellationToken cancellationToken = default)
        {
            var q = CartItems.Where(ci => ci.Cart.UserId == customerId);
            if (cartItemIds != null && cartItemIds.Count > 0) q = q.Where(ci => cartItemIds.Contains(ci.CartItemId));
            return Task.FromResult(q.ToList());
        }

        public Task<List<Inventory>> GetSellablePlatformInventoriesAsync(long variantId, CancellationToken cancellationToken = default)
            => Task.FromResult(Inventories.Where(i => i.VariantId == variantId && i.QuantityOnHand - i.QuantityReserved > 0).ToList());

        public Task AddOrderAsync(Order order, CancellationToken cancellationToken = default)
        {
            order.OrderId = Orders.Count + 1;
            long soSeq = 1;
            long oiSeq = 1;
            foreach (var so in order.SellerOrders)
            {
                so.SellerOrderId = soSeq++;
                so.OrderId = order.OrderId;
                foreach (var item in so.Items)
                {
                    item.OrderItemId = oiSeq++;
                    item.SellerOrderId = so.SellerOrderId;
                }
            }
            Orders.Add(order);
            return Task.CompletedTask;
        }

        public Task AddStockReservationAsync(StockReservation reservation, CancellationToken cancellationToken = default)
        {
            reservation.ReservationId = Reservations.Count + 1;
            Reservations.Add(reservation);
            return Task.CompletedTask;
        }

        public Task AddStatusHistoryAsync(OrderStatusHistory history, CancellationToken cancellationToken = default)
        {
            history.HistoryId = Histories.Count + 1;
            Histories.Add(history);
            return Task.CompletedTask;
        }

        public Task AddPaymentAsync(Payment payment, CancellationToken cancellationToken = default)
        {
            payment.PaymentId = Payments.Count + 1;
            Payments.Add(payment);
            return Task.CompletedTask;
        }

        public void RemoveCartItems(IEnumerable<CartItem> items)
        {
            var set = items.ToHashSet();
            CartItems.RemoveAll(c => set.Contains(c));
        }

        public Task<PagedResult<OrderListItemDto>> GetCustomerOrdersPagedAsync(long customerId, OrderQueryDto query, CancellationToken cancellationToken = default)
            => Task.FromResult(PagedResult<OrderListItemDto>.Create([], query.NormalizedPage, query.NormalizedPageSize, 0));

        public Task<PagedResult<OrderListItemDto>> GetAdminOrdersPagedAsync(AdminOrderQueryDto query, CancellationToken cancellationToken = default)
            => Task.FromResult(PagedResult<OrderListItemDto>.Create([], query.NormalizedPage, query.NormalizedPageSize, 0));

        public Task<OrderDetailDto?> GetAdminOrderDetailAsync(long orderId, CancellationToken cancellationToken = default)
        {
            var order = Orders.FirstOrDefault(o => o.OrderId == orderId);
            if (order == null) return Task.FromResult<OrderDetailDto?>(null);

            return Task.FromResult<OrderDetailDto?>(new OrderDetailDto
            {
                OrderId = order.OrderId,
                OrderCode = order.OrderCode,
                IdempotencyKey = order.IdempotencyKey,
                Subtotal = order.Subtotal,
                TotalAmount = order.TotalAmount,
                OrderStatus = order.OrderStatus
            });
        }

        public Task<OrderDetailDto?> GetOrderDetailForCustomerAsync(long customerId, long orderId, CancellationToken cancellationToken = default)
        {
            var order = Orders.FirstOrDefault(o => o.OrderId == orderId && o.CustomerId == customerId);
            if (order == null) return Task.FromResult<OrderDetailDto?>(null);

            return Task.FromResult<OrderDetailDto?>(new OrderDetailDto
            {
                OrderId = order.OrderId,
                OrderCode = order.OrderCode,
                IdempotencyKey = order.IdempotencyKey,
                Subtotal = order.Subtotal,
                TotalAmount = order.TotalAmount,
                OrderStatus = order.OrderStatus,
                SellerOrders = order.SellerOrders.Select(so => new OrderSellerOrderDto
                {
                    SellerOrderId = so.SellerOrderId,
                    SellerId = so.SellerId,
                    SellerBusinessName = $"Seller {so.SellerId}",
                    WarehouseId = so.WarehouseId,
                    Subtotal = so.Subtotal,
                    Status = so.Status,
                    Items = so.Items.Select(i => new OrderItemDto
                    {
                        OrderItemId = i.OrderItemId,
                        VariantId = i.VariantId,
                        ProductName = i.ProductNameSnapshot,
                        SKU = i.SKUSnapshot,
                        UnitPrice = i.UnitPrice,
                        Quantity = i.Quantity,
                        LineTotal = i.UnitPrice * i.Quantity
                    }).ToList()
                }).ToList()
            });
        }

        public Task<Order?> GetOrderWithDetailsForUpdateAsync(long orderId, CancellationToken cancellationToken = default)
            => Task.FromResult(Orders.FirstOrDefault(o => o.OrderId == orderId));

        public Task<List<StockReservation>> GetActiveReservationsByOrderItemsAsync(IReadOnlyCollection<long> orderItemIds, CancellationToken cancellationToken = default)
            => Task.FromResult(Reservations.Where(r => orderItemIds.Contains(r.OrderItemId) && r.Status == ReservationStatuses.Active).ToList());

        public Task<PagedResult<SellerOrderListItemDto>> GetSellerOrdersPagedAsync(long sellerId, SellerOrderQueryDto query, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();
        public Task<SellerOrderDetailDto?> GetSellerOrderDetailAsync(long sellerId, long sellerOrderId, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();
        public Task<SellerOrder?> GetSellerOrderWithOrderAsync(long sellerOrderId, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();

        public Task<List<Order>> GetExpiredPendingOrdersAsync(DateTime utcNow, CancellationToken cancellationToken = default)
            => Task.FromResult(Orders.Where(o => o.OrderStatus == OrderStatuses.PendingPayment && o.ExpiresAt != null && o.ExpiresAt < utcNow).ToList());
    }

    private static (OrderService Service, InMemoryOrderRepo Repo, SpyInventoryLedger Ledger, StubCurrentUser CurrentUser) CreateSut()
    {
        var repo = new InMemoryOrderRepo();
        var ledger = new SpyInventoryLedger();
        var currentUser = new StubCurrentUser { UserId = 100 };

        repo.Addresses.Add(new UserAddress
        {
            AddressId = 1,
            UserId = 100,
            RecipientName = "Nguyễn Văn A",
            PhoneNumber = "0987654321",
            Province = "Hà Nội",
            District = "Cầu Giấy",
            Ward = "Dịch Vọng",
            StreetAddress = "Số 1 Xuân Thủy"
        });

        var service = new OrderService(
            repo,
            ledger,
            new StubUnitOfWork(),
            currentUser,
            new CheckoutRequestValidator(),
            new CancelOrderRequestValidator(),
            new OrderQueryValidator(),
            new CreatePaymentRequestValidator());

        return (service, repo, ledger, currentUser);
    }

    private static CartItem BuildCartItem(long cartItemId, long userId, long sellerId, long variantId, decimal price, int qty)
    {
        var seller = new Seller { SellerId = sellerId, BusinessName = $"Shop Seller {sellerId}", Status = SellerStatus.Approved };
        var shop = new Shop { ShopId = sellerId * 10, SellerId = sellerId, ShopName = $"Shop {sellerId}", IsActive = true, Seller = seller };
        var product = new Product { ProductId = variantId, ShopId = shop.ShopId, ProductName = $"SP {variantId}", ProductStatus = Domain.Enums.ProductStatus.Active, Shop = shop };
        var variant = new ProductVariant { VariantId = variantId, ProductId = product.ProductId, VariantName = "Mặc định", SKU = $"SKU-{variantId}", Price = price, IsActive = true, Product = product };

        return new CartItem
        {
            CartItemId = cartItemId,
            CartId = 1,
            VariantId = variantId,
            Quantity = qty,
            Cart = new Cart { CartId = 1, UserId = userId },
            Variant = variant
        };
    }

    [Fact]
    public async Task CheckoutAsync_MultiSellerCart_SplitsSellerOrdersReservesStockAndClearsCart()
    {
        var (service, repo, ledger, _) = CreateSut();

        repo.CartItems.Add(BuildCartItem(1, 100, sellerId: 1, variantId: 101, price: 100_000m, qty: 2));
        repo.CartItems.Add(BuildCartItem(2, 100, sellerId: 2, variantId: 201, price: 50_000m, qty: 3));

        repo.Inventories.Add(new Inventory { InventoryId = 10, WarehouseId = 1, LocationId = 1, VariantId = 101, QuantityOnHand = 10, QuantityReserved = 0 });
        repo.Inventories.Add(new Inventory { InventoryId = 11, WarehouseId = 1, LocationId = 2, VariantId = 201, QuantityOnHand = 10, QuantityReserved = 0 });

        var detail = await service.CheckoutAsync("idem-key-001", new CheckoutRequestDto { AddressId = 1, PaymentMethod = PaymentMethods.COD });

        Assert.Equal(350_000m, detail.TotalAmount);
        Assert.Equal(OrderStatuses.Confirmed, detail.OrderStatus);
        Assert.Equal(2, detail.SellerOrders.Count);
        Assert.Equal(2, ledger.ReservedCalls.Count);
        Assert.Equal(2, repo.Reservations.Count);
        Assert.Empty(repo.CartItems);
    }

    [Fact]
    public async Task CheckoutAsync_SameIdempotencyKey_ReturnsExistingOrderWithoutDuplicate()
    {
        var (service, repo, ledger, _) = CreateSut();
        repo.CartItems.Add(BuildCartItem(1, 100, sellerId: 1, variantId: 101, price: 100_000m, qty: 1));
        repo.Inventories.Add(new Inventory { InventoryId = 10, WarehouseId = 1, LocationId = 1, VariantId = 101, QuantityOnHand = 10, QuantityReserved = 0 });

        var first = await service.CheckoutAsync("same-key", new CheckoutRequestDto { AddressId = 1, PaymentMethod = PaymentMethods.COD });
        var second = await service.CheckoutAsync("same-key", new CheckoutRequestDto { AddressId = 1, PaymentMethod = PaymentMethods.COD });

        Assert.Equal(first.OrderId, second.OrderId);
        Assert.Single(repo.Orders);
        Assert.Single(ledger.ReservedCalls);
    }

    [Fact]
    public async Task CheckoutAsync_InsufficientStock_ThrowsInsufficientStock()
    {
        var (service, repo, _, _) = CreateSut();
        repo.CartItems.Add(BuildCartItem(1, 100, sellerId: 1, variantId: 101, price: 100_000m, qty: 5));
        repo.Inventories.Add(new Inventory { InventoryId = 10, WarehouseId = 1, LocationId = 1, VariantId = 101, QuantityOnHand = 2, QuantityReserved = 0 });

        var ex = await Assert.ThrowsAsync<BusinessException>(() =>
            service.CheckoutAsync("key-insufficient", new CheckoutRequestDto { AddressId = 1, PaymentMethod = PaymentMethods.COD }));

        Assert.Equal(ErrorCodes.InsufficientStock, ex.Code);
        Assert.Empty(repo.Orders);
    }

    [Fact]
    public async Task CancelMyOrderAsync_ReleasesReservationsAndCancelsSellerOrders()
    {
        var (service, repo, ledger, _) = CreateSut();
        var order = new Order
        {
            OrderId = 1,
            CustomerId = 100,
            OrderCode = "ORD-1",
            OrderStatus = OrderStatuses.Confirmed,
            SellerOrders =
            [
                new SellerOrder
                {
                    SellerOrderId = 10,
                    OrderId = 1,
                    SellerId = 1,
                    Status = SellerOrderStatuses.Pending,
                    Items = [new OrderItem { OrderItemId = 1000, SellerOrderId = 10, VariantId = 101, Quantity = 2 }]
                }
            ]
        };
        repo.Orders.Add(order);
        repo.Reservations.Add(new StockReservation
        {
            ReservationId = 1,
            OrderItemId = 1000,
            WarehouseId = 1,
            LocationId = 1,
            VariantId = 101,
            Quantity = 2,
            Status = ReservationStatuses.Active
        });

        var cancelled = await service.CancelMyOrderAsync(1, new CancelOrderRequestDto { Reason = "Đổi ý không mua nữa" });

        Assert.Equal(OrderStatuses.Cancelled, cancelled.OrderStatus);
        Assert.Equal(ReservationStatuses.Released, repo.Reservations[0].Status);
        Assert.Single(ledger.ReleasedCalls);
    }

    [Fact]
    public async Task GetMyOrderByIdAsync_OtherCustomerOrder_ThrowsNotFoundException()
    {
        var (service, repo, _, currentUser) = CreateSut();
        repo.Orders.Add(new Order { OrderId = 9, CustomerId = 999, OrderCode = "ORD-OTHER" });
        currentUser.UserId = 100;

        await Assert.ThrowsAsync<NotFoundException>(() => service.GetMyOrderByIdAsync(9));
    }

    [Fact]
    public async Task ExpireOverdueOrdersAsync_ReleasesStockAndMarksOrderExpired()
    {
        var (service, repo, ledger, _) = CreateSut();
        repo.Orders.Add(new Order
        {
            OrderId = 5,
            CustomerId = 100,
            OrderCode = "ORD-EXP",
            OrderStatus = OrderStatuses.PendingPayment,
            ExpiresAt = DateTime.UtcNow.AddMinutes(-5),
            SellerOrders =
            [
                new SellerOrder
                {
                    SellerOrderId = 50,
                    OrderId = 5,
                    SellerId = 1,
                    Status = SellerOrderStatuses.Pending,
                    Items = [new OrderItem { OrderItemId = 5000, SellerOrderId = 50, VariantId = 101, Quantity = 1 }]
                }
            ]
        });
        repo.Reservations.Add(new StockReservation
        {
            ReservationId = 5,
            OrderItemId = 5000,
            WarehouseId = 1,
            LocationId = 1,
            VariantId = 101,
            Quantity = 1,
            Status = ReservationStatuses.Active
        });

        var expiredCount = await service.ExpireOverdueOrdersAsync();

        Assert.Equal(1, expiredCount);
        Assert.Equal(OrderStatuses.Expired, repo.Orders[0].OrderStatus);
        Assert.Equal(ReservationStatuses.Expired, repo.Reservations[0].Status);
        Assert.Single(ledger.ReleasedCalls);
    }

    [Fact]
    public async Task GetAdminOrderByIdAsync_ReturnsOrderDetail_WhenOrderExists()
    {
        var (service, repo, _, _) = CreateSut();
        repo.Orders.Add(new Order
        {
            OrderId = 99,
            CustomerId = 100,
            OrderCode = "ORD-ADM-99",
            IdempotencyKey = "idem-99",
            Subtotal = 200m,
            TotalAmount = 200m,
            OrderStatus = OrderStatuses.PendingPayment
        });

        var result = await service.GetAdminOrderByIdAsync(99);

        Assert.Equal(99, result.OrderId);
        Assert.Equal("ORD-ADM-99", result.OrderCode);
    }

    [Fact]
    public async Task GetAdminOrderByIdAsync_ThrowsNotFoundException_WhenOrderMissing()
    {
        var (service, _, _, _) = CreateSut();

        await Assert.ThrowsAsync<NotFoundException>(() => service.GetAdminOrderByIdAsync(999));
    }
}
