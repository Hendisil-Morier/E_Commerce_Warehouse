using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Seller;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerceWarehouse.WebAPI.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/settlements")]
[Authorize(Policy = RoleNames.Admin)]
[Produces("application/json")]
public class AdminSettlementsController : ControllerBase
{
    private readonly ISettlementService _settlementService;

    public AdminSettlementsController(ISettlementService settlementService)
    {
        _settlementService = settlementService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<SettlementListItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSettlements(
        [FromQuery] SettlementQueryDto query,
        CancellationToken cancellationToken)
        => Ok(await _settlementService.GetSettlementsAsync(query, cancellationToken));

    [HttpGet("{id:long}")]
    [ProducesResponseType(typeof(SettlementDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(long id, CancellationToken cancellationToken)
        => Ok(await _settlementService.GetSettlementByIdAsync(id, cancellationToken));

    [HttpPost("generate")]
    [ProducesResponseType(typeof(SettlementDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Generate(
        [FromBody] GenerateSettlementRequestDto request,
        CancellationToken cancellationToken)
    {
        var created = await _settlementService.GenerateSettlementAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = created.SettlementId }, created);
    }

    [HttpPost("{id:long}/approve")]
    [ProducesResponseType(typeof(SettlementDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Approve(long id, CancellationToken cancellationToken)
        => Ok(await _settlementService.ApproveSettlementAsync(id, cancellationToken));

    [HttpPost("{id:long}/mark-paid")]
    [ProducesResponseType(typeof(SettlementDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> MarkPaid(
        long id,
        [FromBody] MarkSettlementPaidRequestDto request,
        CancellationToken cancellationToken)
        => Ok(await _settlementService.MarkPaidAsync(id, request, cancellationToken));
}
