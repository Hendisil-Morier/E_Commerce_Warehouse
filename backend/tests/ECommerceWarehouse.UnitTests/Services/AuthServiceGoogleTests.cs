using System.Linq.Expressions;
using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.Contracts.Services;
using ECommerceWarehouse.Application.DTOs.Identity;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Application.Validators.Identity;
using ECommerceWarehouse.Domain.Entities.Identity;
using ECommerceWarehouse.Domain.Exceptions;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;

namespace ECommerceWarehouse.UnitTests.Services;

public class AuthServiceGoogleTests
{
    private sealed class InMemoryRepo<T> : IGenericRepository<T> where T : class
    {
        private readonly Func<T, long>? _idSelector;
        private readonly Action<T, long>? _idSetter;
        private long _seq = 100;
        public List<T> Items { get; } = [];

        public InMemoryRepo(Func<T, long>? idSelector = null, Action<T, long>? idSetter = null)
        {
            _idSelector = idSelector;
            _idSetter = idSetter;
        }

        public Task<T?> GetByIdAsync(long id)
            => Task.FromResult(_idSelector == null ? null : Items.FirstOrDefault(x => _idSelector(x) == id));

        public Task<IEnumerable<T>> GetAllAsync() => Task.FromResult<IEnumerable<T>>(Items.ToList());

        public Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate)
            => Task.FromResult<IEnumerable<T>>(Items.Where(predicate.Compile()).ToList());

        public Task AddAsync(T entity)
        {
            if (_idSetter != null && _idSelector != null && _idSelector(entity) == 0)
            {
                _idSetter(entity, ++_seq);
            }
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

    private sealed class StubGoogleTokenValidator : IGoogleTokenValidator
    {
        private readonly Func<string, GoogleTokenPayload> _handler;

        public StubGoogleTokenValidator(Func<string, GoogleTokenPayload> handler)
            => _handler = handler;

        public Task<GoogleTokenPayload> ValidateAsync(string idToken, CancellationToken cancellationToken = default)
            => Task.FromResult(_handler(idToken));
    }

    private static (AuthService Service, InMemoryRepo<User> Users, InMemoryRepo<UserRole> UserRoles, InMemoryRepo<RefreshToken> Tokens) BuildSut(
        Func<string, GoogleTokenPayload> validatorHandler)
    {
        var uow = new TestUnitOfWork();
        var users = new InMemoryRepo<User>(u => u.UserId, (u, id) => u.UserId = id);
        var roles = new InMemoryRepo<Role>(r => r.RoleId);
        var userRoles = new InMemoryRepo<UserRole>();
        var tokens = new InMemoryRepo<RefreshToken>(t => t.RefreshTokenId, (t, id) => t.RefreshTokenId = id);

        roles.Items.Add(new Role { RoleId = 1, RoleName = "Customer" });

        uow.Register(users);
        uow.Register(roles);
        uow.Register(userRoles);
        uow.Register(tokens);

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["JwtSettings:Secret"] = "UnitTestJwtSecretKeyWith32PlusCharacters2026!",
                ["JwtSettings:Issuer"] = "TestIssuer",
                ["JwtSettings:Audience"] = "TestAudience",
                ["JwtSettings:AccessTokenExpirationMinutes"] = "60"
            })
            .Build();

        var service = new AuthService(
            uow,
            config,
            new RefreshTokenRequestValidator(),
            googleTokenValidator: new StubGoogleTokenValidator(validatorHandler));

