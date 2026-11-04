using ECommerceWarehouse.Domain.Entities.Catalog;
using ECommerceWarehouse.Domain.Entities.Identity;
using ECommerceWarehouse.Domain.Entities.Review;

namespace ECommerceWarehouse.Domain.Entities.Warehouse;
public class ReceiptDetail
{
    public long ReceiptDetailId { get; set; }
    public long ReceiptId { get; set; }
    public long WarehouseId { get; set; }
    public long VariantId { get; set; }
    public long LocationId { get; set; }
    public int Quantity { get; set; }
    public decimal? UnitCost { get; set; }

    public InventoryReceipt Receipt { get; set; } = null!;
    public WarehouseLocation Location { get; set; } = null!;
    public ProductVariant Variant { get; set; } = null!;
}