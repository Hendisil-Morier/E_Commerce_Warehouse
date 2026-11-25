using ECommerceWarehouse.Application.DTOs.Common;

namespace ECommerceWarehouse.Application.DTOs.Order;

public class SellerOrderQueryDto : PaginationQuery
{
    public string? Status { get; set; }
    public string? Search { get; set; }
}

public class CancelSellerOrderRequestDto
{
    public string Reason { get; set; } = null!;
}

public class SellerOrderListItemDto
{
    public long SellerOrderId { get; set; }
    public long OrderId { get; set; }
    public string OrderCode { get; set; } = null!;
    public string CustomerName { get; set; } = null!;
    public long? WarehouseId { get; set; }
    public string? WarehouseName { get; set; }
    public decimal Subtotal { get; set; }
    public string Status { get; set; } = null!;
    public string OrderStatus { get; set; } = null!;
    public string PaymentMethod { get; set; } = null!;
    public string PaymentStatus { get; set; } = null!;
    public int ItemCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class SellerOrderDetailDto
{
    public long SellerOrderId { get; set; }
    public long OrderId { get; set; }
    public string OrderCode { get; set; } = null!;
    public long SellerId { get; set; }
    public long? WarehouseId { get; set; }
    public string? WarehouseName { get; set; }
    public decimal Subtotal { get; set; }
    public string Status { get; set; } = null!;
    public string OrderStatus { get; set; } = null!;
    public string? CancelReason { get; set; }
    public DateTime? CancelledAt { get; set; }
    public string RecipientName { get; set; } = null!;
    public string RecipientPhone { get; set; } = null!;
    public string ShippingProvince { get; set; } = null!;
    public string ShippingDistrict { get; set; } = null!;
    public string ShippingWard { get; set; } = null!;
    public string ShippingStreetAddress { get; set; } = null!;
    public string PaymentMethod { get; set; } = null!;
    public string PaymentStatus { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public List<OrderItemDto> Items { get; set; } = new();
    public List<OrderStatusHistoryDto> StatusHistories { get; set; } = new();
}
