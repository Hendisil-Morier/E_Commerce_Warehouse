using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.Contracts.Services;
using ECommerceWarehouse.Application.DTOs.Customer;
using ECommerceWarehouse.Domain.Entities.Customer;
using ECommerceWarehouse.Domain.Exceptions;
using FluentValidation;

namespace ECommerceWarehouse.Application.Services;

public class WishlistService : IWishlistService
{
    private readonly IWishlistRepository _wishlistRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUser _currentUser;
    private readonly IValidator<AddWishlistItemRequestDto> _addValidator;

    public WishlistService(
        IWishlistRepository wishlistRepository,
        IUnitOfWork unitOfWork,
        ICurrentUser currentUser,
        IValidator<AddWishlistItemRequestDto> addValidator)
    {
        _wishlistRepository = wishlistRepository;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _addValidator = addValidator;
    }

    public async Task<WishlistDto> GetMyWishlistAsync(CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId ?? throw BusinessException.Unauthorized();
        return await _wishlistRepository.GetWishlistDtoAsync(userId, cancellationToken)
            ?? new WishlistDto { WishlistId = 0, WishlistName = "Yêu thích", Items = [] };
    }

    public async Task<WishlistDto> AddItemAsync(
        AddWishlistItemRequestDto request,
        CancellationToken cancellationToken = default)
    {
        await _addValidator.ValidateAndThrowAsync(request, cancellationToken);
        var userId = _currentUser.UserId ?? throw BusinessException.Unauthorized();

        if (!await _wishlistRepository.ActiveProductExistsAsync(request.ProductId, cancellationToken))
        {
            throw new NotFoundException("Product", request.ProductId);
        }

        var wishlist = await _wishlistRepository.GetByUserIdWithItemsAsync(userId, cancellationToken);
        if (wishlist == null)
        {
            wishlist = new Wishlist
            {
                UserId = userId,
                WishlistName = "Yêu thích",
                CreatedAt = DateTime.UtcNow
            };
            await _wishlistRepository.AddWishlistAsync(wishlist, cancellationToken);
        }

        if (!wishlist.Items.Any(i => i.ProductId == request.ProductId))
        {
            wishlist.Items.Add(new WishlistItem
            {
                ProductId = request.ProductId,
                AddedAt = DateTime.UtcNow
            });
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return await GetMyWishlistAsync(cancellationToken);
    }

    public async Task<WishlistDto> RemoveItemAsync(long productId, CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId ?? throw BusinessException.Unauthorized();
        var wishlist = await _wishlistRepository.GetByUserIdWithItemsAsync(userId, cancellationToken);

        var item = wishlist?.Items.FirstOrDefault(i => i.ProductId == productId);
        if (item != null)
        {
            _wishlistRepository.RemoveItem(item);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        return await GetMyWishlistAsync(cancellationToken);
    }
}
