using ECommerceWarehouse.Domain.Entities.Identity;

namespace ECommerceWarehouse.Domain.Entities.Seller;

public class SellerSettlement
{
    public long SettlementId { get; set; }
    public long SellerId { get; set; }
    public string SettlementCode { get; set; } = null!;
    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; }
    public decimal GrossAmount { get; set; }
    public decimal RefundDeductionAmount { get; set; }
    public decimal CommissionRateSnapshot { get; set; }
    public decimal CommissionAmount { get; set; }
    public decimal NetPayoutAmount { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, Approved, Paid, Cancelled
    public string? PaymentReference { get; set; }
    public string? Note { get; set; }
    public long CreatedBy { get; set; }
    public long? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime? PaidAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Seller Seller { get; set; } = null!;
    public User CreatedByUser { get; set; } = null!;
    public User? ApprovedByUser { get; set; }
    public ICollection<SellerSettlementItem> Items { get; set; } = new List<SellerSettlementItem>();
}
