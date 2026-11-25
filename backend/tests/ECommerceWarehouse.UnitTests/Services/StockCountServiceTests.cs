using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.Contracts.Services;
using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Warehouse;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Domain.Constants;
using ECommerceWarehouse.Domain.Entities.Warehouse;
using ECommerceWarehouse.Domain.Exceptions;

namespace ECommerceWarehouse.UnitTests.Services;

public class StockCountServiceTests
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
        public long? UserId => 50;
        public IReadOnlyList<string> Roles => [RoleNames.WarehouseManager];
        public long? SellerId => null;
        public bool IsAuthenticated => true;
        public bool IsInRole(string role) => Roles.Contains(role);
        public Task<long?> GetSellerIdAsync(CancellationToken cancellationToken = default) => Task.FromResult<long?>(null);
    }

    private sealed class SpyLedger : IInventoryLedgerService
    {
        public List<(long LocationId, long VariantId, int Delta)> Adjustments { get; } = [];

        public Task IncreaseOnHandAsync(long warehouseId, long locationId, long variantId, int quantity, string movementType, string referenceType, long referenceId, long? createdBy, string? note = null, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task AdjustOnHandAsync(long warehouseId, long locationId, long variantId, int deltaQuantity, string movementType, string referenceType, long referenceId, long? createdBy, string? note = null, CancellationToken cancellationToken = default)
        {
            Adjustments.Add((locationId, variantId, deltaQuantity));
            return Task.CompletedTask;
        }
        public Task ReserveStockAtomicAsync(long inventoryId, int quantity, long referenceId, long? createdBy, string? note = null, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task ReleaseReservationAsync(long locationId, long variantId, int quantity, long referenceId, long? createdBy, string? note = null, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task DispatchReservedStockAsync(long locationId, long variantId, int quantity, long referenceId, long? createdBy, string? note = null, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task TransferAdjustmentAsync(long warehouseId, long sourceLocationId, long destinationLocationId, long variantId, int quantity, string referenceType, long referenceId, long? createdBy, string? note = null, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task PutawayAsync(PutawayRequestDto request, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task<PagedResult<InventoryItemDto>> GetInventoryAsync(InventoryQueryDto query, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<VariantAvailabilityDto> GetVariantAvailabilityAsync(long variantId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<PagedResult<StockMovementDto>> GetStockMovementsAsync(StockMovementQueryDto query, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<List<StockReconciliationItemDto>> GetReconciliationDiscrepanciesAsync(CancellationToken cancellationToken = default) => throw new NotImplementedException();
    }

    private sealed class InMemoryStockCountRepo : IStockCountRepository
    {
        public List<StockCount> Counts { get; } = [];
        public HashSet<long> Warehouses { get; } = [1];
        public HashSet<long> Locations { get; } = [10, 11];
        public HashSet<long> Variants { get; } = [100, 101];
        public Dictionary<(long LocationId, long VariantId), int> SystemQuantities { get; } = new() { [(10, 100)] = 20 };

        public Task<PagedResult<StockCountListItemDto>> GetPagedAsync(StockCountQueryDto query, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<StockCountDetailDto?> GetDetailDtoAsync(long stockCountId, CancellationToken cancellationToken = default)
        {
            var c = Counts.FirstOrDefault(x => x.StockCountId == stockCountId);
            if (c == null) return Task.FromResult<StockCountDetailDto?>(null);
            return Task.FromResult<StockCountDetailDto?>(new StockCountDetailDto
            {
                StockCountId = c.StockCountId,
                WarehouseId = c.WarehouseId,
                WarehouseName = "Kho HN",
                CountCode = c.CountCode,
                Status = c.Status,
                Details = c.Details.Select(d => new StockCountLineDto
                {
                    StockCountDetailId = d.StockCountDetailId,
                    LocationId = d.LocationId,
                    LocationCode = $"LOC-{d.LocationId}",
                    VariantId = d.VariantId,
                    SKU = $"SKU-{d.VariantId}",
                    ProductName = "Product",
                    SystemQuantity = d.SystemQuantity,
                    CountedQuantity = d.CountedQuantity
                }).ToList()
            });
        }

        public Task<StockCount?> GetByIdWithDetailsAsync(long stockCountId, CancellationToken cancellationToken = default)
            => Task.FromResult(Counts.FirstOrDefault(x => x.StockCountId == stockCountId));
        public Task<bool> WarehouseExistsAsync(long warehouseId, CancellationToken cancellationToken = default)
            => Task.FromResult(Warehouses.Contains(warehouseId));
        public Task<HashSet<long>> GetValidLocationIdsInWarehouseAsync(long warehouseId, IReadOnlyCollection<long> locationIds, CancellationToken cancellationToken = default)
            => Task.FromResult(locationIds.Where(Locations.Contains).ToHashSet());
        public Task<HashSet<long>> GetValidVariantIdsAsync(IReadOnlyCollection<long> variantIds, CancellationToken cancellationToken = default)
            => Task.FromResult(variantIds.Where(Variants.Contains).ToHashSet());
        public Task<Dictionary<(long LocationId, long VariantId), int>> GetSystemQuantitiesAsync(long warehouseId, IReadOnlyCollection<(long LocationId, long VariantId)> pairs, CancellationToken cancellationToken = default)
            => Task.FromResult(SystemQuantities);
        public Task AddAsync(StockCount stockCount, CancellationToken cancellationToken = default)
        {
            stockCount.StockCountId = Counts.Count + 1;
            long detailId = 1;
            foreach (var d in stockCount.Details) d.StockCountDetailId = detailId++;
            Counts.Add(stockCount);
            return Task.CompletedTask;
        }
    }

    [Fact]
    public async Task CreateRecordApprove_AdjustsLedgerByDelta_WhenCountDiffers()
    {
        var repo = new InMemoryStockCountRepo();
        var ledger = new SpyLedger();
        var service = new StockCountService(
            repo,
            ledger,
            new StubUnitOfWork(),
            new StubCurrentUser(),
            new CreateStockCountRequestValidator(),
            new RecordStockCountRequestValidator());

        var created = await service.CreateAsync(new CreateStockCountRequestDto
        {
            WarehouseId = 1,
            Items = [new CreateStockCountItemDto { LocationId = 10, VariantId = 100 }]
        });
        Assert.Equal(StockCountStatuses.Draft, created.Status);
        Assert.Equal(20, created.Details[0].SystemQuantity);

        var recorded = await service.RecordAsync(created.StockCountId, new RecordStockCountRequestDto
        {
            SubmitForApproval = true,
            Items = [new RecordStockCountItemDto { StockCountDetailId = created.Details[0].StockCountDetailId, CountedQuantity = 17, Reason = "Hao hụt" }]
        });
        Assert.Equal(StockCountStatuses.PendingApproval, recorded.Status);

        var approved = await service.ApproveAsync(created.StockCountId);
        Assert.Equal(StockCountStatuses.Approved, approved.Status);
        Assert.Single(ledger.Adjustments);
        Assert.Equal((10L, 100L, -3), ledger.Adjustments[0]);
    }
}
