using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Order;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerceWarehouse.WebAPI.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/refunds")]
[Authorize(Policy = RoleNames.Admin)]
public class AdminRefundsController : ControllerBase
{
    private readonly IRefundService _refundService;

    public AdminRefundsController(IRefundService refundService)
    {
        _refundService = refundService;
    }

    /// <summary>
    /// Danh sách yêu cầu hoàn tiền (lọc theo trạng thái, phân trang)
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<RefundDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<PagedResult<RefundDto>>> GetRefunds(
        [FromQuery] RefundQueryDto query,
        CancellationToken cancellationToken)
    {
        var result = await _refundService.GetRefundsAsync(query, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Admin duyệt yêu cầu hoàn tiền (Pending -> Approved; kiểm tra không vượt số đã thanh toán)
    /// </summary>
    [HttpPost("{id:long}/approve")]
    [ProducesResponseType(typeof(RefundDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<RefundDto>> Approve(
        long id,
        CancellationToken cancellationToken)
    {
        var result = await _refundService.ApproveAsync(id, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Admin từ chối yêu cầu hoàn tiền kèm lý do
    /// </summary>
    [HttpPost("{id:long}/reject")]
    [ProducesResponseType(typeof(RefundDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<RefundDto>> Reject(
        long id,
        [FromBody] RejectRefundRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _refundService.RejectAsync(id, request, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Admin hoàn tất hoàn tiền (Approved -> Completed; cập nhật Payment & đồng bộ ReturnRequest/SellerOrder)
    /// </summary>
    [HttpPost("{id:long}/complete")]
    [ProducesResponseType(typeof(RefundDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<RefundDto>> Complete(
        long id,
        CancellationToken cancellationToken)
    {
        var result = await _refundService.CompleteAsync(id, cancellationToken);
        return Ok(result);
    }
}
