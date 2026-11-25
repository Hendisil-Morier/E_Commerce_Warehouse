using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.Contracts.Services;
using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Warehouse;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Application.Validators.Warehouse;
using ECommerceWarehouse.Domain.Constants;
using ECommerceWarehouse.Domain.Entities.Warehouse;
using ECommerceWarehouse.Domain.Exceptions;

namespace ECommerceWarehouse.UnitTests.Services;

public class InventoryLedgerServiceTests
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
        public long? UserId { get; set; } = 10;
        public IReadOnlyList<string> Roles { get; set; } = [RoleNames.WarehouseManager];
        public long? SellerId { get; set; }
        public bool IsAuthenticated => UserId.HasValue;
        public bool IsInRole(string role) => Roles.Contains(role);
        public Task<long?> GetSellerIdAsync(CancellationToken cancellationToken = default) => Task.FromResult(SellerId);
    }

    private sealed class InMemoryInventoryRepository : IInventoryRepository
    {
        public List<Inventory> Inventories { get; } = [];
        public List<StockMovement> Movements { get; } = [];
        public int AtomicReserveRowsAffected { get; set; } = 1;
        public long? LastCapturedRestrictedSellerId { get; private set; }

        public Task<Inventory?> GetByLocationAndVariantAsync(long locationId, long variantId, CancellationToken cancellationToken = default)
            => Task.FromResult(Inventories.FirstOrDefault(i => i.LocationId == locationId && i.VariantId == variantId));

        public Task<Inventory?> GetByIdAsync(long inventoryId, CancellationToken cancellationToken = default)
            => Task.FromResult(Inventories.FirstOrDefault(i => i.InventoryId == inventoryId));

        public Task AddInventoryAsync(Inventory inventory, CancellationToken cancellationToken = default)
        {
            if (inventory.InventoryId == 0) inventory.InventoryId = Inventories.Count + 1;
            Inventories.Add(inventory);
            return Task.CompletedTask;
        }

        public Task AddStockMovementAsync(StockMovement movement, CancellationToken cancellationToken = default)
        {
            movement.StockMovementId = Movements.Count + 1;
            Movements.Add(movement);
            return Task.CompletedTask;
        }

        public Task<int> TryReserveAtomicAsync(long inventoryId, int quantity, CancellationToken cancellationToken = default)
        {
            if (AtomicReserveRowsAffected == 0) return Task.FromResult(0);
            var inv = Inventories.FirstOrDefault(i => i.InventoryId == inventoryId);
            if (inv == null || inv.QuantityOnHand - inv.QuantityReserved < quantity) return Task.FromResult(0);
            inv.QuantityReserved += quantity;
            return Task.FromResult(1);
        }

        public Task<PagedResult<InventoryItemDto>> GetPagedInventoryAsync(
            InventoryQueryDto query,
            long? restrictedSellerId = null,
            CancellationToken cancellationToken = default)
        {
            LastCapturedRestrictedSellerId = restrictedSellerId;
            return Task.FromResult(PagedResult<InventoryItemDto>.Create([], query.NormalizedPage, query.NormalizedPageSize, 0));
        }

        public Task<VariantAvailabilityDto> GetVariantAvailabilityAsync(long variantId, CancellationToken cancellationToken = default)
            => Task.FromResult(new VariantAvailabilityDto { VariantId = variantId });

        public Task<PagedResult<StockMovementDto>> GetPagedMovementsAsync(StockMovementQueryDto query, CancellationToken cancellationToken = default)
            => Task.FromResult(PagedResult<StockMovementDto>.Create([], query.NormalizedPage, query.NormalizedPageSize, 0));

        public Task<List<StockReconciliationItemDto>> GetReconciliationDiscrepanciesAsync(CancellationToken cancellationToken = default)
            => Task.FromResult(new List<StockReconciliationItemDto>());
    }

    private static (InventoryLedgerService Service, InMemoryInventoryRepository Repo, StubCurrentUser CurrentUser) CreateSut()
    {
        var repo = new InMemoryInventoryRepository();
        var currentUser = new StubCurrentUser();
        var service = new InventoryLedgerService(
            repo,
            new StubUnitOfWork(),
            currentUser,
            new InventoryQueryValidator(),
            new StockMovementQueryValidator());
        return (service, repo, currentUser);
    }

    [Fact]
    public async Task IncreaseOnHandAsync_NewLocationVariant_CreatesInventoryAndAppendsReceiptMovement()
    {
        var (service, repo, _) = CreateSut();

        await service.IncreaseOnHandAsync(1, 2, 100, 15, StockMovementTypes.Receipt, StockReferenceTypes.Receipt, 50, 20, "Nhập kho lô 1");

        var inv = Assert.Single(repo.Inventories);
        Assert.Equal(15, inv.QuantityOnHand);
        Assert.Equal(0, inv.QuantityReserved);

        var mov = Assert.Single(repo.Movements);
        Assert.Equal(StockMovementTypes.Receipt, mov.MovementType);
        Assert.Equal(15, mov.OnHandChange);
        Assert.Equal(0, mov.ReservedChange);
        Assert.Equal(15, mov.OnHandAfter);
        Assert.Equal(50, mov.ReferenceId);
    }

    [Fact]
    public async Task ReserveStockAtomicAsync_WhenInsufficientStock_ThrowsInsufficientStock()
    {
        var (service, repo, _) = CreateSut();
        repo.Inventories.Add(new Inventory { InventoryId = 1, WarehouseId = 1, LocationId = 2, VariantId = 100, QuantityOnHand = 5, QuantityReserved = 4 });

        var ex = await Assert.ThrowsAsync<BusinessException>(() =>
            service.ReserveStockAtomicAsync(1, 2, 99, 10));

        Assert.Equal(ErrorCodes.InsufficientStock, ex.Code);
        Assert.Empty(repo.Movements);
    }

    [Fact]
    public async Task DispatchReservedStockAsync_DeductsBothOnHandAndReservedAndLogsMovement()
    {
        var (service, repo, _) = CreateSut();
        repo.Inventories.Add(new Inventory { InventoryId = 1, WarehouseId = 1, LocationId = 2, VariantId = 100, QuantityOnHand = 10, QuantityReserved = 3 });

        await service.DispatchReservedStockAsync(2, 100, 3, 77, 11, "Xuất đơn");

        var inv = Assert.Single(repo.Inventories);
        Assert.Equal(7, inv.QuantityOnHand);
        Assert.Equal(0, inv.QuantityReserved);

        var mov = Assert.Single(repo.Movements);
        Assert.Equal(StockMovementTypes.Issue, mov.MovementType);
        Assert.Equal(-3, mov.OnHandChange);
        Assert.Equal(-3, mov.ReservedChange);
        Assert.Equal(7, mov.OnHandAfter);
        Assert.Equal(0, mov.ReservedAfter);
    }

    [Fact]
    public async Task GetInventoryAsync_WhenCallerIsSeller_RestrictsToOwnSellerId()
    {
        var (service, repo, currentUser) = CreateSut();
        currentUser.Roles = [RoleNames.Seller];
        currentUser.SellerId = 42;

        await service.GetInventoryAsync(new InventoryQueryDto());

        Assert.Equal(42, repo.LastCapturedRestrictedSellerId);
    }
}
