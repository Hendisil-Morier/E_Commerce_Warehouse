using ECommerceWarehouse.Application.DTOs.Catalog;
using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerceWarehouse.WebAPI.Controllers.Catalog;

[ApiController]
[Route("api/v1/products")]
[AllowAnonymous]
public class ProductsController : ControllerBase
{
    private readonly ICatalogProductService _catalogProductService;

    public ProductsController(ICatalogProductService catalogProductService)
    {
        _catalogProductService = catalogProductService;
    }

    /// <summary>
    /// Danh sách sản phẩm công khai đang bán (lọc categoryId, shopId, q, minPrice, maxPrice, inStockOnly; sort=-createdAt|price|-price)
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<PublicProductListItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PagedResult<PublicProductListItemDto>>> GetPublicProducts(
        [FromQuery] PublicProductQueryDto query,
        CancellationToken cancellationToken)
    {
        var result = await _catalogProductService.GetPublicProductsAsync(query, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Xem chi tiết sản phẩm công khai (ảnh, thông tin shop, các biến thể kèm giá và tồn khả dụng)
    /// </summary>
    [HttpGet("{id:long}")]
    [ProducesResponseType(typeof(PublicProductDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PublicProductDetailDto>> GetPublicProductById(
        long id,
        CancellationToken cancellationToken)
    {
        var result = await _catalogProductService.GetPublicProductByIdAsync(id, cancellationToken);
        return Ok(result);
    }
}

