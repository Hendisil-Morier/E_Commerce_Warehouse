namespace ECommerceWarehouse.Domain.Entities;

public class Seller
{
    public int SellerId { get; set; }

    public int UserId { get; set; }

    public string SellerCode { get; set; } = string.Empty;

    public string BusinessName { get; set; } = string.Empty;

    public string? TaxCode { get; set; }

    public string? BusinessAddress { get; set; }

    public string Status { get; set; } = "Pending";

    public DateTime CreatedAt { get; set; }

    // Navigation Properties
    public User User { get; set; } = null!;

    public ICollection<Shop> Shops { get; set; }
        = new List<Shop>();
}