using ECommerceWarehouse.Application.DTOs.Catalog;
using ECommerceWarehouse.Application.DTOs.Common;

namespace ECommerceWarehouse.Application.Services;

public interface IAdminProductService
{
    Task<PagedResult<AdminProductListItemDto>> GetAdminProductsAsync(
        AdminProductQueryDto query,
        CancellationToken cancellationToken = default);

    Task<AdminProductDetailDto> GetAdminProductByIdAsync(
        long productId,
        CancellationToken cancellationToken = default);

    Task<AdminProductDetailDto> ApproveAsync(
        long productId,
        CancellationToken cancellationToken = default);

    Task<AdminProductDetailDto> RejectAsync(
        long productId,
        RejectProductRequestDto request,
        CancellationToken cancellationToken = default);
}

