using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.Contracts.Services;
using ECommerceWarehouse.Application.DTOs.Catalog;
using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.Mappings;
using ECommerceWarehouse.Application.Validators.Catalog;
using ECommerceWarehouse.Domain.Entities.Catalog;
using ECommerceWarehouse.Domain.Enums;
using ECommerceWarehouse.Domain.Exceptions;
using FluentValidation;

namespace ECommerceWarehouse.Application.Services;

public class SellerProductService : ISellerProductService
{
    private const int MaxVariantsPerProduct = 50;

    private readonly IProductRepository _productRepository;
    private readonly IShopRepository _shopRepository;
    private readonly ICategoryRepository _categoryRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IApprovedSellerResolver _approvedSellerResolver;
    private readonly IValidator<SellerProductQueryDto> _queryValidator;
    private readonly IValidator<CreateProductRequestDto> _createValidator;
    private readonly IValidator<UpdateProductRequestDto> _updateValidator;
    private readonly IValidator<UpsertVariantRequestDto> _variantValidator;

    public SellerProductService(
        IProductRepository productRepository,
        IShopRepository shopRepository,
        ICategoryRepository categoryRepository,
        IUnitOfWork unitOfWork,
        IApprovedSellerResolver approvedSellerResolver,
        IValidator<SellerProductQueryDto> queryValidator,
        IValidator<CreateProductRequestDto> createValidator,
        IValidator<UpdateProductRequestDto> updateValidator,
        IValidator<UpsertVariantRequestDto> variantValidator)
    {
        _productRepository = productRepository;
        _shopRepository = shopRepository;
        _categoryRepository = categoryRepository;
        _unitOfWork = unitOfWork;
        _approvedSellerResolver = approvedSellerResolver;
        _queryValidator = queryValidator;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
        _variantValidator = variantValidator;
    }

    public async Task<PagedResult<SellerProductListItemDto>> GetMyProductsAsync(
        SellerProductQueryDto query,
        CancellationToken cancellationToken = default)
    {
        await _queryValidator.ValidateAndThrowAsync(query, cancellationToken);
        var seller = await _approvedSellerResolver.RequireApprovedSellerAsync(cancellationToken);

        var pagedProducts = await _productRepository.GetSellerPagedAsync(seller.SellerId, query, cancellationToken);
        var items = pagedProducts.Items.Select(p => p.ToSellerListItemDto()).ToList();

        return PagedResult<SellerProductListItemDto>.Create(
            items,
            pagedProducts.Page,
            pagedProducts.PageSize,
            pagedProducts.TotalItems);
    }

    public async Task<SellerProductDetailDto> GetMyProductByIdAsync(
        long productId,
        CancellationToken cancellationToken = default)
    {
        var seller = await _approvedSellerResolver.RequireApprovedSellerAsync(cancellationToken);
        var product = await _productRepository.GetByIdForSellerWithDetailsAsync(
            productId,
            seller.SellerId,
            asNoTracking: true,
            cancellationToken) ?? throw new NotFoundException("Product", productId);

        return product.ToSellerDetailDto();
    }

