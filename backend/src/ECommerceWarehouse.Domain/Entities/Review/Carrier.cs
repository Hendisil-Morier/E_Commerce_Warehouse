namespace ECommerceWarehouse.Domain.Entities.Review;

public class Carrier
{
    public int CarrierId { get; set; }
    public string CarrierCode { get; set; } = null!;
    public string CarrierName { get; set; } = null!;
    public bool IsActive { get; set; } = true;

    public ICollection<Shipment> Shipments { get; set; } = new List<Shipment>();
}
