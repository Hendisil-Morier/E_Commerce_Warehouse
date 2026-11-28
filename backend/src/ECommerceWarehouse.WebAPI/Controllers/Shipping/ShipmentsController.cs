using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Shipping;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerceWarehouse.WebAPI.Controllers.Shipping;

[ApiController]
[Route("api/v1")]
public class ShipmentsController : ControllerBase
{
    private readonly IShipmentService _shipmentService;

    public ShipmentsController(IShipmentService shipmentService)
    {
        _shipmentService = shipmentService;
    }

    /// <summary>
    /// Danh sách vận đơn (Nhân viên kho và Quản lý kho)
    /// </summary>
    [HttpGet("shipments")]
    [Authorize(Roles = $"{RoleNames.WarehouseManager},{RoleNames.WarehouseStaff}")]
    [ProducesResponseType(typeof(PagedResult<ShipmentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<PagedResult<ShipmentDto>>> GetShipments(
        [FromQuery] ShipmentQueryDto query,
        CancellationToken cancellationToken)
    {
        var result = await _shipmentService.GetShipmentsAsync(query, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Tạo kiện hàng vận chuyển cho đơn con đã đóng gói/xuất kho (Nhân viên kho hoặc Quản lý kho)
    /// </summary>
    [HttpPost("seller-orders/{sellerOrderId:long}/shipments")]
    [Authorize(Roles = $"{RoleNames.WarehouseStaff},{RoleNames.WarehouseManager}")]
    [ProducesResponseType(typeof(ShipmentDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ShipmentDto>> CreateShipment(
        long sellerOrderId,
        [FromBody] CreateShipmentRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _shipmentService.CreateShipmentAsync(sellerOrderId, request, cancellationToken);
        return Created($"/api/v1/shipments/{result.ShipmentId}", result);
    }

    /// <summary>
    /// Cập nhật trạng thái vận đơn (PickedUp -> InTransit -> Delivered / Failed)
    /// </summary>
    [HttpPatch("shipments/{id:long}/status")]
    [Authorize(Roles = $"{RoleNames.WarehouseStaff},{RoleNames.WarehouseManager},{RoleNames.Admin}")]
    [ProducesResponseType(typeof(ShipmentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ShipmentDto>> UpdateStatus(
        long id,
        [FromBody] UpdateShipmentStatusRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _shipmentService.UpdateShipmentStatusAsync(id, request, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Thêm chặng hành trình trung chuyển cho vận đơn (Nhân viên kho, Quản lý kho, Admin)
    /// </summary>
    [HttpPost("shipments/{id:long}/events")]
    [Authorize(Roles = $"{RoleNames.WarehouseStaff},{RoleNames.WarehouseManager},{RoleNames.Admin}")]
    [ProducesResponseType(typeof(ShipmentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ShipmentDto>> AddTrackingEvent(
        long id,
        [FromBody] CreateShipmentTrackingEventRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _shipmentService.AddTrackingEventAsync(id, request, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Khách hàng tra cứu hành trình vận đơn theo mã vận đơn (chỉ đơn của chính mình)
    /// </summary>
    [HttpGet("shipments/track/{trackingNumber}")]
    [Authorize(Policy = RoleNames.Customer)]
    [ProducesResponseType(typeof(ShipmentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ShipmentDto>> TrackByNumber(
        string trackingNumber,
        CancellationToken cancellationToken)
    {
        var result = await _shipmentService.TrackByNumberForCustomerAsync(trackingNumber, cancellationToken);
        return Ok(result);
    }
}
