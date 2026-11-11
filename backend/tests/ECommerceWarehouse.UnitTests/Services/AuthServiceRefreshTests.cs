using System.IdentityModel.Tokens.Jwt;
using System.Linq.Expressions;
using System.Security.Claims;
using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.DTOs.Identity;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Application.Validators.Identity;
using ECommerceWarehouse.Domain.Constants;
using ECommerceWarehouse.Domain.Entities.Identity;
using ECommerceWarehouse.Domain.Exceptions;
using FluentValidation;
using Microsoft.Extensions.Configuration;

namespace ECommerceWarehouse.UnitTests.Services;

public class AuthServiceRefreshTests
{
    private sealed class InMemoryRepo<T> : IGenericRepository<T> where T : class
    {
        private readonly Func<T, long>? _idSelector;
        public List<T> Items { get; } = [];

        public InMemoryRepo(Func<T, long>? idSelector = null) => _idSelector = idSelector;

        public Task<T?> GetByIdAsync(long id)
            => Task.FromResult(_idSelector == null ? null : Items.FirstOrDefault(x => _idSelector(x) == id));

        public Task<IEnumerable<T>> GetAllAsync() => Task.FromResult<IEnumerable<T>>(Items.ToList());

        public Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate)
            => Task.FromResult<IEnumerable<T>>(Items.Where(predicate.Compile()).ToList());

        public Task AddAsync(T entity)
        {
            Items.Add(entity);
            return Task.CompletedTask;
        }

        public void Update(T entity) { }

        public void Remove(T entity) => Items.Remove(entity);
    }

    private sealed class TestUnitOfWork : IUnitOfWork
    {
        private readonly Dictionary<Type, object> _repos = new();

        public void Register<T>(InMemoryRepo<T> repo) where T : class => _repos[typeof(T)] = repo;

        public IGenericRepository<T> Repository<T>() where T : class
        {
            if (_repos.TryGetValue(typeof(T), out var repo)) return (IGenericRepository<T>)repo;
            var created = new InMemoryRepo<T>();
            _repos[typeof(T)] = created;
            return created;
        }

        public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) => Task.FromResult(1);

        public Task ExecuteInTransactionAsync(Func<CancellationToken, Task> operation, CancellationToken cancellationToken = default)
            => operation(cancellationToken);

        public void Dispose() { }
    }

    private static (
        AuthService Service,
        InMemoryRepo<User> Users,
        InMemoryRepo<UserRole> UserRoles,
        InMemoryRepo<RefreshToken> RefreshTokens) CreateSut()
    {
        var users = new InMemoryRepo<User>(u => u.UserId);
        var roles = new InMemoryRepo<Role>(r => r.RoleId);
        var userRoles = new InMemoryRepo<UserRole>();
        var refreshTokens = new InMemoryRepo<RefreshToken>(rt => rt.RefreshTokenId);

        roles.Items.AddRange([
            new Role { RoleId = 1, RoleName = RoleNames.Customer },
            new Role { RoleId = 2, RoleName = RoleNames.Seller }
        ]);

        users.Items.Add(new User
        {
            UserId = 10,
            Username = "khach10",
            FullName = "Nguyễn Văn A",
            Email = "khach10@gmail.com",
            PasswordHash = "hash",
            IsActive = true
        });

        userRoles.Items.Add(new UserRole { UserId = 10, RoleId = 1 });
        userRoles.Items.Add(new UserRole { UserId = 10, RoleId = 2 }); // Seller role vừa được Admin cấp

        refreshTokens.Items.Add(new RefreshToken
        {
            RefreshTokenId = 1,
            UserId = 10,
            TokenHash = "valid-refresh-token-value",
            ExpiresAt = DateTime.UtcNow.AddDays(3),
            CreatedAt = DateTime.UtcNow.AddMinutes(-5)
        });

        var uow = new TestUnitOfWork();
        uow.Register(users);
        uow.Register(roles);
        uow.Register(userRoles);
        uow.Register(refreshTokens);

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["JwtSettings:Secret"] = "SuperSecretTestSigningKeyForUnitTests1234567890!",
                ["JwtSettings:Issuer"] = "TestIssuer",
                ["JwtSettings:Audience"] = "TestAudience",
                ["JwtSettings:AccessTokenExpirationMinutes"] = "60"
            })
            .Build();

        var service = new AuthService(uow, config, new RefreshTokenRequestValidator());
        return (service, users, userRoles, refreshTokens);
    }

    [Fact]
    public async Task RefreshTokenAsync_ValidToken_RotatesTokenAndReloadsLatestRolesIntoJwt()
    {
        var (service, _, _, refreshTokens) = CreateSut();

        var response = await service.RefreshTokenAsync(
            new RefreshTokenRequestDto { RefreshToken = "valid-refresh-token-value" },
            "127.0.0.1");

        Assert.Contains(RoleNames.Customer, response.Roles);
        Assert.Contains(RoleNames.Seller, response.Roles);
        Assert.Equal(RoleNames.Seller, response.Role);
        Assert.NotEqual("valid-refresh-token-value", response.RefreshToken);

        var oldToken = refreshTokens.Items.Single(rt => rt.RefreshTokenId == 1);
        Assert.NotNull(oldToken.RevokedAt);
        Assert.Equal(response.RefreshToken, oldToken.ReplacedByHash);
        Assert.Equal(2, refreshTokens.Items.Count);

        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(response.AccessToken);
        var roleClaims = jwt.Claims.Where(c => c.Type == ClaimTypes.Role || c.Type == "role").Select(c => c.Value).ToList();
        Assert.Contains(RoleNames.Seller, roleClaims);
    }

    [Fact]
    public async Task RefreshTokenAsync_RevokedToken_Throws401InvalidRefreshToken()
    {
        var (service, _, _, refreshTokens) = CreateSut();
        refreshTokens.Items[0].RevokedAt = DateTime.UtcNow.AddMinutes(-1);

        var ex = await Assert.ThrowsAsync<BusinessException>(() =>
            service.RefreshTokenAsync(new RefreshTokenRequestDto { RefreshToken = "valid-refresh-token-value" }, "127.0.0.1"));

        Assert.Equal(401, ex.HttpStatus);
        Assert.Equal(ErrorCodes.InvalidRefreshToken, ex.Code);
    }

    [Fact]
    public async Task RefreshTokenAsync_LockedUser_Throws403AccountLocked()
    {
        var (service, users, _, _) = CreateSut();
        users.Items[0].IsActive = false;

        var ex = await Assert.ThrowsAsync<BusinessException>(() =>
            service.RefreshTokenAsync(new RefreshTokenRequestDto { RefreshToken = "valid-refresh-token-value" }, "127.0.0.1"));

        Assert.Equal(403, ex.HttpStatus);
        Assert.Equal(ErrorCodes.AccountLocked, ex.Code);
    }

    [Fact]
    public async Task RefreshTokenAsync_EmptyToken_ThrowsValidationException()
    {
        var (service, _, _, _) = CreateSut();

        await Assert.ThrowsAsync<ValidationException>(() =>
            service.RefreshTokenAsync(new RefreshTokenRequestDto { RefreshToken = "   " }, "127.0.0.1"));
    }
}

