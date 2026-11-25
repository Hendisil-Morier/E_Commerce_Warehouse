using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Warehouse;
using ECommerceWarehouse.Domain.Entities.Warehouse;
using ECommerceWarehouse.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ECommerceWarehouse.Infrastructure.Repositories;

public class StockCountRepository : IStockCountRepository
{
    private readonly ApplicationDbContext _context;

    public StockCountRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<StockCountListItemDto>> GetPagedAsync(
        StockCountQueryDto query,
        CancellationToken cancellationToken = default)
    {
        var q = _context.StockCounts.AsNoTracking();

        if (query.WarehouseId.HasValue)
        {
            q = q.Where(x => x.WarehouseId == query.WarehouseId.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.Status))
        {
            var status = query.Status.Trim();
            q = q.Where(x => x.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();
            q = q.Where(x => x.CountCode.Contains(search) || (x.Note != null && x.Note.Contains(search)));
        }

        var totalCount = await q.CountAsync(cancellationToken);

        var items = await q
            .OrderByDescending(x => x.CreatedAt)
            .ThenByDescending(x => x.StockCountId)
            .Skip((query.NormalizedPage - 1) * query.NormalizedPageSize)
            .Take(query.NormalizedPageSize)
            .Select(x => new StockCountListItemDto
            {
                StockCountId = x.StockCountId,
                WarehouseId = x.WarehouseId,
                WarehouseName = x.Warehouse.WarehouseName,
                CountCode = x.CountCode,
                Status = x.Status,
                Note = x.Note,
                ItemCount = x.Details.Count,
                CreatedAt = x.CreatedAt,
                ApprovedAt = x.ApprovedAt
            })
            .ToListAsync(cancellationToken);

        return PagedResult<StockCountListItemDto>.Create(items, query.NormalizedPage, query.NormalizedPageSize, totalCount);
    }

    public async Task<StockCountDetailDto?> GetDetailDtoAsync(long stockCountId, CancellationToken cancellationToken = default)
    {
        return await _context.StockCounts
            .AsNoTracking()
            .Where(x => x.StockCountId == stockCountId)
            .Select(x => new StockCountDetailDto
            {
                StockCountId = x.StockCountId,
                WarehouseId = x.WarehouseId,
                WarehouseName = x.Warehouse.WarehouseName,
                CountCode = x.CountCode,
                Status = x.Status,
                Note = x.Note,
                ItemCount = x.Details.Count,
                CreatedAt = x.CreatedAt,
                ApprovedAt = x.ApprovedAt,
                CreatedBy = x.CreatedBy,
                ApprovedBy = x.ApprovedBy,
                Details = x.Details.Select(d => new StockCountLineDto
                {
                    StockCountDetailId = d.StockCountDetailId,
                    LocationId = d.LocationId,
                    LocationCode = d.Location.LocationCode,
                    VariantId = d.VariantId,
                    SKU = d.Variant.SKU,
                    ProductName = d.Variant.Product.ProductName,
                    SystemQuantity = d.SystemQuantity,
                    CountedQuantity = d.CountedQuantity,
                    Difference = d.Difference,
                    Reason = d.Reason
                }).ToList()
            })
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<StockCount?> GetByIdWithDetailsAsync(long stockCountId, CancellationToken cancellationToken = default)
        => await _context.StockCounts
            .Include(x => x.Details)
            .FirstOrDefaultAsync(x => x.StockCountId == stockCountId, cancellationToken);

    public Task<bool> WarehouseExistsAsync(long warehouseId, CancellationToken cancellationToken = default)
        => _context.Warehouses.AnyAsync(w => w.WarehouseId == warehouseId && w.IsActive, cancellationToken);

    public async Task<HashSet<long>> GetValidLocationIdsInWarehouseAsync(
        long warehouseId,
        IReadOnlyCollection<long> locationIds,
        CancellationToken cancellationToken = default)
    {
        var ids = await _context.WarehouseLocations
            .Where(l => l.WarehouseId == warehouseId && locationIds.Contains(l.LocationId) && l.IsActive)
            .Select(l => l.LocationId)
            .ToListAsync(cancellationToken);
        return ids.ToHashSet();
    }

    public async Task<HashSet<long>> GetValidVariantIdsAsync(
        IReadOnlyCollection<long> variantIds,
        CancellationToken cancellationToken = default)
    {
        var ids = await _context.ProductVariants
            .Where(v => variantIds.Contains(v.VariantId))
            .Select(v => v.VariantId)
            .ToListAsync(cancellationToken);
        return ids.ToHashSet();
    }

    public async Task<Dictionary<(long LocationId, long VariantId), int>> GetSystemQuantitiesAsync(
        long warehouseId,
        IReadOnlyCollection<(long LocationId, long VariantId)> pairs,
        CancellationToken cancellationToken = default)
    {
        var locIds = pairs.Select(p => p.LocationId).Distinct().ToList();
        var varIds = pairs.Select(p => p.VariantId).Distinct().ToList();

        var rows = await _context.Inventories
            .AsNoTracking()
            .Where(i => i.WarehouseId == warehouseId && locIds.Contains(i.LocationId) && varIds.Contains(i.VariantId))
            .Select(i => new { i.LocationId, i.VariantId, i.QuantityOnHand })
            .ToListAsync(cancellationToken);

        return rows.ToDictionary(r => (r.LocationId, r.VariantId), r => r.QuantityOnHand);
    }

    public async Task AddAsync(StockCount stockCount, CancellationToken cancellationToken = default)
        => await _context.StockCounts.AddAsync(stockCount, cancellationToken);
}
