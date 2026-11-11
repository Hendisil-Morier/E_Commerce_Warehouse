using System.Linq.Expressions;
using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.Contracts.Services;
using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Seller;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Application.Validators.Seller;
using ECommerceWarehouse.Domain.Constants;
using ECommerceWarehouse.Domain.Entities.Identity;
using ECommerceWarehouse.Domain.Enums;
using ECommerceWarehouse.Domain.Exceptions;
using FluentValidation;
using DomainSeller = ECommerceWarehouse.Domain.Entities.Seller.Seller;

namespace ECommerceWarehouse.UnitTests.Services;

public class SellerServiceTests
{
    private sealed class FakeCurrentUser : ICurrentUser
    {
        public bool IsAuthenticated { get; set; } = true;
        public long? UserId { get; set; } = 10;
        public IReadOnlyList<string> Roles { get; set; } = [RoleNames.Customer];
        public long? SellerId { get; set; }

        public bool IsInRole(string role) => Roles.Contains(role, StringComparer.OrdinalIgnoreCase);

        public Task<long?> GetSellerIdAsync(CancellationToken cancellationToken = default)
            => Task.FromResult(SellerId);
    }

    private sealed class InMemoryGenericRepository<T> : IGenericRepository<T> where T : class
    {
        private readonly List<T> _items = [];
        private readonly Func<T, long>? _idSelector;

        public InMemoryGenericRepository(Func<T, long>? idSelector = null)
        {
            _idSelector = idSelector;
        }

        public List<T> Items => _items;

        public Task<T?> GetByIdAsync(long id)
        {
            if (_idSelector == null) return Task.FromResult<T?>(null);
            return Task.FromResult(_items.FirstOrDefault(x => _idSelector(x) == id));
        }

        public Task<IEnumerable<T>> GetAllAsync()
            => Task.FromResult<IEnumerable<T>>(_items.ToList());

        public Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate)
        {
            var compiled = predicate.Compile();
            return Task.FromResult<IEnumerable<T>>(_items.Where(compiled).ToList());
        }

        public Task AddAsync(T entity)
        {
            _items.Add(entity);
            return Task.CompletedTask;
        }

        public void Update(T entity)
        {
        }

