using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Warehouse;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Application.Validators.Warehouse;
using ECommerceWarehouse.Domain.Constants;
using ECommerceWarehouse.Domain.Entities.Warehouse;
using ECommerceWarehouse.Domain.Exceptions;

namespace ECommerceWarehouse.UnitTests.Services;

public class WarehouseServiceTests
{
    private sealed class StubUnitOfWork : IUnitOfWork
    {
        public IGenericRepository<T> Repository<T>() where T : class => throw new NotImplementedException();
        public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) => Task.FromResult(1);
        public Task ExecuteInTransactionAsync(Func<CancellationToken, Task> operation, CancellationToken cancellationToken = default)
            => operation(cancellationToken);
        public void Dispose() { }
    }

    private sealed class InMemoryWarehouseRepo : IWarehouseRepository
    {
        public List<Warehouse> Warehouses { get; } = [new() { WarehouseId = 1, WarehouseName = "Kho Hà Nội", WarehouseType = WarehouseTypes.Platform, Address = "Hà Nội", IsActive = true }];
        public List<WarehouseLocation> Locations { get; } = [];

        public Task<PagedResult<WarehouseDto>> GetPagedAsync(WarehouseQueryDto query, CancellationToken cancellationToken = default)
            => Task.FromResult(PagedResult<WarehouseDto>.Create([], query.NormalizedPage, query.NormalizedPageSize, 0));

        public Task<Warehouse?> GetByIdAsync(long warehouseId, CancellationToken cancellationToken = default)
            => Task.FromResult(Warehouses.FirstOrDefault(w => w.WarehouseId == warehouseId));

        public Task<bool> SellerExistsAsync(long sellerId, CancellationToken cancellationToken = default) => Task.FromResult(true);
        public Task AddWarehouseAsync(Warehouse warehouse, CancellationToken cancellationToken = default)
        {
            warehouse.WarehouseId = Warehouses.Count + 1;
            Warehouses.Add(warehouse);
            return Task.CompletedTask;
        }

        public Task<List<WarehouseLocationDto>> GetLocationsAsync(long warehouseId, CancellationToken cancellationToken = default)
            => Task.FromResult(new List<WarehouseLocationDto>());

        public Task<WarehouseLocation?> GetLocationByIdAsync(long locationId, CancellationToken cancellationToken = default)
            => Task.FromResult(Locations.FirstOrDefault(l => l.LocationId == locationId));

        public Task<bool> LocationCodeExistsAsync(long warehouseId, string locationCode, CancellationToken cancellationToken = default)
            => Task.FromResult(Locations.Any(l => l.WarehouseId == warehouseId && l.LocationCode == locationCode));

        public Task AddLocationAsync(WarehouseLocation location, CancellationToken cancellationToken = default)
        {
            location.LocationId = Locations.Count + 1;
            Locations.Add(location);
            return Task.CompletedTask;
        }
    }

    private static WarehouseService CreateSut(InMemoryWarehouseRepo repo)
        => new(repo, new StubUnitOfWork(), new WarehouseQueryValidator(), new CreateWarehouseRequestValidator(), new CreateWarehouseLocationRequestValidator());

    [Fact]
    public async Task CreateLocationAsync_InboundWithIsSellableTrue_ThrowsInvalidLocation()
    {
        var repo = new InMemoryWarehouseRepo();
        var service = CreateSut(repo);

        var ex = await Assert.ThrowsAsync<BusinessException>(() =>
            service.CreateLocationAsync(1, new CreateWarehouseLocationRequestDto
            {
                LocationCode = "INBOUND-02",
                StorageType = StorageTypes.Inbound,
                IsSellable = true
            }));

        Assert.Equal(ErrorCodes.InvalidLocation, ex.Code);
    }

    [Fact]
    public async Task CreateLocationAsync_ReturnsWithIsSellableFalse_Succeeds()
    {
        var repo = new InMemoryWarehouseRepo();
        var service = CreateSut(repo);

        var loc = await service.CreateLocationAsync(1, new CreateWarehouseLocationRequestDto
        {
            LocationCode = "returns-02",
            StorageType = StorageTypes.Returns,
            IsSellable = false
        });

        Assert.Equal("RETURNS-02", loc.LocationCode);
        Assert.False(loc.IsSellable);
    }
}
