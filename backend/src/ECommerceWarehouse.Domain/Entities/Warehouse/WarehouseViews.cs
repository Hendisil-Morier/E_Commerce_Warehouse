namespace ECommerceWarehouse.Domain.Entities.Warehouse;

public class VariantAvailabilityView
{
    public long VariantId { get; set; }
    public long WarehouseId { get; set; }
    public decimal OnHand { get; set; }
    public decimal Reserved { get; set; }
    public decimal Available { get; set; }
}

public class StockReconciliationView
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
    public decimal OnHand_Diff { get; set; }
    public decimal ReservedLedger_Diff { get; set; }
    public decimal ReservedReservation_Diff { get; set; }
}