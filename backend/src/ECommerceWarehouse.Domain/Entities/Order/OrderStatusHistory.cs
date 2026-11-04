using ECommerceWarehouse.Domain.Entities.Identity;

namespace ECommerceWarehouse.Domain.Entities.Order;

public class OrderStatusHistory
{
    public long HistoryId { get; set; }
    public long OrderId { get; set; }
    public long? SellerOrderId { get; set; }
    public string? FromStatus { get; set; }
    public string ToStatus { get; set; } = null!;
    public string? Reason { get; set; }
    public long? ChangedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Order Order { get; set; } = null!;
    public SellerOrder? SellerOrder { get; set; }
    public User? ChangedByUser { get; set; }
}
