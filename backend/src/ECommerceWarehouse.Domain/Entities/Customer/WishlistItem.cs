using ECommerceWarehouse.Domain.Entities.Catalog;

namespace ECommerceWarehouse.Domain.Entities.Customer;

public class WishlistItem
{
    public long WishlistItemId { get; set; }
    public long WishlistId { get; set; }
    public long ProductId { get; set; }
    public DateTime AddedAt { get; set; } = DateTime.UtcNow;

    public Wishlist Wishlist { get; set; } = null!;
    public Product Product { get; set; } = null!;
}