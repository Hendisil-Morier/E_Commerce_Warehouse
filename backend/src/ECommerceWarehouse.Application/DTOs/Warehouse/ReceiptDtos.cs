using ECommerceWarehouse.Application.DTOs.Common;

namespace ECommerceWarehouse.Application.DTOs.Warehouse;

public class ReceiptQueryDto : PaginationQuery
{
    public long? WarehouseId { get; set; }
    public string? Status { get; set; }
    public string? ReceiptType { get; set; }
    public string? Search { get; set; }
}

public class CreateReceiptDetailItemDto
{
    public long VariantId { get; set; }
    public long LocationId { get; set; }
    public int Quantity { get; set; }
    public decimal? UnitCost { get; set; }
}

public class CreateReceiptRequestDto
{
    public long WarehouseId { get; set; }
    public string ReceiptType { get; set; } = "SellerInbound";
    public long? SenderSellerId { get; set; }
    public long? TransferId { get; set; }
    public long? ReturnRequestId { get; set; }
    public string? Note { get; set; }
    public List<CreateReceiptDetailItemDto> Details { get; set; } = new();
}

public class ReceiptDetailDto
{
    public long ReceiptDetailId { get; set; }
    public long VariantId { get; set; }
    public string SKU { get; set; } = null!;
    public string ProductName { get; set; } = null!;
    public string VariantName { get; set; } = null!;
    public long LocationId { get; set; }
    public string LocationCode { get; set; } = null!;
    public int Quantity { get; set; }
    public decimal? UnitCost { get; set; }
}

public class ReceiptDto
{
    public long ReceiptId { get; set; }
    public string ReceiptCode { get; set; } = null!;
    public long WarehouseId { get; set; }
    public string WarehouseName { get; set; } = null!;
    public string ReceiptType { get; set; } = null!;
    public string Status { get; set; } = null!;
    public long? SenderSellerId { get; set; }
    public string? SenderSellerName { get; set; }
    public string? Note { get; set; }
    public long CreatedBy { get; set; }
    public string? CreatedByName { get; set; }
    public long? ConfirmedBy { get; set; }
    public string? ConfirmedByName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ConfirmedAt { get; set; }
    public int TotalLines { get; set; }
    public int TotalQuantity { get; set; }
    public List<ReceiptDetailDto> Details { get; set; } = new();
}
