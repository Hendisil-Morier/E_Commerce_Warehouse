using System.Linq.Expressions;
using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.Contracts.Services;
using ECommerceWarehouse.Application.DTOs.Catalog;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Application.Validators.Catalog;
using ECommerceWarehouse.Domain.Constants;
using ECommerceWarehouse.Domain.Entities.Seller;
using ECommerceWarehouse.Domain.Enums;
using ECommerceWarehouse.Domain.Exceptions;
using FluentValidation;
using DomainSeller = ECommerceWarehouse.Domain.Entities.Seller.Seller;

namespace ECommerceWarehouse.UnitTests.Services;

public class ShopServiceTests
{
    private sealed class FakeApprovedSellerResolver : IApprovedSellerResolver
    {
        public Func<CancellationToken, Task<DomainSeller>> Handler { get; set; }
            = _ => Task.FromResult(new DomainSeller
            {
                SellerId = 1,
                UserId = 10,
                BusinessName = "Công ty A",
                Status = SellerStatus.Approved
            });

        public Task<DomainSeller> RequireApprovedSellerAsync(CancellationToken cancellationToken = default)
            => Handler(cancellationToken);
    }

    private sealed class FakeCurrentUser : ICurrentUser
    {
        public bool IsAuthenticated { get; set; } = true;
        public long? UserId { get; set; } = 10;
        public IReadOnlyList<string> Roles { get; set; } = [RoleNames.Seller];
        public long? SellerId { get; set; } = 1;
        public bool IsInRole(string role) => Roles.Contains(role, StringComparer.OrdinalIgnoreCase);
        public Task<long?> GetSellerIdAsync(CancellationToken cancellationToken = default) => Task.FromResult(SellerId);
    }

    private sealed class InMemorySellerRepo : ISellerRepository
    {
        public List<DomainSeller> Items { get; } = [];
        public Task<DomainSeller?> GetByIdWithUserAsync(long sellerId, CancellationToken cancellationToken = default)
            => Task.FromResult(Items.FirstOrDefault(s => s.SellerId == sellerId));
        public Task<DomainSeller?> GetByUserIdWithUserAsync(long userId, CancellationToken cancellationToken = default)
            => Task.FromResult(Items.FirstOrDefault(s => s.UserId == userId));
        public Task<DomainSeller?> GetByUserIdWithUserAsNoTrackingAsync(long userId, CancellationToken cancellationToken = default)
            => Task.FromResult(Items.FirstOrDefault(s => s.UserId == userId));
        public Task<Application.DTOs.Common.PagedResult<DomainSeller>> GetPagedAsync(Application.DTOs.Seller.SellerListQueryDto query, CancellationToken cancellationToken = default)
            => throw new NotSupportedException();
        public Task AddAsync(DomainSeller seller, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public void Update(DomainSeller seller) { }
    }

    private sealed class InMemoryShopRepository : IShopRepository
    {
        private long _nextShopId = 10;
        public List<Shop> Shops { get; } = [];
        public Dictionary<long, int> ActiveProductCounts { get; } = new();

        public Task<IReadOnlyList<Shop>> GetBySellerIdAsNoTrackingAsync(
            long sellerId,
            bool? isActive = null,
            CancellationToken cancellationToken = default)
        {
            IEnumerable<Shop> query = Shops.Where(s => s.SellerId == sellerId);
            if (isActive.HasValue)
            {
                query = query.Where(s => s.IsActive == isActive.Value);
            }

            IReadOnlyList<Shop> result = query
                .OrderByDescending(s => s.CreatedAt)
                .ThenByDescending(s => s.ShopId)
                .ToList();

            return Task.FromResult(result);
        }

        public Task<Shop?> GetByIdAndSellerIdAsync(long shopId, long sellerId, CancellationToken cancellationToken = default)
            => Task.FromResult(Shops.FirstOrDefault(s => s.ShopId == shopId && s.SellerId == sellerId));

        public Task<Shop?> GetPublicActiveByIdWithSellerAsNoTrackingAsync(long shopId, CancellationToken cancellationToken = default)
            => Task.FromResult(Shops.FirstOrDefault(s =>
                s.ShopId == shopId &&
                s.IsActive &&
                s.Seller != null &&
                s.Seller.Status == SellerStatus.Approved));

        public Task<int> CountActiveProductsByShopIdAsync(long shopId, CancellationToken cancellationToken = default)
            => Task.FromResult(ActiveProductCounts.TryGetValue(shopId, out var count) ? count : 0);

