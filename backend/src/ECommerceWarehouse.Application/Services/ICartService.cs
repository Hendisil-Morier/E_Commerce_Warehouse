using ECommerceWarehouse.Application.DTOs.Customer;

namespace ECommerceWarehouse.Application.Services;

public interface ICartService
{
    Task<CartDto> GetMyCartAsync(CancellationToken cancellationToken = default);

    Task<CartItemMutationResult> AddItemAsync(
        AddCartItemRequestDto request,
        CancellationToken cancellationToken = default);

    Task<CartDto> UpdateItemQuantityAsync(
        long cartItemId,
        UpdateCartItemRequestDto request,
        CancellationToken cancellationToken = default);

    Task RemoveItemAsync(
        long cartItemId,
        CancellationToken cancellationToken = default);
}
