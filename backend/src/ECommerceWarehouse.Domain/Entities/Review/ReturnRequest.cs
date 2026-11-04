using ECommerceWarehouse.Domain.Entities.Identity;
using ECommerceWarehouse.Domain.Entities.Order;

namespace ECommerceWarehouse.Domain.Entities.Review;

public class ReturnRequest
{
    public long ReturnRequestId { get; set; }
    public string RequestCode { get; set; } = null!;
    public long SellerOrderId { get; set; }
    public long CustomerId { get; set; }
    public string Reason { get; set; } = null!;
    public string Status { get; set; } = "Requested"; // Requested, Approved, Rejected, ItemsReceived, Inspected, Completed, Cancelled
    public long? ReviewedBy { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? RejectReason { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public SellerOrder SellerOrder { get; set; } = null!;
    public User Customer { get; set; } = null!;
    public User? ReviewedByUser { get; set; }
    public ICollection<ReturnRequestItem> Items { get; set; } = new List<ReturnRequestItem>();
}
