using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Warehouse;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerceWarehouse.WebAPI.Controllers.Warehouse;

[ApiController]
[Route("api/v1/stock-movements")]
[Authorize(Policy = RoleNames.WarehouseManager)]
public class StockMovementsController : ControllerBase
{
    private readonly IInventoryLedgerService _inventoryLedgerService;

    public StockMovementsController(IInventoryLedgerService inventoryLedgerService)
    {
        _inventoryLedgerService = inventoryLedgerService;
    }

    /// <summary>
    /// Tra cứu thẻ kho bất biến StockMovements (chỉ Quản lý kho)
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<StockMovementDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<PagedResult<StockMovementDto>>> GetMovements(
        [FromQuery] StockMovementQueryDto query,
        CancellationToken cancellationToken)
    {
        var result = await _inventoryLedgerService.GetStockMovementsAsync(query, cancellationToken);
        return Ok(result);
    }
}
