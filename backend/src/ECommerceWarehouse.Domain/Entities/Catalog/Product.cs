using ECommerceWarehouse.Domain.Entities.Seller;

namespace ECommerceWarehouse.Domain.Entities.Catalog;

public class Product
{
    public long ProductId { get; set; }
    public long ShopId { get; set; }
    public long CategoryId { get; set; }
    public string ProductName { get; set; } = null!;
    public string? Description { get; set; }
    public string ProductStatus { get; set; } = "Draft"; // Draft, PendingReview, Active, Inactive, Rejected
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation Properties
    public Shop Shop { get; set; } = null!;
    public Category Category { get; set; } = null!;
    public ICollection<ProductVariant> Variants { get; set; } = new List<ProductVariant>();
    public ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
}