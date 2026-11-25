using ECommerceWarehouse.Domain.Entities.Order;

namespace ECommerceWarehouse.Domain.Entities.Seller;

public class SellerSettlementItem
{
    public long SettlementItemId { get; set; }
    public long SettlementId { get; set; }
    public long SellerOrderId { get; set; }
    public decimal GrossAmount { get; set; }
    public decimal RefundAmount { get; set; }
    public decimal CommissionAmount { get; set; }
    public decimal NetAmount { get; set; }

    public SellerSettlement Settlement { get; set; } = null!;
    public SellerOrder SellerOrder { get; set; } = null!;
}
