namespace ECommerceWarehouse.Domain.Entities.Catalog;

public class ProductVariant
{
    public long VariantId { get; set; }
    public long ProductId { get; set; }
    public string SKU { get; set; } = null!;
    public string? Barcode { get; set; }
    public string VariantName { get; set; } = null!;
    public decimal Price { get; set; }
    public int? WeightGrams { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation Properties
    public Product Product { get; set; } = null!;
}