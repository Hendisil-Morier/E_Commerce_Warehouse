using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.DTOs.Admin;
using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Domain.Entities.Identity;
using ECommerceWarehouse.Infrastructure.Data;
using ECommerceWarehouse.Infrastructure.Extensions;
using Microsoft.EntityFrameworkCore;

namespace ECommerceWarehouse.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly ApplicationDbContext _context;

    public UserRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<User?> GetByIdWithRolesAsync(long userId, CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.UserId == userId, cancellationToken);
    }

    public async Task<User?> GetByIdWithDetailsAsync(long userId, CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .Include(u => u.Seller)
            .FirstOrDefaultAsync(u => u.UserId == userId, cancellationToken);
    }

    public async Task<PagedResult<User>> GetPagedAsync(AdminUserQueryDto query, CancellationToken cancellationToken = default)
    {
        IQueryable<User> usersQuery = _context.Users
            .AsNoTracking()
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role);

        // Lọc theo từ khóa tìm kiếm (Tên, Email, Username, SĐT)
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLower();
            usersQuery = usersQuery.Where(u =>
                u.FullName.ToLower().Contains(search) ||
                u.Email.ToLower().Contains(search) ||
                (u.Username != null && u.Username.ToLower().Contains(search)) ||
                (u.PhoneNumber != null && u.PhoneNumber.Contains(search)));
        }

        // Lọc theo trạng thái hoạt động
        if (query.IsActive.HasValue)
        {
            usersQuery = usersQuery.Where(u => u.IsActive == query.IsActive.Value);
        }

        // Lọc theo vai trò (RoleName)
        if (!string.IsNullOrWhiteSpace(query.Role) && !string.Equals(query.Role, "ALL", StringComparison.OrdinalIgnoreCase))
        {
            var roleName = query.Role.Trim();
            usersQuery = usersQuery.Where(u => u.UserRoles.Any(ur => ur.Role.RoleName == roleName));
        }

        // Sắp xếp
        var (sortField, isDescending) = query.ParseSort();
        usersQuery = (sortField.ToLowerInvariant(), isDescending) switch
        {
            ("fullname", true) => usersQuery.OrderByDescending(u => u.FullName),
            ("fullname", false) => usersQuery.OrderBy(u => u.FullName),
            ("email", true) => usersQuery.OrderByDescending(u => u.Email),
            ("email", false) => usersQuery.OrderBy(u => u.Email),
            ("createdat", false) => usersQuery.OrderBy(u => u.CreatedAt),
            _ => usersQuery.OrderByDescending(u => u.CreatedAt)
        };

        return await usersQuery.ToPagedResultAsync(query, cancellationToken);
    }

    public async Task<List<Role>> GetAllRolesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Roles
            .AsNoTracking()
            .OrderBy(r => r.RoleId)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> GetAddressCountAsync(long userId, CancellationToken cancellationToken = default)
    {
        return await _context.UserAddresses
            .AsNoTracking()
            .CountAsync(a => a.UserId == userId, cancellationToken);
    }

    public async Task AddUserRoleAsync(UserRole userRole, CancellationToken cancellationToken = default)
    {
        await _context.UserRoles.AddAsync(userRole, cancellationToken);
    }

    public void RemoveUserRoles(IEnumerable<UserRole> userRoles)
    {
        _context.UserRoles.RemoveRange(userRoles);
    }

    public void Update(User user)
    {
        _context.Users.Update(user);
    }
}
