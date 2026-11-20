using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.Contracts.Services;
using ECommerceWarehouse.Application.DTOs.Customer;
using ECommerceWarehouse.Application.Mappings;
using ECommerceWarehouse.Domain.Entities.Catalog;
using ECommerceWarehouse.Domain.Entities.Customer;
using ECommerceWarehouse.Domain.Exceptions;
using FluentValidation;
using Microsoft.Extensions.Logging;

namespace ECommerceWarehouse.Application.Services;

public class CartService : ICartService
{
    private readonly ICartRepository _cartRepository;
    private readonly IProductRepository _productRepository;
    private readonly ICurrentUser _currentUser;
    private readonly IValidator<AddCartItemRequestDto> _addValidator;
    private readonly IValidator<UpdateCartItemRequestDto> _updateValidator;
    private readonly ILogger<CartService> _logger;

    public CartService(
        ICartRepository cartRepository,
        IProductRepository productRepository,
        ICurrentUser currentUser,
        IValidator<AddCartItemRequestDto> addValidator,
        IValidator<UpdateCartItemRequestDto> updateValidator,
        ILogger<CartService> logger)
    {
        _cartRepository = cartRepository;
        _productRepository = productRepository;
        _currentUser = currentUser;
        _addValidator = addValidator;
        _updateValidator = updateValidator;
        _logger = logger;
    }

    public async Task<CartDto> GetMyCartAsync(CancellationToken cancellationToken = default)
    {
        var userId = RequireAuthenticatedUserId();
        return await BuildCartDtoAsync(userId, cancellationToken);
    }

    public async Task<CartItemMutationResult> AddItemAsync(
        AddCartItemRequestDto request,
        CancellationToken cancellationToken = default)
    {
        await _addValidator.ValidateAndThrowAsync(request, cancellationToken);

        var userId = RequireAuthenticatedUserId();

        var variant = await _cartRepository.GetVariantWithCatalogAsNoTrackingAsync(request.VariantId, cancellationToken)
            ?? throw new NotFoundException("ProductVariant", request.VariantId);

        EnsureVariantIsSellable(variant);

        var cart = await _cartRepository.GetByUserIdWithItemsAsync(userId, cancellationToken);
        var existingItem = cart?.Items.FirstOrDefault(i => i.VariantId == request.VariantId);

        var targetQuantityLong = existingItem != null
            ? (long)existingItem.Quantity + request.Quantity
            : request.Quantity;

        // Kiểm tra tồn kho mang tính tham khảo từ vw_VariantAvailability, tuyệt đối không giữ chỗ tồn kho.
        await EnsureReferenceStockSufficientAsync(variant, targetQuantityLong, cancellationToken);

        var targetQuantity = (int)targetQuantityLong;
        var utcNow = DateTime.UtcNow;
        CartItem mutatedItem;
        bool isCreated;

        if (cart == null)
        {
            cart = new Cart
            {
                UserId = userId,
                CreatedAt = utcNow,
                UpdatedAt = utcNow
            };

            mutatedItem = new CartItem
            {
                Cart = cart,
                VariantId = variant.VariantId,
                Quantity = targetQuantity,
                AddedAt = utcNow
            };

            cart.Items.Add(mutatedItem);
            await _cartRepository.AddCartAsync(cart, cancellationToken);
            isCreated = true;
        }
        else if (existingItem == null)
        {
            mutatedItem = new CartItem
            {
                CartId = cart.CartId,
                VariantId = variant.VariantId,
                Quantity = targetQuantity,
                AddedAt = utcNow
            };

            cart.UpdatedAt = utcNow;
            await _cartRepository.AddCartItemAsync(mutatedItem, cancellationToken);
            isCreated = true;
        }
        else
        {
            existingItem.Quantity = targetQuantity;
            cart.UpdatedAt = utcNow;
            mutatedItem = existingItem;
            isCreated = false;
        }

        await _cartRepository.SaveChangesHandlingConcurrencyAsync(cancellationToken);

        _logger.LogInformation(
            "User {UserId} {Action} variant {VariantId} in cart with total quantity {Quantity}.",
            userId,
            isCreated ? "added" : "merged",
            variant.VariantId,
            targetQuantity);

        var updatedCart = await BuildCartDtoAsync(userId, cancellationToken);
        return new CartItemMutationResult(updatedCart, mutatedItem.CartItemId, isCreated);
    }

