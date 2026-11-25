using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Order;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerceWarehouse.WebAPI.Controllers.Seller;

[ApiController]
[Route("api/v1/seller/orders")]
[Authorize(Policy = RoleNames.Seller)]
public class SellerOrdersController : ControllerBase
{
    private readonly ISellerOrderService _sellerOrderService;

    public SellerOrdersController(ISellerOrderService sellerOrderService)
    {
        _sellerOrderService = sellerOrderService;
    }

    /// <summary>
    /// Danh sách đơn con (SellerOrders) thuộc shop của Seller đang đăng nhập
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<SellerOrderListItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<PagedResult<SellerOrderListItemDto>>> GetMySellerOrders(
        [FromQuery] SellerOrderQueryDto query,
        CancellationToken cancellationToken)
    {
        var result = await _sellerOrderService.GetMySellerOrdersAsync(query, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Xem chi tiết một đơn con thuộc shop của Seller hiện tại
    /// </summary>
    [HttpGet("{id:long}")]
    [ProducesResponseType(typeof(SellerOrderDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SellerOrderDetailDto>> GetMySellerOrderById(
        long id,
        CancellationToken cancellationToken)
    {
        var result = await _sellerOrderService.GetMySellerOrderByIdAsync(id, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Seller xác nhận đơn con (Pending -> Confirmed) và đồng bộ trạng thái đơn tổng
    /// </summary>
    [HttpPost("{id:long}/confirm")]
    [ProducesResponseType(typeof(SellerOrderDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<SellerOrderDetailDto>> ConfirmSellerOrder(
        long id,
        CancellationToken cancellationToken)
    {
        var result = await _sellerOrderService.ConfirmSellerOrderAsync(id, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Seller hủy đơn con kèm lý do (không hủy được sau Shipped; tự động nhả giữ chỗ tồn kho)
    /// </summary>
    [HttpPost("{id:long}/cancel")]
    [ProducesResponseType(typeof(SellerOrderDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<SellerOrderDetailDto>> CancelSellerOrder(
        long id,
        [FromBody] CancelSellerOrderRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _sellerOrderService.CancelSellerOrderAsync(id, request, cancellationToken);
        return Ok(result);
    }
}
