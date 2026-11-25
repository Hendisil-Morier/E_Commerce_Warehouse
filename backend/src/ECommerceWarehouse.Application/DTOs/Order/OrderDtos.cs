using ECommerceWarehouse.Application.DTOs.Common;

namespace ECommerceWarehouse.Application.DTOs.Order;

public class CheckoutRequestDto
{
    public long AddressId { get; set; }
    public string PaymentMethod { get; set; } = "COD";
    public string? Note { get; set; }
    /// <summary>
    /// Nếu truyền danh sách CartItemIds thì chỉ đặt các dòng đó; nếu null/rỗng thì đặt toàn bộ giỏ hàng.
    /// </summary>
    public List<long>? CartItemIds { get; set; }
}

public class CancelOrderRequestDto
{
    public string Reason { get; set; } = null!;
}

public class OrderQueryDto : PaginationQuery
{
    public string? Status { get; set; }
    public string? Search { get; set; }
}

public class OrderItemDto
{
    public long OrderItemId { get; set; }
    public long VariantId { get; set; }
    public string ProductName { get; set; } = null!;
    public string SKU { get; set; } = null!;
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
    public decimal LineTotal { get; set; }
}

public class OrderSellerOrderDto
{
    public long SellerOrderId { get; set; }
    public long SellerId { get; set; }
    public string SellerBusinessName { get; set; } = null!;
    public long? WarehouseId { get; set; }
    public string? WarehouseName { get; set; }
    public decimal Subtotal { get; set; }
    public string Status { get; set; } = null!;
    public string? CancelReason { get; set; }
    public DateTime? CancelledAt { get; set; }
    public List<OrderItemDto> Items { get; set; } = new();
}

public class OrderStatusHistoryDto
{
    public long HistoryId { get; set; }
    public long? SellerOrderId { get; set; }
    public string? FromStatus { get; set; }
    public string ToStatus { get; set; } = null!;
    public string? Reason { get; set; }
    public long? ChangedBy { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class OrderListItemDto
{
    public long OrderId { get; set; }
    public string OrderCode { get; set; } = null!;
    public decimal Subtotal { get; set; }
    public decimal ShippingFee { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public string OrderStatus { get; set; } = null!;
    public string PaymentMethod { get; set; } = null!;
    public string PaymentStatus { get; set; } = null!;
    public DateTime? ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public int SellerOrderCount { get; set; }
    public int TotalItemCount { get; set; }
}

public class OrderDetailDto
{
    public long OrderId { get; set; }
    public string OrderCode { get; set; } = null!;
    public string? IdempotencyKey { get; set; }
    public string RecipientName { get; set; } = null!;
    public string RecipientPhone { get; set; } = null!;
    public string ShippingProvince { get; set; } = null!;
    public string ShippingDistrict { get; set; } = null!;
    public string ShippingWard { get; set; } = null!;
    public string ShippingStreetAddress { get; set; } = null!;
    public decimal Subtotal { get; set; }
    public decimal ShippingFee { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public string OrderStatus { get; set; } = null!;
    public DateTime? ExpiresAt { get; set; }
    public string? CancelReason { get; set; }
    public DateTime? CancelledAt { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public List<OrderSellerOrderDto> SellerOrders { get; set; } = new();
    public List<PaymentDto> Payments { get; set; } = new();
    public List<OrderStatusHistoryDto> StatusHistories { get; set; } = new();
}
