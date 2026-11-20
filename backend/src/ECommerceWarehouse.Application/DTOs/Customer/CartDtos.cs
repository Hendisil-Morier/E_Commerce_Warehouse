namespace ECommerceWarehouse.Application.DTOs.Customer;

/// <summary>
/// Các giá trị trạng thái khả dụng tham khảo của một dòng hàng trong giỏ.
/// </summary>
public static class CartAvailabilityStatus
{
    public const string Available = "Available";
    public const string InsufficientStock = "InsufficientStock";
    public const string OutOfStock = "OutOfStock";
    public const string ProductUnavailable = "ProductUnavailable";
}

public class AddCartItemRequestDto
{
    public long VariantId { get; set; }
    public int Quantity { get; set; }
}

public class UpdateCartItemRequestDto
{
    public int Quantity { get; set; }
}

public class CartItemDto
{
    public long CartItemId { get; init; }
    public long VariantId { get; init; }
    public long ProductId { get; init; }
    public string ProductName { get; init; } = null!;
    public string VariantName { get; init; } = null!;
    public string SKU { get; init; } = null!;
    public string? ThumbnailUrl { get; init; }
    public decimal UnitPrice { get; init; }
    public int Quantity { get; init; }
    public decimal LineTotal { get; init; }
    public int AvailableQuantity { get; init; }
    public bool IsAvailable { get; init; }
    public string AvailabilityStatus { get; init; } = CartAvailabilityStatus.Available;
    public string? WarningMessage { get; init; }
    public DateTime AddedAt { get; init; }
}

public class CartShopGroupDto
{
    public long ShopId { get; init; }
    public long SellerId { get; init; }
    public string ShopName { get; init; } = null!;
    public string? ShopLogoUrl { get; init; }
    public string SellerBusinessName { get; init; } = null!;
    public bool IsShopActive { get; init; }

    /// <summary>
    /// Tổng tiền tạm tính tham khảo của các dòng hàng đang khả dụng thuộc shop này (không phải tổng tiền Checkout).
    /// </summary>
    public decimal ShopSubtotal { get; init; }

    public IReadOnlyList<CartItemDto> Items { get; init; } = Array.Empty<CartItemDto>();
}

public class CartDto
{
    public long? CartId { get; init; }

    /// <summary>
    /// Tổng số dòng CartItem khác nhau hiện có trong giỏ hàng.
    /// </summary>
    public int TotalItems { get; init; }

    /// <summary>
    /// Tổng số lượng sản phẩm (tổng cột Quantity) của toàn bộ các dòng trong giỏ hàng.
    /// </summary>
    public int TotalQuantity { get; init; }

    /// <summary>
    /// Số dòng CartItem đang không khả dụng (ngừng bán, hết hàng hoặc vượt tồn kho khả dụng).
    /// </summary>
    public int UnavailableItemCount { get; init; }

    public bool HasWarnings { get; init; }

    /// <summary>
    /// Tổng tiền tạm tính tham khảo của các dòng hàng hiện khả dụng trong giỏ (chưa gồm phí vận chuyển/giảm giá và không phải tổng tiền Checkout).
    /// </summary>
    public decimal Subtotal { get; init; }

    public DateTime? UpdatedAt { get; init; }
    public IReadOnlyList<CartShopGroupDto> Shops { get; init; } = Array.Empty<CartShopGroupDto>();
}

public sealed record CartItemMutationResult(CartDto Cart, long CartItemId, bool IsCreated);
