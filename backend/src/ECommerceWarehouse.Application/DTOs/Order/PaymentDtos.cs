namespace ECommerceWarehouse.Application.DTOs.Order;

public class CreatePaymentRequestDto
{
    public string PaymentMethod { get; set; } = "COD";
}

public class PaymentDto
{
    public long PaymentId { get; set; }
    public long OrderId { get; set; }
    public string PaymentMethod { get; set; } = null!;
    public decimal Amount { get; set; }
    public string PaymentStatus { get; set; } = null!;
    public string? TransactionCode { get; set; }
    public DateTime? PaidAt { get; set; }
    public DateTime CreatedAt { get; set; }
}
