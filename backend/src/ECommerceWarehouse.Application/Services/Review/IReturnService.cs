using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Review;

namespace ECommerceWarehouse.Application.Services;

public interface IReturnService
{
    Task<ReturnRequestDto> CreateReturnRequestAsync(long sellerOrderId, CreateReturnRequestDto request, CancellationToken cancellationToken = default);
    Task<PagedResult<ReturnRequestDto>> GetReturnsAsync(ReturnQueryDto query, CancellationToken cancellationToken = default);
    Task<ReturnRequestDto> GetReturnByIdAsync(long returnRequestId, CancellationToken cancellationToken = default);
    Task<ReturnRequestDto> ApproveAsync(long returnRequestId, CancellationToken cancellationToken = default);
    Task<ReturnRequestDto> RejectAsync(long returnRequestId, RejectReturnRequestDto request, CancellationToken cancellationToken = default);
    Task<ReturnRequestDto> ReceiveAsync(long returnRequestId, ReceiveReturnRequestDto? request, CancellationToken cancellationToken = default);
    Task<ReturnRequestDto> InspectItemAsync(long returnRequestId, long returnItemId, InspectReturnItemRequestDto request, CancellationToken cancellationToken = default);
}
