using ECommerceWarehouse.Application.DTOs.Catalog;
using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerceWarehouse.WebAPI.Controllers.Seller;

[ApiController]
[Route("api/v1/seller/products")]
[Authorize(Policy = RoleNames.Seller)]
public class SellerProductsController : ControllerBase
{
    private readonly ISellerProductService _sellerProductService;

    public SellerProductsController(ISellerProductService sellerProductService)
    {
        _sellerProductService = sellerProductService;
    }

    /// <summary>
    /// Danh sách sản phẩm thuộc các shop của người bán hiện tại
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<SellerProductListItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<PagedResult<SellerProductListItemDto>>> GetMyProducts(
        [FromQuery] SellerProductQueryDto query,
        CancellationToken cancellationToken)
    {
        var result = await _sellerProductService.GetMyProductsAsync(query, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Xem chi tiết một sản phẩm thuộc sở hữu của người bán hiện tại
    /// </summary>
    [HttpGet("{id:long}")]
    [ProducesResponseType(typeof(SellerProductDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<SellerProductDetailDto>> GetMyProductById(
        long id,
        CancellationToken cancellationToken)
    {
        var result = await _sellerProductService.GetMyProductByIdAsync(id, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Tạo sản phẩm mới ở trạng thái Draft (kèm danh sách ảnh và biến thể ban đầu nếu có)
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(SellerProductDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<SellerProductDetailDto>> Create(
        [FromBody] CreateProductRequestDto request,
        CancellationToken cancellationToken)
    {
        var created = await _sellerProductService.CreateProductAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetMyProductById), new { id = created.ProductId }, created);
    }

    /// <summary>
    /// Cập nhật thông tin sản phẩm (không cho phép sửa khi đang PendingReview)
    /// </summary>
    [HttpPut("{id:long}")]
    [ProducesResponseType(typeof(SellerProductDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<SellerProductDetailDto>> Update(
        long id,
        [FromBody] UpdateProductRequestDto request,
        CancellationToken cancellationToken)
    {
        var updated = await _sellerProductService.UpdateProductAsync(id, request, cancellationToken);
        return Ok(updated);
    }

    /// <summary>
    /// Gửi duyệt sản phẩm (Draft hoặc Rejected -> PendingReview)
    /// </summary>
    [HttpPost("{id:long}/submit")]
    [ProducesResponseType(typeof(SellerProductDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<SellerProductDetailDto>> Submit(
        long id,
        CancellationToken cancellationToken)
    {
        var submitted = await _sellerProductService.SubmitProductAsync(id, cancellationToken);
        return Ok(submitted);
    }

    /// <summary>
    /// Thêm biến thể (SKU, giá, barcode) cho sản phẩm của người bán hiện tại
    /// </summary>
    [HttpPost("{id:long}/variants")]
    [ProducesResponseType(typeof(ProductVariantDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ProductVariantDto>> AddVariant(
        long id,
        [FromBody] UpsertVariantRequestDto request,
        CancellationToken cancellationToken)
    {
        var created = await _sellerProductService.AddVariantAsync(id, request, cancellationToken);
        return Created($"/api/v1/seller/variants/{created.VariantId}", created);
    }
}

