using ECommerceWarehouse.Domain.Entities.Catalog;
using ECommerceWarehouse.Domain.Entities.Order;

namespace ECommerceWarehouse.Domain.Entities.Warehouse;

public class StockReservation
{
    public long ReservationId { get; set; }
    public long OrderItemId { get; set; }
    public long WarehouseId { get; set; }
    public long LocationId { get; set; }
    public long VariantId { get; set; }
    public int Quantity { get; set; }
    public string Status { get; set; } = "Active"; // Active, Consumed, Released, Expired
    public DateTime? ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ResolvedAt { get; set; }

    public OrderItem OrderItem { get; set; } = null!;
    public WarehouseLocation Location { get; set; } = null!;
    public Inventory Inventory { get; set; } = null!;
}