        return (service, users, userRoles, tokens);
    }

    [Fact]
    public async Task GoogleLogin_InvalidToken_ThrowsGoogleTokenInvalid401()
    {
        var (service, _, _, _) = BuildSut(_ =>
            throw new BusinessException(ErrorCodes.GoogleTokenInvalid, "Token sai", 401));

        var ex = await Assert.ThrowsAsync<BusinessException>(() =>
            service.GoogleLoginAsync(new GoogleLoginRequestDto { IdToken = "bad-token" }, "127.0.0.1"));

        Assert.Equal(ErrorCodes.GoogleTokenInvalid, ex.Code);
        Assert.Equal(401, ex.HttpStatus);
    }

    [Fact]
    public async Task GoogleLogin_UnverifiedEmail_ThrowsGoogleTokenInvalid401()
    {
        var (service, _, _, _) = BuildSut(_ =>
            new GoogleTokenPayload("sub-123", "unverified@gmail.com", false, "No Verify", null));

        var ex = await Assert.ThrowsAsync<BusinessException>(() =>
            service.GoogleLoginAsync(new GoogleLoginRequestDto { IdToken = "valid-shape" }, "127.0.0.1"));

        Assert.Equal(ErrorCodes.GoogleTokenInvalid, ex.Code);
        Assert.Equal(401, ex.HttpStatus);
    }

    [Fact]
    public async Task GoogleLogin_NewUser_CreatesCustomerWithRandomPasswordAndReturnsTokens()
    {
        var (service, users, userRoles, tokens) = BuildSut(_ =>
            new GoogleTokenPayload("sub-new-1", "newuser@gmail.com", true, "New Google User", "https://pic.test/a.jpg"));

        var res = await service.GoogleLoginAsync(new GoogleLoginRequestDto { IdToken = "tok" }, "127.0.0.1");

        var created = Assert.Single(users.Items);
        Assert.Equal("newuser@gmail.com", created.Email);
        Assert.Equal("sub-new-1", created.GoogleSubject);
        Assert.Equal("https://pic.test/a.jpg", created.AvatarUrl);
        Assert.False(string.IsNullOrWhiteSpace(created.PasswordHash));
        Assert.Single(userRoles.Items);
        Assert.Single(tokens.Items);
        Assert.Equal("Customer", res.Role);
        Assert.False(string.IsNullOrWhiteSpace(res.AccessToken));
    }

    [Fact]
    public async Task GoogleLogin_ExistingBySubject_LogsInAndFillsEmptyAvatar()
    {
        var (service, users, userRoles, tokens) = BuildSut(_ =>
            new GoogleTokenPayload("sub-existing", "linked@gmail.com", true, "Linked", "https://pic.test/new.jpg"));

        users.Items.Add(new User
        {
            UserId = 7,
            Email = "linked@gmail.com",
            FullName = "Linked",
            GoogleSubject = "sub-existing",
            PasswordHash = "hash",
            IsActive = true
        });
        userRoles.Items.Add(new UserRole { UserId = 7, RoleId = 1 });

        var res = await service.GoogleLoginAsync(new GoogleLoginRequestDto { IdToken = "tok" }, "127.0.0.1");

        Assert.Equal(7, res.UserId);
        Assert.Equal("https://pic.test/new.jpg", users.Items[0].AvatarUrl);
        Assert.Single(tokens.Items);
    }

    [Fact]
    public async Task GoogleLogin_ExistingEmailWithoutSubject_LinksAccountInvalidatesOldPasswordAndRevokesTokens()
    {
        var (service, users, userRoles, tokens) = BuildSut(_ =>
            new GoogleTokenPayload("sub-bind-99", "victim@gmail.com", true, "Victim", null));

        var user = new User
        {
            UserId = 15,
            Email = "victim@gmail.com",
            FullName = "Victim",
            IsActive = true
        };
        var hasher = new PasswordHasher<User>();
        user.PasswordHash = hasher.HashPassword(user, "AttackerPass123!");
        users.Items.Add(user);
        userRoles.Items.Add(new UserRole { UserId = 15, RoleId = 1 });
        tokens.Items.Add(new RefreshToken
        {
            RefreshTokenId = 1,
            UserId = 15,
            TokenHash = "old_attacker_refresh",
            ExpiresAt = DateTime.UtcNow.AddDays(5),
            CreatedAt = DateTime.UtcNow.AddHours(-1)
        });

        var res = await service.GoogleLoginAsync(new GoogleLoginRequestDto { IdToken = "tok" }, "127.0.0.1");

        Assert.Equal("sub-bind-99", user.GoogleSubject);
        Assert.NotNull(tokens.Items[0].RevokedAt);
        Assert.Equal(2, tokens.Items.Count);
        Assert.Equal(PasswordVerificationResult.Failed, hasher.VerifyHashedPassword(user, user.PasswordHash, "AttackerPass123!"));
        Assert.Equal(15, res.UserId);
    }

    [Fact]
    public async Task GoogleLogin_LockedAccount_ThrowsAccountLocked403()
    {
        var (service, users, _, _) = BuildSut(_ =>
            new GoogleTokenPayload("sub-locked", "locked@gmail.com", true, "Locked", null));

        users.Items.Add(new User
        {
            UserId = 20,
            Email = "locked@gmail.com",
            FullName = "Locked",
            GoogleSubject = "sub-locked",
            PasswordHash = "hash",
            IsActive = false
        });

        var ex = await Assert.ThrowsAsync<BusinessException>(() =>
            service.GoogleLoginAsync(new GoogleLoginRequestDto { IdToken = "tok" }, "127.0.0.1"));

        Assert.Equal(ErrorCodes.AccountLocked, ex.Code);
        Assert.Equal(403, ex.HttpStatus);
    }

    [Fact]
    public async Task GoogleLogin_DifferentGoogleSubjectForSameEmail_ThrowsGoogleTokenInvalid401()
    {
        var (service, users, _, _) = BuildSut(_ =>
            new GoogleTokenPayload("sub-other", "taken@gmail.com", true, "Taken", null));

        users.Items.Add(new User
        {
            UserId = 21,
            Email = "taken@gmail.com",
            FullName = "Taken",
            GoogleSubject = "sub-original",
            PasswordHash = "hash",
            IsActive = true
        });

        var ex = await Assert.ThrowsAsync<BusinessException>(() =>
            service.GoogleLoginAsync(new GoogleLoginRequestDto { IdToken = "tok" }, "127.0.0.1"));

        Assert.Equal(ErrorCodes.GoogleTokenInvalid, ex.Code);
        Assert.Equal(401, ex.HttpStatus);
    }
}
