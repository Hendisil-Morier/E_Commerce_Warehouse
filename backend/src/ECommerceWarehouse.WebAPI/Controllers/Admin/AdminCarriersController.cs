using ECommerceWarehouse.Application.DTOs.Shipping;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerceWarehouse.WebAPI.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/carriers")]
[Authorize(Policy = RoleNames.Admin)]
[Produces("application/json")]
public class AdminCarriersController : ControllerBase
{
    private readonly IShipmentService _shipmentService;

    public AdminCarriersController(IShipmentService shipmentService)
    {
        _shipmentService = shipmentService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<CarrierDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
        => Ok(await _shipmentService.GetAllCarriersAsync(cancellationToken));

    [HttpPost]
    [ProducesResponseType(typeof(CarrierDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create(
        [FromBody] UpsertCarrierRequestDto request,
        CancellationToken cancellationToken)
    {
        var created = await _shipmentService.CreateCarrierAsync(request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, created);
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(CarrierDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] UpsertCarrierRequestDto request,
        CancellationToken cancellationToken)
        => Ok(await _shipmentService.UpdateCarrierAsync(id, request, cancellationToken));

    [HttpPatch("{id:int}/status")]
    [ProducesResponseType(typeof(CarrierDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStatus(
        int id,
        [FromBody] UpdateCarrierStatusRequestDto request,
        CancellationToken cancellationToken)
        => Ok(await _shipmentService.UpdateCarrierStatusAsync(id, request, cancellationToken));
}
