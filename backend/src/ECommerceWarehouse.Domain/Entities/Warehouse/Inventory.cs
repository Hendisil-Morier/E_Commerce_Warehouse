using ECommerceWarehouse.Domain.Entities.Catalog;

namespace ECommerceWarehouse.Domain.Entities.Warehouse;

public class Inventory
{
    public long InventoryId { get; set; }
    public long WarehouseId { get; set; }
    public long LocationId { get; set; }
    public long VariantId { get; set; }
    public int QuantityOnHand { get; set; } = 0;
    public int QuantityReserved { get; set; } = 0;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime RowVersion { get; set; }

    public WarehouseLocation Location { get; set; } = null!;
    public ProductVariant Variant { get; set; } = null!;
}