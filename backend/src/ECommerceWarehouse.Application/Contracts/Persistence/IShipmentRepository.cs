using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Shipping;
using ECommerceWarehouse.Domain.Entities.Order;
using ECommerceWarehouse.Domain.Entities.Review;

namespace ECommerceWarehouse.Application.Contracts.Persistence;

public interface IShipmentRepository
{
    Task<List<CarrierDto>> GetActiveCarriersAsync(CancellationToken cancellationToken = default);
    Task<Carrier?> GetCarrierByIdAsync(int carrierId, CancellationToken cancellationToken = default);
    Task<PagedResult<ShipmentDto>> GetPagedAsync(ShipmentQueryDto query, CancellationToken cancellationToken = default);
    Task<Shipment?> GetByIdWithOrderAsync(long shipmentId, CancellationToken cancellationToken = default);
    Task<ShipmentDto?> GetDtoByIdAsync(long shipmentId, CancellationToken cancellationToken = default);
    Task<ShipmentDto?> GetByTrackingForCustomerAsync(long customerId, string trackingNumber, CancellationToken cancellationToken = default);
    Task<SellerOrder?> GetSellerOrderForShipmentAsync(long sellerOrderId, CancellationToken cancellationToken = default);
    Task<bool> TrackingNumberExistsAsync(int carrierId, string trackingNumber, CancellationToken cancellationToken = default);
    Task AddShipmentAsync(Shipment shipment, CancellationToken cancellationToken = default);
}
