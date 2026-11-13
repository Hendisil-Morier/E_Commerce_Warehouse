using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Domain.Entities.Seller;
using ECommerceWarehouse.Domain.Enums;
using ECommerceWarehouse.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ECommerceWarehouse.Infrastructure.Repositories;

public class ShopRepository : IShopRepository
{
    private readonly ApplicationDbContext _context;

    public ShopRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<Shop>> GetBySellerIdAsNoTrackingAsync(
        long sellerId,
        bool? isActive = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Shops
            .AsNoTracking()
            .Where(s => s.SellerId == sellerId);

        if (isActive.HasValue)
        {
            query = query.Where(s => s.IsActive == isActive.Value);
        }

        return await query
            .OrderByDescending(s => s.CreatedAt)
            .ThenByDescending(s => s.ShopId)
            .ToListAsync(cancellationToken);
    }

    public async Task<Shop?> GetByIdAndSellerIdAsync(
        long shopId,
        long sellerId,
        CancellationToken cancellationToken = default)
        => await _context.Shops
            .FirstOrDefaultAsync(s => s.ShopId == shopId && s.SellerId == sellerId, cancellationToken);

    public async Task<Shop?> GetPublicActiveByIdWithSellerAsNoTrackingAsync(
        long shopId,
        CancellationToken cancellationToken = default)
        => await _context.Shops
            .AsNoTracking()
            .Include(s => s.Seller)
            .FirstOrDefaultAsync(
                s => s.ShopId == shopId && s.IsActive && s.Seller.Status == SellerStatus.Approved,
                cancellationToken);

    public async Task<int> CountActiveProductsByShopIdAsync(
        long shopId,
        CancellationToken cancellationToken = default)
        => await _context.Products
            .AsNoTracking()
            .CountAsync(p => p.ShopId == shopId && p.ProductStatus == ProductStatus.Active, cancellationToken);

    public async Task<bool> ExistsShopNameForSellerAsync(
        long sellerId,
        string shopName,
        long? excludeShopId = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Shops
            .AsNoTracking()
            .Where(s => s.SellerId == sellerId && s.ShopName == shopName);

        if (excludeShopId.HasValue)
        {
            query = query.Where(s => s.ShopId != excludeShopId.Value);
        }

        return await query.AnyAsync(cancellationToken);
    }

    public async Task AddAsync(Shop shop, CancellationToken cancellationToken = default)
        => await _context.Shops.AddAsync(shop, cancellationToken);

    public void Update(Shop shop)
        => _context.Shops.Update(shop);
}

