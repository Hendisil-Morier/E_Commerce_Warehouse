namespace ECommerceWarehouse.Application.DTOs.Identity;

public class RegisterRequestDto
{
    public string? Username { get; set; }
    public string FullName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Password { get; set; } = null!;
    public string? PhoneNumber { get; set; }
    public string? AccountType { get; set; } // "customer" or "seller"
    public string? ShopName { get; set; }
}
