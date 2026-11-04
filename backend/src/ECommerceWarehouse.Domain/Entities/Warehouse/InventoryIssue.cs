using ECommerceWarehouse.Domain.Entities.Catalog;
using ECommerceWarehouse.Domain.Entities.Identity;
using ECommerceWarehouse.Domain.Entities.Order;

namespace ECommerceWarehouse.Domain.Entities.Warehouse;

public class InventoryIssue
{
    public long IssueId { get; set; }
    public long WarehouseId { get; set; }
    public long? SellerOrderId { get; set; }
    public long? TransferId { get; set; }
    public string IssueCode { get; set; } = null!;
    public string IssueType { get; set; } = null!; // OrderFulfillment, TransferOutbound, Adjustment, ReturnToSeller, Disposal
    public string Status { get; set; } = "Draft"; // Draft, Approved, Picking, Packed, Dispatched, Cancelled
    public string? Note { get; set; }
    public long CreatedBy { get; set; }
    public long? ApprovedBy { get; set; }
    public long? DispatchedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ApprovedAt { get; set; }
    public DateTime? DispatchedAt { get; set; }

    public Warehouse Warehouse { get; set; } = null!;
    public SellerOrder? SellerOrder { get; set; }
    public StockTransfer? Transfer { get; set; }
    public User CreatedByUser { get; set; } = null!;
    public User? ApprovedByUser { get; set; }
    public User? DispatchedByUser { get; set; }
    public ICollection<IssueDetail> Details { get; set; } = new List<IssueDetail>();
}