using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Warehouse;
using ECommerceWarehouse.Domain.Entities.Warehouse;

namespace ECommerceWarehouse.Application.Contracts.Persistence;

public interface IWarehouseRepository
{
    Task<PagedResult<WarehouseDto>> GetPagedAsync(WarehouseQueryDto query, CancellationToken cancellationToken = default);
    Task<Warehouse?> GetByIdAsync(long warehouseId, CancellationToken cancellationToken = default);
    Task<bool> SellerExistsAsync(long sellerId, CancellationToken cancellationToken = default);
    Task AddWarehouseAsync(Warehouse warehouse, CancellationToken cancellationToken = default);
    Task<List<WarehouseLocationDto>> GetLocationsAsync(long warehouseId, CancellationToken cancellationToken = default);
    Task<WarehouseLocation?> GetLocationByIdAsync(long locationId, CancellationToken cancellationToken = default);
    Task<bool> LocationCodeExistsAsync(long warehouseId, string locationCode, CancellationToken cancellationToken = default);
    Task AddLocationAsync(WarehouseLocation location, CancellationToken cancellationToken = default);
}
