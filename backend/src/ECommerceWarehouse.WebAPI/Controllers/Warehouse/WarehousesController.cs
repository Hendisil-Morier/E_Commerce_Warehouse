using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Warehouse;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerceWarehouse.WebAPI.Controllers.Warehouse;

[ApiController]
[Route("api/v1/warehouses")]
public class WarehousesController : ControllerBase
{
    private readonly IWarehouseService _warehouseService;

    public WarehousesController(IWarehouseService warehouseService)
    {
        _warehouseService = warehouseService;
    }

    /// <summary>
    /// Danh sách kho hàng (Quản lý kho và Nhân viên kho đều xem được)
    /// </summary>
    [HttpGet]
    [Authorize(Roles = $"{RoleNames.WarehouseManager},{RoleNames.WarehouseStaff}")]
    [ProducesResponseType(typeof(PagedResult<WarehouseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<PagedResult<WarehouseDto>>> GetWarehouses(
        [FromQuery] WarehouseQueryDto query,
        CancellationToken cancellationToken)
    {
        var result = await _warehouseService.GetWarehousesAsync(query, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Tạo kho mới (chỉ Quản lý kho)
    /// </summary>
    [HttpPost]
    [Authorize(Policy = RoleNames.WarehouseManager)]
    [ProducesResponseType(typeof(WarehouseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<WarehouseDto>> CreateWarehouse(
        [FromBody] CreateWarehouseRequestDto request,
        CancellationToken cancellationToken)
    {
        var created = await _warehouseService.CreateWarehouseAsync(request, cancellationToken);
        return Created($"/api/v1/warehouses/{created.WarehouseId}", created);
    }

    /// <summary>
    /// Danh sách vị trí kệ trong kho (Quản lý kho và Nhân viên kho đều xem được)
    /// </summary>
    [HttpGet("{id:long}/locations")]
    [Authorize(Roles = $"{RoleNames.WarehouseManager},{RoleNames.WarehouseStaff}")]
    [ProducesResponseType(typeof(List<WarehouseLocationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<WarehouseLocationDto>>> GetLocations(
        long id,
        CancellationToken cancellationToken)
    {
        var locations = await _warehouseService.GetLocationsAsync(id, cancellationToken);
        return Ok(locations);
    }

    /// <summary>
    /// Tạo vị trí kệ mới trong kho (chỉ Quản lý kho; khu Inbound/Returns/Damaged luôn IsSellable=false)
    /// </summary>
    [HttpPost("{id:long}/locations")]
    [Authorize(Policy = RoleNames.WarehouseManager)]
    [ProducesResponseType(typeof(WarehouseLocationDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<WarehouseLocationDto>> CreateLocation(
        long id,
        [FromBody] CreateWarehouseLocationRequestDto request,
        CancellationToken cancellationToken)
    {
        var created = await _warehouseService.CreateLocationAsync(id, request, cancellationToken);
        return Created($"/api/v1/warehouses/{id}/locations/{created.LocationId}", created);
    }
}
