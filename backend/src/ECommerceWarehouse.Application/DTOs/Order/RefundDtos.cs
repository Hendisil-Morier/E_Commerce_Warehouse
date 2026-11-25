using ECommerceWarehouse.Application.DTOs.Common;

namespace ECommerceWarehouse.Application.DTOs.Order;

public class RefundQueryDto : PaginationQuery
{
    public string? Status { get; set; }
}

public class RejectRefundRequestDto
{
    public string Reason { get; set; } = null!;
}

public class RefundDto
{
    public long RefundId { get; set; }
    public long PaymentId { get; set; }
    public long OrderId { get; set; }
    public string OrderCode { get; set; } = null!;
    public long? SellerOrderId { get; set; }
    public long? ReturnRequestId { get; set; }
    public string? ReturnRequestCode { get; set; }
    public decimal PaymentAmount { get; set; }
    public decimal TotalRefundedOnPayment { get; set; }
    public decimal Amount { get; set; }
    public string? Reason { get; set; }
    public string RefundStatus { get; set; } = null!;
    public long? ApprovedBy { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}
