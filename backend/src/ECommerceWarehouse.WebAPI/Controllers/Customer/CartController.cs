using ECommerceWarehouse.Application.DTOs.Customer;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerceWarehouse.WebAPI.Controllers.Customer;

[ApiController]
[Route("api/v1/cart")]
[Authorize(Policy = RoleNames.Customer)]
public class CartController : ControllerBase
{
    private readonly ICartService _cartService;

    public CartController(ICartService cartService)
    {
        _cartService = cartService;
    }

    /// <summary>
    /// Lấy giỏ hàng hiện tại của khách hàng đang đăng nhập (nhóm theo shop, kèm đơn giá và cảnh báo tồn khả dụng tham khảo)
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(CartDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<CartDto>> GetMyCart(CancellationToken cancellationToken)
    {
        var result = await _cartService.GetMyCartAsync(cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Thêm biến thể sản phẩm vào giỏ hàng (tạo mới dòng giỏ hàng trả 201, cộng dồn vào dòng đã có trả 200)
    /// </summary>
    [HttpPost("items")]
    [ProducesResponseType(typeof(CartDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(CartDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<CartDto>> AddItem(
        [FromBody] AddCartItemRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _cartService.AddItemAsync(request, cancellationToken);
        return result.IsCreated
            ? Created($"/api/v1/cart/items/{result.CartItemId}", result.Cart)
            : Ok(result.Cart);
    }

    /// <summary>
    /// Cập nhật số lượng của một dòng hàng trong giỏ hàng của khách hàng hiện tại
    /// </summary>
    [HttpPut("items/{id:long}")]
    [ProducesResponseType(typeof(CartDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<CartDto>> UpdateItemQuantity(
        long id,
        [FromBody] UpdateCartItemRequestDto request,
        CancellationToken cancellationToken)
    {
        var updated = await _cartService.UpdateItemQuantityAsync(id, request, cancellationToken);
        return Ok(updated);
    }

    /// <summary>
    /// Xóa một dòng hàng khỏi giỏ hàng của khách hàng hiện tại
    /// </summary>
    [HttpDelete("items/{id:long}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> RemoveItem(
        long id,
        CancellationToken cancellationToken)
    {
        await _cartService.RemoveItemAsync(id, cancellationToken);
        return NoContent();
    }
}
