using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Warehouse;

namespace ECommerceWarehouse.Application.Services;

/// <summary>
/// Cổng DUY NHẤT để thay đổi bảng Inventory và ghi nhận sổ cái StockMovements bất biến trong cùng transaction.
/// </summary>
public interface IInventoryLedgerService
{
    Task IncreaseOnHandAsync(
        long warehouseId,
        long locationId,
        long variantId,
        int quantity,
        string movementType,
        string referenceType,
        long referenceId,
        long? createdBy,
        string? note = null,
        CancellationToken cancellationToken = default);

    Task ReserveStockAtomicAsync(
        long inventoryId,
        int quantity,
        long referenceId,
        long? createdBy,
        string? note = null,
        CancellationToken cancellationToken = default);

    Task ReleaseReservationAsync(
        long locationId,
        long variantId,
        int quantity,
        long referenceId,
        long? createdBy,
        string? note = null,
        CancellationToken cancellationToken = default);

    Task DispatchReservedStockAsync(
        long locationId,
        long variantId,
        int quantity,
        long referenceId,
        long? createdBy,
        string? note = null,
        CancellationToken cancellationToken = default);

    Task<PagedResult<InventoryItemDto>> GetInventoryAsync(
        InventoryQueryDto query,
        CancellationToken cancellationToken = default);

    Task<VariantAvailabilityDto> GetVariantAvailabilityAsync(
        long variantId,
        CancellationToken cancellationToken = default);

    Task<PagedResult<StockMovementDto>> GetStockMovementsAsync(
        StockMovementQueryDto query,
        CancellationToken cancellationToken = default);

    Task<List<StockReconciliationItemDto>> GetReconciliationDiscrepanciesAsync(
        CancellationToken cancellationToken = default);
}
