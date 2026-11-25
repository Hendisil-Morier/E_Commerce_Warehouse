using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Review;
using ECommerceWarehouse.Domain.Entities.Order;
using ECommerceWarehouse.Domain.Entities.Review;
using ECommerceWarehouse.Domain.Entities.Warehouse;

namespace ECommerceWarehouse.Application.Contracts.Persistence;

public interface IReturnRepository
{
    Task<SellerOrder?> GetSellerOrderForReturnAsync(long sellerOrderId, CancellationToken cancellationToken = default);
    Task<int> GetAlreadyReturnedQuantityAsync(long orderItemId, CancellationToken cancellationToken = default);
    Task<PagedResult<ReturnRequestDto>> GetPagedAsync(
        ReturnQueryDto query,
        long? customerIdFilter = null,
        long? sellerIdFilter = null,
        CancellationToken cancellationToken = default);
    Task<ReturnRequest?> GetByIdWithDetailsAsync(long returnRequestId, CancellationToken cancellationToken = default);
    Task<ReturnRequestDto?> GetDtoByIdAsync(long returnRequestId, CancellationToken cancellationToken = default);
    Task<WarehouseLocation?> GetReturnZoneLocationAsync(long warehouseId, long? preferredLocationId, CancellationToken cancellationToken = default);
    Task<WarehouseLocation?> GetLocationByIdAsync(long locationId, CancellationToken cancellationToken = default);
    Task AddAsync(ReturnRequest returnRequest, CancellationToken cancellationToken = default);
}
