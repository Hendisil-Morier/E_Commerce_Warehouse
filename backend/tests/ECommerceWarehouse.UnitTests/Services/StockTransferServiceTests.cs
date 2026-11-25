using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.Contracts.Services;
using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Warehouse;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Domain.Constants;
using ECommerceWarehouse.Domain.Entities.Warehouse;

namespace ECommerceWarehouse.UnitTests.Services;

public class StockTransferServiceTests
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
        public long? UserId => 60;
        public IReadOnlyList<string> Roles => [RoleNames.WarehouseManager];
        public long? SellerId => null;
        public bool IsAuthenticated => true;
        public bool IsInRole(string role) => Roles.Contains(role);
        public Task<long?> GetSellerIdAsync(CancellationToken cancellationToken = default) => Task.FromResult<long?>(null);
    }

    private sealed class SpyLedger : IInventoryLedgerService
    {
        public List<(long LocationId, long VariantId, int Qty)> Increased { get; } = [];
        public List<(long LocationId, long VariantId, int Delta)> Adjusted { get; } = [];

        public Task IncreaseOnHandAsync(long warehouseId, long locationId, long variantId, int quantity, string movementType, string referenceType, long referenceId, long? createdBy, string? note = null, CancellationToken cancellationToken = default)
        {
            Increased.Add((locationId, variantId, quantity));
            return Task.CompletedTask;
        }
        public Task AdjustOnHandAsync(long warehouseId, long locationId, long variantId, int deltaQuantity, string movementType, string referenceType, long referenceId, long? createdBy, string? note = null, CancellationToken cancellationToken = default)
        {
            Adjusted.Add((locationId, variantId, deltaQuantity));
            return Task.CompletedTask;
        }
        public Task ReserveStockAtomicAsync(long inventoryId, int quantity, long referenceId, long? createdBy, string? note = null, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task ReleaseReservationAsync(long locationId, long variantId, int quantity, long referenceId, long? createdBy, string? note = null, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task DispatchReservedStockAsync(long locationId, long variantId, int quantity, long referenceId, long? createdBy, string? note = null, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task TransferAdjustmentAsync(long warehouseId, long sourceLocationId, long destinationLocationId, long variantId, int quantity, string referenceType, long referenceId, long? createdBy, string? note = null, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task<PagedResult<InventoryItemDto>> GetInventoryAsync(InventoryQueryDto query, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<VariantAvailabilityDto> GetVariantAvailabilityAsync(long variantId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<PagedResult<StockMovementDto>> GetStockMovementsAsync(StockMovementQueryDto query, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<List<StockReconciliationItemDto>> GetReconciliationDiscrepanciesAsync(CancellationToken cancellationToken = default) => throw new NotImplementedException();
    }

    private sealed class InMemoryStockTransferRepo : IStockTransferRepository
    {
        public List<StockTransfer> Transfers { get; } = [];

        public Task<PagedResult<StockTransferListItemDto>> GetPagedAsync(StockTransferQueryDto query, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<StockTransferDetailDto?> GetDetailDtoAsync(long transferId, CancellationToken cancellationToken = default)
        {
            var t = Transfers.FirstOrDefault(x => x.TransferId == transferId);
            if (t == null) return Task.FromResult<StockTransferDetailDto?>(null);
            return Task.FromResult<StockTransferDetailDto?>(new StockTransferDetailDto
            {
                TransferId = t.TransferId,
                SourceWarehouseId = t.SourceWarehouseId,
                SourceWarehouseName = "Kho A",
                DestinationWarehouseId = t.DestinationWarehouseId,
                DestinationWarehouseName = "Kho B",
                TransferCode = t.TransferCode,
                Status = t.Status,
                Details = t.Details.Select(d => new StockTransferLineDto
                {
                    TransferDetailId = d.TransferDetailId,
                    VariantId = d.VariantId,
                    SKU = $"SKU-{d.VariantId}",
                    ProductName = "Product",
                    SourceLocationId = d.SourceLocationId,
                    SourceLocationCode = $"LOC-{d.SourceLocationId}",
                    DestinationLocationId = d.DestinationLocationId,
                    DestinationLocationCode = $"LOC-{d.DestinationLocationId}",
                    Quantity = d.Quantity,
                    ReceivedQuantity = d.ReceivedQuantity
                }).ToList()
            });
        }

        public Task<StockTransfer?> GetByIdWithDetailsAsync(long transferId, CancellationToken cancellationToken = default)
            => Task.FromResult(Transfers.FirstOrDefault(x => x.TransferId == transferId));
        public Task<bool> WarehouseExistsAsync(long warehouseId, CancellationToken cancellationToken = default)
            => Task.FromResult(warehouseId is 1 or 2);
        public Task<HashSet<long>> GetValidLocationIdsInWarehouseAsync(long warehouseId, IReadOnlyCollection<long> locationIds, CancellationToken cancellationToken = default)
            => Task.FromResult(locationIds.ToHashSet());
        public Task<HashSet<long>> GetValidVariantIdsAsync(IReadOnlyCollection<long> variantIds, CancellationToken cancellationToken = default)
            => Task.FromResult(variantIds.ToHashSet());
        public Task AddAsync(StockTransfer transfer, CancellationToken cancellationToken = default)
        {
            transfer.TransferId = Transfers.Count + 1;
            long detailId = 1;
            foreach (var d in transfer.Details) d.TransferDetailId = detailId++;
            Transfers.Add(transfer);
            return Task.CompletedTask;
        }
    }

    [Fact]
    public async Task FullTransferFlow_DispatchAndReceive_UpdatesSourceAndDestinationLedger()
    {
        var repo = new InMemoryStockTransferRepo();
        var ledger = new SpyLedger();
        var service = new StockTransferService(
            repo,
            ledger,
            new StubUnitOfWork(),
            new StubCurrentUser(),
            new CreateStockTransferRequestValidator(),
            new ReceiveStockTransferRequestValidator());

        var created = await service.CreateAsync(new CreateStockTransferRequestDto
        {
            SourceWarehouseId = 1,
            DestinationWarehouseId = 2,
            Items = [new CreateStockTransferItemDto { VariantId = 100, SourceLocationId = 10, DestinationLocationId = 20, Quantity = 5 }]
        });
        Assert.Equal(StockTransferStatuses.Draft, created.Status);

        var approved = await service.ApproveAsync(created.TransferId);
        Assert.Equal(StockTransferStatuses.Approved, approved.Status);

        var dispatched = await service.DispatchAsync(created.TransferId);
        Assert.Equal(StockTransferStatuses.InTransit, dispatched.Status);
        Assert.Single(ledger.Adjusted);
        Assert.Equal((10L, 100L, -5), ledger.Adjusted[0]);

        var received = await service.ReceiveAsync(created.TransferId, new ReceiveStockTransferRequestDto
        {
            Items = [new ReceiveStockTransferItemDto { TransferDetailId = created.Details[0].TransferDetailId, ReceivedQuantity = 5 }]
        });
        Assert.Equal(StockTransferStatuses.Received, received.Status);
        Assert.Single(ledger.Increased);
        Assert.Equal((20L, 100L, 5), ledger.Increased[0]);
    }
}
