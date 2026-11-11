using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Seller;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace ECommerceWarehouse.WebAPI.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/sellers")]
[Authorize(Policy = RoleNames.Admin)]
public class AdminSellersController : ControllerBase
{
    private readonly ISellerService _sellerService;

    public AdminSellersController(ISellerService sellerService)
    {
        _sellerService = sellerService;
    }

    /// <summary>
    /// Danh sách hồ sơ người bán theo trạng thái và từ khóa tìm kiếm (phân trang)
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<SellerDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<PagedResult<SellerDto>>> GetSellers(
        [FromQuery] SellerListQueryDto query,
        CancellationToken cancellationToken)
    {
        var result = await _sellerService.GetAdminSellersAsync(query, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Duyệt hồ sơ người bán (Pending -> Approved) và gán vai trò Seller
    /// </summary>
    [HttpPost("{id:long}/approve")]
    [ProducesResponseType(typeof(SellerDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<SellerDto>> Approve(long id, CancellationToken cancellationToken)
    {
        var result = await _sellerService.ApproveAsync(id, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Từ chối hồ sơ người bán (Pending -> Rejected) kèm lý do
    /// </summary>
    [HttpPost("{id:long}/reject")]
    [ProducesResponseType(typeof(SellerDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<SellerDto>> Reject(
        long id,
        [FromBody] RejectSellerRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _sellerService.RejectAsync(id, request, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Đình chỉ tài khoản người bán đang hoạt động (Approved -> Suspended) kèm lý do tùy chọn
    /// </summary>
    [HttpPost("{id:long}/suspend")]
    [ProducesResponseType(typeof(SellerDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<SellerDto>> Suspend(
        long id,
        [FromBody(EmptyBodyBehavior = EmptyBodyBehavior.Allow)] SuspendSellerRequestDto? request,
        CancellationToken cancellationToken)
    {
        var result = await _sellerService.SuspendAsync(id, request, cancellationToken);
        return Ok(result);
    }
}