        public void Remove(T entity)
        {
            _items.Remove(entity);
        }
    }

    private sealed class InMemorySellerRepository : ISellerRepository
    {
        private long _nextSellerId = 100;
        public List<DomainSeller> Sellers { get; } = [];

        public Task<DomainSeller?> GetByIdWithUserAsync(long sellerId, CancellationToken cancellationToken = default)
            => Task.FromResult(Sellers.FirstOrDefault(s => s.SellerId == sellerId));

        public Task<DomainSeller?> GetByUserIdWithUserAsync(long userId, CancellationToken cancellationToken = default)
            => Task.FromResult(Sellers.FirstOrDefault(s => s.UserId == userId));

        public Task<DomainSeller?> GetByUserIdWithUserAsNoTrackingAsync(long userId, CancellationToken cancellationToken = default)
            => Task.FromResult(Sellers.FirstOrDefault(s => s.UserId == userId));

        public Task<PagedResult<DomainSeller>> GetPagedAsync(SellerListQueryDto query, CancellationToken cancellationToken = default)
        {
            IEnumerable<DomainSeller> result = Sellers;

            if (query.Status.HasValue)
            {
                result = result.Where(s => s.Status == query.Status.Value);
            }

            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                var keyword = query.Search.Trim();
                result = result.Where(s =>
                    s.BusinessName.Contains(keyword, StringComparison.OrdinalIgnoreCase) ||
                    (s.TaxCode != null && s.TaxCode.Contains(keyword, StringComparison.OrdinalIgnoreCase)) ||
                    (s.User != null && (
                        s.User.Email.Contains(keyword, StringComparison.OrdinalIgnoreCase) ||
                        s.User.FullName.Contains(keyword, StringComparison.OrdinalIgnoreCase))));
            }

            var ordered = result.OrderByDescending(s => s.CreatedAt).ToList();
            var page = query.NormalizedPage;
            var pageSize = query.NormalizedPageSize;
            var pagedItems = ordered.Skip(query.Skip).Take(pageSize).ToList();

            return Task.FromResult(PagedResult<DomainSeller>.Create(pagedItems, page, pageSize, ordered.Count));
        }

        public Task AddAsync(DomainSeller seller, CancellationToken cancellationToken = default)
        {
            if (seller.SellerId == 0)
            {
                seller.SellerId = ++_nextSellerId;
            }
            Sellers.Add(seller);
            return Task.CompletedTask;
        }

        public void Update(DomainSeller seller)
        {
        }
    }

    private sealed class FakeUnitOfWork : IUnitOfWork
    {
        private readonly Dictionary<Type, object> _repositories = new();
        public int TransactionExecutions { get; private set; }
        public int SaveChangesCalls { get; private set; }

        public void RegisterRepository<T>(InMemoryGenericRepository<T> repository) where T : class
        {
            _repositories[typeof(T)] = repository;
        }

        public IGenericRepository<T> Repository<T>() where T : class
        {
            if (_repositories.TryGetValue(typeof(T), out var repo))
            {
                return (IGenericRepository<T>)repo;
            }

            var created = new InMemoryGenericRepository<T>();
            _repositories[typeof(T)] = created;
            return created;
        }

        public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            SaveChangesCalls++;
            return Task.FromResult(1);
        }

        public async Task ExecuteInTransactionAsync(Func<CancellationToken, Task> operation, CancellationToken cancellationToken = default)
        {
            TransactionExecutions++;
            await operation(cancellationToken);
        }

        public void Dispose()
        {
        }
    }

    private static (
        SellerService Service,
        InMemorySellerRepository SellerRepo,
        FakeUnitOfWork UnitOfWork,
        InMemoryGenericRepository<User> UsersRepo,
        InMemoryGenericRepository<Role> RolesRepo,
        InMemoryGenericRepository<UserRole> UserRolesRepo,
        FakeCurrentUser CurrentUser) CreateSut()
    {
        var sellerRepo = new InMemorySellerRepository();
        var unitOfWork = new FakeUnitOfWork();
        var usersRepo = new InMemoryGenericRepository<User>(u => u.UserId);
        var rolesRepo = new InMemoryGenericRepository<Role>(r => r.RoleId);
        var userRolesRepo = new InMemoryGenericRepository<UserRole>();

        rolesRepo.Items.AddRange([
            new Role { RoleId = 1, RoleName = RoleNames.Customer },
            new Role { RoleId = 2, RoleName = RoleNames.Seller },
            new Role { RoleId = 4, RoleName = RoleNames.Admin }
        ]);

        usersRepo.Items.Add(new User
        {
            UserId = 10,
            Username = "customer10",
            FullName = "Nguyễn Văn Khách",
            Email = "customer10@gmail.com",
            PasswordHash = "hashed",
            PhoneNumber = "0901234567",
            IsActive = true
        });

        unitOfWork.RegisterRepository(usersRepo);
        unitOfWork.RegisterRepository(rolesRepo);
        unitOfWork.RegisterRepository(userRolesRepo);

        var currentUser = new FakeCurrentUser();

        var service = new SellerService(
            sellerRepo,
            unitOfWork,
            currentUser,
            new RegisterSellerRequestValidator(),
            new RejectSellerRequestValidator(),
            new SuspendSellerRequestValidator(),
            new SellerListQueryValidator());

        return (service, sellerRepo, unitOfWork, usersRepo, rolesRepo, userRolesRepo, currentUser);
    }

    [Fact]
    public async Task RegisterOrResubmitAsync_NewCustomer_CreatesPendingSeller()
    {
        var (service, sellerRepo, _, _, _, _, _) = CreateSut();

        var result = await service.RegisterOrResubmitAsync(new RegisterSellerRequestDto
        {
            BusinessName = "  Shop Gia Dụng ABC  ",
            TaxCode = " 0109998887 ",
            Description = " Chuyên hàng gia dụng chính hãng "
        });

        Assert.True(result.IsCreated);
        Assert.Equal("Pending", result.Seller.Status);
        Assert.Equal("Shop Gia Dụng ABC", result.Seller.BusinessName);
        Assert.Equal("0109998887", result.Seller.TaxCode);
        Assert.Equal(5.00m, result.Seller.CommissionRate);
        Assert.Equal("customer10@gmail.com", result.Seller.User?.Email);
        Assert.Single(sellerRepo.Sellers);
    }

    [Fact]
    public async Task RegisterOrResubmitAsync_WhenRejected_ResubmitsToPendingAndClearsReason()
    {
        var (service, sellerRepo, _, usersRepo, _, _, _) = CreateSut();
        var user = usersRepo.Items.Single(u => u.UserId == 10);

        sellerRepo.Sellers.Add(new DomainSeller
        {
            SellerId = 55,
            UserId = 10,
            BusinessName = "Old Name",
            Status = SellerStatus.Rejected,
            RejectReason = "Thiếu giấy phép kinh doanh",
            User = user
        });

        var result = await service.RegisterOrResubmitAsync(new RegisterSellerRequestDto
        {
            BusinessName = "New Verified Name",
            TaxCode = "0312345678",
            Description = "Đã bổ sung đầy đủ giấy tờ"
        });

        Assert.False(result.IsCreated);
        Assert.Equal("Pending", result.Seller.Status);
        Assert.Equal("New Verified Name", result.Seller.BusinessName);
        Assert.Null(result.Seller.RejectReason);
        Assert.Null(result.Seller.ApprovedAt);
        Assert.NotNull(result.Seller.UpdatedAt);
        Assert.Single(sellerRepo.Sellers);
    }

    [Theory]
    [InlineData(SellerStatus.Pending)]
    [InlineData(SellerStatus.Approved)]
    [InlineData(SellerStatus.Suspended)]
    public async Task RegisterOrResubmitAsync_ExistingNonRejectedSeller_Throws409SellerAlreadyExists(
        SellerStatus existingStatus)
    {
        var (service, sellerRepo, _, usersRepo, _, _, _) = CreateSut();
        var user = usersRepo.Items.Single(u => u.UserId == 10);

        sellerRepo.Sellers.Add(new DomainSeller
        {
            SellerId = 77,
            UserId = 10,
            BusinessName = "Existing Shop",
            Status = existingStatus,
            User = user
        });

        var ex = await Assert.ThrowsAsync<BusinessException>(() =>
            service.RegisterOrResubmitAsync(new RegisterSellerRequestDto
            {
                BusinessName = "Duplicate Attempt"
            }));

        Assert.Equal(409, ex.HttpStatus);
        Assert.Equal(ErrorCodes.SellerAlreadyExists, ex.Code);
    }

    [Fact]
    public async Task RegisterOrResubmitAsync_EmptyBusinessName_ThrowsValidationException()
    {
        var (service, _, _, _, _, _, _) = CreateSut();

        await Assert.ThrowsAsync<ValidationException>(() =>
            service.RegisterOrResubmitAsync(new RegisterSellerRequestDto
            {
                BusinessName = "   "
            }));
    }

    [Fact]
    public async Task GetMySellerAsync_WhenMissing_ThrowsNotFoundException()
    {
        var (service, _, _, _, _, _, _) = CreateSut();

        await Assert.ThrowsAsync<NotFoundException>(() => service.GetMySellerAsync());
    }

    [Fact]
    public async Task GetMySellerAsync_WhenExists_ReturnsSellerDto()
    {
        var (service, sellerRepo, _, usersRepo, _, _, _) = CreateSut();
        var user = usersRepo.Items.Single(u => u.UserId == 10);

        sellerRepo.Sellers.Add(new DomainSeller
        {
            SellerId = 20,
            UserId = 10,
            BusinessName = "My Seller Profile",
            Status = SellerStatus.Pending,
            User = user
        });

        var dto = await service.GetMySellerAsync();

        Assert.Equal(20, dto.SellerId);
        Assert.Equal("Pending", dto.Status);
        Assert.Equal("My Seller Profile", dto.BusinessName);
    }

    [Fact]
    public async Task GetAdminSellersAsync_FiltersByStatusAndSearch_ReturnsPagedResult()
    {
        var (service, sellerRepo, _, usersRepo, _, _, _) = CreateSut();
        var user = usersRepo.Items.Single(u => u.UserId == 10);

        sellerRepo.Sellers.AddRange([
            new DomainSeller { SellerId = 1, UserId = 10, BusinessName = "Alpha Tech", Status = SellerStatus.Pending, User = user, CreatedAt = DateTime.UtcNow.AddMinutes(-2) },
            new DomainSeller { SellerId = 2, UserId = 11, BusinessName = "Beta Home", Status = SellerStatus.Approved, User = user, CreatedAt = DateTime.UtcNow.AddMinutes(-1) },
            new DomainSeller { SellerId = 3, UserId = 12, BusinessName = "Alpha Fashion", Status = SellerStatus.Pending, User = user, CreatedAt = DateTime.UtcNow }
        ]);

        var paged = await service.GetAdminSellersAsync(new SellerListQueryDto
        {
            Status = SellerStatus.Pending,
            Search = "Fashion",
            Page = 1,
            PageSize = 10
        });

        Assert.Equal(1, paged.TotalItems);
        Assert.Single(paged.Items);
        Assert.Equal(3, paged.Items[0].SellerId);
    }

    [Fact]
    public async Task ApproveAsync_PendingSeller_ApprovesAndAssignsSellerRoleInTransaction()
    {
        var (service, sellerRepo, unitOfWork, usersRepo, _, userRolesRepo, _) = CreateSut();
        var user = usersRepo.Items.Single(u => u.UserId == 10);

        sellerRepo.Sellers.Add(new DomainSeller
        {
            SellerId = 30,
            UserId = 10,
            BusinessName = "Pending Seller",
            Status = SellerStatus.Pending,
            RejectReason = "Old note",
            User = user
        });

        var dto = await service.ApproveAsync(30);

        Assert.Equal("Approved", dto.Status);
        Assert.NotNull(dto.ApprovedAt);
        Assert.Null(dto.RejectReason);
        Assert.Equal(1, unitOfWork.TransactionExecutions);
        Assert.Contains(userRolesRepo.Items, ur => ur.UserId == 10 && ur.RoleId == 2);
    }

    [Theory]
    [InlineData(SellerStatus.Approved)]
    [InlineData(SellerStatus.Rejected)]
    [InlineData(SellerStatus.Suspended)]
    public async Task ApproveAsync_NonPendingSeller_Throws409InvalidStatusTransition(SellerStatus status)
    {
        var (service, sellerRepo, _, usersRepo, _, _, _) = CreateSut();
        var user = usersRepo.Items.Single(u => u.UserId == 10);

        sellerRepo.Sellers.Add(new DomainSeller
        {
            SellerId = 31,
            UserId = 10,
            BusinessName = "Non-Pending Seller",
            Status = status,
            User = user
        });

        var ex = await Assert.ThrowsAsync<BusinessException>(() => service.ApproveAsync(31));

        Assert.Equal(409, ex.HttpStatus);
        Assert.Equal(ErrorCodes.InvalidStatusTransition, ex.Code);
    }

    [Fact]
    public async Task ApproveAsync_MissingSeller_ThrowsNotFoundException()
    {
        var (service, _, _, _, _, _, _) = CreateSut();

        await Assert.ThrowsAsync<NotFoundException>(() => service.ApproveAsync(999));
    }

    [Fact]
    public async Task RejectAsync_PendingSeller_SetsRejectedWithReason()
    {
        var (service, sellerRepo, _, usersRepo, _, _, _) = CreateSut();
        var user = usersRepo.Items.Single(u => u.UserId == 10);

        sellerRepo.Sellers.Add(new DomainSeller
        {
            SellerId = 40,
            UserId = 10,
            BusinessName = "To Reject",
            Status = SellerStatus.Pending,
            User = user
        });

        var dto = await service.RejectAsync(40, new RejectSellerRequestDto
        {
            Reason = "  Thông tin MST không hợp lệ  "
        });

        Assert.Equal("Rejected", dto.Status);
        Assert.Equal("Thông tin MST không hợp lệ", dto.RejectReason);
        Assert.Null(dto.ApprovedAt);
    }

    [Fact]
    public async Task RejectAsync_EmptyReason_ThrowsValidationException()
    {
        var (service, _, _, _, _, _, _) = CreateSut();

        await Assert.ThrowsAsync<ValidationException>(() =>
            service.RejectAsync(40, new RejectSellerRequestDto { Reason = "" }));
    }

    [Fact]
    public async Task RejectAsync_ApprovedSeller_Throws409InvalidStatusTransition()
    {
        var (service, sellerRepo, _, usersRepo, _, _, _) = CreateSut();
        var user = usersRepo.Items.Single(u => u.UserId == 10);

        sellerRepo.Sellers.Add(new DomainSeller
        {
            SellerId = 41,
            UserId = 10,
            BusinessName = "Already Approved",
            Status = SellerStatus.Approved,
            User = user
        });

        var ex = await Assert.ThrowsAsync<BusinessException>(() =>
            service.RejectAsync(41, new RejectSellerRequestDto { Reason = "Invalid attempt" }));

        Assert.Equal(409, ex.HttpStatus);
        Assert.Equal(ErrorCodes.InvalidStatusTransition, ex.Code);
    }

    [Fact]
    public async Task SuspendAsync_ApprovedSeller_SetsSuspendedAndOptionalReason()
    {
        var (service, sellerRepo, _, usersRepo, _, _, _) = CreateSut();
        var user = usersRepo.Items.Single(u => u.UserId == 10);

        sellerRepo.Sellers.Add(new DomainSeller
        {
            SellerId = 50,
            UserId = 10,
            BusinessName = "Active Shop",
            Status = SellerStatus.Approved,
            ApprovedAt = DateTime.UtcNow.AddDays(-5),
            User = user
        });

        var dto = await service.SuspendAsync(50, new SuspendSellerRequestDto
        {
            Reason = "Vi phạm chính sách vận chuyển"
        });

        Assert.Equal("Suspended", dto.Status);
        Assert.Equal("Vi phạm chính sách vận chuyển", dto.RejectReason);
    }

    [Theory]
    [InlineData(SellerStatus.Pending)]
    [InlineData(SellerStatus.Rejected)]
    [InlineData(SellerStatus.Suspended)]
    public async Task SuspendAsync_NonApprovedSeller_Throws409InvalidStatusTransition(SellerStatus status)
    {
        var (service, sellerRepo, _, usersRepo, _, _, _) = CreateSut();
        var user = usersRepo.Items.Single(u => u.UserId == 10);

        sellerRepo.Sellers.Add(new DomainSeller
        {
            SellerId = 51,
            UserId = 10,
            BusinessName = "Not Approved",
            Status = status,
            User = user
        });

        var ex = await Assert.ThrowsAsync<BusinessException>(() =>
            service.SuspendAsync(51, null));

        Assert.Equal(409, ex.HttpStatus);
        Assert.Equal(ErrorCodes.InvalidStatusTransition, ex.Code);
    }
}

