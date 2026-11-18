using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.DTOs.Catalog;
using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Application.Validators.Catalog;
using ECommerceWarehouse.Domain.Entities.Catalog;
using ECommerceWarehouse.Domain.Entities.Seller;
using ECommerceWarehouse.Domain.Enums;
using ECommerceWarehouse.Domain.Exceptions;
using FluentValidation;
using DomainSeller = ECommerceWarehouse.Domain.Entities.Seller.Seller;

namespace ECommerceWarehouse.UnitTests.Services;

public class AdminProductServiceTests
{
    private sealed class InMemoryAdminProductRepository : IProductRepository
    {
        public List<Product> Products { get; } = [];

        public Task<PagedResult<Product>> GetAdminPagedAsync(
            AdminProductQueryDto query,
            CancellationToken cancellationToken = default)
        {
            IEnumerable<Product> items = Products;
            if (query.Status.HasValue)
            {
                items = items.Where(p => p.ProductStatus == query.Status.Value);
            }

            if (query.ShopId.HasValue)
            {
                items = items.Where(p => p.ShopId == query.ShopId.Value);
            }

            if (query.CategoryId.HasValue)
            {
                items = items.Where(p => p.CategoryId == query.CategoryId.Value);
            }

            if (!string.IsNullOrWhiteSpace(query.Q))
            {
                var kw = query.Q.Trim();
                items = items.Where(p =>
                    p.ProductName.Contains(kw, StringComparison.OrdinalIgnoreCase) ||
                    p.Shop.ShopName.Contains(kw, StringComparison.OrdinalIgnoreCase) ||
                    p.Shop.Seller.BusinessName.Contains(kw, StringComparison.OrdinalIgnoreCase) ||
                    p.Variants.Any(v => v.SKU.Contains(kw, StringComparison.OrdinalIgnoreCase)));
            }

            var ordered = items.OrderByDescending(p => p.CreatedAt).ThenByDescending(p => p.ProductId).ToList();
            var pageItems = ordered.Skip(query.Skip).Take(query.NormalizedPageSize).ToList();
            return Task.FromResult(PagedResult<Product>.Create(pageItems, query.NormalizedPage, query.NormalizedPageSize, ordered.Count));
        }

        public Task<Product?> GetByIdWithDetailsAsync(long productId, bool asNoTracking = false, CancellationToken cancellationToken = default)
            => Task.FromResult(Products.FirstOrDefault(p => p.ProductId == productId));

        public Task<PagedResult<Product>> GetSellerPagedAsync(long sellerId, SellerProductQueryDto query, CancellationToken cancellationToken = default)
            => throw new NotSupportedException();
        public Task<Product?> GetByIdForSellerWithDetailsAsync(long productId, long sellerId, bool asNoTracking = false, CancellationToken cancellationToken = default)
            => throw new NotSupportedException();
        public Task<PagedResult<Product>> GetPublicPagedAsync(PublicProductQueryDto query, IReadOnlyCollection<long>? expandedCategoryIds = null, CancellationToken cancellationToken = default)
            => throw new NotSupportedException();
        public Task<Product?> GetPublicByIdWithDetailsAsync(long productId, CancellationToken cancellationToken = default)
            => throw new NotSupportedException();
        public Task<IReadOnlyDictionary<long, int>> GetVariantAvailabilityByIdsAsync(IReadOnlyCollection<long> variantIds, CancellationToken cancellationToken = default)
            => throw new NotSupportedException();
        public Task<ProductVariant?> GetVariantByIdForSellerAsync(long variantId, long sellerId, CancellationToken cancellationToken = default)
            => throw new NotSupportedException();
        public Task<bool> ExistsSkuAsync(string sku, long? excludeVariantId = null, CancellationToken cancellationToken = default)
            => throw new NotSupportedException();
        public Task<bool> ExistsBarcodeAsync(string barcode, long? excludeVariantId = null, CancellationToken cancellationToken = default)
            => throw new NotSupportedException();
        public Task AddAsync(Product product, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task AddVariantAsync(ProductVariant variant, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public void Update(Product product) { }
        public void UpdateVariant(ProductVariant variant) { }
        public void RemoveImages(IEnumerable<ProductImage> images) { }
    }

    private sealed class FakeUnitOfWork : IUnitOfWork
    {
        public IGenericRepository<T> Repository<T>() where T : class => throw new NotSupportedException();
        public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) => Task.FromResult(1);
        public Task ExecuteInTransactionAsync(Func<CancellationToken, Task> operation, CancellationToken cancellationToken = default)
            => operation(cancellationToken);
        public void Dispose() { }
    }

