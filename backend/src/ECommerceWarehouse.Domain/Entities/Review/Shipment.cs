using ECommerceWarehouse.Domain.Entities.Order;

namespace ECommerceWarehouse.Domain.Entities.Review;

public class Shipment
{
    public long ShipmentId { get; set; }
    public long SellerOrderId { get; set; }
    public int? CarrierId { get; set; }
    public string? TrackingNumber { get; set; }
    public string ShippingStatus { get; set; } = "Preparing"; // Preparing, PickedUp, InTransit, Delivered, Failed, Returned
    public decimal CodAmount { get; set; } = 0m;
    public string? FailedReason { get; set; }
    public DateTime? ShippedAt { get; set; }
    public DateTime? DeliveredAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public SellerOrder SellerOrder { get; set; } = null!;
    public Carrier? Carrier { get; set; }
}