namespace ECommerceWarehouse.Domain.Entities.Warehouse;

public class WarehouseLocation
{
    public long LocationId { get; set; }
    public long WarehouseId { get; set; }
    public string LocationCode { get; set; } = null!;
    public string StorageType { get; set; } = "Standard"; // Standard, Cold, Hazardous, Fragile, Inbound, Returns, Damaged
    public bool IsSellable { get; set; } = true;
    public bool IsActive { get; set; } = true;

    public Warehouse Warehouse { get; set; } = null!;
}