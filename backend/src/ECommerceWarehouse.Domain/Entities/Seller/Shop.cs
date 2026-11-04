namespace ECommerceWarehouse.Domain.Entities.Seller;

public class Shop
{
    public long ShopId { get; set; }
    public long SellerId { get; set; }
    public string ShopName { get; set; } = null!;
    public string? Description { get; set; }
    public string? LogoUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Seller Seller { get; set; } = null!;
}