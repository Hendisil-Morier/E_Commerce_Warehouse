using ECommerceWarehouse.Domain.Entities.Identity;

namespace ECommerceWarehouse.Domain.Entities.Order;

public class Order
{
    public long OrderId { get; set; }
    public long CustomerId { get; set; }
    public string OrderCode { get; set; } = null!;
    public string RecipientName { get; set; } = null!;
    public string RecipientPhone { get; set; } = null!;
    public string ShippingProvince { get; set; } = null!;
    public string ShippingDistrict { get; set; } = null!;
    public string ShippingWard { get; set; } = null!;
    public string ShippingStreetAddress { get; set; } = null!;
    public decimal Subtotal { get; set; }
    public decimal ShippingFee { get; set; } = 0m;
    public decimal DiscountAmount { get; set; } = 0m;
    public decimal TotalAmount { get; set; }
    public string OrderStatus { get; set; } = "PendingPayment";
    public DateTime? ExpiresAt { get; set; }
    public string? CancelReason { get; set; }
    public DateTime? CancelledAt { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public DateTime RowVersion { get; set; }

    // Navigation Properties
    public User Customer { get; set; } = null!;
    public ICollection<SellerOrder> SellerOrders { get; set; } = new List<SellerOrder>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    public ICollection<OrderStatusHistory> StatusHistories { get; set; } = new List<OrderStatusHistory>();
}