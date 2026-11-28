using ECommerceWarehouse.Application.DTOs.Admin;
using ECommerceWarehouse.Application.DTOs.Common;

namespace ECommerceWarehouse.Application.Services;

public interface IAdminUserService
{
    Task<PagedResult<AdminUserListItemDto>> GetUsersAsync(AdminUserQueryDto query, CancellationToken cancellationToken = default);
    Task<AdminUserDetailDto> GetUserByIdAsync(long userId, CancellationToken cancellationToken = default);
    Task<AdminUserListItemDto> UpdateUserStatusAsync(long userId, UpdateUserStatusRequestDto request, CancellationToken cancellationToken = default);
    Task<AdminUserListItemDto> UpdateUserRolesAsync(long userId, UpdateUserRolesRequestDto request, CancellationToken cancellationToken = default);
    Task<List<RoleDto>> GetRolesAsync(CancellationToken cancellationToken = default);
}