    private static (AdminProductService Service, InMemoryAdminProductRepository Repo) CreateSut()
    {
        var repo = new InMemoryAdminProductRepository();
        var seller = new DomainSeller
        {
            SellerId = 1,
            UserId = 10,
            BusinessName = "Công ty TNHH Modu",
            Status = SellerStatus.Approved
        };
        var activeShop = new Shop
        {
            ShopId = 10,
            SellerId = 1,
            Seller = seller,
            ShopName = "Modu Store",
            IsActive = true
        };
        var inactiveShop = new Shop
        {
            ShopId = 11,
            SellerId = 1,
            Seller = seller,
            ShopName = "Paused Store",
            IsActive = false
        };
        var category = new Category { CategoryId = 2, CategoryName = "Tai nghe", IsActive = true };

        repo.Products.Add(new Product
        {
            ProductId = 1,
            ShopId = 10,
            Shop = activeShop,
            CategoryId = 2,
            Category = category,
            ProductName = "Sony WH-1000XM5",
            Description = "Noise cancelling headphones",
            ProductStatus = ProductStatus.PendingReview,
            RejectReason = "Old note",
            CreatedAt = DateTime.UtcNow.AddHours(-2),
            Images = [new ProductImage { ImageId = 1, ProductId = 1, ImageUrl = "/uploads/products/2026/11/xm5.png", IsPrimary = true, DisplayOrder = 0 }],
            Variants = [new ProductVariant { VariantId = 1, ProductId = 1, SKU = "SONY-XM5-BLK", VariantName = "Black", Price = 7990000m, IsActive = true }]
        });

        repo.Products.Add(new Product
        {
            ProductId = 2,
            ShopId = 11,
            Shop = inactiveShop,
            CategoryId = 2,
            Category = category,
            ProductName = "Draft Buds",
            ProductStatus = ProductStatus.PendingReview,
            CreatedAt = DateTime.UtcNow.AddHours(-1),
            Images = [new ProductImage { ImageId = 2, ProductId = 2, ImageUrl = "/uploads/products/2026/11/buds.png", IsPrimary = true, DisplayOrder = 0 }],
            Variants = [new ProductVariant { VariantId = 2, ProductId = 2, SKU = "BUDS-1", VariantName = "White", Price = 990000m, IsActive = true }]
        });

        repo.Products.Add(new Product
        {
            ProductId = 3,
            ShopId = 10,
            Shop = activeShop,
            CategoryId = 2,
            Category = category,
            ProductName = "Already Active Headset",
            ProductStatus = ProductStatus.Active,
            CreatedAt = DateTime.UtcNow,
            Images = [new ProductImage { ImageId = 3, ProductId = 3, ImageUrl = "/uploads/products/2026/11/hs.png", IsPrimary = true, DisplayOrder = 0 }],
            Variants = [new ProductVariant { VariantId = 3, ProductId = 3, SKU = "HS-ACT", VariantName = "Gray", Price = 1500000m, IsActive = true }]
        });

        var service = new AdminProductService(
            repo,
            new FakeUnitOfWork(),
            new AdminProductQueryValidator(),
            new RejectProductRequestValidator());

        return (service, repo);
    }

    [Fact]
    public async Task GetAdminProducts_FiltersByStatusAndKeyword()
    {
        var (service, _) = CreateSut();

        var result = await service.GetAdminProductsAsync(new AdminProductQueryDto
        {
            Status = ProductStatus.PendingReview,
            Q = "SONY-XM5"
        });

        Assert.Single(result.Items);
        Assert.Equal("Sony WH-1000XM5", result.Items[0].ProductName);
        Assert.Equal("Modu Store", result.Items[0].ShopName);
        Assert.Equal("Công ty TNHH Modu", result.Items[0].SellerBusinessName);
        Assert.Equal("/uploads/products/2026/11/xm5.png", result.Items[0].ThumbnailUrl);
    }

    [Fact]
    public async Task Approve_PendingReviewWithValidInvariants_TransitionsToActiveAndClearsRejectReason()
    {
        var (service, _) = CreateSut();

        var approved = await service.ApproveAsync(1);

        Assert.Equal("Active", approved.ProductStatus);
        Assert.Null(approved.RejectReason);
        Assert.Equal("Modu Store", approved.Shop.ShopName);
        Assert.Single(approved.Variants);
    }

    [Fact]
    public async Task Approve_NonPendingReview_ThrowsInvalidStatusTransition()
    {
        var (service, _) = CreateSut();

        var ex = await Assert.ThrowsAsync<BusinessException>(() => service.ApproveAsync(3));
        Assert.Equal(ErrorCodes.InvalidStatusTransition, ex.Code);
    }

    [Fact]
    public async Task Approve_InactiveShop_ThrowsBusinessRuleViolation()
    {
        var (service, _) = CreateSut();

        var ex = await Assert.ThrowsAsync<BusinessException>(() => service.ApproveAsync(2));
        Assert.Equal(ErrorCodes.BusinessRuleViolation, ex.Code);
    }

    [Fact]
    public async Task Reject_WithoutReason_ThrowsValidationException()
    {
        var (service, _) = CreateSut();

        await Assert.ThrowsAsync<ValidationException>(() => service.RejectAsync(1, new RejectProductRequestDto { Reason = "   " }));
    }

    [Fact]
    public async Task Reject_PendingReviewWithReason_TransitionsToRejectedAndStoresReason()
    {
        var (service, _) = CreateSut();

        var rejected = await service.RejectAsync(1, new RejectProductRequestDto { Reason = "  Thiếu thông số bảo hành chính hãng  " });

        Assert.Equal("Rejected", rejected.ProductStatus);
        Assert.Equal("Thiếu thông số bảo hành chính hãng", rejected.RejectReason);
    }

    [Fact]
    public async Task GetAdminProductById_ExistingAndMissing_ReturnsDetailOrThrowsNotFound()
    {
        var (service, _) = CreateSut();

        var detail = await service.GetAdminProductByIdAsync(1);
        Assert.Equal("Sony WH-1000XM5", detail.ProductName);
        Assert.Equal("Modu Store", detail.Shop.ShopName);

        await Assert.ThrowsAsync<NotFoundException>(() => service.GetAdminProductByIdAsync(9999));
    }
}
