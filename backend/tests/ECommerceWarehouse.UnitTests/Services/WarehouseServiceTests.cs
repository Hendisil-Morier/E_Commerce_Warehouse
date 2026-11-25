using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Warehouse;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Application.Validators.Warehouse;
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
        public List<Warehouse> Warehouses { get; } = [];
        public List<WarehouseLocation> Locations { get; } = [];
        public HashSet<long> LocationsWithStock { get; } = [];

        public Task<PagedResult<WarehouseDto>> GetPagedAsync(WarehouseQueryDto query, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<Warehouse?> GetByIdAsync(long warehouseId, CancellationToken cancellationToken = default)
            => Task.FromResult(Warehouses.FirstOrDefault(w => w.WarehouseId == warehouseId));
        public Task<bool> SellerExistsAsync(long sellerId, CancellationToken cancellationToken = default) => Task.FromResult(true);
        public Task AddWarehouseAsync(Warehouse warehouse, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task<List<WarehouseLocationDto>> GetLocationsAsync(long warehouseId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<WarehouseLocation?> GetLocationByIdAsync(long locationId, CancellationToken cancellationToken = default)
            => Task.FromResult(Locations.FirstOrDefault(l => l.LocationId == locationId));
        public Task<WarehouseLocation?> GetLocationForUpdateAsync(long locationId, CancellationToken cancellationToken = default)
            => Task.FromResult(Locations.FirstOrDefault(l => l.LocationId == locationId));
        public Task<bool> LocationHasStockAsync(long locationId, CancellationToken cancellationToken = default)
            => Task.FromResult(LocationsWithStock.Contains(locationId));
        public Task<bool> LocationCodeExistsAsync(long warehouseId, string locationCode, CancellationToken cancellationToken = default) => Task.FromResult(false);
        public Task AddLocationAsync(WarehouseLocation location, CancellationToken cancellationToken = default) => Task.CompletedTask;
    }

    [Fact]
    public async Task SetLocationStatusAsync_ThrowsBusinessException_WhenDeactivatingLocationWithStock()
    {
        var repo = new InMemoryWarehouseRepo();
        repo.Locations.Add(new WarehouseLocation { LocationId = 10, WarehouseId = 1, LocationCode = "A-01", StorageType = "Standard", IsActive = true });
        repo.LocationsWithStock.Add(10);

        var service = new WarehouseService(
            repo,
            new StubUnitOfWork(),
            new WarehouseQueryValidator(),
            new CreateWarehouseRequestValidator(),
            new CreateWarehouseLocationRequestValidator());

        await Assert.ThrowsAsync<BusinessException>(() => service.SetLocationStatusAsync(10, false));
    }

    [Fact]
    public async Task SetLocationStatusAsync_DeactivatesLocation_WhenEmpty()
    {
        var repo = new InMemoryWarehouseRepo();
        repo.Locations.Add(new WarehouseLocation { LocationId = 11, WarehouseId = 1, LocationCode = "A-02", StorageType = "Standard", IsActive = true });

        var service = new WarehouseService(
            repo,
            new StubUnitOfWork(),
            new WarehouseQueryValidator(),
            new CreateWarehouseRequestValidator(),
            new CreateWarehouseLocationRequestValidator());

        var result = await service.SetLocationStatusAsync(11, false);

        Assert.False(result.IsActive);
        Assert.False(repo.Locations[0].IsActive);
    }
}
