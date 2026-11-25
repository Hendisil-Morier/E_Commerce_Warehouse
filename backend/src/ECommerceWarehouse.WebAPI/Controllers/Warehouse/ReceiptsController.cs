using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Warehouse;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerceWarehouse.WebAPI.Controllers.Warehouse;

[ApiController]
[Route("api/v1/receipts")]
public class ReceiptsController : ControllerBase
{
    private readonly IReceiptService _receiptService;

    public ReceiptsController(IReceiptService receiptService)
    {
        _receiptService = receiptService;
    }

    /// <summary>
    /// Danh sách phiếu nhập kho (Nhân viên kho và Quản lý kho)
    /// </summary>
    [HttpGet]
    [Authorize(Roles = $"{RoleNames.WarehouseManager},{RoleNames.WarehouseStaff}")]
    [ProducesResponseType(typeof(PagedResult<ReceiptDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<PagedResult<ReceiptDto>>> GetReceipts(
        [FromQuery] ReceiptQueryDto query,
        CancellationToken cancellationToken)
    {
        var result = await _receiptService.GetReceiptsAsync(query, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Chi tiết phiếu nhập kho theo ID (Nhân viên kho và Quản lý kho)
    /// </summary>
    [HttpGet("{id:long}")]
    [Authorize(Roles = $"{RoleNames.WarehouseManager},{RoleNames.WarehouseStaff}")]
    [ProducesResponseType(typeof(ReceiptDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ReceiptDto>> GetReceiptById(
        long id,
        CancellationToken cancellationToken)
    {
        var result = await _receiptService.GetReceiptByIdAsync(id, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Tạo phiếu nhập kho ở trạng thái Draft (Nhân viên kho hoặc Quản lý kho)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = $"{RoleNames.WarehouseStaff},{RoleNames.WarehouseManager}")]
    [ProducesResponseType(typeof(ReceiptDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ReceiptDto>> CreateReceipt(
        [FromBody] CreateReceiptRequestDto request,
        CancellationToken cancellationToken)
    {
        var created = await _receiptService.CreateReceiptAsync(request, cancellationToken);
        return Created($"/api/v1/receipts/{created.ReceiptId}", created);
    }

    /// <summary>
    /// Xác nhận phiếu nhập kho: tăng tồn kho và ghi sổ cái (CHỈ Quản lý kho, và phải khác người tạo)
    /// </summary>
    [HttpPost("{id:long}/confirm")]
    [Authorize(Policy = RoleNames.WarehouseManager)]
    [ProducesResponseType(typeof(ReceiptDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ReceiptDto>> ConfirmReceipt(
        long id,
        CancellationToken cancellationToken)
    {
        var confirmed = await _receiptService.ConfirmReceiptAsync(id, cancellationToken);
        return Ok(confirmed);
    }

    /// <summary>
    /// Hủy phiếu nhập kho ở trạng thái Draft (Nhân viên kho hoặc Quản lý kho; không hủy được phiếu đã Confirmed)
    /// </summary>
    [HttpPost("{id:long}/cancel")]
    [Authorize(Roles = $"{RoleNames.WarehouseStaff},{RoleNames.WarehouseManager}")]
    [ProducesResponseType(typeof(ReceiptDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ReceiptDto>> CancelReceipt(
        long id,
        CancellationToken cancellationToken)
    {
        var cancelled = await _receiptService.CancelReceiptAsync(id, cancellationToken);
        return Ok(cancelled);
    }
}
