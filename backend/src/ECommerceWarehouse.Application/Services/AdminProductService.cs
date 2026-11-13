using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.DTOs.Catalog;
using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.Mappings;
using ECommerceWarehouse.Domain.Enums;
using ECommerceWarehouse.Domain.Exceptions;
using FluentValidation;

namespace ECommerceWarehouse.Application.Services;

public class AdminProductService : IAdminProductService
{
    private readonly IProductRepository _productRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IValidator<AdminProductQueryDto> _queryValidator;
    private readonly IValidator<RejectProductRequestDto> _rejectValidator;

    public AdminProductService(
        IProductRepository productRepository,
        IUnitOfWork unitOfWork,
        IValidator<AdminProductQueryDto> queryValidator,
        IValidator<RejectProductRequestDto> rejectValidator)
    {
        _productRepository = productRepository;
        _unitOfWork = unitOfWork;
        _queryValidator = queryValidator;
        _rejectValidator = rejectValidator;
    }

    public async Task<PagedResult<AdminProductListItemDto>> GetAdminProductsAsync(
        AdminProductQueryDto query,
        CancellationToken cancellationToken = default)
    {
        await _queryValidator.ValidateAndThrowAsync(query, cancellationToken);

        var pagedProducts = await _productRepository.GetAdminPagedAsync(query, cancellationToken);
        var items = pagedProducts.Items.Select(p => p.ToAdminListItemDto()).ToList();

        return PagedResult<AdminProductListItemDto>.Create(
            items,
            pagedProducts.Page,
            pagedProducts.PageSize,
            pagedProducts.TotalItems);
    }

    public async Task<AdminProductDetailDto> GetAdminProductByIdAsync(
        long productId,
        CancellationToken cancellationToken = default)
    {
        var product = await _productRepository.GetByIdWithDetailsAsync(
            productId,
            asNoTracking: true,
            cancellationToken) ?? throw new NotFoundException("Product", productId);

        return product.ToAdminDetailDto();
    }

    public async Task<AdminProductDetailDto> ApproveAsync(
        long productId,
        CancellationToken cancellationToken = default)
    {
        var product = await _productRepository.GetByIdWithDetailsAsync(
            productId,
            asNoTracking: false,
            cancellationToken) ?? throw new NotFoundException("Product", productId);

        if (product.ProductStatus != ProductStatus.PendingReview)
        {
            throw BusinessException.InvalidStatusTransition(
                $"Chỉ có thể duyệt sản phẩm ở trạng thái PendingReview (hiện tại: {product.ProductStatus}).");
        }

        CatalogProductRules.EnsureReadyForReviewOrPublish(
            product,
            product.Shop.IsActive,
            product.Shop.Seller.Status,
            "phê duyệt");

        product.ProductStatus = ProductStatus.Active;
        product.RejectReason = null;
        product.UpdatedAt = DateTime.UtcNow;

        _productRepository.Update(product);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return product.ToAdminDetailDto();
    }

    public async Task<AdminProductDetailDto> RejectAsync(
        long productId,
        RejectProductRequestDto request,
        CancellationToken cancellationToken = default)
    {
        await _rejectValidator.ValidateAndThrowAsync(request, cancellationToken);

        var product = await _productRepository.GetByIdWithDetailsAsync(
            productId,
            asNoTracking: false,
            cancellationToken) ?? throw new NotFoundException("Product", productId);

        if (product.ProductStatus != ProductStatus.PendingReview)
        {
            throw BusinessException.InvalidStatusTransition(
                $"Chỉ có thể từ chối sản phẩm ở trạng thái PendingReview (hiện tại: {product.ProductStatus}).");
        }

        product.ProductStatus = ProductStatus.Rejected;
        product.RejectReason = request.Reason.Trim();
        product.UpdatedAt = DateTime.UtcNow;

        _productRepository.Update(product);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return product.ToAdminDetailDto();
    }
}

