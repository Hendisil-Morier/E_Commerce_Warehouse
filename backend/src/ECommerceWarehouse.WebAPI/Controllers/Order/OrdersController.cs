using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Order;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerceWarehouse.WebAPI.Controllers.Order;

[ApiController]
[Route("api/v1/orders")]
[Authorize(Policy = RoleNames.Customer)]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;

    public OrdersController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    /// <summary>
    /// Đặt hàng đa shop từ giỏ hàng và giữ chỗ tồn kho nguyên tử (bắt buộc header Idempotency-Key)
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(OrderDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<OrderDetailDto>> Checkout(
        [FromHeader(Name = "Idempotency-Key")] string? idempotencyKey,
        [FromBody] CheckoutRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _orderService.CheckoutAsync(idempotencyKey ?? string.Empty, request, cancellationToken);
        return Created($"/api/v1/orders/{result.OrderId}", result);
    }

    /// <summary>
    /// Danh sách đơn hàng của khách hàng đang đăng nhập (phân trang, lọc trạng thái)
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<OrderListItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<PagedResult<OrderListItemDto>>> GetMyOrders(
        [FromQuery] OrderQueryDto query,
        CancellationToken cancellationToken)
    {
        var result = await _orderService.GetMyOrdersAsync(query, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Chi tiết một đơn hàng của khách hàng đang đăng nhập (kèm đơn con theo shop và lịch sử trạng thái)
    /// </summary>
    [HttpGet("{id:long}")]
    [ProducesResponseType(typeof(OrderDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<OrderDetailDto>> GetMyOrderById(
        long id,
        CancellationToken cancellationToken)
    {
        var result = await _orderService.GetMyOrderByIdAsync(id, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Khách hàng hủy đơn hàng khi chưa bàn giao vận chuyển (tự động nhả giữ chỗ tồn kho)
    /// </summary>
    [HttpPost("{id:long}/cancel")]
    [ProducesResponseType(typeof(OrderDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<OrderDetailDto>> CancelMyOrder(
        long id,
        [FromBody] CancelOrderRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _orderService.CancelMyOrderAsync(id, request, cancellationToken);
        return Ok(result);
    }
}
