using ECommerceWarehouse.Application.DTOs.Customer;
using ECommerceWarehouse.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerceWarehouse.WebAPI.Controllers.Customer;

[ApiController]
[Route("api/v1/users/me/addresses")]
[Authorize]
public class UserAddressesController : ControllerBase
{
    private readonly IUserAddressService _addressService;

    public UserAddressesController(IUserAddressService addressService)
    {
        _addressService = addressService;
    }

    /// <summary>
    /// Lấy danh sách sổ địa chỉ nhận hàng của người dùng hiện tại
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<UserAddressDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<IReadOnlyList<UserAddressDto>>> GetMyAddresses(CancellationToken cancellationToken)
    {
        var result = await _addressService.GetMyAddressesAsync(cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Lấy chi tiết một địa chỉ theo ID
    /// </summary>
    [HttpGet("{id:long}")]
    [ProducesResponseType(typeof(UserAddressDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserAddressDto>> GetAddressById(long id, CancellationToken cancellationToken)
    {
        var result = await _addressService.GetAddressByIdAsync(id, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Thêm địa chỉ nhận hàng mới
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(UserAddressDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<UserAddressDto>> CreateAddress(
        [FromBody] CreateAddressRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _addressService.CreateAddressAsync(request, cancellationToken);
        return Created($"/api/v1/users/me/addresses/{result.AddressId}", result);
    }

    /// <summary>
    /// Cập nhật địa chỉ nhận hàng
    /// </summary>
    [HttpPut("{id:long}")]
    [ProducesResponseType(typeof(UserAddressDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserAddressDto>> UpdateAddress(
        long id,
        [FromBody] UpdateAddressRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _addressService.UpdateAddressAsync(id, request, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Xóa địa chỉ nhận hàng
    /// </summary>
    [HttpDelete("{id:long}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteAddress(long id, CancellationToken cancellationToken)
    {
        await _addressService.DeleteAddressAsync(id, cancellationToken);
        return NoContent();
    }

    /// <summary>
    /// Đặt địa chỉ làm mặc định
    /// </summary>
    [HttpPatch("{id:long}/default")]
    [ProducesResponseType(typeof(UserAddressDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserAddressDto>> SetDefault(long id, CancellationToken cancellationToken)
    {
        var result = await _addressService.SetDefaultAddressAsync(id, cancellationToken);
        return Ok(result);
    }
}
