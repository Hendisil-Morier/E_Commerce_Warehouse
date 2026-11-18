namespace ECommerceWarehouse.Application.DTOs.Catalog;

public class ShopDto
{
    public long ShopId { get; init; }
    public long SellerId { get; init; }
    public string ShopName { get; init; } = null!;
    public string? Description { get; init; }
    public string? LogoUrl { get; init; }
    public bool IsActive { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
}

public class PublicShopDto
{
    public long ShopId { get; init; }
    public long SellerId { get; init; }
    public string ShopName { get; init; } = null!;
    public string? Description { get; init; }
    public string? LogoUrl { get; init; }
    public string SellerBusinessName { get; init; } = null!;
    public int ActiveProductCount { get; init; }
    public DateTime CreatedAt { get; init; }
}

public class CreateShopRequestDto
{
    public string ShopName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? LogoUrl { get; set; }
}

public class UpdateShopRequestDto
{
    public string ShopName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? LogoUrl { get; set; }
    public bool IsActive { get; set; } = true;
}

