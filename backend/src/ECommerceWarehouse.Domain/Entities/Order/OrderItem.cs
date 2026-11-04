using ECommerceWarehouse.Domain.Entities.Catalog;

namespace ECommerceWarehouse.Domain.Entities.Order;

public class OrderItem
{
    public long OrderItemId { get; set; }
    public long SellerOrderId { get; set; }
    public long VariantId { get; set; }
    public string ProductNameSnapshot { get; set; } = null!;
    public string SKUSnapshot { get; set; } = null!;
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
    public decimal LineTotal { get; private set; } // Cột GENERATED ALWAYS AS (UnitPrice * Quantity) STORED

    public SellerOrder SellerOrder { get; set; } = null!;
    public ProductVariant Variant { get; set; } = null!;
}