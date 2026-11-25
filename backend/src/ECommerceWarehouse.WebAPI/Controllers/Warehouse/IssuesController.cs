using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Warehouse;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerceWarehouse.WebAPI.Controllers.Warehouse;

[ApiController]
[Route("api/v1/issues")]
public class IssuesController : ControllerBase
{
    private readonly IIssueService _issueService;

    public IssuesController(IIssueService issueService)
    {
        _issueService = issueService;
    }

    /// <summary>
    /// Danh sách phiếu xuất kho (Nhân viên kho và Quản lý kho)
    /// </summary>
    [HttpGet]
    [Authorize(Roles = $"{RoleNames.WarehouseManager},{RoleNames.WarehouseStaff}")]
    [ProducesResponseType(typeof(PagedResult<IssueDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<PagedResult<IssueDto>>> GetIssues(
        [FromQuery] IssueQueryDto query,
        CancellationToken cancellationToken)
    {
        var result = await _issueService.GetIssuesAsync(query, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Chi tiết phiếu xuất kho và danh sách dòng hàng cần soạn
    /// </summary>
    [HttpGet("{id:long}")]
    [Authorize(Roles = $"{RoleNames.WarehouseManager},{RoleNames.WarehouseStaff}")]
    [ProducesResponseType(typeof(IssueDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IssueDto>> GetIssueById(
        long id,
        CancellationToken cancellationToken)
    {
        var result = await _issueService.GetIssueByIdAsync(id, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Duyệt phiếu xuất kho (Draft -> Approved; chỉ Quản lý kho, tách quyền người tạo)
    /// </summary>
    [HttpPost("{id:long}/approve")]
    [Authorize(Policy = RoleNames.WarehouseManager)]
    [ProducesResponseType(typeof(IssueDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<IssueDto>> Approve(
        long id,
        CancellationToken cancellationToken)
    {
        var result = await _issueService.ApproveAsync(id, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Bắt đầu soạn hàng (Approved -> Picking; đồng bộ SellerOrder -> Preparing)
    /// </summary>
    [HttpPost("{id:long}/start-picking")]
    [Authorize(Roles = $"{RoleNames.WarehouseStaff},{RoleNames.WarehouseManager}")]
    [ProducesResponseType(typeof(IssueDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<IssueDto>> StartPicking(
        long id,
        CancellationToken cancellationToken)
    {
        var result = await _issueService.StartPickingAsync(id, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Quét mã SKU/Barcode cho một dòng hàng cần soạn (tăng PickedQuantity)
    /// </summary>
    [HttpPost("{id:long}/lines/{lineId:long}/scan")]
    [Authorize(Roles = $"{RoleNames.WarehouseStaff},{RoleNames.WarehouseManager}")]
    [ProducesResponseType(typeof(IssueDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<IssueDto>> ScanLine(
        long id,
        long lineId,
        [FromBody] ScanIssueLineRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _issueService.ScanLineAsync(id, lineId, request, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Đóng gói phiếu xuất (Picking -> Packed; bắt buộc mọi dòng đã lấy đủ số lượng)
    /// </summary>
    [HttpPost("{id:long}/pack")]
    [Authorize(Roles = $"{RoleNames.WarehouseStaff},{RoleNames.WarehouseManager}")]
    [ProducesResponseType(typeof(IssueDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<IssueDto>> Pack(
        long id,
        CancellationToken cancellationToken)
    {
        var result = await _issueService.PackAsync(id, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Xuất kho vật lý (Packed -> Dispatched): trừ OnHand & Reserved, ghi sổ cái Issue, Consumed giữ chỗ và chuyển SellerOrder -> Shipped
    /// </summary>
    [HttpPost("{id:long}/dispatch")]
    [Authorize(Policy = RoleNames.WarehouseManager)]
    [ProducesResponseType(typeof(IssueDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<IssueDto>> Dispatch(
        long id,
        CancellationToken cancellationToken)
    {
        var result = await _issueService.DispatchAsync(id, cancellationToken);
        return Ok(result);
    }
}