    public async Task<CartDto> UpdateItemQuantityAsync(
        long cartItemId,
        UpdateCartItemRequestDto request,
        CancellationToken cancellationToken = default)
    {
        await _updateValidator.ValidateAndThrowAsync(request, cancellationToken);

        var userId = RequireAuthenticatedUserId();

        var cartItem = await _cartRepository.GetItemByIdForUserWithCatalogAsync(cartItemId, userId, cancellationToken)
            ?? throw new NotFoundException("CartItem", cartItemId);

        EnsureVariantIsSellable(cartItem.Variant);

        // Kiểm tra tồn kho mang tính tham khảo từ vw_VariantAvailability, tuyệt đối không giữ chỗ tồn kho.
        await EnsureReferenceStockSufficientAsync(cartItem.Variant, request.Quantity, cancellationToken);

        cartItem.Quantity = request.Quantity;
        cartItem.Cart.UpdatedAt = DateTime.UtcNow;

        await _cartRepository.SaveChangesHandlingConcurrencyAsync(cancellationToken);

        _logger.LogInformation(
            "User {UserId} updated cart item {CartItemId} (variant {VariantId}) to quantity {Quantity}.",
            userId,
            cartItemId,
            cartItem.VariantId,
            request.Quantity);

        return await BuildCartDtoAsync(userId, cancellationToken);
    }

    public async Task RemoveItemAsync(
        long cartItemId,
        CancellationToken cancellationToken = default)
    {
        var userId = RequireAuthenticatedUserId();

        var cartItem = await _cartRepository.GetItemByIdForUserAsync(cartItemId, userId, cancellationToken)
            ?? throw new NotFoundException("CartItem", cartItemId);

        cartItem.Cart.UpdatedAt = DateTime.UtcNow;
        _cartRepository.RemoveCartItem(cartItem);

        await _cartRepository.SaveChangesHandlingConcurrencyAsync(cancellationToken);

        _logger.LogInformation(
            "User {UserId} removed cart item {CartItemId} (variant {VariantId}).",
            userId,
            cartItemId,
            cartItem.VariantId);
    }

    private async Task<CartDto> BuildCartDtoAsync(long userId, CancellationToken cancellationToken)
    {
        var cart = await _cartRepository.GetByUserIdWithDetailsAsNoTrackingAsync(userId, cancellationToken);
        if (cart == null)
        {
            return CartMapping.CreateEmptyCartDto();
        }

        var variantIds = cart.Items
            .Select(i => i.VariantId)
            .Distinct()
            .ToList();

        var availabilityMap = variantIds.Count == 0
            ? new Dictionary<long, int>()
            : await _productRepository.GetVariantAvailabilityByIdsAsync(variantIds, cancellationToken);

        return cart.ToDto(availabilityMap);
    }

    private async Task EnsureReferenceStockSufficientAsync(
        ProductVariant variant,
        long requestedQuantity,
        CancellationToken cancellationToken)
    {
        var availabilityMap = await _productRepository.GetVariantAvailabilityByIdsAsync(
            [variant.VariantId],
            cancellationToken);

        var availableQuantity = availabilityMap.TryGetValue(variant.VariantId, out var qty) && qty > 0
            ? qty
            : 0;

        if (availableQuantity <= 0)
        {
            throw BusinessException.InsufficientStock(
                $"Biến thể '{variant.SKU}' hiện đã hết hàng.");
        }

        if (requestedQuantity > availableQuantity)
        {
            throw BusinessException.InsufficientStock(
                $"Biến thể '{variant.SKU}' chỉ còn {availableQuantity}, bạn yêu cầu {requestedQuantity}.");
        }
    }

    private static void EnsureVariantIsSellable(ProductVariant variant)
    {
        if (CartMapping.IsVariantSellable(variant))
        {
            return;
        }

        var message = !variant.IsActive
            ? "Phân loại sản phẩm này hiện không còn bán."
            : "Sản phẩm hiện không còn kinh doanh.";

        throw BusinessException.ProductNotAvailable(message);
    }

    private long RequireAuthenticatedUserId()
    {
        if (!_currentUser.IsAuthenticated || !_currentUser.UserId.HasValue)
        {
            throw BusinessException.Unauthorized();
        }

        return _currentUser.UserId.Value;
    }
}
