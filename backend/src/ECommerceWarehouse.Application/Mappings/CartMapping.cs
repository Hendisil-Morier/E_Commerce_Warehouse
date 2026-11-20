using ECommerceWarehouse.Application.DTOs.Customer;
using ECommerceWarehouse.Domain.Entities.Catalog;
using ECommerceWarehouse.Domain.Entities.Customer;
using ECommerceWarehouse.Domain.Enums;

namespace ECommerceWarehouse.Application.Mappings;

public static class CartMapping
{
    public static CartDto CreateEmptyCartDto() => new()
    {
        CartId = null,
        TotalItems = 0,
        TotalQuantity = 0,
        UnavailableItemCount = 0,
        HasWarnings = false,
        Subtotal = 0m,
        UpdatedAt = null,
        Shops = Array.Empty<CartShopGroupDto>()
    };

    /// <summary>
    /// Kiểm tra biến thể còn đủ điều kiện kinh doanh hay không (khớp bộ lọc Public Catalog).
    /// </summary>
    public static bool IsVariantSellable(ProductVariant variant) =>
        variant.IsActive &&
        variant.Product.ProductStatus == ProductStatus.Active &&
        variant.Product.Shop.IsActive &&
        variant.Product.Shop.Seller.Status == SellerStatus.Approved &&
        variant.Product.Category.IsActive;

    public static CartDto ToDto(
        this Cart cart,
        IReadOnlyDictionary<long, int> availabilityByVariantId)
    {
        var evaluatedItems = cart.Items
            .Select(item => EvaluateCartItem(item, availabilityByVariantId))
            .ToList();

        var shopGroups = evaluatedItems
            .GroupBy(x => x.ShopId)
            .Select(group =>
            {
                var first = group.First();
                var orderedItems = group
                    .OrderByDescending(x => x.Dto.AddedAt)
                    .ThenByDescending(x => x.Dto.CartItemId)
                    .Select(x => x.Dto)
                    .ToList();

                var shopSubtotal = orderedItems
                    .Where(i => i.IsAvailable)
                    .Sum(i => i.LineTotal);

                return new CartShopGroupDto
                {
                    ShopId = first.ShopId,
                    SellerId = first.SellerId,
                    ShopName = first.ShopName,
                    ShopLogoUrl = first.ShopLogoUrl,
                    SellerBusinessName = first.SellerBusinessName,
                    IsShopActive = first.IsShopActive,
                    ShopSubtotal = shopSubtotal,
                    Items = orderedItems
                };
            })
            .OrderBy(s => s.ShopName, StringComparer.OrdinalIgnoreCase)
            .ThenBy(s => s.ShopId)
            .ToList();

        var totalItems = evaluatedItems.Count;
        var totalQuantity = evaluatedItems.Sum(x => x.Dto.Quantity);
        var unavailableItemCount = evaluatedItems.Count(x => !x.Dto.IsAvailable);
        var subtotal = shopGroups.Sum(s => s.ShopSubtotal);

        return new CartDto
        {
            CartId = cart.CartId,
            TotalItems = totalItems,
            TotalQuantity = totalQuantity,
            UnavailableItemCount = unavailableItemCount,
            HasWarnings = unavailableItemCount > 0,
            Subtotal = subtotal,
            UpdatedAt = cart.UpdatedAt ?? cart.CreatedAt,
            Shops = shopGroups
        };
    }

    private static EvaluatedCartItem EvaluateCartItem(
        CartItem item,
        IReadOnlyDictionary<long, int> availabilityByVariantId)
    {
        var variant = item.Variant;
        var product = variant.Product;
        var shop = product.Shop;
        var seller = shop.Seller;

        var availableQuantity = GetVariantAvailableQuantity(item.VariantId, availabilityByVariantId);
        var isSellable = IsVariantSellable(variant);
        var (isAvailable, availabilityStatus, warningMessage) = EvaluateAvailability(
            variant,
            isSellable,
            item.Quantity,
            availableQuantity);

        var unitPrice = variant.Price;
        var lineTotal = unitPrice * item.Quantity;

        var dto = new CartItemDto
        {
            CartItemId = item.CartItemId,
            VariantId = item.VariantId,
            ProductId = product.ProductId,
            ProductName = product.ProductName,
            VariantName = variant.VariantName,
            SKU = variant.SKU,
            ThumbnailUrl = GetThumbnailUrl(product.Images),
            UnitPrice = unitPrice,
            Quantity = item.Quantity,
            LineTotal = lineTotal,
            AvailableQuantity = availableQuantity,
            IsAvailable = isAvailable,
            AvailabilityStatus = availabilityStatus,
            WarningMessage = warningMessage,
            AddedAt = item.AddedAt
        };

        return new EvaluatedCartItem(
            shop.ShopId,
            shop.SellerId,
            shop.ShopName,
            shop.LogoUrl,
            seller.BusinessName,
            shop.IsActive,
            dto);
    }

    private static (bool IsAvailable, string Status, string? WarningMessage) EvaluateAvailability(
        ProductVariant variant,
        bool isSellable,
        int requestedQuantity,
        int availableQuantity)
    {
        if (!isSellable)
        {
            var message = !variant.IsActive
                ? "Phân loại sản phẩm này hiện không còn bán."
                : "Sản phẩm hiện không còn kinh doanh.";

            return (false, CartAvailabilityStatus.ProductUnavailable, message);
        }

        if (availableQuantity <= 0)
        {
            return (false, CartAvailabilityStatus.OutOfStock, "Sản phẩm hiện đã hết hàng.");
        }

        if (requestedQuantity > availableQuantity)
        {
            return (
                false,
                CartAvailabilityStatus.InsufficientStock,
                $"Sản phẩm chỉ còn {availableQuantity} trong kho khả dụng (giỏ hàng đang có {requestedQuantity}).");
        }

        return (true, CartAvailabilityStatus.Available, null);
    }

    private static int GetVariantAvailableQuantity(
        long variantId,
        IReadOnlyDictionary<long, int> availabilityByVariantId)
        => availabilityByVariantId.TryGetValue(variantId, out var qty) && qty > 0 ? qty : 0;

    private static string? GetThumbnailUrl(IEnumerable<ProductImage> images) =>
        images
            .OrderByDescending(i => i.IsPrimary)
            .ThenBy(i => i.DisplayOrder)
            .ThenBy(i => i.ImageId)
            .Select(i => i.ImageUrl)
            .FirstOrDefault();

    private sealed record EvaluatedCartItem(
        long ShopId,
        long SellerId,
        string ShopName,
        string? ShopLogoUrl,
        string SellerBusinessName,
        bool IsShopActive,
        CartItemDto Dto);
}
