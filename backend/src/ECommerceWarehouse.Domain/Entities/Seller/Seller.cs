using ECommerceWarehouse.Domain.Entities.Identity;

namespace ECommerceWarehouse.Domain.Entities.Seller;

public class Seller
{
    public long SellerId { get; set; }
    public long UserId { get; set; }
    public string BusinessName { get; set; } = null!;
    public string? TaxCode { get; set; }
    public string? Description { get; set; }
    public decimal CommissionRate { get; set; } = 5.00m;
    public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected, Suspended
    public DateTime? ApprovedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public User User { get; set; } = null!;
    public ICollection<Shop> Shops { get; set; } = new List<Shop>();
}