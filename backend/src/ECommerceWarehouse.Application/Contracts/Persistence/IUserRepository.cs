using ECommerceWarehouse.Application.DTOs.Admin;
using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Domain.Entities.Identity;

namespace ECommerceWarehouse.Application.Contracts.Persistence;

public interface IUserRepository
{
    Task<User?> GetByIdWithRolesAsync(long userId, CancellationToken cancellationToken = default);
    Task<User?> GetByIdWithDetailsAsync(long userId, CancellationToken cancellationToken = default);
    Task<PagedResult<User>> GetPagedAsync(AdminUserQueryDto query, CancellationToken cancellationToken = default);
    Task<List<Role>> GetAllRolesAsync(CancellationToken cancellationToken = default);
    Task<int> GetAddressCountAsync(long userId, CancellationToken cancellationToken = default);
    Task AddUserRoleAsync(UserRole userRole, CancellationToken cancellationToken = default);
    void RemoveUserRoles(IEnumerable<UserRole> userRoles);
    Task RevokeAllRefreshTokensAsync(long userId, DateTime revokedAt, CancellationToken cancellationToken = default);
    void Update(User user);
}
