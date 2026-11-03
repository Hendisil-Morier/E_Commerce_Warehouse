namespace ECommerceWarehouse.Domain.Entities;

public class Shop
{
    public int ShopId { get; set; }

    public int SellerId { get; set; }

    public string ShopName { get; set; } = string.Empty;

    public string? Description { get; set; }

    public string? LogoUrl { get; set; }

    public string? Address { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    // Navigation Properties
    public Seller Seller { get; set; } = null!;

    public ICollection<Product> Products { get; set; }
        = new List<Product>();
}