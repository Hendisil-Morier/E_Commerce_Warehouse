using ECommerceWarehouse.Domain.Entities.Catalog;
using ECommerceWarehouse.Domain.Entities.Identity;

namespace ECommerceWarehouse.Domain.Entities.Warehouse;

public class StockMovement
{
    public long StockMovementId { get; set; }
    public long WarehouseId { get; set; }
    public long LocationId { get; set; }
    public long VariantId { get; set; }
    public string MovementType { get; set; } = null!; // Receipt, Issue, TransferIn, TransferOut, Adjustment, ReturnIn, StockCount, Reserve, ReleaseReserve
    public int OnHandChange { get; set; } = 0;
    public int ReservedChange { get; set; } = 0;
    public int OnHandAfter { get; set; }
    public int ReservedAfter { get; set; }
    public string ReferenceType { get; set; } = null!; // Receipt, Issue, Transfer, StockCount, Reservation, ReturnRequest, Manual
    public long ReferenceId { get; set; }
    public long? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? Note { get; set; }

    public WarehouseLocation Location { get; set; } = null!;
    public ProductVariant Variant { get; set; } = null!;
    public User? CreatedByUser { get; set; }
}