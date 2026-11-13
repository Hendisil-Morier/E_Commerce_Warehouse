using ECommerceWarehouse.Application.DTOs.Catalog;
using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerceWarehouse.WebAPI.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/products")]
[Authorize(Policy = RoleNames.Admin)]
public class AdminProductsController : ControllerBase
{
    private readonly IAdminProductService _adminProductService;

    public AdminProductsController(IAdminProductService adminProductService)
    {
        _adminProductService = adminProductService;
    }

    /// <summary>
    /// Danh sách sản phẩm phục vụ hàng đợi duyệt của Admin
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<AdminProductListItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<PagedResult<AdminProductListItemDto>>> GetProducts(
        [FromQuery] AdminProductQueryDto query,
        CancellationToken cancellationToken)
    {
        var result = await _adminProductService.GetAdminProductsAsync(query, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Xem chi tiết sản phẩm (ảnh, biến thể, shop) trong hàng đợi duyệt Admin
    /// </summary>
    [HttpGet("{id:long}")]
    [ProducesResponseType(typeof(AdminProductDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AdminProductDetailDto>> GetProductById(
        long id,
        CancellationToken cancellationToken)
    {
        var result = await _adminProductService.GetAdminProductByIdAsync(id, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Phê duyệt sản phẩm (PendingReview -> Active)
    /// </summary>
    [HttpPost("{id:long}/approve")]
    [ProducesResponseType(typeof(AdminProductDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AdminProductDetailDto>> Approve(
        long id,
        CancellationToken cancellationToken)
    {
        var approved = await _adminProductService.ApproveAsync(id, cancellationToken);
        return Ok(approved);
    }

    /// <summary>
    /// Từ chối sản phẩm kèm lý do (PendingReview -> Rejected)
    /// </summary>
    [HttpPost("{id:long}/reject")]
    [ProducesResponseType(typeof(AdminProductDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AdminProductDetailDto>> Reject(
        long id,
        [FromBody] RejectProductRequestDto request,
        CancellationToken cancellationToken)
    {
        var rejected = await _adminProductService.RejectAsync(id, request, cancellationToken);
        return Ok(rejected);
    }
}

