using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Warehouse;
using ECommerceWarehouse.Domain.Entities.Warehouse;
using ECommerceWarehouse.Infrastructure.Data;
using ECommerceWarehouse.Infrastructure.Extensions;
using Microsoft.EntityFrameworkCore;

namespace ECommerceWarehouse.Infrastructure.Repositories;

public class InventoryRepository : IInventoryRepository
{
    private readonly ApplicationDbContext _context;

    public InventoryRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Inventory?> GetByLocationAndVariantAsync(
        long locationId,
        long variantId,
        CancellationToken cancellationToken = default)
        => await _context.Inventories
            .FirstOrDefaultAsync(i => i.LocationId == locationId && i.VariantId == variantId, cancellationToken);

    public async Task<Inventory?> GetByIdAsync(long inventoryId, CancellationToken cancellationToken = default)
        => await _context.Inventories
            .FirstOrDefaultAsync(i => i.InventoryId == inventoryId, cancellationToken);

    public async Task AddInventoryAsync(Inventory inventory, CancellationToken cancellationToken = default)
        => await _context.Inventories.AddAsync(inventory, cancellationToken);

    public async Task AddStockMovementAsync(StockMovement movement, CancellationToken cancellationToken = default)
        => await _context.StockMovements.AddAsync(movement, cancellationToken);

    public async Task<int> TryReserveAtomicAsync(
        long inventoryId,
        int quantity,
        CancellationToken cancellationToken = default)
    {
        return await _context.Database.ExecuteSqlInterpolatedAsync(
            $"UPDATE Inventory SET QuantityReserved = QuantityReserved + {quantity}, UpdatedAt = UTC_TIMESTAMP(3) WHERE InventoryId = {inventoryId} AND QuantityOnHand - QuantityReserved >= {quantity}",
            cancellationToken);
    }

