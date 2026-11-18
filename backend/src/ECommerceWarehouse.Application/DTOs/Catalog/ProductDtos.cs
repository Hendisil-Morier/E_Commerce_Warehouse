using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Domain.Enums;

namespace ECommerceWarehouse.Application.DTOs.Catalog;

public class ProductImageDto
{
    public long ImageId { get; init; }
    public string ImageUrl { get; init; } = null!;
    public bool IsPrimary { get; init; }
    public int DisplayOrder { get; init; }
}

public class ProductImageInputDto
{
    public string ImageUrl { get; set; } = string.Empty;
    public bool IsPrimary { get; set; }
    public int DisplayOrder { get; set; }
}

public class ProductVariantDto
{
    public long VariantId { get; init; }
    public long ProductId { get; init; }
    public string SKU { get; init; } = null!;
    public string? Barcode { get; init; }
    public string VariantName { get; init; } = null!;
    public decimal Price { get; init; }
    public int? WeightGrams { get; init; }
    public bool IsActive { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
}

public class UpsertVariantRequestDto
{
    public string SKU { get; set; } = string.Empty;
    public string? Barcode { get; set; }
    public string VariantName { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int? WeightGrams { get; set; }
    public bool IsActive { get; set; } = true;
}

public class SellerProductQueryDto : PaginationQuery
{
    public ProductStatus? Status { get; set; }
    public long? ShopId { get; set; }
    public string? Q { get; set; }
}

public class SellerProductListItemDto
{
    public long ProductId { get; init; }
    public long ShopId { get; init; }
    public string ShopName { get; init; } = null!;
    public long CategoryId { get; init; }
    public string CategoryName { get; init; } = null!;
    public string ProductName { get; init; } = null!;
    public string ProductStatus { get; init; } = null!;
    public string? RejectReason { get; init; }
    public string? ThumbnailUrl { get; init; }
    public int VariantCount { get; init; }
    public decimal? MinPrice { get; init; }
    public decimal? MaxPrice { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
}

public class SellerProductDetailDto
{
    public long ProductId { get; init; }
    public long ShopId { get; init; }
    public string ShopName { get; init; } = null!;
    public long CategoryId { get; init; }
    public string CategoryName { get; init; } = null!;
    public string ProductName { get; init; } = null!;
    public string? Description { get; init; }
    public string ProductStatus { get; init; } = null!;
    public string? RejectReason { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
    public IReadOnlyList<ProductImageDto> Images { get; init; } = Array.Empty<ProductImageDto>();
    public IReadOnlyList<ProductVariantDto> Variants { get; init; } = Array.Empty<ProductVariantDto>();
}

public interface IProductUpsertRequest
{
    long ShopId { get; }
    long CategoryId { get; }
    string ProductName { get; }
    string? Description { get; }
    List<ProductImageInputDto>? Images { get; }
}

public class CreateProductRequestDto : IProductUpsertRequest
{
    public long ShopId { get; set; }
    public long CategoryId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public List<ProductImageInputDto>? Images { get; set; }
    public List<UpsertVariantRequestDto>? Variants { get; set; }
}

public class UpdateProductRequestDto : IProductUpsertRequest
{
    public long ShopId { get; set; }
    public long CategoryId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public List<ProductImageInputDto>? Images { get; set; }
}

public class AdminProductQueryDto : PaginationQuery
{
    public ProductStatus? Status { get; set; }
    public long? ShopId { get; set; }
    public long? CategoryId { get; set; }
    public string? Q { get; set; }
}

public class AdminProductShopDto
{
    public long ShopId { get; init; }
    public long SellerId { get; init; }
    public string ShopName { get; init; } = null!;
    public string SellerBusinessName { get; init; } = null!;
    public string? LogoUrl { get; init; }
    public bool IsActive { get; init; }
}

public class AdminProductListItemDto
{
    public long ProductId { get; init; }
    public string ProductName { get; init; } = null!;
    public long ShopId { get; init; }
    public string ShopName { get; init; } = null!;
    public long SellerId { get; init; }
    public string SellerBusinessName { get; init; } = null!;
    public long CategoryId { get; init; }
    public string CategoryName { get; init; } = null!;
    public string ProductStatus { get; init; } = null!;
    public string? RejectReason { get; init; }
    public string? ThumbnailUrl { get; init; }
    public int VariantCount { get; init; }
    public decimal? MinPrice { get; init; }
    public decimal? MaxPrice { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
}

public class AdminProductDetailDto
{
    public long ProductId { get; init; }
    public string ProductName { get; init; } = null!;
    public string? Description { get; init; }
    public string ProductStatus { get; init; } = null!;
    public string? RejectReason { get; init; }
    public long CategoryId { get; init; }
    public string CategoryName { get; init; } = null!;
    public AdminProductShopDto Shop { get; init; } = null!;
    public IReadOnlyList<ProductImageDto> Images { get; init; } = Array.Empty<ProductImageDto>();
    public IReadOnlyList<ProductVariantDto> Variants { get; init; } = Array.Empty<ProductVariantDto>();
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
}

public class RejectProductRequestDto
{
    public string Reason { get; set; } = string.Empty;
}

public class PublicProductQueryDto : PaginationQuery
{
    public long? CategoryId { get; set; }
    public long? ShopId { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public bool? InStockOnly { get; set; }
    public string? Q { get; set; }
}

public class PublicProductListItemDto
{
    public long ProductId { get; init; }
    public long ShopId { get; init; }
    public string ShopName { get; init; } = null!;
    public long CategoryId { get; init; }
    public string CategoryName { get; init; } = null!;
    public string ProductName { get; init; } = null!;
    public string? ThumbnailUrl { get; init; }
    public decimal MinPrice { get; init; }
    public decimal MaxPrice { get; init; }
    public int AvailableQuantity { get; init; }
    public bool InStock { get; init; }
    public DateTime CreatedAt { get; init; }
}

public class PublicProductShopDto
{
    public long ShopId { get; init; }
    public long SellerId { get; init; }
    public string ShopName { get; init; } = null!;
    public string? Description { get; init; }
    public string? LogoUrl { get; init; }
    public string SellerBusinessName { get; init; } = null!;
}

public class PublicProductVariantDto
{
    public long VariantId { get; init; }
    public long ProductId { get; init; }
    public string SKU { get; init; } = null!;
    public string? Barcode { get; init; }
    public string VariantName { get; init; } = null!;
    public decimal Price { get; init; }
    public int? WeightGrams { get; init; }
    public int AvailableQuantity { get; init; }
    public bool InStock { get; init; }
}

public class PublicProductDetailDto
{
    public long ProductId { get; init; }
    public string ProductName { get; init; } = null!;
    public string? Description { get; init; }
    public long CategoryId { get; init; }
    public string CategoryName { get; init; } = null!;
    public decimal MinPrice { get; init; }
    public decimal MaxPrice { get; init; }
    public int AvailableQuantity { get; init; }
    public bool InStock { get; init; }
    public PublicProductShopDto Shop { get; init; } = null!;
    public IReadOnlyList<ProductImageDto> Images { get; init; } = Array.Empty<ProductImageDto>();
    public IReadOnlyList<PublicProductVariantDto> Variants { get; init; } = Array.Empty<PublicProductVariantDto>();
    public DateTime CreatedAt { get; init; }
}

