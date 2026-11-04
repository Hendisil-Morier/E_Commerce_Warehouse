using ECommerceWarehouse.Domain.Entities.Identity;
using ECommerceWarehouse.Domain.Entities.Order;

namespace ECommerceWarehouse.Domain.Entities.Review;

public class Review
{
    public long ReviewId { get; set; }
    public long CustomerId { get; set; }
    public long OrderItemId { get; set; }
    public sbyte Rating { get; set; } // TINYINT (1 -> 5)
    public string? Comment { get; set; }
    public bool IsVisible { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User Customer { get; set; } = null!;
    public OrderItem OrderItem { get; set; } = null!;
}