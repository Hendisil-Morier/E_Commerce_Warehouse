using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Seller;

namespace ECommerceWarehouse.Application.Services;

public sealed record SellerSubmissionResult(SellerDto Seller, bool IsCreated);

public interface ISellerService
{
    Task<SellerSubmissionResult> RegisterOrResubmitAsync(RegisterSellerRequestDto request, CancellationToken cancellationToken = default);
    Task<SellerDto> GetMySellerAsync(CancellationToken cancellationToken = default);
    Task<PagedResult<SellerDto>> GetAdminSellersAsync(SellerListQueryDto query, CancellationToken cancellationToken = default);
    Task<SellerDto> ApproveAsync(long sellerId, CancellationToken cancellationToken = default);
    Task<SellerDto> RejectAsync(long sellerId, RejectSellerRequestDto request, CancellationToken cancellationToken = default);
    Task<SellerDto> SuspendAsync(long sellerId, SuspendSellerRequestDto? request, CancellationToken cancellationToken = default);
}

