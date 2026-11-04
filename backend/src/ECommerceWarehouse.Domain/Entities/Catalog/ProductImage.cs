namespace ECommerceWarehouse.Domain.Entities.Catalog;

public class ProductImage
{
    public long ImageId { get; set; }
    public long ProductId { get; set; }
    public string ImageUrl { get; set; } = null!;
    public bool IsPrimary { get; set; } = false;
    public sbyte? PrimaryFlag { get; private set; } // Cột GENERATED ALWAYS AS (IF(IsPrimary, 1, NULL)) STORED
    public int DisplayOrder { get; set; } = 0;

    public Product Product { get; set; } = null!;
}