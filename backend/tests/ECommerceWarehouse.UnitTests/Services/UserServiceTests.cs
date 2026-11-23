using System.Linq.Expressions;
using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.Contracts.Services;
using ECommerceWarehouse.Application.DTOs.Customer;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Application.Validators.Customer;
using ECommerceWarehouse.Domain.Entities.Identity;
using ECommerceWarehouse.Domain.Exceptions;
using FluentValidation;
using Microsoft.AspNetCore.Identity;

namespace ECommerceWarehouse.UnitTests.Services;

public class UserServiceTests
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
        public Task ExecuteInTransactionAsync(Func<CancellationToken, Task> operation, CancellationToken cancellationToken = default) => operation(cancellationToken);
        public void Dispose() { }
    }

    private sealed class TestCurrentUser : ICurrentUser
    {
        public long? UserId { get; set; } = 100;
        public IReadOnlyList<string> Roles { get; set; } = ["Customer"];
        public long? SellerId => null;
        public bool IsAuthenticated => UserId.HasValue;
        public bool IsInRole(string role) => Roles.Contains(role);
        public Task<long?> GetSellerIdAsync(CancellationToken cancellationToken = default) => Task.FromResult<long?>(null);
    }

    private static (UserService Service, InMemoryRepo<User> Users, TestCurrentUser CurrentUser) CreateSut()
    {
        var users = new InMemoryRepo<User>(u => u.UserId);
        var roles = new InMemoryRepo<Role>(r => r.RoleId);
        var userRoles = new InMemoryRepo<UserRole>();

        roles.Items.Add(new Role { RoleId = 1, RoleName = "Customer" });

        var hasher = new PasswordHasher<User>();
        var user = new User
        {
            UserId = 100,
            Username = "user100",
            FullName = "Nguyễn Văn A",
            Email = "user100@emarket.vn",
            PhoneNumber = "0912345678",
            IsActive = true
        };
        user.PasswordHash = hasher.HashPassword(user, "OldPassword@123");

        users.Items.Add(user);
        userRoles.Items.Add(new UserRole { UserId = 100, RoleId = 1 });

        var uow = new TestUnitOfWork();
        uow.Register(users);
        uow.Register(roles);
        uow.Register(userRoles);

        var currentUser = new TestCurrentUser();
        var service = new UserService(
            uow,
            currentUser,
            new UpdateProfileRequestValidator(),
            new ChangePasswordRequestValidator());

        return (service, users, currentUser);
    }

    [Fact]
    public async Task GetCurrentUserProfileAsync_ReturnsCorrectProfile()
    {
        var (service, _, _) = CreateSut();
        var profile = await service.GetCurrentUserProfileAsync();

        Assert.Equal(100, profile.UserId);
        Assert.Equal("Nguyễn Văn A", profile.FullName);
        Assert.Equal("user100@emarket.vn", profile.Email);
        Assert.Contains("Customer", profile.Roles);
    }

    [Fact]
    public async Task UpdateCurrentUserProfileAsync_UpdatesFieldsSuccessfully()
    {
        var (service, users, _) = CreateSut();
        var request = new UpdateProfileRequestDto
        {
            FullName = "Nguyễn Văn Mới",
            PhoneNumber = "0988776655",
            AvatarUrl = "https://example.com/avatar.jpg"
        };

        var updated = await service.UpdateCurrentUserProfileAsync(request);

        Assert.Equal("Nguyễn Văn Mới", updated.FullName);
        Assert.Equal("0988776655", updated.PhoneNumber);
        Assert.Equal("https://example.com/avatar.jpg", updated.AvatarUrl);

        var userInDb = users.Items.Single(u => u.UserId == 100);
        Assert.Equal("Nguyễn Văn Mới", userInDb.FullName);
        Assert.Equal("0988776655", userInDb.PhoneNumber);
    }

    [Fact]
    public async Task ChangePasswordAsync_CorrectOldPassword_ChangesPassword()
    {
        var (service, users, _) = CreateSut();
        var request = new ChangePasswordRequestDto
        {
            CurrentPassword = "OldPassword@123",
            NewPassword = "NewSecretPassword@123",
            ConfirmPassword = "NewSecretPassword@123"
        };

        await service.ChangePasswordAsync(request);

        var userInDb = users.Items.Single(u => u.UserId == 100);
        var hasher = new PasswordHasher<User>();
        var verify = hasher.VerifyHashedPassword(userInDb, userInDb.PasswordHash, "NewSecretPassword@123");
        Assert.Equal(PasswordVerificationResult.Success, verify);
    }

    [Fact]
    public async Task ChangePasswordAsync_WrongOldPassword_ThrowsInvalidCredentials()
    {
        var (service, _, _) = CreateSut();
        var request = new ChangePasswordRequestDto
        {
            CurrentPassword = "WrongPassword@123",
            NewPassword = "NewSecretPassword@123",
            ConfirmPassword = "NewSecretPassword@123"
        };

        var ex = await Assert.ThrowsAsync<BusinessException>(() => service.ChangePasswordAsync(request));
        Assert.Equal(ErrorCodes.InvalidCredentials, ex.Code);
        Assert.Equal(400, ex.HttpStatus);
    }

    [Fact]
    public async Task ChangePasswordAsync_SamePassword_ThrowsValidationException()
    {
        var (service, _, _) = CreateSut();
        var request = new ChangePasswordRequestDto
        {
            CurrentPassword = "OldPassword@123",
            NewPassword = "OldPassword@123",
            ConfirmPassword = "OldPassword@123"
        };

        await Assert.ThrowsAsync<ValidationException>(() => service.ChangePasswordAsync(request));
    }
}
