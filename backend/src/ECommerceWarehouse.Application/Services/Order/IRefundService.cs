using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Order;

namespace ECommerceWarehouse.Application.Services;

public interface IRefundService
{
    Task<PagedResult<RefundDto>> GetRefundsAsync(RefundQueryDto query, CancellationToken cancellationToken = default);
    Task<RefundDto> ApproveAsync(long refundId, CancellationToken cancellationToken = default);
    Task<RefundDto> RejectAsync(long refundId, RejectRefundRequestDto request, CancellationToken cancellationToken = default);
    Task<RefundDto> CompleteAsync(long refundId, CancellationToken cancellationToken = default);
}
