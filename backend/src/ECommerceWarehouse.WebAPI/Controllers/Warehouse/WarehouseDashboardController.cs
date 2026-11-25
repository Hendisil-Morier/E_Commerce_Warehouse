using ECommerceWarehouse.Application.DTOs.Dashboard;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerceWarehouse.WebAPI.Controllers.Warehouse;

[ApiController]
[Route("api/v1/warehouse/dashboard")]
[Authorize(Roles = $"{RoleNames.WarehouseManager},{RoleNames.WarehouseStaff}")]
[Produces("application/json")]
public class WarehouseDashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public WarehouseDashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(WarehouseDashboardDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDashboard(
        [FromQuery] int lowStockThreshold = 10,
        CancellationToken cancellationToken = default)
    {
        var result = await _dashboardService.GetWarehouseDashboardAsync(lowStockThreshold, cancellationToken);
        return Ok(result);
    }
}
