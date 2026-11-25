using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Order;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerceWarehouse.WebAPI.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/orders")]
[Authorize(Policy = RoleNames.Admin)]
public class AdminOrdersController : ControllerBase
{
    private readonly IOrderService _orderService;

    public AdminOrdersController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    /// <summary>
    /// Tra cứu toàn bộ đơn hàng trên sàn (lọc trạng thái, ngày, mã đơn/khách hàng)
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<OrderListItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<PagedResult<OrderListItemDto>>> GetOrders(
        [FromQuery] AdminOrderQueryDto query,
        CancellationToken cancellationToken)
    {
        var result = await _orderService.GetAdminOrdersAsync(query, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Xem chi tiết một đơn tổng kèm các đơn con, thanh toán và lịch sử trạng thái
    /// </summary>
    [HttpGet("{id:long}")]
    [ProducesResponseType(typeof(OrderDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<OrderDetailDto>> GetOrderById(
        long id,
        CancellationToken cancellationToken)
    {
        var result = await _orderService.GetAdminOrderByIdAsync(id, cancellationToken);
        return Ok(result);
    }
}
