namespace ECommerceWarehouse.Domain.Entities.Warehouse;

public class Warehouse
{
    public long WarehouseId { get; set; }
    public string WarehouseName { get; set; } = null!;
    public string WarehouseType { get; set; } = null!; // Platform, Seller
    public long? OwnerSellerId { get; set; }
    public string Address { get; set; } = null!;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ECommerceWarehouse.Domain.Entities.Seller.Seller? OwnerSeller { get; set; }
    public ICollection<WarehouseLocation> Locations { get; set; } = new List<WarehouseLocation>();
}