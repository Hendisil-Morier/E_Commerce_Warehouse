using ECommerceWarehouse.Domain.Entities.Catalog;
using ECommerceWarehouse.Domain.Entities.Identity;
using ECommerceWarehouse.Domain.Entities.Review;

namespace ECommerceWarehouse.Domain.Entities.Warehouse;

public class StockCountDetail
{
    public long StockCountDetailId { get; set; }
    public long StockCountId { get; set; }
    public long WarehouseId { get; set; }
    public long LocationId { get; set; }
    public long VariantId { get; set; }
    public int SystemQuantity { get; set; }
    public int? CountedQuantity { get; set; }
    public int? Difference { get; private set; } // Cột GENERATED ALWAYS AS (CountedQuantity - SystemQuantity) STORED
    public string? Reason { get; set; }

    public StockCount StockCount { get; set; } = null!;
    public WarehouseLocation Location { get; set; } = null!;
    public ProductVariant Variant { get; set; } = null!;
}