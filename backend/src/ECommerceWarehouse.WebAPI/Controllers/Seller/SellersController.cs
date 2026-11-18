using ECommerceWarehouse.Application.DTOs.Seller;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerceWarehouse.WebAPI.Controllers.Seller;

[ApiController]
[Route("api/v1/sellers")]
[Authorize]
public class SellersController : ControllerBase
{
    private readonly ISellerService _sellerService;

    public SellersController(ISellerService sellerService)
    {
        _sellerService = sellerService;
    }

    /// <summary>
    /// Khách hàng đăng ký mở hồ sơ người bán (trạng thái Pending) hoặc gửi lại hồ sơ bị từ chối (Rejected -> Pending)
    /// </summary>
    [HttpPost]
    [Authorize(Policy = RoleNames.Customer)]
    [ProducesResponseType(typeof(SellerDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(SellerDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Register(
        [FromBody] RegisterSellerRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _sellerService.RegisterOrResubmitAsync(request, cancellationToken);
        return result.IsCreated
            ? CreatedAtAction(nameof(GetMySeller), null, result.Seller)
            : Ok(result.Seller);
    }

    /// <summary>
    /// Xem hồ sơ người bán hiện tại của tài khoản đang đăng nhập
    /// </summary>
    [HttpGet("me")]
    [Authorize(Roles = $"{RoleNames.Customer},{RoleNames.Seller}")]
    [ProducesResponseType(typeof(SellerDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SellerDto>> GetMySeller(CancellationToken cancellationToken)
    {
        var result = await _sellerService.GetMySellerAsync(cancellationToken);
        return Ok(result);
    }
}

