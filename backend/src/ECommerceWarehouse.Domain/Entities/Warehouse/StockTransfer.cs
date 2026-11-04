using ECommerceWarehouse.Domain.Entities.Catalog;
using ECommerceWarehouse.Domain.Entities.Identity;

namespace ECommerceWarehouse.Domain.Entities.Warehouse;

public class StockTransfer
{
    public long TransferId { get; set; }
    public long SourceWarehouseId { get; set; }
    public long DestinationWarehouseId { get; set; }
    public string TransferCode { get; set; } = null!;
    public string Status { get; set; } = "Draft"; // Draft, Approved, InTransit, Received, Cancelled
    public string? Note { get; set; }
    public long CreatedBy { get; set; }
    public long? ApprovedBy { get; set; }
    public long? ReceivedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ApprovedAt { get; set; }
    public DateTime? ShippedAt { get; set; }
    public DateTime? ReceivedAt { get; set; }

    public Warehouse SourceWarehouse { get; set; } = null!;
    public Warehouse DestinationWarehouse { get; set; } = null!;
    public User CreatedByUser { get; set; } = null!;
    public User? ApprovedByUser { get; set; }
    public User? ReceivedByUser { get; set; }
    public ICollection<StockTransferDetail> Details { get; set; } = new List<StockTransferDetail>();
}

