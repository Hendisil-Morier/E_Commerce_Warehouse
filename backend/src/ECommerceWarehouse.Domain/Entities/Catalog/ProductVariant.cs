namespace ECommerceWarehouse.Domain.Entities;

public class ProductVariant
{
    public int VariantId { get; set; }

    public int ProductId { get; set; }

    public string SKU { get; set; } = string.Empty;

    public string? VariantName { get; set; }

    public string? Attributes { get; set; }

    public decimal Price { get; set; }

    public decimal? CompareAtPrice { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    // Navigation Properties
    public Product Product { get; set; } = null!;
}