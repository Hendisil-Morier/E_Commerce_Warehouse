using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Order;

namespace ECommerceWarehouse.Application.Services;

public interface IOrderService
{
    Task<OrderDetailDto> CheckoutAsync(string idempotencyKey, CheckoutRequestDto request, CancellationToken cancellationToken = default);
    Task<PagedResult<OrderListItemDto>> GetMyOrdersAsync(OrderQueryDto query, CancellationToken cancellationToken = default);
    Task<OrderDetailDto> GetMyOrderByIdAsync(long orderId, CancellationToken cancellationToken = default);
    Task<OrderDetailDto> CancelMyOrderAsync(long orderId, CancelOrderRequestDto request, CancellationToken cancellationToken = default);
    Task<PaymentDto> CreateCodPaymentAsync(long orderId, CreatePaymentRequestDto request, CancellationToken cancellationToken = default);
    Task<int> ExpireOverdueOrdersAsync(CancellationToken cancellationToken = default);
}
