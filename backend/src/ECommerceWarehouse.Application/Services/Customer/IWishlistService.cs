using ECommerceWarehouse.Application.DTOs.Customer;

namespace ECommerceWarehouse.Application.Services;

public interface IWishlistService
{
    Task<WishlistDto> GetMyWishlistAsync(CancellationToken cancellationToken = default);
    Task<WishlistDto> AddItemAsync(AddWishlistItemRequestDto request, CancellationToken cancellationToken = default);
    Task<WishlistDto> RemoveItemAsync(long productId, CancellationToken cancellationToken = default);
}
