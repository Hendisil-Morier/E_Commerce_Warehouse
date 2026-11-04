using ECommerceWarehouse.Domain.Entities.Catalog;

namespace ECommerceWarehouse.Domain.Entities.Customer;

public class CartItem
{
    public long CartItemId { get; set; }
    public long CartId { get; set; }
    public long VariantId { get; set; }
    public int Quantity { get; set; }
    public DateTime AddedAt { get; set; } = DateTime.UtcNow;

    public Cart Cart { get; set; } = null!;
    public ProductVariant Variant { get; set; } = null!;
}