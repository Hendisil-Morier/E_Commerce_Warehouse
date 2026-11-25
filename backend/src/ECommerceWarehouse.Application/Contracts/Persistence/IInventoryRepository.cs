using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Warehouse;
using ECommerceWarehouse.Domain.Entities.Warehouse;

namespace ECommerceWarehouse.Application.Contracts.Persistence;

public interface IInventoryRepository
{
    Task<Inventory?> GetByLocationAndVariantAsync(long locationId, long variantId, CancellationToken cancellationToken = default);
    Task<Inventory?> GetByIdAsync(long inventoryId, CancellationToken cancellationToken = default);
    Task AddInventoryAsync(Inventory inventory, CancellationToken cancellationToken = default);
    Task AddStockMovementAsync(StockMovement movement, CancellationToken cancellationToken = default);

    /// <summary>
    /// Cập nhật giữ chỗ nguyên tử: UPDATE Inventory SET QuantityReserved = QuantityReserved + qty WHERE InventoryId = id AND QuantityOnHand - QuantityReserved >= qty.
    /// Trả về số dòng bị ảnh hưởng (1 = thành công, 0 = không đủ tồn).
    /// </summary>
    Task<int> TryReserveAtomicAsync(long inventoryId, int quantity, CancellationToken cancellationToken = default);

    Task<PagedResult<InventoryItemDto>> GetPagedInventoryAsync(
        InventoryQueryDto query,
        long? restrictedSellerId = null,
        CancellationToken cancellationToken = default);

    Task<VariantAvailabilityDto> GetVariantAvailabilityAsync(long variantId, CancellationToken cancellationToken = default);

    Task<PagedResult<StockMovementDto>> GetPagedMovementsAsync(
        StockMovementQueryDto query,
        CancellationToken cancellationToken = default);

    Task<List<StockReconciliationItemDto>> GetReconciliationDiscrepanciesAsync(
        CancellationToken cancellationToken = default);
}
