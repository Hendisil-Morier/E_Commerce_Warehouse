using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Shipping;

namespace ECommerceWarehouse.Application.Services;

public interface IShipmentService
{
    Task<List<CarrierDto>> GetActiveCarriersAsync(CancellationToken cancellationToken = default);
    Task<PagedResult<ShipmentDto>> GetShipmentsAsync(ShipmentQueryDto query, CancellationToken cancellationToken = default);
    Task<ShipmentDto> CreateShipmentAsync(long sellerOrderId, CreateShipmentRequestDto request, CancellationToken cancellationToken = default);
    Task<ShipmentDto> UpdateShipmentStatusAsync(long shipmentId, UpdateShipmentStatusRequestDto request, CancellationToken cancellationToken = default);
    Task<ShipmentDto> TrackByNumberForCustomerAsync(string trackingNumber, CancellationToken cancellationToken = default);
}
