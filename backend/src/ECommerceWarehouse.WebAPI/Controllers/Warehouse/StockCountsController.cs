using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Warehouse;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerceWarehouse.WebAPI.Controllers.Warehouse;

[ApiController]
[Route("api/v1/warehouse/stock-counts")]
[Produces("application/json")]
public class StockCountsController : ControllerBase
{
    private readonly IStockCountService _stockCountService;

    public StockCountsController(IStockCountService stockCountService)
    {
        _stockCountService = stockCountService;
    }

    [HttpGet]
    [Authorize(Roles = $"{RoleNames.WarehouseManager},{RoleNames.WarehouseStaff}")]
    [ProducesResponseType(typeof(PagedResult<StockCountListItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStockCounts(
        [FromQuery] StockCountQueryDto query,
        CancellationToken cancellationToken)
    {
        var result = await _stockCountService.GetStockCountsAsync(query, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:long}")]
    [Authorize(Roles = $"{RoleNames.WarehouseManager},{RoleNames.WarehouseStaff}")]
    [ProducesResponseType(typeof(StockCountDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(long id, CancellationToken cancellationToken)
    {
        var result = await _stockCountService.GetByIdAsync(id, cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = $"{RoleNames.WarehouseStaff},{RoleNames.WarehouseManager}")]
    [ProducesResponseType(typeof(StockCountDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(
        [FromBody] CreateStockCountRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _stockCountService.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = result.StockCountId }, result);
    }

    [HttpPost("{id:long}/record")]
    [Authorize(Roles = $"{RoleNames.WarehouseStaff},{RoleNames.WarehouseManager}")]
    [ProducesResponseType(typeof(StockCountDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Record(
        long id,
        [FromBody] RecordStockCountRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _stockCountService.RecordAsync(id, request, cancellationToken);
        return Ok(result);
    }

    [HttpPost("{id:long}/approve")]
    [Authorize(Policy = RoleNames.WarehouseManager)]
    [ProducesResponseType(typeof(StockCountDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Approve(long id, CancellationToken cancellationToken)
    {
        var result = await _stockCountService.ApproveAsync(id, cancellationToken);
        return Ok(result);
    }

    [HttpPost("{id:long}/cancel")]
    [Authorize(Roles = $"{RoleNames.WarehouseStaff},{RoleNames.WarehouseManager}")]
    [ProducesResponseType(typeof(StockCountDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Cancel(long id, CancellationToken cancellationToken)
    {
        var result = await _stockCountService.CancelAsync(id, cancellationToken);
        return Ok(result);
    }
}
