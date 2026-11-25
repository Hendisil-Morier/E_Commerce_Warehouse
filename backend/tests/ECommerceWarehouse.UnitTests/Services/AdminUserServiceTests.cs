using System.Linq.Expressions;
using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.Contracts.Services;
using ECommerceWarehouse.Application.DTOs.Admin;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Application.Validators.Admin;
using ECommerceWarehouse.Domain.Constants;
using ECommerceWarehouse.Domain.Entities.Identity;
using ECommerceWarehouse.Domain.Entities.Seller;
using ECommerceWarehouse.Domain.Enums;
using ECommerceWarehouse.Domain.Exceptions;
using FluentValidation;
using Xunit;

namespace ECommerceWarehouse.UnitTests.Services;

public class AdminUserServiceTests
{
    private sealed class TestUnitOfWork : IUnitOfWork
    {
        public IGenericRepository<T> Repository<T>() where T : class => throw new NotImplementedException();
        public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) => Task.FromResult(1);
        public Task ExecuteInTransactionAsync(Func<CancellationToken, Task> operation, CancellationToken cancellationToken = default) => operation(cancellationToken);
        public void Dispose() { }
    }

    private sealed class TestCurrentUser : ICurrentUser
    {
        public long? UserId { get; set; }
        public string? Email { get; set; }
        public string? Role { get; set; }
        public IReadOnlyList<string> Roles { get; set; } = [];
        public long? SellerId => null;
        public bool IsAuthenticated => UserId.HasValue;
        public bool IsInRole(string role) => Roles.Contains(role);
        public Task<long?> GetSellerIdAsync(CancellationToken cancellationToken = default) => Task.FromResult<long?>(null);
    }

    private sealed class TestUserRepository : IUserRepository
    {
        public List<User> Users { get; } = [];
        public List<Role> Roles { get; } = [];
        public List<UserRole> UserRoles { get; } = [];
        public Dictionary<long, int> AddressCounts { get; } = new();

        public Task<User?> GetByIdWithRolesAsync(long userId, CancellationToken cancellationToken = default)
        {
            var user = Users.FirstOrDefault(u => u.UserId == userId);
            if (user == null) return Task.FromResult<User?>(null);

            var rolesForUser = UserRoles.Where(ur => ur.UserId == userId).ToList();
            foreach (var ur in rolesForUser)
            {
                ur.Role = Roles.First(r => r.RoleId == ur.RoleId);
            }
            user.UserRoles = rolesForUser;
            return Task.FromResult<User?>(user);
        }

        public Task<User?> GetByIdWithDetailsAsync(long userId, CancellationToken cancellationToken = default)
        {
            return GetByIdWithRolesAsync(userId, cancellationToken);
        }

        public Task<ECommerceWarehouse.Application.DTOs.Common.PagedResult<User>> GetPagedAsync(
            AdminUserQueryDto query,
            CancellationToken cancellationToken = default)
        {
            var queryable = Users.AsEnumerable();

            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                var s = query.Search.ToLower();
                queryable = queryable.Where(u =>
                    u.FullName.ToLower().Contains(s) ||
                    u.Email.ToLower().Contains(s) ||
                    (u.Username != null && u.Username.ToLower().Contains(s)));
            }

            if (query.IsActive.HasValue)
            {
                queryable = queryable.Where(u => u.IsActive == query.IsActive.Value);
            }

            if (!string.IsNullOrWhiteSpace(query.Role) && !string.Equals(query.Role, "ALL", StringComparison.OrdinalIgnoreCase))
            {
                queryable = queryable.Where(u =>
                {
                    var userRoleIds = UserRoles.Where(ur => ur.UserId == u.UserId).Select(ur => ur.RoleId);
                    var userRoleNames = Roles.Where(r => userRoleIds.Contains(r.RoleId)).Select(r => r.RoleName);
                    return userRoleNames.Contains(query.Role);
                });
            }

            var list = queryable.ToList();
            foreach (var user in list)
            {
                var rolesForUser = UserRoles.Where(ur => ur.UserId == user.UserId).ToList();
                foreach (var ur in rolesForUser)
                {
                    ur.Role = Roles.First(r => r.RoleId == ur.RoleId);
                }
                user.UserRoles = rolesForUser;
            }

            var paged = ECommerceWarehouse.Application.DTOs.Common.PagedResult<User>.Create(
                list,
                query.NormalizedPage,
                query.NormalizedPageSize,
                list.Count);

            return Task.FromResult(paged);
        }

        public Task<List<Role>> GetAllRolesAsync(CancellationToken cancellationToken = default)
        {
            return Task.FromResult(Roles.ToList());
        }

        public Task<int> GetAddressCountAsync(long userId, CancellationToken cancellationToken = default)
        {
            AddressCounts.TryGetValue(userId, out var count);
            return Task.FromResult(count);
        }

        public Task AddUserRoleAsync(UserRole userRole, CancellationToken cancellationToken = default)
        {
            UserRoles.Add(userRole);
            return Task.CompletedTask;
        }

        public void RemoveUserRoles(IEnumerable<UserRole> userRoles)
        {
            var toRemove = userRoles.ToList();
            UserRoles.RemoveAll(ur => toRemove.Any(tr => tr.UserId == ur.UserId && tr.RoleId == tr.RoleId));
        }

        public List<long> RevokedUserIds { get; } = [];

        public Task RevokeAllRefreshTokensAsync(long userId, DateTime revokedAt, CancellationToken cancellationToken = default)
        {
            RevokedUserIds.Add(userId);
            return Task.CompletedTask;
        }

        public void Update(User user) { }
    }

    private static (AdminUserService Service, TestUserRepository UserRepo, TestCurrentUser CurrentUser) CreateTestContext()
    {
        var userRepo = new TestUserRepository();
        var uow = new TestUnitOfWork();
        var currentUser = new TestCurrentUser { UserId = 1, Email = "admin@emarket.vn", Role = RoleNames.Admin, Roles = [RoleNames.Admin] };

        // Seed default roles
        userRepo.Roles.AddRange(new[]
        {
            new Role { RoleId = 1, RoleName = RoleNames.Customer, Description = "Khách hàng" },
            new Role { RoleId = 2, RoleName = RoleNames.Seller, Description = "Người bán" },
            new Role { RoleId = 3, RoleName = RoleNames.WarehouseManager, Description = "Quản lý kho" },
            new Role { RoleId = 4, RoleName = RoleNames.Admin, Description = "Quản trị viên" }
        });

        var service = new AdminUserService(
            userRepo,
            uow,
            currentUser,
            new AdminUserQueryValidator(),
            new UpdateUserStatusRequestValidator(),
            new UpdateUserRolesRequestValidator());

        return (service, userRepo, currentUser);
    }

    [Fact]
    public async Task GetUsersAsync_WithFiltersAndPaging_ReturnsFilteredResult()
    {
        var (service, repo, _) = CreateTestContext();

        var admin = new User { UserId = 1, FullName = "Admin User", Email = "admin@emarket.vn", IsActive = true };
        var customer = new User { UserId = 2, FullName = "Customer One", Email = "customer@gmail.com", IsActive = true };
        var lockedUser = new User { UserId = 3, FullName = "Locked Seller", Email = "locked@seller.com", IsActive = false };

        repo.Users.AddRange([admin, customer, lockedUser]);
        repo.UserRoles.AddRange([
            new UserRole { UserId = 1, RoleId = 4 },
            new UserRole { UserId = 2, RoleId = 1 },
            new UserRole { UserId = 3, RoleId = 2 }
        ]);

        var query = new AdminUserQueryDto
        {
            Search = "Seller",
            Role = RoleNames.Seller,
            IsActive = false
        };

        var result = await service.GetUsersAsync(query);

        Assert.Single(result.Items);
        Assert.Equal("Locked Seller", result.Items[0].FullName);
        Assert.False(result.Items[0].IsActive);
    }

    [Fact]
    public async Task GetUserByIdAsync_WhenFound_ReturnsDetailedDto()
    {
        var (service, repo, _) = CreateTestContext();

        var user = new User
        {
            UserId = 10,
            FullName = "Nguyễn Văn A",
            Email = "vana@test.com",
            PhoneNumber = "0901234567",
            IsActive = true,
            Seller = new Seller
            {
                SellerId = 5,
                UserId = 10,
                BusinessName = "Cửa Hàng A",
                Status = SellerStatus.Approved
            }
        };

        repo.Users.Add(user);
        repo.UserRoles.Add(new UserRole { UserId = 10, RoleId = 2 });
        repo.AddressCounts[10] = 3;

        var result = await service.GetUserByIdAsync(10);

        Assert.NotNull(result);
        Assert.Equal(10, result.UserId);
        Assert.Equal("Nguyễn Văn A", result.FullName);
        Assert.Equal(3, result.AddressCount);
        Assert.True(result.IsSeller);
        Assert.Equal("Cửa Hàng A", result.BusinessName);
        Assert.Equal("Approved", result.SellerStatus);
    }

    [Fact]
    public async Task GetUserByIdAsync_WhenNotFound_ThrowsNotFoundException()
    {
        var (service, _, _) = CreateTestContext();

        await Assert.ThrowsAsync<NotFoundException>(() => service.GetUserByIdAsync(999));
    }

    [Fact]
    public async Task UpdateUserStatusAsync_LockOtherUser_Success()
    {
        var (service, repo, _) = CreateTestContext();

        var targetUser = new User { UserId = 2, FullName = "User Two", Email = "user2@test.com", IsActive = true };
        repo.Users.Add(targetUser);
        repo.UserRoles.Add(new UserRole { UserId = 2, RoleId = 1 });

        var request = new UpdateUserStatusRequestDto { IsActive = false, Reason = "Vi phạm chính sách sàn" };

        var result = await service.UpdateUserStatusAsync(2, request);

        Assert.False(result.IsActive);
        Assert.False(targetUser.IsActive);
    }

    [Fact]
    public async Task UpdateUserStatusAsync_WhenAdminTriesToLockThemselves_ThrowsBusinessException()
    {
        var (service, repo, currentUser) = CreateTestContext();
        currentUser.UserId = 1;

        var adminUser = new User { UserId = 1, FullName = "Current Admin", Email = "admin@emarket.vn", IsActive = true };
        repo.Users.Add(adminUser);
        repo.UserRoles.Add(new UserRole { UserId = 1, RoleId = 4 });

        var request = new UpdateUserStatusRequestDto { IsActive = false, Reason = "Tự khóa" };

        var ex = await Assert.ThrowsAsync<BusinessException>(() => service.UpdateUserStatusAsync(1, request));
        Assert.Equal(ErrorCodes.AdminCannotLockSelf, ex.Code);
    }

    [Fact]
    public async Task UpdateUserRolesAsync_ValidRoles_ReplacesRolesSuccessfully()
    {
        var (service, repo, _) = CreateTestContext();

        var targetUser = new User { UserId = 5, FullName = "User Five", Email = "user5@test.com", IsActive = true };
        repo.Users.Add(targetUser);
        repo.UserRoles.Add(new UserRole { UserId = 5, RoleId = 1 }); // Starts as Customer

        var request = new UpdateUserRolesRequestDto
        {
            Roles = [RoleNames.Customer, RoleNames.Seller]
        };

        var result = await service.UpdateUserRolesAsync(5, request);

        Assert.Equal(2, result.Roles.Count);
        Assert.Contains(RoleNames.Customer, result.Roles);
        Assert.Contains(RoleNames.Seller, result.Roles);
    }

    [Fact]
    public async Task UpdateUserRolesAsync_WhenAdminTriesToRevokeOwnAdminRole_ThrowsBusinessException()
    {
        var (service, repo, currentUser) = CreateTestContext();
        currentUser.UserId = 1;

        var adminUser = new User { UserId = 1, FullName = "Current Admin", Email = "admin@emarket.vn", IsActive = true };
        repo.Users.Add(adminUser);
        repo.UserRoles.Add(new UserRole { UserId = 1, RoleId = 4 });

        var request = new UpdateUserRolesRequestDto
        {
            Roles = [RoleNames.Customer, RoleNames.Seller] // Missing RoleNames.Admin
        };

        var ex = await Assert.ThrowsAsync<BusinessException>(() => service.UpdateUserRolesAsync(1, request));
        Assert.Equal(ErrorCodes.AdminCannotRevokeOwnAdminRole, ex.Code);
    }

    [Fact]
    public async Task UpdateUserRolesAsync_WhenRoleIsInvalid_ThrowsBusinessException()
    {
        var (service, repo, _) = CreateTestContext();

        var targetUser = new User { UserId = 5, FullName = "User Five", Email = "user5@test.com", IsActive = true };
        repo.Users.Add(targetUser);
        repo.UserRoles.Add(new UserRole { UserId = 5, RoleId = 1 });

        var request = new UpdateUserRolesRequestDto
        {
            Roles = ["NonExistentRole"]
        };

        var ex = await Assert.ThrowsAsync<BusinessException>(() => service.UpdateUserRolesAsync(5, request));
        Assert.Equal(ErrorCodes.InvalidRole, ex.Code);
    }

    [Fact]
    public async Task GetRolesAsync_ReturnsAllSystemRoles()
    {
        var (service, _, _) = CreateTestContext();

        var roles = await service.GetRolesAsync();

        Assert.Equal(4, roles.Count);
        Assert.Contains(roles, r => r.RoleName == RoleNames.Admin);
        Assert.Contains(roles, r => r.RoleName == RoleNames.WarehouseManager);
        Assert.Contains(roles, r => r.RoleName == RoleNames.Seller);
        Assert.Contains(roles, r => r.RoleName == RoleNames.Customer);
    }

    [Fact]
    public async Task UpdateUserStatusAsync_LockingUser_RevokesRefreshTokens()
    {
        var (service, repo, _) = CreateTestContext();
        repo.Users.Add(new User { UserId = 9, FullName = "User 9", Email = "u9@test.com", IsActive = true });

        var updated = await service.UpdateUserStatusAsync(9, new UpdateUserStatusRequestDto { IsActive = false });

        Assert.False(updated.IsActive);
        Assert.Contains(9, repo.RevokedUserIds);
    }
}
