using ECommerceWarehouse.Application.DTOs.Admin;
using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerceWarehouse.WebAPI.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/users")]
[Authorize(Policy = RoleNames.Admin)]
public class AdminUsersController : ControllerBase
{
    private readonly IAdminUserService _adminUserService;

    public AdminUsersController(IAdminUserService adminUserService)
    {
        _adminUserService = adminUserService;
    }

    /// <summary>
    /// Danh sách người dùng hệ thống có phân trang, tìm kiếm và lọc theo vai trò, trạng thái.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<AdminUserListItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<PagedResult<AdminUserListItemDto>>> GetUsers(
        [FromQuery] AdminUserQueryDto query,
        CancellationToken cancellationToken)
    {
        var result = await _adminUserService.GetUsersAsync(query, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Danh sách tất cả vai trò trong hệ thống (phục vụ phân quyền và bộ lọc).
    /// </summary>
    [HttpGet("roles")]
    [ProducesResponseType(typeof(List<RoleDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<List<RoleDto>>> GetRoles(CancellationToken cancellationToken)
    {
        var result = await _adminUserService.GetRolesAsync(cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Xem chi tiết thông tin một người dùng theo ID.
    /// </summary>
    [HttpGet("{id:long}")]
    [ProducesResponseType(typeof(AdminUserDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AdminUserDetailDto>> GetUserById(
        long id,
        CancellationToken cancellationToken)
    {
        var result = await _adminUserService.GetUserByIdAsync(id, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Cập nhật trạng thái hoạt động (Khóa / Mở khóa tài khoản). Admin không thể tự khóa chính mình.
    /// </summary>
    [HttpPut("{id:long}/status")]
    [ProducesResponseType(typeof(AdminUserListItemDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AdminUserListItemDto>> UpdateUserStatus(
        long id,
        [FromBody] UpdateUserStatusRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _adminUserService.UpdateUserStatusAsync(id, request, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Phân quyền / Cập nhật danh sách vai trò cho người dùng (RBAC). Admin không thể tự tước quyền Admin của mình.
    /// </summary>
    [HttpPut("{id:long}/roles")]
    [ProducesResponseType(typeof(AdminUserListItemDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AdminUserListItemDto>> UpdateUserRoles(
        long id,
        [FromBody] UpdateUserRolesRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _adminUserService.UpdateUserRolesAsync(id, request, cancellationToken);
        return Ok(result);
    }
}