        public Task<bool> ExistsShopNameForSellerAsync(
            long sellerId,
            string shopName,
            long? excludeShopId = null,
            CancellationToken cancellationToken = default)
        {
            var exists = Shops.Any(s =>
                s.SellerId == sellerId &&
                (!excludeShopId.HasValue || s.ShopId != excludeShopId.Value) &&
                string.Equals(s.ShopName, shopName, StringComparison.OrdinalIgnoreCase));

            return Task.FromResult(exists);
        }

        public Task AddAsync(Shop shop, CancellationToken cancellationToken = default)
        {
            if (shop.ShopId == 0)
            {
                shop.ShopId = ++_nextShopId;
            }

            Shops.Add(shop);
            return Task.CompletedTask;
        }

        public void Update(Shop shop) { }
    }

    private sealed class FakeUnitOfWork : IUnitOfWork
    {
        public IGenericRepository<T> Repository<T>() where T : class => throw new NotSupportedException();
        public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) => Task.FromResult(1);
        public Task ExecuteInTransactionAsync(Func<CancellationToken, Task> operation, CancellationToken cancellationToken = default)
            => operation(cancellationToken);
        public void Dispose() { }
    }

    private static ShopService CreateService(
        InMemoryShopRepository shopRepo,
        IApprovedSellerResolver? resolver = null)
    {
        return new ShopService(
            shopRepo,
            new FakeUnitOfWork(),
            resolver ?? new FakeApprovedSellerResolver(),
            new CreateShopRequestValidator(),
            new UpdateShopRequestValidator());
    }

    [Fact]
    public async Task CreateAndGetMyShops_ApprovedSeller_ReturnsOnlyOwnShops()
    {
        var shopRepo = new InMemoryShopRepository();
        shopRepo.Shops.Add(new Shop { ShopId = 99, SellerId = 2, ShopName = "Other Seller Shop", IsActive = true });
        var service = CreateService(shopRepo);

        var created = await service.CreateShopAsync(new CreateShopRequestDto
        {
            ShopName = "  Modu Tech Store  ",
            Description = "  Phụ kiện chính hãng  ",
            LogoUrl = "/uploads/products/2026/11/logo.png"
        });

        Assert.Equal(1, created.SellerId);
        Assert.Equal("Modu Tech Store", created.ShopName);
        Assert.Equal("Phụ kiện chính hãng", created.Description);
        Assert.True(created.IsActive);

        var myShops = await service.GetMyShopsAsync();
        Assert.Single(myShops);
        Assert.Equal(created.ShopId, myShops[0].ShopId);
    }

    [Theory]
    [InlineData(SellerStatus.Pending)]
    [InlineData(SellerStatus.Rejected)]
    [InlineData(SellerStatus.Suspended)]
    public async Task ApprovedSellerResolver_WhenNotApproved_ThrowsSellerNotApproved(SellerStatus status)
    {
        var sellerRepo = new InMemorySellerRepo();
        sellerRepo.Items.Add(new DomainSeller { SellerId = 5, UserId = 10, BusinessName = "A", Status = status });
        var resolver = new ApprovedSellerResolver(sellerRepo, new FakeCurrentUser { UserId = 10 });
        var service = CreateService(new InMemoryShopRepository(), resolver);

        var ex = await Assert.ThrowsAsync<BusinessException>(() => service.GetMyShopsAsync());
        Assert.Equal(ErrorCodes.SellerNotApproved, ex.Code);
        Assert.Equal(409, ex.HttpStatus);
    }

    [Fact]
    public async Task ApprovedSellerResolver_WhenMissingSellerProfile_ThrowsSellerNotApproved()
    {
        var resolver = new ApprovedSellerResolver(new InMemorySellerRepo(), new FakeCurrentUser { UserId = 999 });
        var service = CreateService(new InMemoryShopRepository(), resolver);

        var ex = await Assert.ThrowsAsync<BusinessException>(() =>
            service.CreateShopAsync(new CreateShopRequestDto { ShopName = "Shop Mới" }));

        Assert.Equal(ErrorCodes.SellerNotApproved, ex.Code);
        Assert.Equal(409, ex.HttpStatus);
    }

