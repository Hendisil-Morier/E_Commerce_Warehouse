using ECommerceWarehouse.Domain.Entities.Review;
using ECommerceWarehouse.Domain.Entities.Warehouse;

namespace ECommerceWarehouse.Domain.Entities.Order;

public class SellerOrder
{
    public long SellerOrderId { get; set; }
    public long OrderId { get; set; }
    public long SellerId { get; set; }
    public long? WarehouseId { get; set; }
    public decimal Subtotal { get; set; }
    public string Status { get; set; } = "Pending";
    public string? CancelReason { get; set; }
    public DateTime? CancelledAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public DateTime RowVersion { get; set; }

    // Navigation Properties
    public Order Order { get; set; } = null!;
    public ECommerceWarehouse.Domain.Entities.Seller.Seller Seller { get; set; } = null!;
    public ECommerceWarehouse.Domain.Entities.Warehouse.Warehouse? Warehouse { get; set; }
    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
    public ICollection<Shipment> Shipments { get; set; } = new List<Shipment>();
    public ICollection<ReturnRequest> ReturnRequests { get; set; } = new List<ReturnRequest>();
}