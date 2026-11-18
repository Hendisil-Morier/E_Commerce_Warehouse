using ECommerceWarehouse.Application.DTOs.Catalog;

namespace ECommerceWarehouse.Application.Services;

public interface IShopService
{
    Task<IReadOnlyList<ShopDto>> GetMyShopsAsync(bool? isActive = null, CancellationToken cancellationToken = default);
    Task<ShopDto> GetMyShopByIdAsync(long shopId, CancellationToken cancellationToken = default);
    Task<ShopDto> CreateShopAsync(CreateShopRequestDto request, CancellationToken cancellationToken = default);
    Task<ShopDto> UpdateShopAsync(long shopId, UpdateShopRequestDto request, CancellationToken cancellationToken = default);
    Task<PublicShopDto> GetPublicShopByIdAsync(long shopId, CancellationToken cancellationToken = default);
}

