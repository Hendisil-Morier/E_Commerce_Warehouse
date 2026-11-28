using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Warehouse;
using ECommerceWarehouse.Domain.Entities.Warehouse;
using ECommerceWarehouse.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ECommerceWarehouse.Infrastructure.Repositories;

public class StockTransferRepository : IStockTransferRepository
{
    private readonly ApplicationDbContext _context;

    public StockTransferRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<StockTransferListItemDto>> GetPagedAsync(
        StockTransferQueryDto query,
        CancellationToken cancellationToken = default)
    {
        var q = _context.StockTransfers.AsNoTracking();

        if (query.SourceWarehouseId.HasValue)
        {
            q = q.Where(x => x.SourceWarehouseId == query.SourceWarehouseId.Value);
        }

        if (query.DestinationWarehouseId.HasValue)
        {
            q = q.Where(x => x.DestinationWarehouseId == query.DestinationWarehouseId.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.Status))
        {
            var status = query.Status.Trim();
            q = q.Where(x => x.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();
            q = q.Where(x => x.TransferCode.Contains(search) || (x.Note != null && x.Note.Contains(search)));
        }

        var totalCount = await q.CountAsync(cancellationToken);

        var items = await q
            .OrderByDescending(x => x.CreatedAt)
            .ThenByDescending(x => x.TransferId)
            .Skip((query.NormalizedPage - 1) * query.NormalizedPageSize)
            .Take(query.NormalizedPageSize)
            .Select(x => new StockTransferListItemDto
            {
                TransferId = x.TransferId,
                SourceWarehouseId = x.SourceWarehouseId,
                SourceWarehouseName = x.SourceWarehouse.WarehouseName,
                DestinationWarehouseId = x.DestinationWarehouseId,
                DestinationWarehouseName = x.DestinationWarehouse.WarehouseName,
                TransferCode = x.TransferCode,
                Status = x.Status,
                Note = x.Note,
                TotalQuantity = x.Details.Sum(d => d.Quantity),
                CreatedAt = x.CreatedAt,
                ApprovedAt = x.ApprovedAt,
                ShippedAt = x.ShippedAt,
                ReceivedAt = x.ReceivedAt
            })
            .ToListAsync(cancellationToken);

        return PagedResult<StockTransferListItemDto>.Create(items, query.NormalizedPage, query.NormalizedPageSize, totalCount);
    }

    public async Task<StockTransferDetailDto?> GetDetailDtoAsync(long transferId, CancellationToken cancellationToken = default)
    {
        return await _context.StockTransfers
            .AsNoTracking()
            .Where(x => x.TransferId == transferId)
            .Select(x => new StockTransferDetailDto
            {
                TransferId = x.TransferId,
                SourceWarehouseId = x.SourceWarehouseId,
                SourceWarehouseName = x.SourceWarehouse.WarehouseName,
                DestinationWarehouseId = x.DestinationWarehouseId,
                DestinationWarehouseName = x.DestinationWarehouse.WarehouseName,
                TransferCode = x.TransferCode,
                Status = x.Status,
                Note = x.Note,
                TotalQuantity = x.Details.Sum(d => d.Quantity),
                CreatedAt = x.CreatedAt,
                ApprovedAt = x.ApprovedAt,
                ShippedAt = x.ShippedAt,
                ReceivedAt = x.ReceivedAt,
                CreatedBy = x.CreatedBy,
                ApprovedBy = x.ApprovedBy,
                ReceivedBy = x.ReceivedBy,
                Details = x.Details.Select(d => new StockTransferLineDto
                {
                    TransferDetailId = d.TransferDetailId,
                    VariantId = d.VariantId,
                    SKU = d.Variant.SKU,
                    ProductName = d.Variant.Product.ProductName,
                    SourceLocationId = d.SourceLocationId,
                    SourceLocationCode = d.SourceLocation.LocationCode,
                    DestinationLocationId = d.DestinationLocationId,
                    DestinationLocationCode = d.DestinationLocation != null ? d.DestinationLocation.LocationCode : null,
                    Quantity = d.Quantity,
                    ReceivedQuantity = d.ReceivedQuantity
                }).ToList()
            })
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<StockTransfer?> GetByIdWithDetailsAsync(long transferId, CancellationToken cancellationToken = default)
        => await _context.StockTransfers
            .Include(x => x.Details)
            .FirstOrDefaultAsync(x => x.TransferId == transferId, cancellationToken);

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

    public async Task AddAsync(StockTransfer transfer, CancellationToken cancellationToken = default)
        => await _context.StockTransfers.AddAsync(transfer, cancellationToken);
}
