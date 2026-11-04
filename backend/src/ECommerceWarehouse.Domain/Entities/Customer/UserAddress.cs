using ECommerceWarehouse.Domain.Entities.Identity;

namespace ECommerceWarehouse.Domain.Entities.Customer;

public class UserAddress
{
    public long AddressId { get; set; }
    public long UserId { get; set; }
    public string RecipientName { get; set; } = null!;
    public string PhoneNumber { get; set; } = null!;
    public string Province { get; set; } = null!;
    public string District { get; set; } = null!;
    public string Ward { get; set; } = null!;
    public string StreetAddress { get; set; } = null!;
    public bool IsDefault { get; set; } = false;
    public sbyte? DefaultFlag { get; private set; } // Cột GENERATED ALWAYS AS (IF(IsDefault, 1, NULL)) STORED
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public User User { get; set; } = null!;
}