using ECommerceWarehouse.Domain.Entities.Identity;

namespace ECommerceWarehouse.Domain.Entities.Customer;

public class Cart
{
    public long CartId { get; set; }
    public long UserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public User User { get; set; } = null!;
    public ICollection<CartItem> Items { get; set; } = new List<CartItem>();
}