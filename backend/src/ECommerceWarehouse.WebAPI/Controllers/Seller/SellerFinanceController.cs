using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Seller;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerceWarehouse.WebAPI.Controllers.Seller;

[ApiController]
[Route("api/v1/seller/finance")]
[Authorize(Policy = RoleNames.Seller)]
[Produces("application/json")]
public class SellerFinanceController : ControllerBase
{
    private readonly ISettlementService _settlementService;

    public SellerFinanceController(ISettlementService settlementService)
    {
        _settlementService = settlementService;
    }

    [HttpGet("summary")]
    [ProducesResponseType(typeof(SellerFinanceSummaryDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSummary(CancellationToken cancellationToken)
        => Ok(await _settlementService.GetMyFinanceSummaryAsync(cancellationToken));

    [HttpGet("settlements")]
    [ProducesResponseType(typeof(PagedResult<SettlementListItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMySettlements(
        [FromQuery] SettlementQueryDto query,
        CancellationToken cancellationToken)
        => Ok(await _settlementService.GetMySettlementsAsync(query, cancellationToken));

    [HttpGet("settlements/{id:long}")]
    [ProducesResponseType(typeof(SettlementDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMySettlementById(long id, CancellationToken cancellationToken)
        => Ok(await _settlementService.GetMySettlementByIdAsync(id, cancellationToken));
}
