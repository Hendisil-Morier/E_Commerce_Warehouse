using ECommerceWarehouse.Domain.Entities.Catalog;
using ECommerceWarehouse.Domain.Entities.Identity;
using ECommerceWarehouse.Domain.Entities.Order;
using ECommerceWarehouse.Domain.Entities.Review;

namespace ECommerceWarehouse.Domain.Entities.Warehouse;


public class IssueDetail
{
    public long IssueDetailId { get; set; }
    public long IssueId { get; set; }
    public long WarehouseId { get; set; }
    public long VariantId { get; set; }
    public long LocationId { get; set; }
    public int Quantity { get; set; }
    public int PickedQuantity { get; set; } = 0;
    public long? ReservationId { get; set; }

    public InventoryIssue Issue { get; set; } = null!;
    public WarehouseLocation Location { get; set; } = null!;
    public ProductVariant Variant { get; set; } = null!;
    public StockReservation? Reservation { get; set; }
}