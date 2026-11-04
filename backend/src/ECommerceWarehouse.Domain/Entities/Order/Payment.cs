namespace ECommerceWarehouse.Domain.Entities.Order;

public class Payment
{
    public long PaymentId { get; set; }
    public long OrderId { get; set; }
    public string PaymentMethod { get; set; } = null!; // COD, BankTransfer, EWallet, CreditCard
    public decimal Amount { get; set; }
    public string PaymentStatus { get; set; } = "Pending"; // Pending, Paid, Failed, Refunded, PartiallyRefunded
    public string? TransactionCode { get; set; }
    public DateTime? PaidAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Order Order { get; set; } = null!;
    public ICollection<Refund> Refunds { get; set; } = new List<Refund>();
}