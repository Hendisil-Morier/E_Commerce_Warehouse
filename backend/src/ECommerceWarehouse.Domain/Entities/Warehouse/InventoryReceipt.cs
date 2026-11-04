using ECommerceWarehouse.Domain.Entities.Catalog;
using ECommerceWarehouse.Domain.Entities.Identity;
using ECommerceWarehouse.Domain.Entities.Review;

namespace ECommerceWarehouse.Domain.Entities.Warehouse;

public class InventoryReceipt
{
    public long ReceiptId { get; set; }
    public long WarehouseId { get; set; }
    public long? SenderSellerId { get; set; }
    public long? TransferId { get; set; }
    public long? ReturnRequestId { get; set; }
    public string ReceiptCode { get; set; } = null!;
    public string ReceiptType { get; set; } = null!; // SellerInbound, TransferInbound, CustomerReturn, Adjustment
    public string Status { get; set; } = "Draft"; // Draft, Confirmed, Cancelled
    public string? Note { get; set; }
    public long CreatedBy { get; set; }
    public long? ConfirmedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ConfirmedAt { get; set; }

    public Warehouse Warehouse { get; set; } = null!;
    public ECommerceWarehouse.Domain.Entities.Seller.Seller? SenderSeller { get; set; }
    public StockTransfer? Transfer { get; set; }
    public ReturnRequest? ReturnRequest { get; set; }
    public User CreatedByUser { get; set; } = null!;
    public User? ConfirmedByUser { get; set; }
    public ICollection<ReceiptDetail> Details { get; set; } = new List<ReceiptDetail>();
}