using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.DTOs.Catalog;
using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.Mappings;
using ECommerceWarehouse.Domain.Exceptions;
using FluentValidation;

namespace ECommerceWarehouse.Application.Services;

public class CatalogProductService : ICatalogProductService
{
    private readonly IProductRepository _productRepository;
    private readonly ICategoryRepository _categoryRepository;
    private readonly IValidator<PublicProductQueryDto> _queryValidator;

    public CatalogProductService(
        IProductRepository productRepository,
        ICategoryRepository categoryRepository,
        IValidator<PublicProductQueryDto> queryValidator)
    {
        _productRepository = productRepository;
        _categoryRepository = categoryRepository;
        _queryValidator = queryValidator;
    }

    public async Task<PagedResult<PublicProductListItemDto>> GetPublicProductsAsync(
        PublicProductQueryDto query,
        CancellationToken cancellationToken = default)
    {
        await _queryValidator.ValidateAndThrowAsync(query, cancellationToken);

        IReadOnlyCollection<long>? expandedCategoryIds = null;
        if (query.CategoryId.HasValue)
        {
            expandedCategoryIds = await ResolveActiveDescendantCategoryIdsAsync(query.CategoryId.Value, cancellationToken);
            if (expandedCategoryIds.Count == 0)
            {
                return PagedResult<PublicProductListItemDto>.Create(
                    Array.Empty<PublicProductListItemDto>(),
                    query.NormalizedPage,
                    query.NormalizedPageSize,
                    0);
            }
        }

        var pagedProducts = await _productRepository.GetPublicPagedAsync(query, expandedCategoryIds, cancellationToken);
        var variantIds = pagedProducts.Items
            .SelectMany(p => p.Variants.Where(v => v.IsActive).Select(v => v.VariantId))
            .Distinct()
            .ToList();

        var availabilityMap = variantIds.Count == 0
            ? new Dictionary<long, int>()
            : await _productRepository.GetVariantAvailabilityByIdsAsync(variantIds, cancellationToken);

        var items = pagedProducts.Items
            .Select(p => p.ToPublicListItemDto(availabilityMap))
            .ToList();

        return PagedResult<PublicProductListItemDto>.Create(
            items,
            pagedProducts.Page,
            pagedProducts.PageSize,
            pagedProducts.TotalItems);
    }

    public async Task<PublicProductDetailDto> GetPublicProductByIdAsync(
        long productId,
        CancellationToken cancellationToken = default)
    {
        var product = await _productRepository.GetPublicByIdWithDetailsAsync(productId, cancellationToken)
            ?? throw new NotFoundException("Product", productId);

        var activeVariantIds = product.Variants
            .Where(v => v.IsActive)
            .Select(v => v.VariantId)
            .Distinct()
            .ToList();

        var availabilityMap = activeVariantIds.Count == 0
            ? new Dictionary<long, int>()
            : await _productRepository.GetVariantAvailabilityByIdsAsync(activeVariantIds, cancellationToken);

        return product.ToPublicDetailDto(availabilityMap);
    }

    private async Task<IReadOnlyCollection<long>> ResolveActiveDescendantCategoryIdsAsync(
        long rootCategoryId,
        CancellationToken cancellationToken)
    {
        var activeCategories = await _categoryRepository.GetActiveAsNoTrackingAsync(cancellationToken);
        if (!activeCategories.Any(c => c.CategoryId == rootCategoryId))
        {
            return Array.Empty<long>();
        }

        var childrenByParent = activeCategories
            .Where(c => c.ParentCategoryId.HasValue)
            .ToLookup(c => c.ParentCategoryId!.Value, c => c.CategoryId);

        var result = new HashSet<long> { rootCategoryId };
        var queue = new Queue<long>();
        queue.Enqueue(rootCategoryId);

        while (queue.Count > 0)
        {
            var currentId = queue.Dequeue();
            foreach (var childId in childrenByParent[currentId])
            {
                if (result.Add(childId))
                {
                    queue.Enqueue(childId);
                }
            }
        }

        return result;
    }
}

