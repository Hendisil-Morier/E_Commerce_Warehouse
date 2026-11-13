using ECommerceWarehouse.Application.DTOs.Catalog;
using ECommerceWarehouse.Domain.Entities.Catalog;
using ECommerceWarehouse.Domain.Entities.Seller;

namespace ECommerceWarehouse.Application.Mappings;

public static class CatalogMapping
{
    public static ShopDto ToDto(this Shop shop) => new()
    {
        ShopId = shop.ShopId,
        SellerId = shop.SellerId,
        ShopName = shop.ShopName,
        Description = shop.Description,
        LogoUrl = shop.LogoUrl,
        IsActive = shop.IsActive,
        CreatedAt = shop.CreatedAt,
        UpdatedAt = shop.UpdatedAt
    };

    public static PublicShopDto ToPublicDto(this Shop shop, int activeProductCount) => new()
    {
        ShopId = shop.ShopId,
        SellerId = shop.SellerId,
        ShopName = shop.ShopName,
        Description = shop.Description,
        LogoUrl = shop.LogoUrl,
        SellerBusinessName = shop.Seller.BusinessName,
        ActiveProductCount = activeProductCount,
        CreatedAt = shop.CreatedAt
    };

    public static CategoryTreeDto ToTreeDto(this Category category, IReadOnlyList<CategoryTreeDto> children) => new()
    {
        CategoryId = category.CategoryId,
        ParentCategoryId = category.ParentCategoryId,
        CategoryName = category.CategoryName,
        Description = category.Description,
        IsActive = category.IsActive,
        Children = children
    };

    public static ProductImageDto ToDto(this ProductImage image) => new()
    {
        ImageId = image.ImageId,
        ImageUrl = image.ImageUrl,
        IsPrimary = image.IsPrimary,
        DisplayOrder = image.DisplayOrder
    };

    public static ProductVariantDto ToDto(this ProductVariant variant) => new()
    {
        VariantId = variant.VariantId,
        ProductId = variant.ProductId,
        SKU = variant.SKU,
        Barcode = variant.Barcode,
        VariantName = variant.VariantName,
        Price = variant.Price,
        WeightGrams = variant.WeightGrams,
        IsActive = variant.IsActive,
        CreatedAt = variant.CreatedAt,
        UpdatedAt = variant.UpdatedAt
    };

    public static SellerProductListItemDto ToSellerListItemDto(this Product product)
    {
        var (thumbnailUrl, variantCount, minPrice, maxPrice) = ExtractProductSummaryMetrics(product);

        return new SellerProductListItemDto
        {
            ProductId = product.ProductId,
            ShopId = product.ShopId,
            ShopName = product.Shop.ShopName,
            CategoryId = product.CategoryId,
            CategoryName = product.Category.CategoryName,
            ProductName = product.ProductName,
            ProductStatus = product.ProductStatus.ToString(),
            RejectReason = product.RejectReason,
            ThumbnailUrl = thumbnailUrl,
            VariantCount = variantCount,
            MinPrice = minPrice,
            MaxPrice = maxPrice,
            CreatedAt = product.CreatedAt,
            UpdatedAt = product.UpdatedAt
        };
    }

    public static SellerProductDetailDto ToSellerDetailDto(this Product product) => new()
    {
        ProductId = product.ProductId,
        ShopId = product.ShopId,
        ShopName = product.Shop.ShopName,
        CategoryId = product.CategoryId,
        CategoryName = product.Category.CategoryName,
        ProductName = product.ProductName,
        Description = product.Description,
        ProductStatus = product.ProductStatus.ToString(),
        RejectReason = product.RejectReason,
        CreatedAt = product.CreatedAt,
        UpdatedAt = product.UpdatedAt,
        Images = OrderImages(product.Images),
        Variants = product.Variants
            .OrderBy(v => v.VariantId)
            .Select(v => v.ToDto())
            .ToList()
    };

    public static AdminProductListItemDto ToAdminListItemDto(this Product product)
    {
        var (thumbnailUrl, variantCount, minPrice, maxPrice) = ExtractProductSummaryMetrics(product);

        return new AdminProductListItemDto
        {
            ProductId = product.ProductId,
            ProductName = product.ProductName,
            ShopId = product.ShopId,
            ShopName = product.Shop.ShopName,
            SellerId = product.Shop.SellerId,
            SellerBusinessName = product.Shop.Seller.BusinessName,
            CategoryId = product.CategoryId,
            CategoryName = product.Category.CategoryName,
            ProductStatus = product.ProductStatus.ToString(),
            RejectReason = product.RejectReason,
            ThumbnailUrl = thumbnailUrl,
            VariantCount = variantCount,
            MinPrice = minPrice,
            MaxPrice = maxPrice,
            CreatedAt = product.CreatedAt,
            UpdatedAt = product.UpdatedAt
        };
    }

