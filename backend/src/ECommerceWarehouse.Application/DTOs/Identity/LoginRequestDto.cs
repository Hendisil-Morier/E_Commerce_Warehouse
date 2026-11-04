namespace ECommerceWarehouse.Application.DTOs.Identity;

public class LoginRequestDto
{
    public string Email { get; set; } = null!;
    public string Password { get; set; } = null!;
}
