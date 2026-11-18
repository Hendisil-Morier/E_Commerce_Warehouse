using ECommerceWarehouse.Application.DTOs.Catalog;
using ECommerceWarehouse.Application.DTOs.Common;

namespace ECommerceWarehouse.Application.Services;

public interface ICatalogProductService
{
    Task<PagedResult<PublicProductListItemDto>> GetPublicProductsAsync(
        PublicProductQueryDto query,
        CancellationToken cancellationToken = default);

    Task<PublicProductDetailDto> GetPublicProductByIdAsync(
        long productId,
        CancellationToken cancellationToken = default);
}

