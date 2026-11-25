using FluentValidation;

namespace ECommerceWarehouse.Application.DTOs.Customer;

public class WishlistDto
{
    public long WishlistId { get; set; }
    public string WishlistName { get; set; } = null!;
    public List<WishlistItemDto> Items { get; set; } = [];
}

public class WishlistItemDto
{
    public long WishlistItemId { get; set; }
    public long ProductId { get; set; }
    public string ProductName { get; set; } = null!;
    public decimal? MinPrice { get; set; }
    public string? ThumbnailUrl { get; set; }
    public DateTime AddedAt { get; set; }
}

public class AddWishlistItemRequestDto
{
    public long ProductId { get; set; }
}

public class AddWishlistItemRequestValidator : AbstractValidator<AddWishlistItemRequestDto>
{
    public AddWishlistItemRequestValidator()
    {
        RuleFor(x => x.ProductId).GreaterThan(0);
    }
}
