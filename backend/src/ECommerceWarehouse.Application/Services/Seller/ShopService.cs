using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.Contracts.Services;
using ECommerceWarehouse.Application.DTOs.Catalog;
using ECommerceWarehouse.Application.Mappings;
using ECommerceWarehouse.Application.Validators.Catalog;
using ECommerceWarehouse.Domain.Entities.Seller;
using ECommerceWarehouse.Domain.Exceptions;
using FluentValidation;

namespace ECommerceWarehouse.Application.Services;

public class ShopService : IShopService
{
    private readonly IShopRepository _shopRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IApprovedSellerResolver _approvedSellerResolver;
    private readonly IValidator<CreateShopRequestDto> _createValidator;
    private readonly IValidator<UpdateShopRequestDto> _updateValidator;

    public ShopService(
        IShopRepository shopRepository,
        IUnitOfWork unitOfWork,
        IApprovedSellerResolver approvedSellerResolver,
        IValidator<CreateShopRequestDto> createValidator,
        IValidator<UpdateShopRequestDto> updateValidator)
    {
        _shopRepository = shopRepository;
        _unitOfWork = unitOfWork;
        _approvedSellerResolver = approvedSellerResolver;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
    }

    public async Task<IReadOnlyList<ShopDto>> GetMyShopsAsync(
        bool? isActive = null,
        CancellationToken cancellationToken = default)
    {
        var seller = await _approvedSellerResolver.RequireApprovedSellerAsync(cancellationToken);
        var shops = await _shopRepository.GetBySellerIdAsNoTrackingAsync(seller.SellerId, isActive, cancellationToken);
        return shops.Select(s => s.ToDto()).ToList();
    }

    public async Task<ShopDto> GetMyShopByIdAsync(long shopId, CancellationToken cancellationToken = default)
    {
        var seller = await _approvedSellerResolver.RequireApprovedSellerAsync(cancellationToken);
        var shop = await _shopRepository.GetByIdAndSellerIdAsync(shopId, seller.SellerId, cancellationToken)
            ?? throw new NotFoundException("Shop", shopId);

        return shop.ToDto();
    }

    public async Task<ShopDto> CreateShopAsync(
        CreateShopRequestDto request,
        CancellationToken cancellationToken = default)
    {
        await _createValidator.ValidateAndThrowAsync(request, cancellationToken);

        var seller = await _approvedSellerResolver.RequireApprovedSellerAsync(cancellationToken);
        var shopName = request.ShopName.Trim();

        await EnsureUniqueShopNameAsync(seller.SellerId, shopName, excludeShopId: null, cancellationToken);

        var shop = new Shop
        {
            SellerId = seller.SellerId,
            ShopName = shopName,
            Description = CatalogValidationExtensions.NormalizeOptionalText(request.Description),
            LogoUrl = CatalogValidationExtensions.NormalizeOptionalText(request.LogoUrl),
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        await _shopRepository.AddAsync(shop, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return shop.ToDto();
    }

    public async Task<ShopDto> UpdateShopAsync(
        long shopId,
        UpdateShopRequestDto request,
        CancellationToken cancellationToken = default)
    {
        await _updateValidator.ValidateAndThrowAsync(request, cancellationToken);

        var seller = await _approvedSellerResolver.RequireApprovedSellerAsync(cancellationToken);
        var shop = await _shopRepository.GetByIdAndSellerIdAsync(shopId, seller.SellerId, cancellationToken)
            ?? throw new NotFoundException("Shop", shopId);

        var shopName = request.ShopName.Trim();
        await EnsureUniqueShopNameAsync(seller.SellerId, shopName, excludeShopId: shopId, cancellationToken);

        shop.ShopName = shopName;
        shop.Description = CatalogValidationExtensions.NormalizeOptionalText(request.Description);
        shop.LogoUrl = CatalogValidationExtensions.NormalizeOptionalText(request.LogoUrl);
        shop.IsActive = request.IsActive;
        shop.UpdatedAt = DateTime.UtcNow;

        _shopRepository.Update(shop);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return shop.ToDto();
    }

    public async Task<PublicShopDto> GetPublicShopByIdAsync(long shopId, CancellationToken cancellationToken = default)
    {
        var shop = await _shopRepository.GetPublicActiveByIdWithSellerAsNoTrackingAsync(shopId, cancellationToken)
            ?? throw new NotFoundException("Shop", shopId);

        var activeProductCount = await _shopRepository.CountActiveProductsByShopIdAsync(shopId, cancellationToken);
        return shop.ToPublicDto(activeProductCount);
    }

    private async Task EnsureUniqueShopNameAsync(
        long sellerId,
        string shopName,
        long? excludeShopId,
        CancellationToken cancellationToken)
    {
        if (await _shopRepository.ExistsShopNameForSellerAsync(sellerId, shopName, excludeShopId, cancellationToken))
        {
            throw BusinessException.ShopNameAlreadyExists($"Bạn đã có một shop tên '{shopName}'.");
        }
    }
}

