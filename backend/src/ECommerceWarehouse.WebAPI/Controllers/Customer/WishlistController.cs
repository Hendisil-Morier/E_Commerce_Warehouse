using ECommerceWarehouse.Application.DTOs.Customer;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerceWarehouse.WebAPI.Controllers.Customer;

[ApiController]
[Route("api/v1/wishlist")]
[Authorize(Policy = RoleNames.Customer)]
[Produces("application/json")]
public class WishlistController : ControllerBase
{
    private readonly IWishlistService _wishlistService;

    public WishlistController(IWishlistService wishlistService)
    {
        _wishlistService = wishlistService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(WishlistDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyWishlist(CancellationToken cancellationToken)
    {
        var result = await _wishlistService.GetMyWishlistAsync(cancellationToken);
        return Ok(result);
    }

    [HttpPost("items")]
    [ProducesResponseType(typeof(WishlistDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AddItem(
        [FromBody] AddWishlistItemRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _wishlistService.AddItemAsync(request, cancellationToken);
        return Ok(result);
    }

    [HttpDelete("items/{productId:long}")]
    [ProducesResponseType(typeof(WishlistDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> RemoveItem(long productId, CancellationToken cancellationToken)
    {
        var result = await _wishlistService.RemoveItemAsync(productId, cancellationToken);
        return Ok(result);
    }
}
