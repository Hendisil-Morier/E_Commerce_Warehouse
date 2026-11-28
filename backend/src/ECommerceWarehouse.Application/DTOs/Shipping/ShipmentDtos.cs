using ECommerceWarehouse.Application.DTOs.Common;

namespace ECommerceWarehouse.Application.DTOs.Shipping;

public class CarrierDto
{
    public int CarrierId { get; set; }
    public string CarrierCode { get; set; } = null!;
    public string CarrierName { get; set; } = null!;
    public bool IsActive { get; set; }
}

public class UpsertCarrierRequestDto
{
    public string CarrierCode { get; set; } = null!;
    public string CarrierName { get; set; } = null!;
    public bool IsActive { get; set; } = true;
}

public class UpdateCarrierStatusRequestDto
{
    public bool IsActive { get; set; }
}

public class ShipmentQueryDto : PaginationQuery
{
    public string? Status { get; set; }
    public int? CarrierId { get; set; }
    public string? Search { get; set; }
}

public class CreateShipmentRequestDto
{
    public int CarrierId { get; set; }
    public string TrackingNumber { get; set; } = null!;
    public decimal? CodAmount { get; set; }
}

public class UpdateShipmentStatusRequestDto
{
    public string Status { get; set; } = null!;
    public string? FailedReason { get; set; }
}

public class ShipmentTrackingEventDto
{
    public long EventId { get; set; }
    public long ShipmentId { get; set; }
    public string Milestone { get; set; } = null!;
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public string? LocationName { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public DateTime EventTime { get; set; }
}

public class CreateShipmentTrackingEventRequestDto
{
    public string Milestone { get; set; } = "InTransit";
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public string? LocationName { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public DateTime? EventTime { get; set; }
}

public class ShipmentDto
{
    public long ShipmentId { get; set; }
    public long SellerOrderId { get; set; }
    public long OrderId { get; set; }
    public string OrderCode { get; set; } = null!;
    public int? CarrierId { get; set; }
    public string? CarrierCode { get; set; }
    public string? CarrierName { get; set; }
    public string? TrackingNumber { get; set; }
    public string ShippingStatus { get; set; } = null!;
    public decimal CodAmount { get; set; }
    public string? FailedReason { get; set; }
    public DateTime? ShippedAt { get; set; }
    public DateTime? DeliveredAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public List<ShipmentTrackingEventDto> TrackingEvents { get; set; } = new();
}
