using ECommerceWarehouse.Domain.Entities.Identity;
using ECommerceWarehouse.Domain.Entities.Order;
using ECommerceWarehouse.Domain.Entities.Warehouse;

namespace ECommerceWarehouse.Domain.Entities.Review;

public class ReturnRequestItem
{
    public long ReturnItemId { get; set; }
    public long ReturnRequestId { get; set; }
    public long OrderItemId { get; set; }
    public int Quantity { get; set; }
    public string InspectionResult { get; set; } = "Pending"; // Pending, Good, MinorDefect, Damaged
    public string? InspectionNote { get; set; }
    public long? InspectedBy { get; set; }
    public DateTime? InspectedAt { get; set; }
    public long? RestockLocationId { get; set; }

    public ReturnRequest ReturnRequest { get; set; } = null!;
    public OrderItem OrderItem { get; set; } = null!;
    public User? InspectedByUser { get; set; }
    public WarehouseLocation? RestockLocation { get; set; }
}