    public async Task<SellerProductDetailDto> CreateProductAsync(
        CreateProductRequestDto request,
        CancellationToken cancellationToken = default)
    {
        await _createValidator.ValidateAndThrowAsync(request, cancellationToken);
        var seller = await _approvedSellerResolver.RequireApprovedSellerAsync(cancellationToken);

        var shop = await _shopRepository.GetByIdAndSellerIdAsync(request.ShopId, seller.SellerId, cancellationToken)
            ?? throw new NotFoundException("Shop", request.ShopId);

        if (!shop.IsActive)
        {
            throw new BusinessException(
                ErrorCodes.BusinessRuleViolation,
                "Shop đang tạm ngưng hoạt động, không thể tạo sản phẩm mới.");
        }

        var category = await _categoryRepository.GetActiveByIdAsNoTrackingAsync(request.CategoryId, cancellationToken)
            ?? throw new NotFoundException("Category", request.CategoryId);

        var utcNow = DateTime.UtcNow;
        var product = new Product
        {
            ShopId = shop.ShopId,
            CategoryId = category.CategoryId,
            ProductName = request.ProductName.Trim(),
            Description = CatalogValidationExtensions.NormalizeOptionalText(request.Description),
            ProductStatus = ProductStatus.Draft,
            CreatedAt = utcNow
        };

        if (request.Images != null)
        {
            foreach (var imageInput in request.Images)
            {
                product.Images.Add(BuildProductImage(imageInput));
            }
        }

        if (request.Variants != null)
        {
            foreach (var variantInput in request.Variants)
            {
                var (sku, barcode) = await ValidateUniqueSkuAndBarcodeAsync(
                    variantInput,
                    excludeVariantId: null,
                    cancellationToken);

                product.Variants.Add(BuildProductVariant(variantInput, sku, barcode, utcNow));
            }
        }

        await _productRepository.AddAsync(product, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var created = await _productRepository.GetByIdForSellerWithDetailsAsync(
            product.ProductId,
            seller.SellerId,
            asNoTracking: true,
            cancellationToken) ?? throw new NotFoundException("Product", product.ProductId);

        return created.ToSellerDetailDto();
    }

    public async Task<SellerProductDetailDto> UpdateProductAsync(
        long productId,
        UpdateProductRequestDto request,
        CancellationToken cancellationToken = default)
    {
        await _updateValidator.ValidateAndThrowAsync(request, cancellationToken);
        var seller = await _approvedSellerResolver.RequireApprovedSellerAsync(cancellationToken);

        var product = await _productRepository.GetByIdForSellerWithDetailsAsync(
            productId,
            seller.SellerId,
            asNoTracking: false,
            cancellationToken) ?? throw new NotFoundException("Product", productId);

        if (product.ProductStatus == ProductStatus.PendingReview)
        {
            throw BusinessException.InvalidStatusTransition(
                "Không thể chỉnh sửa sản phẩm khi đang ở trạng thái PendingReview.");
        }

        if (product.ProductStatus == ProductStatus.Active && request.Images != null && request.Images.Count == 0)
        {
            throw new BusinessException(
                ErrorCodes.BusinessRuleViolation,
                "Sản phẩm đang bán (Active) phải có ít nhất 1 ảnh.");
        }

        var shop = await _shopRepository.GetByIdAndSellerIdAsync(request.ShopId, seller.SellerId, cancellationToken)
            ?? throw new NotFoundException("Shop", request.ShopId);

        if (!shop.IsActive && (product.ProductStatus == ProductStatus.Active || product.ShopId != shop.ShopId))
        {
            throw new BusinessException(
                ErrorCodes.BusinessRuleViolation,
                "Shop đang tạm ngưng hoạt động, không thể gán cho sản phẩm.");
        }

        var category = await _categoryRepository.GetActiveByIdAsNoTrackingAsync(request.CategoryId, cancellationToken)
            ?? throw new NotFoundException("Category", request.CategoryId);

        var utcNow = DateTime.UtcNow;

        if (product.ShopId != shop.ShopId)
        {
            product.Shop = null!;
            product.ShopId = shop.ShopId;
        }

        if (product.CategoryId != category.CategoryId)
        {
            product.Category = null!;
            product.CategoryId = category.CategoryId;
        }

        product.ProductName = request.ProductName.Trim();
        product.Description = CatalogValidationExtensions.NormalizeOptionalText(request.Description);
        product.UpdatedAt = utcNow;

        if (request.Images != null)
        {
            await _unitOfWork.ExecuteInTransactionAsync(async ct =>
            {
                if (product.Images.Count > 0)
                {
                    _productRepository.RemoveImages(product.Images.ToList());
                    product.Images.Clear();
                    await _unitOfWork.SaveChangesAsync(ct);
                }

                foreach (var imageInput in request.Images)
                {
                    product.Images.Add(BuildProductImage(imageInput));
                }

                _productRepository.Update(product);
                await _unitOfWork.SaveChangesAsync(ct);
            }, cancellationToken);
        }
        else
        {
            _productRepository.Update(product);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        var updated = await _productRepository.GetByIdForSellerWithDetailsAsync(
            product.ProductId,
            seller.SellerId,
            asNoTracking: true,
            cancellationToken) ?? throw new NotFoundException("Product", product.ProductId);

        return updated.ToSellerDetailDto();
    }

    public async Task<SellerProductDetailDto> SubmitProductAsync(
        long productId,
        CancellationToken cancellationToken = default)
    {
        var seller = await _approvedSellerResolver.RequireApprovedSellerAsync(cancellationToken);

        var product = await _productRepository.GetByIdForSellerWithDetailsAsync(
            productId,
            seller.SellerId,
            asNoTracking: false,
            cancellationToken) ?? throw new NotFoundException("Product", productId);

        if (product.ProductStatus != ProductStatus.Draft && product.ProductStatus != ProductStatus.Rejected)
        {
            throw BusinessException.InvalidStatusTransition(
                $"Chỉ có thể gửi duyệt sản phẩm ở trạng thái Draft hoặc Rejected (hiện tại: {product.ProductStatus}).");
        }

        var shop = await _shopRepository.GetByIdAndSellerIdAsync(product.ShopId, seller.SellerId, cancellationToken)
            ?? throw new NotFoundException("Shop", product.ShopId);

        CatalogProductRules.EnsureReadyForReviewOrPublish(
            product,
            shop.IsActive,
            seller.Status,
            "gửi duyệt");

        product.ProductStatus = ProductStatus.PendingReview;
        product.RejectReason = null;
        product.UpdatedAt = DateTime.UtcNow;

        _productRepository.Update(product);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var submitted = await _productRepository.GetByIdForSellerWithDetailsAsync(
            product.ProductId,
            seller.SellerId,
            asNoTracking: true,
            cancellationToken) ?? throw new NotFoundException("Product", product.ProductId);

        return submitted.ToSellerDetailDto();
    }

    public async Task<ProductVariantDto> AddVariantAsync(
        long productId,
        UpsertVariantRequestDto request,
        CancellationToken cancellationToken = default)
    {
        await _variantValidator.ValidateAndThrowAsync(request, cancellationToken);
        var seller = await _approvedSellerResolver.RequireApprovedSellerAsync(cancellationToken);

        var product = await _productRepository.GetByIdForSellerWithDetailsAsync(
            productId,
            seller.SellerId,
            asNoTracking: false,
            cancellationToken) ?? throw new NotFoundException("Product", productId);

        if (product.ProductStatus == ProductStatus.PendingReview)
        {
            throw BusinessException.InvalidStatusTransition(
                "Không thể thêm biến thể khi sản phẩm đang chờ duyệt.");
        }

        if (product.Variants.Count >= MaxVariantsPerProduct)
        {
            throw new BusinessException(
                ErrorCodes.BusinessRuleViolation,
                $"Mỗi sản phẩm chỉ hỗ trợ tối đa {MaxVariantsPerProduct} biến thể.");
        }

        var (sku, barcode) = await ValidateUniqueSkuAndBarcodeAsync(request, excludeVariantId: null, cancellationToken);
        var utcNow = DateTime.UtcNow;
        var variant = BuildProductVariant(request, sku, barcode, utcNow);
        variant.ProductId = product.ProductId;

        product.UpdatedAt = utcNow;
        await _productRepository.AddVariantAsync(variant, cancellationToken);
        _productRepository.Update(product);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return variant.ToDto();
    }

    public async Task<ProductVariantDto> UpdateVariantAsync(
        long variantId,
        UpsertVariantRequestDto request,
        CancellationToken cancellationToken = default)
    {
        await _variantValidator.ValidateAndThrowAsync(request, cancellationToken);
        var seller = await _approvedSellerResolver.RequireApprovedSellerAsync(cancellationToken);

        var variant = await _productRepository.GetVariantByIdForSellerAsync(variantId, seller.SellerId, cancellationToken)
            ?? throw new NotFoundException("ProductVariant", variantId);

        if (variant.Product.ProductStatus == ProductStatus.PendingReview)
        {
            throw BusinessException.InvalidStatusTransition(
                "Không thể chỉnh sửa biến thể khi sản phẩm đang chờ duyệt.");
        }

        if (variant.Product.ProductStatus == ProductStatus.Active &&
            !request.IsActive &&
            !variant.Product.Variants.Any(v => v.VariantId != variantId && v.IsActive))
        {
            throw new BusinessException(
                ErrorCodes.BusinessRuleViolation,
                "Không thể tắt biến thể hoạt động cuối cùng của sản phẩm đang bán (Active).");
        }

        var (sku, barcode) = await ValidateUniqueSkuAndBarcodeAsync(request, excludeVariantId: variantId, cancellationToken);
        var utcNow = DateTime.UtcNow;

        variant.SKU = sku;
        variant.Barcode = barcode;
        variant.VariantName = request.VariantName.Trim();
        variant.Price = request.Price;
        variant.WeightGrams = request.WeightGrams;
        variant.IsActive = request.IsActive;
        variant.UpdatedAt = utcNow;
        variant.Product.UpdatedAt = utcNow;

        _productRepository.UpdateVariant(variant);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return variant.ToDto();
    }

    private async Task<(string Sku, string? Barcode)> ValidateUniqueSkuAndBarcodeAsync(
        UpsertVariantRequestDto request,
        long? excludeVariantId,
        CancellationToken cancellationToken)
    {
        var sku = request.SKU.Trim();
        if (await _productRepository.ExistsSkuAsync(sku, excludeVariantId, cancellationToken))
        {
            throw BusinessException.DuplicateSku($"SKU '{sku}' đã tồn tại trong hệ thống.");
        }

        var barcode = CatalogValidationExtensions.NormalizeOptionalText(request.Barcode);
        if (barcode != null && await _productRepository.ExistsBarcodeAsync(barcode, excludeVariantId, cancellationToken))
        {
            throw BusinessException.DuplicateBarcode($"Barcode '{barcode}' đã tồn tại trong hệ thống.");
        }

        return (sku, barcode);
    }

    private static ProductImage BuildProductImage(ProductImageInputDto input) => new()
    {
        ImageUrl = input.ImageUrl.Trim(),
        IsPrimary = input.IsPrimary,
        DisplayOrder = input.DisplayOrder
    };

    private static ProductVariant BuildProductVariant(
        UpsertVariantRequestDto input,
        string sku,
        string? barcode,
        DateTime utcNow) => new()
    {
        SKU = sku,
        Barcode = barcode,
        VariantName = input.VariantName.Trim(),
        Price = input.Price,
        WeightGrams = input.WeightGrams,
        IsActive = input.IsActive,
        CreatedAt = utcNow
    };
}
