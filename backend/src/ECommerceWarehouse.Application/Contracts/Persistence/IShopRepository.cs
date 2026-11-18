using ECommerceWarehouse.Domain.Entities.Seller;

namespace ECommerceWarehouse.Application.Contracts.Persistence;

public interface IShopRepository
{
    Task<IReadOnlyList<Shop>> GetBySellerIdAsNoTrackingAsync(
        long sellerId,
        bool? isActive = null,
        CancellationToken cancellationToken = default);

    Task<Shop?> GetByIdAndSellerIdAsync(
        long shopId,
        long sellerId,
        CancellationToken cancellationToken = default);

    Task<Shop?> GetPublicActiveByIdWithSellerAsNoTrackingAsync(
        long shopId,
        CancellationToken cancellationToken = default);

    Task<int> CountActiveProductsByShopIdAsync(
        long shopId,
        CancellationToken cancellationToken = default);

    Task<bool> ExistsShopNameForSellerAsync(
        long sellerId,
        string shopName,
        long? excludeShopId = null,
        CancellationToken cancellationToken = default);

    Task AddAsync(Shop shop, CancellationToken cancellationToken = default);

    void Update(Shop shop);
}

