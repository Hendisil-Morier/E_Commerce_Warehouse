namespace ECommerceWarehouse.Domain.Entities.Review;

public class ShipmentTrackingEvent
{
    public long EventId { get; set; }
    public long ShipmentId { get; set; }
    public string Milestone { get; set; } = null!;
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public string? LocationName { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public DateTime EventTime { get; set; } = DateTime.UtcNow;
    public long? CreatedBy { get; set; }

    public Shipment Shipment { get; set; } = null!;
}
