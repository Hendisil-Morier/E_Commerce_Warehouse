using ECommerceWarehouse.Application.DTOs.Common;

namespace ECommerceWarehouse.Application.DTOs.Warehouse;

public class StockMovementQueryDto : PaginationQuery
{
    public long? WarehouseId { get; set; }
    public long? LocationId { get; set; }
    public long? VariantId { get; set; }
    public string? MovementType { get; set; }
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }
}

public class StockMovementDto
{
    public long StockMovementId { get; set; }
    public long WarehouseId { get; set; }
    public long LocationId { get; set; }
    public string LocationCode { get; set; } = null!;
    public long VariantId { get; set; }
    public string SKU { get; set; } = null!;
    public string ProductName { get; set; } = null!;
    public string VariantName { get; set; } = null!;
    public string MovementType { get; set; } = null!;
    public int OnHandChange { get; set; }
    public int ReservedChange { get; set; }
    public int OnHandAfter { get; set; }
    public int ReservedAfter { get; set; }
    public string ReferenceType { get; set; } = null!;
    public long ReferenceId { get; set; }
    public long? CreatedBy { get; set; }
    public string? CreatedByName { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? Note { get; set; }
}
