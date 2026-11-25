using ECommerceWarehouse.Application.DTOs.Order;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerceWarehouse.WebAPI.Controllers.Order;

[ApiController]
[Route("api/v1/orders/{orderId:long}/payments")]
[Authorize(Policy = RoleNames.Customer)]
public class PaymentsController : ControllerBase
{
    private readonly IOrderService _orderService;

    public PaymentsController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    /// <summary>
    /// Khởi tạo hoặc xác nhận thanh toán COD cho đơn hàng của khách hàng hiện tại
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(PaymentDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<PaymentDto>> CreatePayment(
        long orderId,
        [FromBody] CreatePaymentRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _orderService.CreateCodPaymentAsync(orderId, request, cancellationToken);
        return Created($"/api/v1/orders/{orderId}/payments/{result.PaymentId}", result);
    }
}