    public static AdminProductDetailDto ToAdminDetailDto(this Product product) => new()
    {
        ProductId = product.ProductId,
        ProductName = product.ProductName,
        Description = product.Description,
        ProductStatus = product.ProductStatus.ToString(),
        RejectReason = product.RejectReason,
        CategoryId = product.CategoryId,
        CategoryName = product.Category.CategoryName,
        Shop = new AdminProductShopDto
        {
            ShopId = product.Shop.ShopId,
            SellerId = product.Shop.SellerId,
            ShopName = product.Shop.ShopName,
            SellerBusinessName = product.Shop.Seller.BusinessName,
            LogoUrl = product.Shop.LogoUrl,
            IsActive = product.Shop.IsActive
        },
        Images = OrderImages(product.Images),
        Variants = product.Variants
            .OrderBy(v => v.VariantId)
            .Select(v => v.ToDto())
            .ToList(),
        CreatedAt = product.CreatedAt,
        UpdatedAt = product.UpdatedAt
    };

    public static PublicProductVariantDto ToPublicDto(this ProductVariant variant, int availableQuantity)
    {
        var normalizedAvailable = Math.Max(0, availableQuantity);
        return new PublicProductVariantDto
        {
            VariantId = variant.VariantId,
            ProductId = variant.ProductId,
            SKU = variant.SKU,
            Barcode = variant.Barcode,
            VariantName = variant.VariantName,
            Price = variant.Price,
            WeightGrams = variant.WeightGrams,
            AvailableQuantity = normalizedAvailable,
            InStock = normalizedAvailable > 0
        };
    }

    public static PublicProductListItemDto ToPublicListItemDto(
        this Product product,
        IReadOnlyDictionary<long, int> availabilityByVariantId)
    {
        var activeVariants = product.Variants.Where(v => v.IsActive).ToList();
        var availableQuantity = activeVariants.Sum(v => GetVariantAvailableQuantity(v.VariantId, availabilityByVariantId));

        return new PublicProductListItemDto
        {
            ProductId = product.ProductId,
            ShopId = product.ShopId,
            ShopName = product.Shop.ShopName,
            CategoryId = product.CategoryId,
            CategoryName = product.Category.CategoryName,
            ProductName = product.ProductName,
            ThumbnailUrl = GetThumbnailUrl(product.Images),
            MinPrice = activeVariants.Count > 0 ? activeVariants.Min(v => v.Price) : 0m,
            MaxPrice = activeVariants.Count > 0 ? activeVariants.Max(v => v.Price) : 0m,
            AvailableQuantity = availableQuantity,
            InStock = availableQuantity > 0,
            CreatedAt = product.CreatedAt
        };
    }

    public static PublicProductDetailDto ToPublicDetailDto(
        this Product product,
        IReadOnlyDictionary<long, int> availabilityByVariantId)
    {
        var variantDtos = product.Variants
            .Where(v => v.IsActive)
            .OrderBy(v => v.VariantId)
            .Select(v => v.ToPublicDto(GetVariantAvailableQuantity(v.VariantId, availabilityByVariantId)))
            .ToList();

        var availableQuantity = variantDtos.Sum(v => v.AvailableQuantity);

        return new PublicProductDetailDto
        {
            ProductId = product.ProductId,
            ProductName = product.ProductName,
            Description = product.Description,
            CategoryId = product.CategoryId,
            CategoryName = product.Category.CategoryName,
            MinPrice = variantDtos.Count > 0 ? variantDtos.Min(v => v.Price) : 0m,
            MaxPrice = variantDtos.Count > 0 ? variantDtos.Max(v => v.Price) : 0m,
            AvailableQuantity = availableQuantity,
            InStock = variantDtos.Any(v => v.InStock),
            Shop = new PublicProductShopDto
            {
                ShopId = product.Shop.ShopId,
                SellerId = product.Shop.SellerId,
                ShopName = product.Shop.ShopName,
                Description = product.Shop.Description,
                LogoUrl = product.Shop.LogoUrl,
                SellerBusinessName = product.Shop.Seller.BusinessName
            },
            Images = OrderImages(product.Images),
            Variants = variantDtos,
            CreatedAt = product.CreatedAt
        };
    }

    private static IReadOnlyList<ProductImageDto> OrderImages(IEnumerable<ProductImage> images) =>
        images
            .OrderBy(i => i.DisplayOrder)
            .ThenBy(i => i.ImageId)
            .Select(i => i.ToDto())
            .ToList();

    private static string? GetThumbnailUrl(IEnumerable<ProductImage> images) =>
        images
            .OrderByDescending(i => i.IsPrimary)
            .ThenBy(i => i.DisplayOrder)
            .ThenBy(i => i.ImageId)
            .Select(i => i.ImageUrl)
            .FirstOrDefault();

    private static int GetVariantAvailableQuantity(
        long variantId,
        IReadOnlyDictionary<long, int> availabilityByVariantId)
        => availabilityByVariantId.TryGetValue(variantId, out var qty) && qty > 0 ? qty : 0;

    private static (string? ThumbnailUrl, int VariantCount, decimal? MinPrice, decimal? MaxPrice) ExtractProductSummaryMetrics(Product product)
    {
        var activeVariants = product.Variants.Where(v => v.IsActive).ToList();
        var priceSource = activeVariants.Count > 0 ? activeVariants : product.Variants.ToList();

        return (
            GetThumbnailUrl(product.Images),
            product.Variants.Count,
            priceSource.Count > 0 ? priceSource.Min(v => v.Price) : null,
            priceSource.Count > 0 ? priceSource.Max(v => v.Price) : null
        );
    }
}