    public async Task<PagedResult<InventoryItemDto>> GetPagedInventoryAsync(
        InventoryQueryDto query,
        long? restrictedSellerId = null,
        CancellationToken cancellationToken = default)
    {
        var baseQuery = _context.Inventories
            .AsNoTracking()
            .Include(i => i.Location)
                .ThenInclude(l => l.Warehouse)
            .Include(i => i.Variant)
                .ThenInclude(v => v.Product)
                    .ThenInclude(p => p.Shop)
            .AsQueryable();

        if (restrictedSellerId.HasValue)
        {
            baseQuery = baseQuery.Where(i => i.Variant.Product.Shop.SellerId == restrictedSellerId.Value);
        }
        else if (query.SellerId.HasValue)
        {
            baseQuery = baseQuery.Where(i => i.Variant.Product.Shop.SellerId == query.SellerId.Value);
        }

        if (query.WarehouseId.HasValue)
        {
            baseQuery = baseQuery.Where(i => i.WarehouseId == query.WarehouseId.Value);
        }

        if (query.LocationId.HasValue)
        {
            baseQuery = baseQuery.Where(i => i.LocationId == query.LocationId.Value);
        }

        if (query.VariantId.HasValue)
        {
            baseQuery = baseQuery.Where(i => i.VariantId == query.VariantId.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLower();
            baseQuery = baseQuery.Where(i =>
                i.Variant.SKU.ToLower().Contains(search) ||
                i.Variant.Product.ProductName.ToLower().Contains(search) ||
                i.Location.LocationCode.ToLower().Contains(search));
        }

        if (query.LowStockOnly == true)
        {
            baseQuery = baseQuery.Where(i => (i.QuantityOnHand - i.QuantityReserved) <= 10);
        }

        var projected = baseQuery
            .OrderBy(i => i.WarehouseId)
            .ThenBy(i => i.Location.LocationCode)
            .ThenBy(i => i.Variant.SKU)
            .Select(i => new InventoryItemDto
            {
                InventoryId = i.InventoryId,
                WarehouseId = i.WarehouseId,
                WarehouseName = i.Location.Warehouse.WarehouseName,
                LocationId = i.LocationId,
                LocationCode = i.Location.LocationCode,
                StorageType = i.Location.StorageType,
                IsSellable = i.Location.IsSellable,
                VariantId = i.VariantId,
                ProductId = i.Variant.ProductId,
                ProductName = i.Variant.Product.ProductName,
                VariantName = i.Variant.VariantName,
                SKU = i.Variant.SKU,
                SellerId = i.Variant.Product.Shop.SellerId,
                ShopName = i.Variant.Product.Shop.ShopName,
                QuantityOnHand = i.QuantityOnHand,
                QuantityReserved = i.QuantityReserved,
                UpdatedAt = i.UpdatedAt
            });

        return await projected.ToPagedResultAsync(query, cancellationToken);
    }

    public async Task<VariantAvailabilityDto> GetVariantAvailabilityAsync(
        long variantId,
        CancellationToken cancellationToken = default)
    {
        var totals = await _context.VariantAvailabilities
            .AsNoTracking()
            .Where(v => v.VariantId == variantId)
            .GroupBy(v => v.VariantId)
            .Select(g => new
            {
                OnHand = (int)g.Sum(x => x.OnHand),
                Reserved = (int)g.Sum(x => x.Reserved),
                Available = (int)g.Sum(x => x.Available)
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (totals == null)
        {
            return new VariantAvailabilityDto
            {
                VariantId = variantId,
                TotalOnHand = 0,
                TotalReserved = 0,
                AvailableQuantity = 0
            };
        }

        return new VariantAvailabilityDto
        {
            VariantId = variantId,
            TotalOnHand = totals.OnHand,
            TotalReserved = totals.Reserved,
            AvailableQuantity = totals.Available
        };
    }

    public async Task<PagedResult<StockMovementDto>> GetPagedMovementsAsync(
        StockMovementQueryDto query,
        CancellationToken cancellationToken = default)
    {
        var baseQuery = _context.StockMovements
            .AsNoTracking()
            .Include(m => m.Location)
            .Include(m => m.Variant)
                .ThenInclude(v => v.Product)
            .Include(m => m.CreatedByUser)
            .AsQueryable();

        if (query.WarehouseId.HasValue)
        {
            baseQuery = baseQuery.Where(m => m.WarehouseId == query.WarehouseId.Value);
        }

        if (query.LocationId.HasValue)
        {
            baseQuery = baseQuery.Where(m => m.LocationId == query.LocationId.Value);
        }

        if (query.VariantId.HasValue)
        {
            baseQuery = baseQuery.Where(m => m.VariantId == query.VariantId.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.MovementType))
        {
            baseQuery = baseQuery.Where(m => m.MovementType == query.MovementType);
        }

        if (query.From.HasValue)
        {
            baseQuery = baseQuery.Where(m => m.CreatedAt >= query.From.Value);
        }

        if (query.To.HasValue)
        {
            baseQuery = baseQuery.Where(m => m.CreatedAt <= query.To.Value);
        }

        var projected = baseQuery
            .OrderByDescending(m => m.CreatedAt)
            .ThenByDescending(m => m.StockMovementId)
            .Select(m => new StockMovementDto
            {
                StockMovementId = m.StockMovementId,
                WarehouseId = m.WarehouseId,
                LocationId = m.LocationId,
                LocationCode = m.Location.LocationCode,
                VariantId = m.VariantId,
                SKU = m.Variant.SKU,
                ProductName = m.Variant.Product.ProductName,
                VariantName = m.Variant.VariantName,
                MovementType = m.MovementType,
                OnHandChange = m.OnHandChange,
                ReservedChange = m.ReservedChange,
                OnHandAfter = m.OnHandAfter,
                ReservedAfter = m.ReservedAfter,
                ReferenceType = m.ReferenceType,
                ReferenceId = m.ReferenceId,
                CreatedBy = m.CreatedBy,
                CreatedByName = m.CreatedByUser != null ? m.CreatedByUser.FullName : null,
                CreatedAt = m.CreatedAt,
                Note = m.Note
            });

        return await projected.ToPagedResultAsync(query, cancellationToken);
    }

    public async Task<List<StockReconciliationItemDto>> GetReconciliationDiscrepanciesAsync(
        CancellationToken cancellationToken = default)
    {
        return await _context.StockReconciliations
            .AsNoTracking()
            .Select(r => new StockReconciliationItemDto
            {
                InventoryId = r.InventoryId,
                WarehouseId = r.WarehouseId,
                LocationId = r.LocationId,
                VariantId = r.VariantId,
                QuantityOnHand = r.QuantityOnHand,
                QuantityReserved = r.QuantityReserved,
                LedgerOnHand = r.LedgerOnHand,
                LedgerReserved = r.LedgerReserved,
                ActiveReservations = r.ActiveReservations,
                OnHandDiff = r.OnHand_Diff,
                ReservedLedgerDiff = r.ReservedLedger_Diff,
                ReservedReservationDiff = r.ReservedReservation_Diff
            })
            .ToListAsync(cancellationToken);
    }
}
