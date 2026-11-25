using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Order;

namespace ECommerceWarehouse.Application.Services;

public interface ISellerOrderService
{
    Task<PagedResult<SellerOrderListItemDto>> GetMySellerOrdersAsync(SellerOrderQueryDto query, CancellationToken cancellationToken = default);
    Task<SellerOrderDetailDto> GetMySellerOrderByIdAsync(long sellerOrderId, CancellationToken cancellationToken = default);
    Task<SellerOrderDetailDto> ConfirmSellerOrderAsync(long sellerOrderId, CancellationToken cancellationToken = default);
    Task<SellerOrderDetailDto> CancelSellerOrderAsync(long sellerOrderId, CancelSellerOrderRequestDto request, CancellationToken cancellationToken = default);
}
