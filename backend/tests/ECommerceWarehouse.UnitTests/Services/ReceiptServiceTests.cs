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

public class ReceiptServiceTests
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
        public long? SellerId => null;
        public bool IsAuthenticated => UserId.HasValue;
        public bool IsInRole(string role) => Roles.Contains(role);
        public Task<long?> GetSellerIdAsync(CancellationToken cancellationToken = default) => Task.FromResult<long?>(null);
    }

    private sealed class StubReceiptRepo : IReceiptRepository
    {
        public List<InventoryReceipt> Receipts { get; } = [];
        public Dictionary<long, long> VariantSellers { get; } = new() { [100] = 5 };

        public Task<PagedResult<ReceiptDto>> GetPagedAsync(ReceiptQueryDto query, CancellationToken cancellationToken = default)
            => Task.FromResult(PagedResult<ReceiptDto>.Create([], query.NormalizedPage, query.NormalizedPageSize, 0));

        public Task<InventoryReceipt?> GetByIdWithDetailsAsync(long receiptId, CancellationToken cancellationToken = default)
            => Task.FromResult(Receipts.FirstOrDefault(r => r.ReceiptId == receiptId));

        public Task<ReceiptDto?> GetDtoByIdAsync(long receiptId, CancellationToken cancellationToken = default)
        {
            var r = Receipts.FirstOrDefault(x => x.ReceiptId == receiptId);
            if (r == null) return Task.FromResult<ReceiptDto?>(null);
            return Task.FromResult<ReceiptDto?>(new ReceiptDto
            {
                ReceiptId = r.ReceiptId,
                ReceiptCode = r.ReceiptCode,
                WarehouseId = r.WarehouseId,
                WarehouseName = "Kho test",
                ReceiptType = r.ReceiptType,
                Status = r.Status,
                CreatedBy = r.CreatedBy,
                ConfirmedBy = r.ConfirmedBy,
                CreatedAt = r.CreatedAt,
                ConfirmedAt = r.ConfirmedAt
            });
        }

        public Task<bool> VariantExistsAsync(long variantId, CancellationToken cancellationToken = default)
            => Task.FromResult(VariantSellers.ContainsKey(variantId));

        public Task<long?> GetVariantSellerIdAsync(long variantId, CancellationToken cancellationToken = default)
            => Task.FromResult(VariantSellers.TryGetValue(variantId, out var sid) ? (long?)sid : null);

        public Task AddAsync(InventoryReceipt receipt, CancellationToken cancellationToken = default)
        {
            receipt.ReceiptId = Receipts.Count + 1;
            Receipts.Add(receipt);
            return Task.CompletedTask;
        }

        public void Update(InventoryReceipt receipt) { }
    }

    private sealed class StubWarehouseRepo : IWarehouseRepository
    {
        public List<Warehouse> Warehouses { get; } = [new() { WarehouseId = 1, WarehouseName = "Kho Hà Nội", WarehouseType = WarehouseTypes.Platform, IsActive = true }];
        public List<WarehouseLocation> Locations { get; } = [new() { LocationId = 2, WarehouseId = 1, LocationCode = "A-01-01", StorageType = StorageTypes.Standard, IsSellable = true, IsActive = true }];

        public Task<PagedResult<WarehouseDto>> GetPagedAsync(WarehouseQueryDto query, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();
        public Task<Warehouse?> GetByIdAsync(long warehouseId, CancellationToken cancellationToken = default)
            => Task.FromResult(Warehouses.FirstOrDefault(w => w.WarehouseId == warehouseId));
        public Task<bool> SellerExistsAsync(long sellerId, CancellationToken cancellationToken = default)
            => Task.FromResult(true);
        public Task AddWarehouseAsync(Warehouse warehouse, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task<List<WarehouseLocationDto>> GetLocationsAsync(long warehouseId, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();
        public Task<WarehouseLocation?> GetLocationByIdAsync(long locationId, CancellationToken cancellationToken = default)
            => Task.FromResult(Locations.FirstOrDefault(l => l.LocationId == locationId));
        public Task<bool> LocationCodeExistsAsync(long warehouseId, string locationCode, CancellationToken cancellationToken = default)
            => Task.FromResult(false);
        public Task AddLocationAsync(WarehouseLocation location, CancellationToken cancellationToken = default) => Task.CompletedTask;
    }

    private sealed class SpyInventoryLedgerService : IInventoryLedgerService
    {
        public List<(long WarehouseId, long LocationId, long VariantId, int Qty)> IncreasedCalls { get; } = [];

        public Task IncreaseOnHandAsync(long warehouseId, long locationId, long variantId, int quantity, string movementType, string referenceType, long referenceId, long? createdBy, string? note = null, CancellationToken cancellationToken = default)
        {
            IncreasedCalls.Add((warehouseId, locationId, variantId, quantity));
            return Task.CompletedTask;
        }

        public Task ReserveStockAtomicAsync(long inventoryId, int quantity, long referenceId, long? createdBy, string? note = null, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task ReleaseReservationAsync(long locationId, long variantId, int quantity, long referenceId, long? createdBy, string? note = null, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task DispatchReservedStockAsync(long locationId, long variantId, int quantity, long referenceId, long? createdBy, string? note = null, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task<PagedResult<InventoryItemDto>> GetInventoryAsync(InventoryQueryDto query, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<VariantAvailabilityDto> GetVariantAvailabilityAsync(long variantId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<PagedResult<StockMovementDto>> GetStockMovementsAsync(StockMovementQueryDto query, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<List<StockReconciliationItemDto>> GetReconciliationDiscrepanciesAsync(CancellationToken cancellationToken = default) => throw new NotImplementedException();
    }

    private static (ReceiptService Service, StubReceiptRepo Repo, SpyInventoryLedgerService Ledger, StubCurrentUser CurrentUser) CreateSut()
    {
        var repo = new StubReceiptRepo();
        var warehouseRepo = new StubWarehouseRepo();
        var ledger = new SpyInventoryLedgerService();
        var currentUser = new StubCurrentUser();

        var service = new ReceiptService(
            repo,
            warehouseRepo,
            ledger,
            new StubUnitOfWork(),
            currentUser,
            new ReceiptQueryValidator(),
            new CreateReceiptRequestValidator());

        return (service, repo, ledger, currentUser);
    }

    [Fact]
    public async Task CreateReceiptAsync_ValidDraft_CreatesReceiptWithStatusDraft()
    {
        var (service, repo, _, currentUser) = CreateSut();
        currentUser.UserId = 15;

        var result = await service.CreateReceiptAsync(new CreateReceiptRequestDto
        {
            WarehouseId = 1,
            ReceiptType = ReceiptTypes.SellerInbound,
            SenderSellerId = 5,
            Details = [new CreateReceiptDetailItemDto { VariantId = 100, LocationId = 2, Quantity = 20, UnitCost = 50000 }]
        });

        Assert.Equal(ReceiptStatuses.Draft, result.Status);
        Assert.Equal(15, result.CreatedBy);
        Assert.Single(repo.Receipts);
    }

    [Fact]
    public async Task ConfirmReceiptAsync_SameCreator_ThrowsSelfApprovalNotAllowed()
    {
        var (service, repo, ledger, currentUser) = CreateSut();
        currentUser.UserId = 10;
        repo.Receipts.Add(new InventoryReceipt
        {
            ReceiptId = 1,
            WarehouseId = 1,
            ReceiptCode = "PN-001",
            ReceiptType = ReceiptTypes.SellerInbound,
            Status = ReceiptStatuses.Draft,
            CreatedBy = 10,
            Details = [new ReceiptDetail { VariantId = 100, LocationId = 2, Quantity = 10 }]
        });

        var ex = await Assert.ThrowsAsync<BusinessException>(() => service.ConfirmReceiptAsync(1));

        Assert.Equal(ErrorCodes.SelfApprovalNotAllowed, ex.Code);
        Assert.Empty(ledger.IncreasedCalls);
    }

    [Fact]
    public async Task ConfirmReceiptAsync_DifferentManager_ConfirmsAndIncreasesStock()
    {
        var (service, repo, ledger, currentUser) = CreateSut();
        currentUser.UserId = 20;
        repo.Receipts.Add(new InventoryReceipt
        {
            ReceiptId = 1,
            WarehouseId = 1,
            ReceiptCode = "PN-001",
            ReceiptType = ReceiptTypes.SellerInbound,
            Status = ReceiptStatuses.Draft,
            CreatedBy = 10,
            Details = [new ReceiptDetail { VariantId = 100, LocationId = 2, Quantity = 10 }]
        });

        var confirmed = await service.ConfirmReceiptAsync(1);

        Assert.Equal(ReceiptStatuses.Confirmed, confirmed.Status);
        Assert.Equal(20, confirmed.ConfirmedBy);
        var call = Assert.Single(ledger.IncreasedCalls);
        Assert.Equal((1, 2, 100, 10), call);
    }

    [Fact]
    public async Task CancelReceiptAsync_WhenConfirmed_ThrowsInvalidStatusTransition()
    {
        var (service, repo, _, _) = CreateSut();
        repo.Receipts.Add(new InventoryReceipt
        {
            ReceiptId = 1,
            WarehouseId = 1,
            ReceiptCode = "PN-001",
            ReceiptType = ReceiptTypes.SellerInbound,
            Status = ReceiptStatuses.Confirmed,
            CreatedBy = 10
        });

        var ex = await Assert.ThrowsAsync<BusinessException>(() => service.CancelReceiptAsync(1));
        Assert.Equal(ErrorCodes.InvalidStatusTransition, ex.Code);
    }
}
