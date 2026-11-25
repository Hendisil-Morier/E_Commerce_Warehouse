using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Warehouse;
using ECommerceWarehouse.Domain.Entities.Warehouse;

namespace ECommerceWarehouse.Application.Contracts.Persistence;

public interface IStockCountRepository
{
    Task<PagedResult<StockCountListItemDto>> GetPagedAsync(StockCountQueryDto query, CancellationToken cancellationToken = default);
    Task<StockCountDetailDto?> GetDetailDtoAsync(long stockCountId, CancellationToken cancellationToken = default);
    Task<StockCount?> GetByIdWithDetailsAsync(long stockCountId, CancellationToken cancellationToken = default);
    Task<bool> WarehouseExistsAsync(long warehouseId, CancellationToken cancellationToken = default);
    Task<HashSet<long>> GetValidLocationIdsInWarehouseAsync(long warehouseId, IReadOnlyCollection<long> locationIds, CancellationToken cancellationToken = default);
    Task<HashSet<long>> GetValidVariantIdsAsync(IReadOnlyCollection<long> variantIds, CancellationToken cancellationToken = default);
    Task<Dictionary<(long LocationId, long VariantId), int>> GetSystemQuantitiesAsync(long warehouseId, IReadOnlyCollection<(long LocationId, long VariantId)> pairs, CancellationToken cancellationToken = default);
    Task AddAsync(StockCount stockCount, CancellationToken cancellationToken = default);
}
