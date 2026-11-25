using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.DTOs.Customer;
using ECommerceWarehouse.Domain.Entities.Customer;
using ECommerceWarehouse.Domain.Enums;
using ECommerceWarehouse.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ECommerceWarehouse.Infrastructure.Repositories;

public class WishlistRepository : IWishlistRepository
{
    private readonly ApplicationDbContext _context;

    public WishlistRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<WishlistDto?> GetWishlistDtoAsync(long userId, CancellationToken cancellationToken = default)
        => await _context.Wishlists
            .AsNoTracking()
            .Where(w => w.UserId == userId)
            .OrderBy(w => w.WishlistId)
            .Select(w => new WishlistDto
            {
                WishlistId = w.WishlistId,
                WishlistName = w.WishlistName,
                Items = w.Items
                    .OrderByDescending(i => i.AddedAt)
                    .Select(i => new WishlistItemDto
                    {
                        WishlistItemId = i.WishlistItemId,
                        ProductId = i.ProductId,
                        ProductName = i.Product.ProductName,
                        MinPrice = i.Product.Variants
                            .Where(v => v.IsActive)
                            .Select(v => (decimal?)v.Price)
                            .Min(),
                        ThumbnailUrl = i.Product.Images
                            .OrderByDescending(img => img.IsPrimary)
                            .ThenBy(img => img.DisplayOrder)
                            .Select(img => img.ImageUrl)
                            .FirstOrDefault(),
                        AddedAt = i.AddedAt
                    })
                    .ToList()
            })
            .FirstOrDefaultAsync(cancellationToken);

    public async Task<Wishlist?> GetByUserIdWithItemsAsync(long userId, CancellationToken cancellationToken = default)
        => await _context.Wishlists
            .Include(w => w.Items)
            .OrderBy(w => w.WishlistId)
            .FirstOrDefaultAsync(w => w.UserId == userId, cancellationToken);

    public Task<bool> ActiveProductExistsAsync(long productId, CancellationToken cancellationToken = default)
        => _context.Products.AnyAsync(p => p.ProductId == productId && p.ProductStatus == ProductStatus.Active, cancellationToken);

    public async Task AddWishlistAsync(Wishlist wishlist, CancellationToken cancellationToken = default)
        => await _context.Wishlists.AddAsync(wishlist, cancellationToken);

    public void RemoveItem(WishlistItem item)
        => _context.WishlistItems.Remove(item);
}
