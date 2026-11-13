using ECommerceWarehouse.Application.DTOs.Catalog;
using ECommerceWarehouse.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerceWarehouse.WebAPI.Controllers.Catalog;

[ApiController]
[Route("api/v1/shops")]
[AllowAnonymous]
public class ShopsController : ControllerBase
{
    private readonly IShopService _shopService;

    public ShopsController(IShopService shopService)
    {
        _shopService = shopService;
    }

    /// <summary>
    /// Xem thông tin công khai của một shop đang hoạt động
    /// </summary>
    [HttpGet("{id:long}")]
    [ProducesResponseType(typeof(PublicShopDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PublicShopDto>> GetPublicShopById(
        long id,
        CancellationToken cancellationToken)
    {
        var result = await _shopService.GetPublicShopByIdAsync(id, cancellationToken);
        return Ok(result);
    }
}

