using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Warehouse;
using ECommerceWarehouse.Domain.Entities.Warehouse;
using ECommerceWarehouse.Infrastructure.Data;
using ECommerceWarehouse.Infrastructure.Extensions;
using Microsoft.EntityFrameworkCore;

namespace ECommerceWarehouse.Infrastructure.Repositories;

public class WarehouseRepository : IWarehouseRepository
{
    private readonly ApplicationDbContext _context;

    public WarehouseRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<WarehouseDto>> GetPagedAsync(
        WarehouseQueryDto query,
        CancellationToken cancellationToken = default)
    {
        var baseQuery = _context.Warehouses
            .AsNoTracking()
            .Include(w => w.OwnerSeller)
            .Include(w => w.Locations)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLower();
            baseQuery = baseQuery.Where(w =>
                w.WarehouseName.ToLower().Contains(search) ||
                w.Address.ToLower().Contains(search));
        }

        if (!string.IsNullOrWhiteSpace(query.WarehouseType))
        {
            baseQuery = baseQuery.Where(w => w.WarehouseType == query.WarehouseType);
        }

        if (query.IsActive.HasValue)
        {
            baseQuery = baseQuery.Where(w => w.IsActive == query.IsActive.Value);
        }

        var projected = baseQuery
            .OrderByDescending(w => w.CreatedAt)
            .Select(w => new WarehouseDto
            {
                WarehouseId = w.WarehouseId,
                WarehouseName = w.WarehouseName,
                WarehouseType = w.WarehouseType,
                OwnerSellerId = w.OwnerSellerId,
                OwnerSellerName = w.OwnerSeller != null ? w.OwnerSeller.BusinessName : null,
                Address = w.Address,
                IsActive = w.IsActive,
                LocationCount = w.Locations.Count,
                CreatedAt = w.CreatedAt,
                UpdatedAt = w.UpdatedAt
            });

        return await projected.ToPagedResultAsync(query, cancellationToken);
    }

    public async Task<Warehouse?> GetByIdAsync(long warehouseId, CancellationToken cancellationToken = default)
        => await _context.Warehouses
            .Include(w => w.OwnerSeller)
            .Include(w => w.Locations)
            .FirstOrDefaultAsync(w => w.WarehouseId == warehouseId, cancellationToken);

    public async Task<bool> SellerExistsAsync(long sellerId, CancellationToken cancellationToken = default)
        => await _context.Sellers.AsNoTracking().AnyAsync(s => s.SellerId == sellerId, cancellationToken);

    public async Task AddWarehouseAsync(Warehouse warehouse, CancellationToken cancellationToken = default)
        => await _context.Warehouses.AddAsync(warehouse, cancellationToken);

    public async Task<List<WarehouseLocationDto>> GetLocationsAsync(
        long warehouseId,
        CancellationToken cancellationToken = default)
        => await _context.WarehouseLocations
            .AsNoTracking()
            .Where(l => l.WarehouseId == warehouseId)
            .OrderBy(l => l.LocationCode)
            .Select(l => new WarehouseLocationDto
            {
                LocationId = l.LocationId,
                WarehouseId = l.WarehouseId,
                LocationCode = l.LocationCode,
                StorageType = l.StorageType,
                IsSellable = l.IsSellable,
                IsActive = l.IsActive
            })
            .ToListAsync(cancellationToken);

    public async Task<WarehouseLocation?> GetLocationByIdAsync(long locationId, CancellationToken cancellationToken = default)
        => await _context.WarehouseLocations
            .AsNoTracking()
            .FirstOrDefaultAsync(l => l.LocationId == locationId, cancellationToken);

    public async Task<bool> LocationCodeExistsAsync(
        long warehouseId,
        string locationCode,
        CancellationToken cancellationToken = default)
        => await _context.WarehouseLocations
            .AsNoTracking()
            .AnyAsync(l => l.WarehouseId == warehouseId && l.LocationCode == locationCode, cancellationToken);

    public async Task AddLocationAsync(WarehouseLocation location, CancellationToken cancellationToken = default)
        => await _context.WarehouseLocations.AddAsync(location, cancellationToken);
}
