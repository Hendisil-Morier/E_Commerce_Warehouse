using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Warehouse;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerceWarehouse.WebAPI.Controllers.Warehouse;

[ApiController]
[Route("api/v1/warehouse/stock-transfers")]
[Produces("application/json")]
public class StockTransfersController : ControllerBase
{
    private readonly IStockTransferService _stockTransferService;

    public StockTransfersController(IStockTransferService stockTransferService)
    {
        _stockTransferService = stockTransferService;
    }

    [HttpGet]
    [Authorize(Roles = $"{RoleNames.WarehouseManager},{RoleNames.WarehouseStaff}")]
    [ProducesResponseType(typeof(PagedResult<StockTransferListItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStockTransfers(
        [FromQuery] StockTransferQueryDto query,
        CancellationToken cancellationToken)
    {
        var result = await _stockTransferService.GetStockTransfersAsync(query, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:long}")]
    [Authorize(Roles = $"{RoleNames.WarehouseManager},{RoleNames.WarehouseStaff}")]
    [ProducesResponseType(typeof(StockTransferDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(long id, CancellationToken cancellationToken)
    {
        var result = await _stockTransferService.GetByIdAsync(id, cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = $"{RoleNames.WarehouseStaff},{RoleNames.WarehouseManager}")]
    [ProducesResponseType(typeof(StockTransferDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(
        [FromBody] CreateStockTransferRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _stockTransferService.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = result.TransferId }, result);
    }

    [HttpPost("{id:long}/approve")]
    [Authorize(Policy = RoleNames.WarehouseManager)]
    [ProducesResponseType(typeof(StockTransferDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Approve(long id, CancellationToken cancellationToken)
    {
        var result = await _stockTransferService.ApproveAsync(id, cancellationToken);
        return Ok(result);
    }

    [HttpPost("{id:long}/dispatch")]
    [Authorize(Roles = $"{RoleNames.WarehouseStaff},{RoleNames.WarehouseManager}")]
    [ProducesResponseType(typeof(StockTransferDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Dispatch(long id, CancellationToken cancellationToken)
    {
        var result = await _stockTransferService.DispatchAsync(id, cancellationToken);
        return Ok(result);
    }

    [HttpPost("{id:long}/receive")]
    [Authorize(Roles = $"{RoleNames.WarehouseStaff},{RoleNames.WarehouseManager}")]
    [ProducesResponseType(typeof(StockTransferDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Receive(
        long id,
        [FromBody] ReceiveStockTransferRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _stockTransferService.ReceiveAsync(id, request, cancellationToken);
        return Ok(result);
    }

    [HttpPost("{id:long}/cancel")]
    [Authorize(Roles = $"{RoleNames.WarehouseStaff},{RoleNames.WarehouseManager}")]
    [ProducesResponseType(typeof(StockTransferDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Cancel(long id, CancellationToken cancellationToken)
    {
        var result = await _stockTransferService.CancelAsync(id, cancellationToken);
        return Ok(result);
    }
}
