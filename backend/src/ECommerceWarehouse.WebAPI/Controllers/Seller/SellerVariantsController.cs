using ECommerceWarehouse.Application.DTOs.Catalog;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerceWarehouse.WebAPI.Controllers.Seller;

[ApiController]
[Route("api/v1/seller/variants")]
[Authorize(Policy = RoleNames.Seller)]
public class SellerVariantsController : ControllerBase
{
    private readonly ISellerProductService _sellerProductService;

    public SellerVariantsController(ISellerProductService sellerProductService)
    {
        _sellerProductService = sellerProductService;
    }

    /// <summary>
    /// Cập nhật thông tin biến thể (SKU, barcode, giá, trạng thái hoạt động) thuộc shop của người bán
    /// </summary>
    [HttpPut("{id:long}")]
    [ProducesResponseType(typeof(ProductVariantDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ProductVariantDto>> Update(
        long id,
        [FromBody] UpsertVariantRequestDto request,
        CancellationToken cancellationToken)
    {
        var updated = await _sellerProductService.UpdateVariantAsync(id, request, cancellationToken);
        return Ok(updated);
    }
}

