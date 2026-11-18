namespace ECommerceWarehouse.Application.DTOs.Seller;

public class SellerDto
{
    public long SellerId { get; init; }
    public long UserId { get; init; }
    public string BusinessName { get; init; } = null!;
    public string? TaxCode { get; init; }
    public string? Description { get; init; }
    public decimal CommissionRate { get; init; }
    public string Status { get; init; } = null!;
    public DateTime? ApprovedAt { get; init; }
    public string? RejectReason { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
    public SellerUserSummaryDto? User { get; init; }
}

public class SellerUserSummaryDto
{
    public long UserId { get; init; }
    public string? Username { get; init; }
    public string FullName { get; init; } = null!;
    public string Email { get; init; } = null!;
    public string? PhoneNumber { get; init; }
}

