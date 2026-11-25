using ECommerceWarehouse.Application.DTOs.Common;

namespace ECommerceWarehouse.Application.DTOs.Warehouse;

public class InventoryQueryDto : PaginationQuery
{
    public long? WarehouseId { get; set; }
    public long? LocationId { get; set; }
    public long? VariantId { get; set; }
    public long? SellerId { get; set; }
    public string? Search { get; set; }
    public bool? LowStockOnly { get; set; }
}

public class InventoryItemDto
{
    public long InventoryId { get; set; }
    public long WarehouseId { get; set; }
    public string WarehouseName { get; set; } = null!;
    public long LocationId { get; set; }
    public string LocationCode { get; set; } = null!;
    public string StorageType { get; set; } = null!;
    public bool IsSellable { get; set; }
    public long VariantId { get; set; }
    public long ProductId { get; set; }
    public string ProductName { get; set; } = null!;
    public string VariantName { get; set; } = null!;
    public string SKU { get; set; } = null!;
    public long SellerId { get; set; }
    public string ShopName { get; set; } = null!;
    public int QuantityOnHand { get; set; }
    public int QuantityReserved { get; set; }
    public int AvailableQuantity => QuantityOnHand - QuantityReserved;
    public DateTime UpdatedAt { get; set; }
}

public class VariantAvailabilityDto
{
    public long VariantId { get; set; }
    public int TotalOnHand { get; set; }
    public int TotalReserved { get; set; }
    public int AvailableQuantity { get; set; }
    public bool InStock => AvailableQuantity > 0;
}

public class StockReconciliationItemDto
{
    public long InventoryId { get; set; }
    public long WarehouseId { get; set; }
    public long LocationId { get; set; }
    public long VariantId { get; set; }
    public int QuantityOnHand { get; set; }
    public int QuantityReserved { get; set; }
    public decimal LedgerOnHand { get; set; }
    public decimal LedgerReserved { get; set; }
    public decimal ActiveReservations { get; set; }
    public decimal OnHandDiff { get; set; }
    public decimal ReservedLedgerDiff { get; set; }
    public decimal ReservedReservationDiff { get; set; }
}
