using ECommerceWarehouse.Application.DTOs.Dashboard;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerceWarehouse.WebAPI.Controllers.Seller;

[ApiController]
[Route("api/v1/seller/dashboard")]
[Authorize(Policy = RoleNames.Seller)]
[Produces("application/json")]
public class SellerDashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public SellerDashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(SellerDashboardDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDashboard(
        [FromQuery] int lowStockThreshold = 10,
        CancellationToken cancellationToken = default)
    {
        var result = await _dashboardService.GetSellerDashboardAsync(lowStockThreshold, cancellationToken);
        return Ok(result);
    }
}
