using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.Contracts.Services;
using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Order;
using ECommerceWarehouse.Application.DTOs.Warehouse;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Application.Validators.Order;
using ECommerceWarehouse.Domain.Constants;
using ECommerceWarehouse.Domain.Entities.Customer;
using ECommerceWarehouse.Domain.Entities.Order;
using ECommerceWarehouse.Domain.Entities.Warehouse;
using ECommerceWarehouse.Domain.Exceptions;

namespace ECommerceWarehouse.UnitTests.Services;

public class SellerOrderServiceTests
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
        public long? UserId { get; set; } = 200;
        public IReadOnlyList<string> Roles { get; set; } = [RoleNames.Seller];
        public long? SellerId { get; set; } = 10;
        public bool IsAuthenticated => UserId.HasValue;
        public bool IsInRole(string role) => Roles.Contains(role);
        public Task<long?> GetSellerIdAsync(CancellationToken cancellationToken = default) => Task.FromResult(SellerId);
    }

    private sealed class SpyInventoryLedger : IInventoryLedgerService
    {
        public List<(long LocationId, long VariantId, int Qty)> ReleasedCalls { get; } = [];
        public Task IncreaseOnHandAsync(long warehouseId, long locationId, long variantId, int quantity, string movementType, string referenceType, long referenceId, long? createdBy, string? note = null, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task ReserveStockAtomicAsync(long inventoryId, int quantity, long referenceId, long? createdBy, string? note = null, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task ReleaseReservationAsync(long locationId, long variantId, int quantity, long referenceId, long? createdBy, string? note = null, CancellationToken cancellationToken = default)
        {
            ReleasedCalls.Add((locationId, variantId, quantity));
            return Task.CompletedTask;
        }
        public Task DispatchReservedStockAsync(long locationId, long variantId, int quantity, long referenceId, long? createdBy, string? note = null, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task TransferAdjustmentAsync(long warehouseId, long sourceLocationId, long destinationLocationId, long variantId, int quantity, string referenceType, long referenceId, long? createdBy, string? note = null, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task<PagedResult<InventoryItemDto>> GetInventoryAsync(InventoryQueryDto query, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<VariantAvailabilityDto> GetVariantAvailabilityAsync(long variantId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<PagedResult<StockMovementDto>> GetStockMovementsAsync(StockMovementQueryDto query, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<List<StockReconciliationItemDto>> GetReconciliationDiscrepanciesAsync(CancellationToken cancellationToken = default) => throw new NotImplementedException();
    }

    private sealed class StubOrderRepo : IOrderRepository
    {
        public List<SellerOrder> SellerOrders { get; } = [];
        public List<StockReservation> Reservations { get; } = [];
        public List<OrderStatusHistory> Histories { get; } = [];

        public Task<Order?> GetByIdempotencyKeyAsync(long customerId, string idempotencyKey, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<UserAddress?> GetCustomerAddressAsync(long customerId, long addressId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<List<CartItem>> GetCartItemsForCheckoutAsync(long customerId, IReadOnlyCollection<long>? cartItemIds, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<List<Inventory>> GetSellablePlatformInventoriesAsync(long variantId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task AddOrderAsync(Order order, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task AddStockReservationAsync(StockReservation reservation, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task AddStatusHistoryAsync(OrderStatusHistory history, CancellationToken cancellationToken = default)
        {
            Histories.Add(history);
            return Task.CompletedTask;
        }
        public Task AddPaymentAsync(Payment payment, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public void RemoveCartItems(IEnumerable<CartItem> items) { }
        public Task<PagedResult<OrderListItemDto>> GetCustomerOrdersPagedAsync(long customerId, OrderQueryDto query, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<OrderDetailDto?> GetOrderDetailForCustomerAsync(long customerId, long orderId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<Order?> GetOrderWithDetailsForUpdateAsync(long orderId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<List<StockReservation>> GetActiveReservationsByOrderItemsAsync(IReadOnlyCollection<long> orderItemIds, CancellationToken cancellationToken = default)
            => Task.FromResult(Reservations.Where(r => orderItemIds.Contains(r.OrderItemId) && r.Status == ReservationStatuses.Active).ToList());
        public Task<PagedResult<SellerOrderListItemDto>> GetSellerOrdersPagedAsync(long sellerId, SellerOrderQueryDto query, CancellationToken cancellationToken = default)
            => Task.FromResult(PagedResult<SellerOrderListItemDto>.Create([], query.NormalizedPage, query.NormalizedPageSize, 0));

        public Task<SellerOrderDetailDto?> GetSellerOrderDetailAsync(long sellerId, long sellerOrderId, CancellationToken cancellationToken = default)
        {
            var so = SellerOrders.FirstOrDefault(x => x.SellerOrderId == sellerOrderId && x.SellerId == sellerId);
            if (so == null) return Task.FromResult<SellerOrderDetailDto?>(null);

            return Task.FromResult<SellerOrderDetailDto?>(new SellerOrderDetailDto
            {
                SellerOrderId = so.SellerOrderId,
                OrderId = so.OrderId,
                OrderCode = so.Order.OrderCode,
                SellerId = so.SellerId,
                Status = so.Status,
                OrderStatus = so.Order.OrderStatus,
                CancelReason = so.CancelReason,
                RecipientName = "Khách A",
                RecipientPhone = "0900000000",
                ShippingProvince = "HN",
                ShippingDistrict = "CG",
                ShippingWard = "DV",
                ShippingStreetAddress = "1 XT",
                PaymentMethod = PaymentMethods.COD,
                PaymentStatus = PaymentStatuses.Paid
            });
        }

        public Task<SellerOrder?> GetSellerOrderWithOrderAsync(long sellerOrderId, CancellationToken cancellationToken = default)
            => Task.FromResult(SellerOrders.FirstOrDefault(x => x.SellerOrderId == sellerOrderId));

        public Task<List<Order>> GetExpiredPendingOrdersAsync(DateTime utcNow, CancellationToken cancellationToken = default) => throw new NotImplementedException();
    }

    private sealed class StubIssueRepo : IInventoryIssueRepository
    {
        public List<InventoryIssue> Issues { get; } = [];
        public Task<PagedResult<IssueDto>> GetPagedAsync(IssueQueryDto query, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<InventoryIssue?> GetByIdWithDetailsAsync(long issueId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<IssueDto?> GetDtoByIdAsync(long issueId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<bool> ExistsForSellerOrderAsync(long sellerOrderId, CancellationToken cancellationToken = default)
            => Task.FromResult(Issues.Any(i => i.SellerOrderId == sellerOrderId));
        public Task AddAsync(InventoryIssue issue, CancellationToken cancellationToken = default)
        {
            issue.IssueId = Issues.Count + 1;
            Issues.Add(issue);
            return Task.CompletedTask;
        }
    }

    private static (SellerOrderService Service, StubOrderRepo Repo, SpyInventoryLedger Ledger, StubCurrentUser CurrentUser, StubIssueRepo IssueRepo) CreateSut()
    {
        var repo = new StubOrderRepo();
        var issueRepo = new StubIssueRepo();
        var ledger = new SpyInventoryLedger();
        var currentUser = new StubCurrentUser { SellerId = 10 };

        var service = new SellerOrderService(
            repo,
            issueRepo,
            ledger,
            new StubUnitOfWork(),
            currentUser,
            new SellerOrderQueryValidator(),
            new CancelSellerOrderRequestValidator());

        return (service, repo, ledger, currentUser, issueRepo);
    }

    [Fact]
    public async Task ConfirmSellerOrderAsync_PendingOrder_ConfirmsAndUpdatesParentToProcessing()
    {
        var (service, repo, _, _, issueRepo) = CreateSut();
        var order = new Order { OrderId = 1, OrderCode = "ORD-1", OrderStatus = OrderStatuses.Confirmed };
        var so = new SellerOrder
        {
            SellerOrderId = 1,
            OrderId = 1,
            SellerId = 10,
            WarehouseId = 1,
            Status = SellerOrderStatuses.Pending,
            Order = order,
            Items = [new OrderItem { OrderItemId = 10, SellerOrderId = 1, VariantId = 101, Quantity = 2 }]
        };
        order.SellerOrders.Add(so);
        repo.SellerOrders.Add(so);
        repo.Reservations.Add(new StockReservation { ReservationId = 99, OrderItemId = 10, WarehouseId = 1, LocationId = 3, VariantId = 101, Quantity = 2, Status = ReservationStatuses.Active });

        var result = await service.ConfirmSellerOrderAsync(1);

        Assert.Equal(SellerOrderStatuses.Confirmed, result.Status);
        Assert.Equal(OrderStatuses.Processing, order.OrderStatus);
        var createdIssue = Assert.Single(issueRepo.Issues);
        Assert.Equal(IssueStatuses.Draft, createdIssue.Status);
        Assert.Equal(99, createdIssue.Details.Single().ReservationId);
    }

    [Fact]
    public async Task ConfirmSellerOrderAsync_OtherSellerOrder_ThrowsNotFoundException()
    {
        var (service, repo, _, _, _) = CreateSut();
        var order = new Order { OrderId = 1, OrderCode = "ORD-1", OrderStatus = OrderStatuses.Confirmed };
        var so = new SellerOrder { SellerOrderId = 1, OrderId = 1, SellerId = 999, Status = SellerOrderStatuses.Pending, Order = order };
        order.SellerOrders.Add(so);
        repo.SellerOrders.Add(so);

        await Assert.ThrowsAsync<NotFoundException>(() => service.ConfirmSellerOrderAsync(1));
    }

    [Fact]
    public async Task CancelSellerOrderAsync_ShippedOrder_ThrowsInvalidStatusTransition()
    {
        var (service, repo, _, _, _) = CreateSut();
        var order = new Order { OrderId = 1, OrderCode = "ORD-1", OrderStatus = OrderStatuses.Shipped };
        var so = new SellerOrder { SellerOrderId = 1, OrderId = 1, SellerId = 10, Status = SellerOrderStatuses.Shipped, Order = order };
        order.SellerOrders.Add(so);
        repo.SellerOrders.Add(so);

        var ex = await Assert.ThrowsAsync<BusinessException>(() =>
            service.CancelSellerOrderAsync(1, new CancelSellerOrderRequestDto { Reason = "Hết hàng" }));

        Assert.Equal(ErrorCodes.InvalidStatusTransition, ex.Code);
    }

    [Fact]
    public async Task CancelSellerOrderAsync_OnlySellerOrder_CancelsParentOrderAndReleasesStock()
    {
        var (service, repo, ledger, _, _) = CreateSut();
        var order = new Order { OrderId = 1, OrderCode = "ORD-1", OrderStatus = OrderStatuses.Confirmed };
        var so = new SellerOrder
        {
            SellerOrderId = 1,
            OrderId = 1,
            SellerId = 10,
            Status = SellerOrderStatuses.Pending,
            Order = order,
            Items = [new OrderItem { OrderItemId = 55, SellerOrderId = 1, VariantId = 101, Quantity = 3 }]
        };
        order.SellerOrders.Add(so);
        repo.SellerOrders.Add(so);
        repo.Reservations.Add(new StockReservation { ReservationId = 1, OrderItemId = 55, LocationId = 2, VariantId = 101, Quantity = 3, Status = ReservationStatuses.Active });

        var result = await service.CancelSellerOrderAsync(1, new CancelSellerOrderRequestDto { Reason = "Không kịp giao" });

        Assert.Equal(SellerOrderStatuses.Cancelled, result.Status);
        Assert.Equal(OrderStatuses.Cancelled, order.OrderStatus);
        Assert.Equal(ReservationStatuses.Released, repo.Reservations[0].Status);
        Assert.Single(ledger.ReleasedCalls);
    }
}
