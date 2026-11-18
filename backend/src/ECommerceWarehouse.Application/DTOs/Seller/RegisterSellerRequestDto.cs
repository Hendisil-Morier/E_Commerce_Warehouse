namespace ECommerceWarehouse.Application.DTOs.Seller;

public class RegisterSellerRequestDto
{
    public string BusinessName { get; set; } = null!;
    public string? TaxCode { get; set; }
    public string? Description { get; set; }
}

