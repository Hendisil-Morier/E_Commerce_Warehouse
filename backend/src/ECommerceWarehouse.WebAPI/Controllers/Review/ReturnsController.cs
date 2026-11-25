using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Review;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerceWarehouse.WebAPI.Controllers.Review;

[ApiController]
[Route("api/v1")]
public class ReturnsController : ControllerBase
{
    private readonly IReturnService _returnService;

    public ReturnsController(IReturnService returnService)
    {
        _returnService = returnService;
    }

    /// <summary>
    /// Khách hàng tạo yêu cầu trả hàng cho đơn con đã giao (Delivered)
    /// </summary>
    [HttpPost("seller-orders/{sellerOrderId:long}/returns")]
    [Authorize(Policy = RoleNames.Customer)]
    [ProducesResponseType(typeof(ReturnRequestDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ReturnRequestDto>> CreateReturnRequest(
        long sellerOrderId,
        [FromBody] CreateReturnRequestDto request,
        CancellationToken cancellationToken)
    {
        var created = await _returnService.CreateReturnRequestAsync(sellerOrderId, request, cancellationToken);
        return Created($"/api/v1/returns/{created.ReturnRequestId}", created);
    }

    /// <summary>
    /// Danh sách yêu cầu trả hàng (phân quyền theo Customer / Seller / Kho / Admin)
    /// </summary>
    [HttpGet("returns")]
    [Authorize]
    [ProducesResponseType(typeof(PagedResult<ReturnRequestDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<PagedResult<ReturnRequestDto>>> GetReturns(
        [FromQuery] ReturnQueryDto query,
        CancellationToken cancellationToken)
    {
        var result = await _returnService.GetReturnsAsync(query, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Chi tiết yêu cầu trả hàng
    /// </summary>
    [HttpGet("returns/{id:long}")]
    [Authorize]
    [ProducesResponseType(typeof(ReturnRequestDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ReturnRequestDto>> GetReturnById(
        long id,
        CancellationToken cancellationToken)
    {
        var result = await _returnService.GetReturnByIdAsync(id, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Seller hoặc Admin duyệt yêu cầu trả hàng (Requested -> Approved)
    /// </summary>
    [HttpPost("returns/{id:long}/approve")]
    [Authorize(Roles = $"{RoleNames.Seller},{RoleNames.Admin}")]
    [ProducesResponseType(typeof(ReturnRequestDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ReturnRequestDto>> Approve(
        long id,
        CancellationToken cancellationToken)
    {
        var result = await _returnService.ApproveAsync(id, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Seller hoặc Admin từ chối yêu cầu trả hàng kèm lý do (Requested -> Rejected)
    /// </summary>
    [HttpPost("returns/{id:long}/reject")]
    [Authorize(Roles = $"{RoleNames.Seller},{RoleNames.Admin}")]
    [ProducesResponseType(typeof(ReturnRequestDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ReturnRequestDto>> Reject(
        long id,
        [FromBody] RejectReturnRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _returnService.RejectAsync(id, request, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Kho tiếp nhận hàng hoàn về khu Returns (Approved -> ItemsReceived; ghi sổ cái ReturnIn)
    /// </summary>
    [HttpPost("returns/{id:long}/receive")]
    [Authorize(Roles = $"{RoleNames.WarehouseStaff},{RoleNames.WarehouseManager}")]
    [ProducesResponseType(typeof(ReturnRequestDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ReturnRequestDto>> Receive(
        long id,
        [FromBody] ReceiveReturnRequestDto? request,
        CancellationToken cancellationToken)
    {
        var result = await _returnService.ReceiveAsync(id, request, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Kho kiểm định từng dòng hàng hoàn (Good / MinorDefect / Damaged) và chuyển sang kệ đích bằng cặp bút toán Adjustment
    /// </summary>
    [HttpPost("returns/{id:long}/items/{itemId:long}/inspect")]
    [Authorize(Roles = $"{RoleNames.WarehouseStaff},{RoleNames.WarehouseManager}")]
    [ProducesResponseType(typeof(ReturnRequestDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ReturnRequestDto>> InspectItem(
        long id,
        long itemId,
        [FromBody] InspectReturnItemRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _returnService.InspectItemAsync(id, itemId, request, cancellationToken);
        return Ok(result);
    }
}