    [Fact]
    public async Task CreateShop_DuplicateNameForSameSeller_ThrowsShopNameAlreadyExists()
    {
        var shopRepo = new InMemoryShopRepository();
        shopRepo.Shops.Add(new Shop { ShopId = 1, SellerId = 1, ShopName = "Alpha Store" });
        shopRepo.Shops.Add(new Shop { ShopId = 2, SellerId = 2, ShopName = "Beta Store" });
        var service = CreateService(shopRepo);

        var duplicateEx = await Assert.ThrowsAsync<BusinessException>(() =>
            service.CreateShopAsync(new CreateShopRequestDto { ShopName = "alpha store" }));
        Assert.Equal(ErrorCodes.ShopNameAlreadyExists, duplicateEx.Code);
        Assert.Equal(409, duplicateEx.HttpStatus);

        // Seller 1 được phép dùng tên trùng với shop của Seller 2
        var created = await service.CreateShopAsync(new CreateShopRequestDto { ShopName = "Beta Store" });
        Assert.Equal("Beta Store", created.ShopName);
    }

    [Fact]
    public async Task UpdateShop_OwnedByAnotherSeller_ThrowsNotFound()
    {
        var shopRepo = new InMemoryShopRepository();
        shopRepo.Shops.Add(new Shop { ShopId = 50, SellerId = 2, ShopName = "Seller2 Shop" });
        var service = CreateService(shopRepo);

        var ex = await Assert.ThrowsAsync<NotFoundException>(() =>
            service.UpdateShopAsync(50, new UpdateShopRequestDto { ShopName = "Hijack" }));

        Assert.Equal(ErrorCodes.NotFound, ex.Code);
        Assert.Equal(404, ex.HttpStatus);
    }

    [Fact]
    public async Task UpdateShop_OwnShop_UpdatesFieldsAndCanToggleActive()
    {
        var shopRepo = new InMemoryShopRepository();
        shopRepo.Shops.Add(new Shop { ShopId = 15, SellerId = 1, ShopName = "Old Name", IsActive = true });
        var service = CreateService(shopRepo);

        var updated = await service.UpdateShopAsync(15, new UpdateShopRequestDto
        {
            ShopName = "New Name",
            Description = "Mô tả mới",
            LogoUrl = "https://cdn.example.com/logo.webp",
            IsActive = false
        });

        Assert.Equal("New Name", updated.ShopName);
        Assert.False(updated.IsActive);
        Assert.NotNull(updated.UpdatedAt);
    }

    [Fact]
    public async Task CreateShop_UnsafeLogoUrl_ThrowsValidationException()
    {
        var service = CreateService(new InMemoryShopRepository());

        await Assert.ThrowsAsync<ValidationException>(() =>
            service.CreateShopAsync(new CreateShopRequestDto
            {
                ShopName = "Valid Shop",
                LogoUrl = "javascript:alert(1)"
            }));

        await Assert.ThrowsAsync<ValidationException>(() =>
            service.CreateShopAsync(new CreateShopRequestDto
            {
                ShopName = "Valid Shop",
                LogoUrl = "/uploads/../appsettings.json"
            }));
    }

    [Fact]
    public async Task GetPublicShopById_ActiveShopApprovedSeller_ReturnsDtoWithCount()
    {
        var shopRepo = new InMemoryShopRepository();
        var seller = new DomainSeller { SellerId = 1, BusinessName = "Modu Co", Status = SellerStatus.Approved };
        shopRepo.Shops.Add(new Shop { ShopId = 7, SellerId = 1, ShopName = "Modu Flagship", IsActive = true, Seller = seller });
        shopRepo.ActiveProductCounts[7] = 12;
        var service = CreateService(shopRepo);

        var dto = await service.GetPublicShopByIdAsync(7);
        Assert.Equal("Modu Flagship", dto.ShopName);
        Assert.Equal("Modu Co", dto.SellerBusinessName);
        Assert.Equal(12, dto.ActiveProductCount);
    }

    [Theory]
    [InlineData(false, SellerStatus.Approved)]
    [InlineData(true, SellerStatus.Suspended)]
    public async Task GetPublicShopById_InactiveOrSuspendedSeller_ThrowsNotFound(bool isActive, SellerStatus sellerStatus)
    {
        var shopRepo = new InMemoryShopRepository();
        var seller = new DomainSeller { SellerId = 1, BusinessName = "Modu Co", Status = sellerStatus };
        shopRepo.Shops.Add(new Shop { ShopId = 8, SellerId = 1, ShopName = "Hidden Shop", IsActive = isActive, Seller = seller });
        var service = CreateService(shopRepo);

        await Assert.ThrowsAsync<NotFoundException>(() => service.GetPublicShopByIdAsync(8));
    }
}

