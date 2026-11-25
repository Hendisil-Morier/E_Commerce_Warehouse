using ECommerceWarehouse.Application.DTOs.Common;

namespace ECommerceWarehouse.Application.DTOs.Warehouse;

public class IssueQueryDto : PaginationQuery
{
    public string? Status { get; set; }
    public long? WarehouseId { get; set; }
    public string? Search { get; set; }
}

public class ScanIssueLineRequestDto
{
    public string Code { get; set; } = null!;
    public int Quantity { get; set; } = 1;
}

public class IssueDetailDto
{
    public long IssueDetailId { get; set; }
    public long VariantId { get; set; }
    public string SKU { get; set; } = null!;
    public string? Barcode { get; set; }
    public string ProductName { get; set; } = null!;
    public string VariantName { get; set; } = null!;
    public long LocationId { get; set; }
    public string LocationCode { get; set; } = null!;
    public int Quantity { get; set; }
    public int PickedQuantity { get; set; }
    public long? ReservationId { get; set; }
    public bool IsFullyPicked => PickedQuantity >= Quantity;
}

public class IssueDto
{
    public long IssueId { get; set; }
    public string IssueCode { get; set; } = null!;
    public long WarehouseId { get; set; }
    public string WarehouseName { get; set; } = null!;
    public long? SellerOrderId { get; set; }
    public string? OrderCode { get; set; }
    public string IssueType { get; set; } = null!;
    public string Status { get; set; } = null!;
    public string? Note { get; set; }
    public long CreatedBy { get; set; }
    public string? CreatedByName { get; set; }
    public long? ApprovedBy { get; set; }
    public string? ApprovedByName { get; set; }
    public long? DispatchedBy { get; set; }
    public string? DispatchedByName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime? DispatchedAt { get; set; }
    public int TotalQuantity { get; set; }
    public int TotalPickedQuantity { get; set; }
    public List<IssueDetailDto> Details { get; set; } = new();
}
