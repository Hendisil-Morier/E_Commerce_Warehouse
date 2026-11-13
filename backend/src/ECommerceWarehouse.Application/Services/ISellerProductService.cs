using ECommerceWarehouse.Application.DTOs.Catalog;
using ECommerceWarehouse.Application.DTOs.Common;

namespace ECommerceWarehouse.Application.Services;

public interface ISellerProductService
{
    Task<PagedResult<SellerProductListItemDto>> GetMyProductsAsync(
        SellerProductQueryDto query,
        CancellationToken cancellationToken = default);

    Task<SellerProductDetailDto> GetMyProductByIdAsync(
        long productId,
        CancellationToken cancellationToken = default);

    Task<SellerProductDetailDto> CreateProductAsync(
        CreateProductRequestDto request,
        CancellationToken cancellationToken = default);

    Task<SellerProductDetailDto> UpdateProductAsync(
        long productId,
        UpdateProductRequestDto request,
        CancellationToken cancellationToken = default);

    Task<SellerProductDetailDto> SubmitProductAsync(
        long productId,
        CancellationToken cancellationToken = default);

    Task<ProductVariantDto> AddVariantAsync(
        long productId,
        UpsertVariantRequestDto request,
        CancellationToken cancellationToken = default);

    Task<ProductVariantDto> UpdateVariantAsync(
        long variantId,
        UpsertVariantRequestDto request,
        CancellationToken cancellationToken = default);
}

