using ECommerceWarehouse.Application.DTOs.Catalog;
using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Domain.Entities.Catalog;

namespace ECommerceWarehouse.Application.Contracts.Persistence;

public interface IProductRepository
{
    Task<PagedResult<Product>> GetSellerPagedAsync(
        long sellerId,
        SellerProductQueryDto query,
        CancellationToken cancellationToken = default);

    Task<Product?> GetByIdForSellerWithDetailsAsync(
        long productId,
        long sellerId,
        bool asNoTracking = false,
        CancellationToken cancellationToken = default);

    Task<PagedResult<Product>> GetAdminPagedAsync(
        AdminProductQueryDto query,
        CancellationToken cancellationToken = default);

    Task<Product?> GetByIdWithDetailsAsync(
        long productId,
        bool asNoTracking = false,
        CancellationToken cancellationToken = default);

    Task<PagedResult<Product>> GetPublicPagedAsync(
        PublicProductQueryDto query,
        IReadOnlyCollection<long>? expandedCategoryIds = null,
        CancellationToken cancellationToken = default);

    Task<Product?> GetPublicByIdWithDetailsAsync(
        long productId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyDictionary<long, int>> GetVariantAvailabilityByIdsAsync(
        IReadOnlyCollection<long> variantIds,
        CancellationToken cancellationToken = default);

    Task<ProductVariant?> GetVariantByIdForSellerAsync(
        long variantId,
        long sellerId,
        CancellationToken cancellationToken = default);

    Task<bool> ExistsSkuAsync(
        string sku,
        long? excludeVariantId = null,
        CancellationToken cancellationToken = default);

    Task<bool> ExistsBarcodeAsync(
        string barcode,
        long? excludeVariantId = null,
        CancellationToken cancellationToken = default);

    Task AddAsync(Product product, CancellationToken cancellationToken = default);
    Task AddVariantAsync(ProductVariant variant, CancellationToken cancellationToken = default);
    void Update(Product product);
    void UpdateVariant(ProductVariant variant);
    void RemoveImages(IEnumerable<ProductImage> images);
}

