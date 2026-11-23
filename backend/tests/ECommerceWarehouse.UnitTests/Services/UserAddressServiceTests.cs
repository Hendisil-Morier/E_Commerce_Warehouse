using System.Linq.Expressions;
using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.Contracts.Services;
using ECommerceWarehouse.Application.DTOs.Customer;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Application.Validators.Customer;
using ECommerceWarehouse.Domain.Entities.Customer;
using ECommerceWarehouse.Domain.Exceptions;

namespace ECommerceWarehouse.UnitTests.Services;

public class UserAddressServiceTests
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
        public long? UserId { get; set; } = 200;
        public IReadOnlyList<string> Roles { get; set; } = ["Customer"];
        public long? SellerId => null;
        public bool IsAuthenticated => UserId.HasValue;
        public bool IsInRole(string role) => Roles.Contains(role);
        public Task<long?> GetSellerIdAsync(CancellationToken cancellationToken = default) => Task.FromResult<long?>(null);
    }

    private static (UserAddressService Service, InMemoryRepo<UserAddress> Addresses) CreateSut()
    {
        var addresses = new InMemoryRepo<UserAddress>(a => a.AddressId);
        var uow = new TestUnitOfWork();
        uow.Register(addresses);

        var currentUser = new TestCurrentUser();
        var service = new UserAddressService(
            uow,
            currentUser,
            new CreateAddressRequestValidator(),
            new UpdateAddressRequestValidator());

        return (service, addresses);
    }

    [Fact]
    public async Task CreateAddressAsync_FirstAddress_AutomaticallySetsDefault()
    {
        var (service, addresses) = CreateSut();
        var request = new CreateAddressRequestDto
        {
            RecipientName = "Nguyễn Văn B",
            PhoneNumber = "0912345678",
            Province = "Hà Nội",
            District = "Cầu Giấy",
            Ward = "Dịch Vọng",
            StreetAddress = "123 Đường Cầu Giấy",
            IsDefault = false // Người dùng truyền false nhưng là địa chỉ đầu tiên
        };

        var created = await service.CreateAddressAsync(request);

        Assert.True(created.IsDefault);
        Assert.Single(addresses.Items);
        Assert.True(addresses.Items[0].IsDefault);
        Assert.Equal("123 Đường Cầu Giấy, Dịch Vọng, Cầu Giấy, Hà Nội", created.FullAddress);
    }

    [Fact]
    public async Task CreateAddressAsync_SecondDefaultAddress_UnsetsPreviousDefault()
    {
        var (service, addresses) = CreateSut();
        addresses.Items.Add(new UserAddress
        {
            AddressId = 1,
            UserId = 200,
            RecipientName = "Địa chỉ 1",
            PhoneNumber = "0912345678",
            Province = "HN",
            District = "Ba Đình",
            Ward = "Kim Mã",
            StreetAddress = "10 Kim Mã",
            IsDefault = true
        });

        var request = new CreateAddressRequestDto
        {
            RecipientName = "Địa chỉ 2",
            PhoneNumber = "0987654321",
            Province = "HCM",
            District = "Quận 1",
            Ward = "Bến Nghé",
            StreetAddress = "20 Lê Lợi",
            IsDefault = true
        };

        var created = await service.CreateAddressAsync(request);

        Assert.True(created.IsDefault);
        var oldAddr = addresses.Items.Single(a => a.AddressId == 1);
        Assert.False(oldAddr.IsDefault);
    }

    [Fact]
    public async Task SetDefaultAddressAsync_SwitchesDefaultCorrectly()
    {
        var (service, addresses) = CreateSut();
        addresses.Items.Add(new UserAddress
        {
            AddressId = 1,
            UserId = 200,
            RecipientName = "Địa chỉ 1",
            PhoneNumber = "0912345678",
            Province = "HN",
            District = "Ba Đình",
            Ward = "Kim Mã",
            StreetAddress = "10 Kim Mã",
            IsDefault = true
        });
        addresses.Items.Add(new UserAddress
        {
            AddressId = 2,
            UserId = 200,
            RecipientName = "Địa chỉ 2",
            PhoneNumber = "0987654321",
            Province = "HCM",
            District = "Quận 1",
            Ward = "Bến Nghé",
            StreetAddress = "20 Lê Lợi",
            IsDefault = false
        });

        var result = await service.SetDefaultAddressAsync(2);

        Assert.True(result.IsDefault);
        Assert.False(addresses.Items.Single(a => a.AddressId == 1).IsDefault);
        Assert.True(addresses.Items.Single(a => a.AddressId == 2).IsDefault);
    }

    [Fact]
    public async Task DeleteAddressAsync_DefaultAddress_SetsAnotherAddressAsDefault()
    {
        var (service, addresses) = CreateSut();
        addresses.Items.Add(new UserAddress
        {
            AddressId = 1,
            UserId = 200,
            RecipientName = "Địa chỉ 1",
            PhoneNumber = "0912345678",
            Province = "HN",
            District = "Ba Đình",
            Ward = "Kim Mã",
            StreetAddress = "10 Kim Mã",
            IsDefault = true
        });
        addresses.Items.Add(new UserAddress
        {
            AddressId = 2,
            UserId = 200,
            RecipientName = "Địa chỉ 2",
            PhoneNumber = "0987654321",
            Province = "HCM",
            District = "Quận 1",
            Ward = "Bến Nghé",
            StreetAddress = "20 Lê Lợi",
            IsDefault = false
        });

        await service.DeleteAddressAsync(1);

        Assert.Single(addresses.Items);
        Assert.Equal(2, addresses.Items[0].AddressId);
        Assert.True(addresses.Items[0].IsDefault);
    }

    [Fact]
    public async Task GetAddressByIdAsync_NotOwned_ThrowsNotFoundException()
    {
        var (service, addresses) = CreateSut();
        addresses.Items.Add(new UserAddress
        {
            AddressId = 999,
            UserId = 300, // Của user khác
            RecipientName = "Người lạ",
            PhoneNumber = "0912345678",
            Province = "HN",
            District = "Ba Đình",
            Ward = "Kim Mã",
            StreetAddress = "10 Kim Mã",
            IsDefault = true
        });

        await Assert.ThrowsAsync<NotFoundException>(() => service.GetAddressByIdAsync(999));
    }
}
