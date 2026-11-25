using ECommerceWarehouse.Application.DTOs.Shipping;
using ECommerceWarehouse.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerceWarehouse.WebAPI.Controllers.Shipping;

[ApiController]
[Route("api/v1/carriers")]
[Authorize]
public class CarriersController : ControllerBase
{
    private readonly IShipmentService _shipmentService;

    public CarriersController(IShipmentService shipmentService)
    {
        _shipmentService = shipmentService;
    }

    /// <summary>
    /// Danh sách các hãng vận chuyển đang hoạt động (GHN, GHTK, VTP, JT, SPX)
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<CarrierDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<List<CarrierDto>>> GetActiveCarriers(CancellationToken cancellationToken)
    {
        var result = await _shipmentService.GetActiveCarriersAsync(cancellationToken);
        return Ok(result);
    }
}
