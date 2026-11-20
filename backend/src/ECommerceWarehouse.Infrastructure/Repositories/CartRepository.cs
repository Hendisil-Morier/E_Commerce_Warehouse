using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Domain.Entities.Catalog;
using ECommerceWarehouse.Domain.Entities.Customer;
using ECommerceWarehouse.Domain.Exceptions;
using ECommerceWarehouse.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using MySqlConnector;

namespace ECommerceWarehouse.Infrastructure.Repositories;

public class CartRepository : ICartRepository
{
    private const int MySqlDuplicateEntryErrorNumber = 1062;
    private const string CartUserUniqueConstraint = "UQ_Carts_User";
    private const string CartItemVariantUniqueConstraint = "UQ_CartItems_Cart_Variant";

    private readonly ApplicationDbContext _context;

    public CartRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Cart?> GetByUserIdWithDetailsAsNoTrackingAsync(
        long userId,
        CancellationToken cancellationToken = default)
    {
        var cart = await _context.Carts
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.UserId == userId, cancellationToken);

        if (cart == null)
        {
            return null;
        }

        var items = await _context.CartItems
            .AsNoTracking()
            .Where(ci => ci.CartId == cart.CartId)
            .Include(ci => ci.Variant)
                .ThenInclude(v => v.Product)
                    .ThenInclude(p => p.Shop)
                        .ThenInclude(s => s.Seller)
            .Include(ci => ci.Variant)
                .ThenInclude(v => v.Product)
                    .ThenInclude(p => p.Category)
            .ToListAsync(cancellationToken);

        if (items.Count > 0)
        {
            var productIds = items
                .Select(ci => ci.Variant.ProductId)
                .Distinct()
                .ToList();

            // Tách truy vấn ảnh sản phẩm thành 1 batch query để tránh Cartesian explosion và N+1.
            var images = await _context.ProductImages
                .AsNoTracking()
                .Where(img => productIds.Contains(img.ProductId))
                .ToListAsync(cancellationToken);

            var imagesByProduct = images.ToLookup(img => img.ProductId);

            foreach (var item in items)
            {
                var product = item.Variant.Product;
                if (product.Images.Count == 0)
                {
                    foreach (var image in imagesByProduct[product.ProductId])
                    {
                        product.Images.Add(image);
                    }
                }

                cart.Items.Add(item);
            }
        }

        return cart;
    }

    public async Task<Cart?> GetByUserIdWithItemsAsync(
        long userId,
        CancellationToken cancellationToken = default)
        => await _context.Carts
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.UserId == userId, cancellationToken);

    public async Task<CartItem?> GetItemByIdForUserWithCatalogAsync(
        long cartItemId,
        long userId,
        CancellationToken cancellationToken = default)
        => await _context.CartItems
            .Include(ci => ci.Cart)
            .Include(ci => ci.Variant)
                .ThenInclude(v => v.Product)
                    .ThenInclude(p => p.Shop)
                        .ThenInclude(s => s.Seller)
            .Include(ci => ci.Variant)
                .ThenInclude(v => v.Product)
                    .ThenInclude(p => p.Category)
            .FirstOrDefaultAsync(
                ci => ci.CartItemId == cartItemId && ci.Cart.UserId == userId,
                cancellationToken);

    public async Task<CartItem?> GetItemByIdForUserAsync(
        long cartItemId,
        long userId,
        CancellationToken cancellationToken = default)
        => await _context.CartItems
            .Include(ci => ci.Cart)
            .FirstOrDefaultAsync(
                ci => ci.CartItemId == cartItemId && ci.Cart.UserId == userId,
                cancellationToken);

    public async Task<ProductVariant?> GetVariantWithCatalogAsNoTrackingAsync(
        long variantId,
        CancellationToken cancellationToken = default)
        => await _context.ProductVariants
            .AsNoTracking()
            .Include(v => v.Product)
                .ThenInclude(p => p.Shop)
                    .ThenInclude(s => s.Seller)
            .Include(v => v.Product)
                .ThenInclude(p => p.Category)
            .FirstOrDefaultAsync(v => v.VariantId == variantId, cancellationToken);

    public async Task AddCartAsync(Cart cart, CancellationToken cancellationToken = default)
        => await _context.Carts.AddAsync(cart, cancellationToken);

    public async Task AddCartItemAsync(CartItem item, CancellationToken cancellationToken = default)
        => await _context.CartItems.AddAsync(item, cancellationToken);

    public void RemoveCartItem(CartItem item)
        => _context.CartItems.Remove(item);

    public async Task SaveChangesHandlingConcurrencyAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex) when (IsCartUniqueConstraintViolation(ex))
        {
            throw BusinessException.ConcurrencyConflict(
                "Giỏ hàng vừa được cập nhật bởi một thao tác khác, vui lòng thử lại.");
        }
    }

    internal static bool IsCartUniqueConstraintViolation(Exception? exception)
    {
        var current = exception;
        while (current != null)
        {
            if (current is MySqlException mySqlEx && mySqlEx.Number == MySqlDuplicateEntryErrorNumber)
            {
                return mySqlEx.Message.Contains(CartUserUniqueConstraint, StringComparison.OrdinalIgnoreCase) ||
                       mySqlEx.Message.Contains(CartItemVariantUniqueConstraint, StringComparison.OrdinalIgnoreCase);
            }

            current = current.InnerException;
        }

        return false;
    }
}
