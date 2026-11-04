using ECommerceWarehouse.Domain.Entities.Catalog;
using ECommerceWarehouse.Domain.Entities.Identity;
using ECommerceWarehouse.Domain.Entities.Review;

namespace ECommerceWarehouse.Domain.Entities.Warehouse; 

public class StockTransferDetail
{
    public long TransferDetailId { get; set; }
    public long TransferId { get; set; }
    public long VariantId { get; set; }
    public long SourceLocationId { get; set; }
    public long? DestinationLocationId { get; set; }
    public int Quantity { get; set; }
    public int? ReceivedQuantity { get; set; }

    public StockTransfer Transfer { get; set; } = null!;
    public ProductVariant Variant { get; set; } = null!;
    public WarehouseLocation SourceLocation { get; set; } = null!;
    public WarehouseLocation? DestinationLocation { get; set; }
}