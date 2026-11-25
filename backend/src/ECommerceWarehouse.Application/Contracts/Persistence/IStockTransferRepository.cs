using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Warehouse;
using ECommerceWarehouse.Domain.Entities.Warehouse;

namespace ECommerceWarehouse.Application.Contracts.Persistence;

public interface IStockTransferRepository
{
    Task<PagedResult<StockTransferListItemDto>> GetPagedAsync(StockTransferQueryDto query, CancellationToken cancellationToken = default);
    Task<StockTransferDetailDto?> GetDetailDtoAsync(long transferId, CancellationToken cancellationToken = default);
    Task<StockTransfer?> GetByIdWithDetailsAsync(long transferId, CancellationToken cancellationToken = default);
    Task<bool> WarehouseExistsAsync(long warehouseId, CancellationToken cancellationToken = default);
    Task<HashSet<long>> GetValidLocationIdsInWarehouseAsync(long warehouseId, IReadOnlyCollection<long> locationIds, CancellationToken cancellationToken = default);
    Task<HashSet<long>> GetValidVariantIdsAsync(IReadOnlyCollection<long> variantIds, CancellationToken cancellationToken = default);
    Task AddAsync(StockTransfer transfer, CancellationToken cancellationToken = default);
}
