using ECommerceWarehouse.Domain.Entities.Identity;

namespace ECommerceWarehouse.Domain.Entities.Customer;

public class Wishlist
{
    public long WishlistId { get; set; }
    public long UserId { get; set; }
    public string WishlistName { get; set; } = "Yêu thích";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public ICollection<WishlistItem> Items { get; set; } = new List<WishlistItem>();
}