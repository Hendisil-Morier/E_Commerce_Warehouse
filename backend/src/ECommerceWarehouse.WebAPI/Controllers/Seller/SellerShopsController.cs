using ECommerceWarehouse.Application.DTOs.Catalog;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerceWarehouse.WebAPI.Controllers.Seller;

[ApiController]
[Route("api/v1/seller/shops")]
[Authorize(Policy = RoleNames.Seller)]
public class SellerShopsController : ControllerBase
{
    private readonly IShopService _shopService;

    public SellerShopsController(IShopService shopService)
    {
        _shopService = shopService;
    }

    /// <summary>
    /// Danh sách shop thuộc quyền quản lý của người bán hiện tại
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<ShopDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<IReadOnlyList<ShopDto>>> GetMyShops(
        [FromQuery] bool? isActive,
        CancellationToken cancellationToken)
    {
        var result = await _shopService.GetMyShopsAsync(isActive, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Xem chi tiết một shop thuộc sở hữu của người bán hiện tại
    /// </summary>
    [HttpGet("{id:long}")]
    [ProducesResponseType(typeof(ShopDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ShopDto>> GetMyShopById(
        long id,
        CancellationToken cancellationToken)
    {
        var result = await _shopService.GetMyShopByIdAsync(id, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Tạo shop mới cho người bán đã được duyệt
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ShopDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ShopDto>> Create(
        [FromBody] CreateShopRequestDto request,
        CancellationToken cancellationToken)
    {
        var created = await _shopService.CreateShopAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetMyShopById), new { id = created.ShopId }, created);
    }

    /// <summary>
    /// Cập nhật thông tin shop thuộc sở hữu của người bán hiện tại
    /// </summary>
    [HttpPut("{id:long}")]
    [ProducesResponseType(typeof(ShopDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ShopDto>> Update(
        long id,
        [FromBody] UpdateShopRequestDto request,
        CancellationToken cancellationToken)
    {
        var updated = await _shopService.UpdateShopAsync(id, request, cancellationToken);
        return Ok(updated);
    }
}

