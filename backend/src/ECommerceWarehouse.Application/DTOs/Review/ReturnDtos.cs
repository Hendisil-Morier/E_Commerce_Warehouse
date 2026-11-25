using ECommerceWarehouse.Application.DTOs.Common;

namespace ECommerceWarehouse.Application.DTOs.Review;

public class ReturnQueryDto : PaginationQuery
{
    public string? Status { get; set; }
    public string? Search { get; set; }
}

public class CreateReturnItemDto
{
    public long OrderItemId { get; set; }
    public int Quantity { get; set; }
}

public class CreateReturnRequestDto
{
    public string Reason { get; set; } = null!;
    public List<CreateReturnItemDto> Items { get; set; } = new();
}

public class RejectReturnRequestDto
{
    public string Reason { get; set; } = null!;
}

public class ReceiveReturnRequestDto
{
    public long? ReturnLocationId { get; set; }
}

public class InspectReturnItemRequestDto
{
    public string InspectionResult { get; set; } = null!; // Good, MinorDefect, Damaged
    public long RestockLocationId { get; set; }
    public string? InspectionNote { get; set; }
}

public class ReturnItemDto
{
    public long ReturnItemId { get; set; }
    public long OrderItemId { get; set; }
    public long VariantId { get; set; }
    public string ProductName { get; set; } = null!;
    public string SKU { get; set; } = null!;
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
    public string InspectionResult { get; set; } = null!;
    public string? InspectionNote { get; set; }
    public long? InspectedBy { get; set; }
    public DateTime? InspectedAt { get; set; }
    public long? RestockLocationId { get; set; }
    public string? RestockLocationCode { get; set; }
}

public class ReturnRequestDto
{
    public long ReturnRequestId { get; set; }
    public string RequestCode { get; set; } = null!;
    public long SellerOrderId { get; set; }
    public long OrderId { get; set; }
    public string OrderCode { get; set; } = null!;
    public long CustomerId { get; set; }
    public string CustomerName { get; set; } = null!;
    public long SellerId { get; set; }
    public string Reason { get; set; } = null!;
    public string Status { get; set; } = null!;
    public long? ReviewedBy { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? RejectReason { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public List<ReturnItemDto> Items { get; set; } = new();
}
