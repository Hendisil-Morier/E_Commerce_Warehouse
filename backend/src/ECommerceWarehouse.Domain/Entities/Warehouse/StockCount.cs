using ECommerceWarehouse.Domain.Entities.Catalog;
using ECommerceWarehouse.Domain.Entities.Identity;

namespace ECommerceWarehouse.Domain.Entities.Warehouse;

public class StockCount
{
    public long StockCountId { get; set; }
    public long WarehouseId { get; set; }
    public string CountCode { get; set; } = null!;
    public string Status { get; set; } = "Draft"; // Draft, Counting, PendingApproval, Approved, Cancelled
    public string? Note { get; set; }
    public long CreatedBy { get; set; }
    public long? ApprovedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ApprovedAt { get; set; }

    public Warehouse Warehouse { get; set; } = null!;
    public User CreatedByUser { get; set; } = null!;
    public User? ApprovedByUser { get; set; }
    public ICollection<StockCountDetail> Details { get; set; } = new List<StockCountDetail>();
}


