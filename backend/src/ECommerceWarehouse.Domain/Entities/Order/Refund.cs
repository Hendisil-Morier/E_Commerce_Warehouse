using ECommerceWarehouse.Domain.Entities.Identity;
using ECommerceWarehouse.Domain.Entities.Review;

namespace ECommerceWarehouse.Domain.Entities.Order;

public class Refund
{
    public long RefundId { get; set; }
    public long PaymentId { get; set; }
    public long? SellerOrderId { get; set; }
    public long? ReturnRequestId { get; set; }
    public decimal Amount { get; set; }
    public string? Reason { get; set; }
    public string RefundStatus { get; set; } = "Pending"; // Pending, Approved, Rejected, Completed
    public long? ApprovedBy { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Payment Payment { get; set; } = null!;
    public SellerOrder? SellerOrder { get; set; }
    public ReturnRequest? ReturnRequest { get; set; }
    public User? ApprovedByUser { get; set; }
}