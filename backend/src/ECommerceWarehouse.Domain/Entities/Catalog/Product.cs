namespace ECommerceWarehouse.Domain.Entities;

public class Product
{
    public int ProductId { get; set; }

    public int SellerId { get; set; }

    public int ShopId { get; set; }

    public int CategoryId { get; set; }

    public string ProductName { get; set; } = string.Empty;

    public string? Description { get; set; }

    public string Status { get; set; } = "Draft";

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    // Navigation Properties
    public Seller Seller { get; set; } = null!;

    public Shop Shop { get; set; } = null!;

    public Category Category { get; set; } = null!;

    public ICollection<ProductVariant> ProductVariants { get; set; }
        = new List<ProductVariant>();

    public ICollection<ProductImage> ProductImages { get; set; }
        = new List<ProductImage>();
}