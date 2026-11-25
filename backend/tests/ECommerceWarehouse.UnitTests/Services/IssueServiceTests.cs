using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.Contracts.Services;
using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Order;
using ECommerceWarehouse.Application.DTOs.Warehouse;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Application.Validators.Warehouse;
using ECommerceWarehouse.Domain.Constants;
using ECommerceWarehouse.Domain.Entities.Catalog;
using ECommerceWarehouse.Domain.Entities.Customer;
using ECommerceWarehouse.Domain.Entities.Order;
using ECommerceWarehouse.Domain.Entities.Warehouse;
using ECommerceWarehouse.Domain.Exceptions;

namespace ECommerceWarehouse.UnitTests.Services;

public class IssueServiceTests
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
        public long? UserId { get; set; } = 20;
        public IReadOnlyList<string> Roles { get; set; } = [RoleNames.WarehouseManager];
        public long? SellerId => null;
        public bool IsAuthenticated => UserId.HasValue;
        public bool IsInRole(string role) => Roles.Contains(role);
        public Task<long?> GetSellerIdAsync(CancellationToken cancellationToken = default) => Task.FromResult<long?>(null);
    }

    private sealed class SpyInventoryLedger : IInventoryLedgerService
    {
        public List<(long LocationId, long VariantId, int Qty)> DispatchedCalls { get; } = [];
        public Task IncreaseOnHandAsync(long warehouseId, long locationId, long variantId, int quantity, string movementType, string referenceType, long referenceId, long? createdBy, string? note = null, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task ReserveStockAtomicAsync(long inventoryId, int quantity, long referenceId, long? createdBy, string? note = null, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task ReleaseReservationAsync(long locationId, long variantId, int quantity, long referenceId, long? createdBy, string? note = null, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task DispatchReservedStockAsync(long locationId, long variantId, int quantity, long referenceId, long? createdBy, string? note = null, CancellationToken cancellationToken = default)
        {
            DispatchedCalls.Add((locationId, variantId, quantity));
            return Task.CompletedTask;
        }
        public Task<PagedResult<InventoryItemDto>> GetInventoryAsync(InventoryQueryDto query, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<VariantAvailabilityDto> GetVariantAvailabilityAsync(long variantId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<PagedResult<StockMovementDto>> GetStockMovementsAsync(StockMovementQueryDto query, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<List<StockReconciliationItemDto>> GetReconciliationDiscrepanciesAsync(CancellationToken cancellationToken = default) => throw new NotImplementedException();
    }

    private sealed class InMemoryIssueRepo : IInventoryIssueRepository
    {
        public List<InventoryIssue> Issues { get; } = [];
        public Task<PagedResult<IssueDto>> GetPagedAsync(IssueQueryDto query, CancellationToken cancellationToken = default)
            => Task.FromResult(PagedResult<IssueDto>.Create([], query.NormalizedPage, query.NormalizedPageSize, 0));
        public Task<InventoryIssue?> GetByIdWithDetailsAsync(long issueId, CancellationToken cancellationToken = default)
            => Task.FromResult(Issues.FirstOrDefault(i => i.IssueId == issueId));
        public Task<IssueDto?> GetDtoByIdAsync(long issueId, CancellationToken cancellationToken = default)
        {
            var i = Issues.FirstOrDefault(x => x.IssueId == issueId);
            if (i == null) return Task.FromResult<IssueDto?>(null);
            return Task.FromResult<IssueDto?>(new IssueDto
            {
                IssueId = i.IssueId,
                IssueCode = i.IssueCode,
                WarehouseId = i.WarehouseId,
                WarehouseName = "Kho HN",
                IssueType = i.IssueType,
                Status = i.Status,
                CreatedBy = i.CreatedBy,
                ApprovedBy = i.ApprovedBy,
                DispatchedBy = i.DispatchedBy,
                TotalQuantity = i.Details.Sum(d => d.Quantity),
                TotalPickedQuantity = i.Details.Sum(d => d.PickedQuantity),
                Details = i.Details.Select(d => new IssueDetailDto
                {
                    IssueDetailId = d.IssueDetailId,
                    VariantId = d.VariantId,
                    SKU = d.Variant.SKU,
                    Quantity = d.Quantity,
                    PickedQuantity = d.PickedQuantity
                }).ToList()
            });
        }
        public Task<bool> ExistsForSellerOrderAsync(long sellerOrderId, CancellationToken cancellationToken = default) => Task.FromResult(false);
        public Task AddAsync(InventoryIssue issue, CancellationToken cancellationToken = default) => Task.CompletedTask;
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
        public Task<Order?> GetOrderWithDetailsForUpdateAsync(long orderId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<List<StockReservation>> GetActiveReservationsByOrderItemsAsync(IReadOnlyCollection<long> orderItemIds, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<PagedResult<SellerOrderListItemDto>> GetSellerOrdersPagedAsync(long sellerId, SellerOrderQueryDto query, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<SellerOrderDetailDto?> GetSellerOrderDetailAsync(long sellerId, long sellerOrderId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<SellerOrder?> GetSellerOrderWithOrderAsync(long sellerOrderId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<List<Order>> GetExpiredPendingOrdersAsync(DateTime utcNow, CancellationToken cancellationToken = default) => throw new NotImplementedException();
    }

    private static (IssueService Service, InMemoryIssueRepo Repo, SpyInventoryLedger Ledger, StubCurrentUser User) CreateSut()
    {
        var repo = new InMemoryIssueRepo();
        var ledger = new SpyInventoryLedger();
        var user = new StubCurrentUser();

        var service = new IssueService(
            repo,
            new StubOrderRepo(),
            ledger,
            new StubUnitOfWork(),
            user,
            new IssueQueryValidator(),
            new ScanIssueLineRequestValidator());

        return (service, repo, ledger, user);
    }

    private static InventoryIssue BuildIssue(string status, long createdBy = 10, int qty = 2, int picked = 0)
    {
        var order = new Order { OrderId = 1, OrderCode = "ORD-1", OrderStatus = OrderStatuses.Processing };
        var so = new SellerOrder { SellerOrderId = 1, OrderId = 1, SellerId = 5, Status = SellerOrderStatuses.Confirmed, Order = order };
        order.SellerOrders.Add(so);

        var reservation = new StockReservation { ReservationId = 99, OrderItemId = 10, LocationId = 3, VariantId = 101, Quantity = qty, Status = ReservationStatuses.Active };
        var variant = new ProductVariant { VariantId = 101, SKU = "SKU-101", Barcode = "893000101" };

        return new InventoryIssue
        {
            IssueId = 1,
            WarehouseId = 1,
            SellerOrderId = 1,
            SellerOrder = so,
            IssueCode = "PX-001",
            IssueType = IssueTypes.OrderFulfillment,
            Status = status,
            CreatedBy = createdBy,
            Details =
            [
                new IssueDetail
                {
                    IssueDetailId = 50,
                    IssueId = 1,
                    WarehouseId = 1,
                    LocationId = 3,
                    VariantId = 101,
                    Variant = variant,
                    Quantity = qty,
                    PickedQuantity = picked,
                    ReservationId = 99,
                    Reservation = reservation
                }
            ]
        };
    }

    [Fact]
    public async Task ApproveAsync_SameCreator_ThrowsSelfApprovalNotAllowed()
    {
        var (service, repo, _, user) = CreateSut();
        user.UserId = 10;
        repo.Issues.Add(BuildIssue(IssueStatuses.Draft, createdBy: 10));

        var ex = await Assert.ThrowsAsync<BusinessException>(() => service.ApproveAsync(1));
        Assert.Equal(ErrorCodes.SelfApprovalNotAllowed, ex.Code);
    }

    [Fact]
    public async Task ScanLineAsync_WrongBarcodeOrSku_ThrowsValidationError()
    {
        var (service, repo, _, _) = CreateSut();
        repo.Issues.Add(BuildIssue(IssueStatuses.Picking, qty: 2, picked: 0));

        var ex = await Assert.ThrowsAsync<BusinessException>(() =>
            service.ScanLineAsync(1, 50, new ScanIssueLineRequestDto { Code = "WRONG-CODE", Quantity = 1 }));

        Assert.Equal(ErrorCodes.ValidationError, ex.Code);
    }

    [Fact]
    public async Task PackAsync_NotFullyPicked_ThrowsBusinessRuleViolation()
    {
        var (service, repo, _, _) = CreateSut();
        repo.Issues.Add(BuildIssue(IssueStatuses.Picking, qty: 2, picked: 1));

        var ex = await Assert.ThrowsAsync<BusinessException>(() => service.PackAsync(1));
        Assert.Equal(ErrorCodes.BusinessRuleViolation, ex.Code);
    }

    [Fact]
    public async Task DispatchAsync_PackedIssue_DispatchesConsumesReservationAndShipsOrder()
    {
        var (service, repo, ledger, _) = CreateSut();
        var issue = BuildIssue(IssueStatuses.Packed, qty: 2, picked: 2);
        repo.Issues.Add(issue);

        var result = await service.DispatchAsync(1);

        Assert.Equal(IssueStatuses.Dispatched, result.Status);
        var dispatchCall = Assert.Single(ledger.DispatchedCalls);
        Assert.Equal((3, 101, 2), dispatchCall);
        Assert.Equal(ReservationStatuses.Consumed, issue.Details.Single().Reservation!.Status);
        Assert.Equal(SellerOrderStatuses.Shipped, issue.SellerOrder!.Status);
        Assert.Equal(OrderStatuses.Shipped, issue.SellerOrder.Order.OrderStatus);
    }
}
