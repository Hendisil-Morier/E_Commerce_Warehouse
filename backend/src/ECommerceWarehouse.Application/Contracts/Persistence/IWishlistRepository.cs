using ECommerceWarehouse.Application.DTOs.Customer;
using ECommerceWarehouse.Domain.Entities.Customer;

namespace ECommerceWarehouse.Application.Contracts.Persistence;

public interface IWishlistRepository
{
    Task<WishlistDto?> GetWishlistDtoAsync(long userId, CancellationToken cancellationToken = default);
    Task<Wishlist?> GetByUserIdWithItemsAsync(long userId, CancellationToken cancellationToken = default);
    Task<bool> ActiveProductExistsAsync(long productId, CancellationToken cancellationToken = default);
    Task AddWishlistAsync(Wishlist wishlist, CancellationToken cancellationToken = default);
    void RemoveItem(WishlistItem item);
}
