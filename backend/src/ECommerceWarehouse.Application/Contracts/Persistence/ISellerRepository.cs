using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Seller;
using ECommerceWarehouse.Domain.Entities.Seller;

namespace ECommerceWarehouse.Application.Contracts.Persistence;

public interface ISellerRepository
{
    Task<Seller?> GetByIdWithUserAsync(long sellerId, CancellationToken cancellationToken = default);
    Task<Seller?> GetByUserIdWithUserAsync(long userId, CancellationToken cancellationToken = default);
    Task<Seller?> GetByUserIdWithUserAsNoTrackingAsync(long userId, CancellationToken cancellationToken = default);
    Task<PagedResult<Seller>> GetPagedAsync(SellerListQueryDto query, CancellationToken cancellationToken = default);
    Task AddAsync(Seller seller, CancellationToken cancellationToken = default);
    void Update(Seller seller);
}

