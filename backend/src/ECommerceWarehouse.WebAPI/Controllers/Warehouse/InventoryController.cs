using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Warehouse;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerceWarehouse.WebAPI.Controllers.Warehouse;

[ApiController]
[Route("api/v1/inventory")]
public class InventoryController : ControllerBase
{
    private readonly IInventoryLedgerService _inventoryLedgerService;

    public InventoryController(IInventoryLedgerService inventoryLedgerService)
    {
        _inventoryLedgerService = inventoryLedgerService;
    }

    /// <summary>
    /// Tra cứu tồn kho theo vị trí kệ (WM/WS xem tất cả; Seller chỉ xem hàng thuộc shop của mình)
    /// </summary>
    [HttpGet]
    [Authorize(Roles = $"{RoleNames.WarehouseManager},{RoleNames.WarehouseStaff},{RoleNames.Seller}")]
    [ProducesResponseType(typeof(PagedResult<InventoryItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<PagedResult<InventoryItemDto>>> GetInventory(
        [FromQuery] InventoryQueryDto query,
        CancellationToken cancellationToken)
    {
        var result = await _inventoryLedgerService.GetInventoryAsync(query, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Tra cứu tổng tồn khả dụng bán được của một biến thể (công khai)
    /// </summary>
    [HttpGet("availability")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(VariantAvailabilityDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<VariantAvailabilityDto>> GetAvailability(
        [FromQuery] long variantId,
        CancellationToken cancellationToken)
    {
        var result = await _inventoryLedgerService.GetVariantAvailabilityAsync(variantId, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Đối soát toàn vẹn tồn kho từ view vw_StockReconciliation (chỉ Quản lý kho)
    /// </summary>
    [HttpGet("reconciliation")]
    [Authorize(Policy = RoleNames.WarehouseManager)]
    [ProducesResponseType(typeof(List<StockReconciliationItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<List<StockReconciliationItemDto>>> GetReconciliation(
        CancellationToken cancellationToken)
    {
        var result = await _inventoryLedgerService.GetReconciliationDiscrepanciesAsync(cancellationToken);
        return Ok(result);
    }
}
