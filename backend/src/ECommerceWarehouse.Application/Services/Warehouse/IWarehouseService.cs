using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Warehouse;

namespace ECommerceWarehouse.Application.Services;

public interface IWarehouseService
{
    Task<PagedResult<WarehouseDto>> GetWarehousesAsync(WarehouseQueryDto query, CancellationToken cancellationToken = default);
    Task<WarehouseDto> CreateWarehouseAsync(CreateWarehouseRequestDto request, CancellationToken cancellationToken = default);
    Task<WarehouseDto> UpdateWarehouseAsync(long warehouseId, UpdateWarehouseRequestDto request, CancellationToken cancellationToken = default);
    Task<WarehouseDto> SetWarehouseStatusAsync(long warehouseId, bool isActive, CancellationToken cancellationToken = default);
    Task<List<WarehouseLocationDto>> GetLocationsAsync(long warehouseId, CancellationToken cancellationToken = default);
    Task<WarehouseLocationDto> CreateLocationAsync(long warehouseId, CreateWarehouseLocationRequestDto request, CancellationToken cancellationToken = default);
    Task<WarehouseLocationDto> SetLocationStatusAsync(long locationId, bool isActive, CancellationToken cancellationToken = default);
}
