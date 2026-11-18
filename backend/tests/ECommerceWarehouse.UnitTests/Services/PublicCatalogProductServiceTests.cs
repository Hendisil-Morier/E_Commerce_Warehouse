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

public class PublicCatalogProductServiceTests
{
    private sealed class InMemoryCategoryRepository : ICategoryRepository
    {
        public List<Category> Categories { get; } = [];

        public Task<IReadOnlyList<Category>> GetActiveAsNoTrackingAsync(CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<Category>>(Categories.Where(c => c.IsActive).ToList());

        public Task<Category?> GetActiveByIdAsNoTrackingAsync(long categoryId, CancellationToken cancellationToken = default)
            => Task.FromResult(Categories.FirstOrDefault(c => c.CategoryId == categoryId && c.IsActive));
    }

    private sealed class InMemoryPublicProductRepository : IProductRepository
    {
        public List<Product> Products { get; } = [];
        public Dictionary<long, int> AvailabilityByVariantId { get; } = new();

        public Task<PagedResult<Product>> GetPublicPagedAsync(
            PublicProductQueryDto query,
            IReadOnlyCollection<long>? expandedCategoryIds = null,
            CancellationToken cancellationToken = default)
        {
            var items = Products.Where(IsPublicVisible);

            if (expandedCategoryIds is { Count: > 0 })
            {
                items = items.Where(p => expandedCategoryIds.Contains(p.CategoryId));
            }

            if (query.ShopId.HasValue)
            {
                items = items.Where(p => p.ShopId == query.ShopId.Value);
            }

            if (query.MinPrice.HasValue || query.MaxPrice.HasValue)
            {
                items = items.Where(p => p.Variants.Any(v =>
                    v.IsActive &&
                    (!query.MinPrice.HasValue || v.Price >= query.MinPrice.Value) &&
                    (!query.MaxPrice.HasValue || v.Price <= query.MaxPrice.Value)));
            }

            if (!string.IsNullOrWhiteSpace(query.Q))
            {
                var kw = query.Q.Trim();
                items = items.Where(p =>
                    p.ProductName.Contains(kw, StringComparison.OrdinalIgnoreCase) ||
                    p.Variants.Any(v => v.IsActive && v.SKU.Contains(kw, StringComparison.OrdinalIgnoreCase)));
            }

            if (query.InStockOnly == true)
            {
                items = items.Where(p => p.Variants.Any(v =>
                    v.IsActive &&
                    AvailabilityByVariantId.TryGetValue(v.VariantId, out var qty) &&
                    qty > 0));
            }

            var (field, isDescending) = query.ParseSort();
            var normalized = field.ToLowerInvariant();
            if (normalized is "price_asc") { normalized = "price"; isDescending = false; }
            else if (normalized is "price_desc") { normalized = "price"; isDescending = true; }

            var sorted = (normalized, isDescending) switch
            {
                ("price", false) or ("minprice", false) => items
                    .OrderBy(p => p.Variants.Where(v => v.IsActive).Min(v => v.Price))
                    .ThenByDescending(p => p.ProductId),
                ("price", true) or ("minprice", true) => items
                    .OrderByDescending(p => p.Variants.Where(v => v.IsActive).Min(v => v.Price))
                    .ThenByDescending(p => p.ProductId),
                (_, true) => items.OrderByDescending(p => p.CreatedAt).ThenByDescending(p => p.ProductId),
                (_, false) => items.OrderBy(p => p.CreatedAt).ThenBy(p => p.ProductId)
            };

            var list = sorted.ToList();
            var pageItems = list.Skip(query.Skip).Take(query.NormalizedPageSize).ToList();
            return Task.FromResult(PagedResult<Product>.Create(pageItems, query.NormalizedPage, query.NormalizedPageSize, list.Count));
        }

        public Task<Product?> GetPublicByIdWithDetailsAsync(long productId, CancellationToken cancellationToken = default)
            => Task.FromResult(Products.FirstOrDefault(p => p.ProductId == productId && IsPublicVisible(p)));

        public Task<IReadOnlyDictionary<long, int>> GetVariantAvailabilityByIdsAsync(
            IReadOnlyCollection<long> variantIds,
            CancellationToken cancellationToken = default)
        {
            IReadOnlyDictionary<long, int> result = variantIds
                .Distinct()
                .Where(id => AvailabilityByVariantId.ContainsKey(id))
                .ToDictionary(id => id, id => Math.Max(0, AvailabilityByVariantId[id]));

            return Task.FromResult(result);
        }

        private static bool IsPublicVisible(Product p) =>
            p.ProductStatus == ProductStatus.Active &&
            p.Shop.IsActive &&
            p.Shop.Seller.Status == SellerStatus.Approved &&
            p.Category.IsActive &&
            p.Variants.Any(v => v.IsActive);

        public Task<PagedResult<Product>> GetSellerPagedAsync(long sellerId, SellerProductQueryDto query, CancellationToken cancellationToken = default)
            => throw new NotSupportedException();
        public Task<Product?> GetByIdForSellerWithDetailsAsync(long productId, long sellerId, bool asNoTracking = false, CancellationToken cancellationToken = default)
            => throw new NotSupportedException();
        public Task<PagedResult<Product>> GetAdminPagedAsync(AdminProductQueryDto query, CancellationToken cancellationToken = default)
            => throw new NotSupportedException();
        public Task<Product?> GetByIdWithDetailsAsync(long productId, bool asNoTracking = false, CancellationToken cancellationToken = default)
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

    private static (CatalogProductService Service, InMemoryPublicProductRepository Repo, InMemoryCategoryRepository CatRepo) CreateSut()
    {
        var approvedSeller = new DomainSeller { SellerId = 1, UserId = 10, BusinessName = "Modu Tech", Status = SellerStatus.Approved };
        var suspendedSeller = new DomainSeller { SellerId = 2, UserId = 20, BusinessName = "Suspended Biz", Status = SellerStatus.Suspended };

        var shop1 = new Shop { ShopId = 10, SellerId = 1, Seller = approvedSeller, ShopName = "Modu Flagship", LogoUrl = "/uploads/s1.png", IsActive = true };
        var shop2 = new Shop { ShopId = 11, SellerId = 1, Seller = approvedSeller, ShopName = "Modu Audio", IsActive = true };
        var pausedShop = new Shop { ShopId = 12, SellerId = 1, Seller = approvedSeller, ShopName = "Paused Shop", IsActive = false };
        var suspendedShop = new Shop { ShopId = 13, SellerId = 2, Seller = suspendedSeller, ShopName = "Blocked Shop", IsActive = true };

        var catElectronics = new Category { CategoryId = 1, ParentCategoryId = null, CategoryName = "Điện tử", IsActive = true };
        var catKeyboards = new Category { CategoryId = 2, ParentCategoryId = 1, CategoryName = "Bàn phím", IsActive = true };
        var catAudio = new Category { CategoryId = 3, ParentCategoryId = 1, CategoryName = "Âm thanh", IsActive = true };
        var catInactive = new Category { CategoryId = 4, ParentCategoryId = 1, CategoryName = "Danh mục ẩn", IsActive = false };

        var catRepo = new InMemoryCategoryRepository();
        catRepo.Categories.AddRange([catElectronics, catKeyboards, catAudio, catInactive]);

        var repo = new InMemoryPublicProductRepository();
        var baseTime = new DateTime(2026, 11, 1, 0, 0, 0, DateTimeKind.Utc);

        // 1: Active, inStock = true (variant 101 has 5, variant 102 is inactive with stock 99 ignored)
        repo.Products.Add(new Product
        {
            ProductId = 1,
            ShopId = 10,
            Shop = shop1,
            CategoryId = 2,
            Category = catKeyboards,
            ProductName = "Keychron K2 Pro",
            Description = "Keyboard",
            ProductStatus = ProductStatus.Active,
            CreatedAt = baseTime.AddHours(1),
            Images =
            [
                new ProductImage { ImageId = 1, ProductId = 1, ImageUrl = "/uploads/k2-side.png", IsPrimary = false, DisplayOrder = 0 },
                new ProductImage { ImageId = 2, ProductId = 1, ImageUrl = "/uploads/k2-main.png", IsPrimary = true, DisplayOrder = 1 }
            ],
            Variants =
            [
                new ProductVariant { VariantId = 101, ProductId = 1, SKU = "KC-K2P-RED", VariantName = "Red Switch", Price = 2200000m, IsActive = true },
                new ProductVariant { VariantId = 102, ProductId = 1, SKU = "KC-K2P-OLD", VariantName = "Discontinued", Price = 1000000m, IsActive = false },
                new ProductVariant { VariantId = 103, ProductId = 1, SKU = "KC-K2P-BRN", VariantName = "Brown Switch", Price = 2400000m, IsActive = true }
            ]
        });
        repo.AvailabilityByVariantId[101] = 5;
        repo.AvailabilityByVariantId[102] = 99;
        repo.AvailabilityByVariantId[103] = 0;

        // 2: Active, out of stock (no rows in view -> inStock = false)
        repo.Products.Add(new Product
        {
            ProductId = 2,
            ShopId = 11,
            Shop = shop2,
            CategoryId = 3,
            Category = catAudio,
            ProductName = "Sony WF-1000XM5",
            ProductStatus = ProductStatus.Active,
            CreatedAt = baseTime.AddHours(3),
            Images = [new ProductImage { ImageId = 3, ProductId = 2, ImageUrl = "/uploads/xm5.png", IsPrimary = true, DisplayOrder = 0 }],
            Variants = [new ProductVariant { VariantId = 201, ProductId = 2, SKU = "SONY-WF-XM5", VariantName = "Silver", Price = 5500000m, IsActive = true }]
        });

        // 3: Draft (must NOT appear publicly)
        repo.Products.Add(new Product
        {
            ProductId = 3,
            ShopId = 10,
            Shop = shop1,
            CategoryId = 2,
            Category = catKeyboards,
            ProductName = "Unpublished Draft",
            ProductStatus = ProductStatus.Draft,
            CreatedAt = baseTime.AddHours(4),
            Variants = [new ProductVariant { VariantId = 301, ProductId = 3, SKU = "DRAFT-1", VariantName = "Default", Price = 500000m, IsActive = true }]
        });

        // 4: PendingReview (must NOT appear publicly)
        repo.Products.Add(new Product
        {
            ProductId = 4,
            ShopId = 10,
            Shop = shop1,
            CategoryId = 2,
            Category = catKeyboards,
            ProductName = "Pending Review Item",
            ProductStatus = ProductStatus.PendingReview,
            CreatedAt = baseTime.AddHours(5),
            Variants = [new ProductVariant { VariantId = 401, ProductId = 4, SKU = "PEND-1", VariantName = "Default", Price = 500000m, IsActive = true }]
        });

        // 5: Active but PausedShop / SuspendedSeller / InactiveCategory (must NOT appear publicly)
        repo.Products.Add(new Product
        {
            ProductId = 5,
            ShopId = 12,
            Shop = pausedShop,
            CategoryId = 2,
            Category = catKeyboards,
            ProductName = "Paused Shop Product",
            ProductStatus = ProductStatus.Active,
            CreatedAt = baseTime.AddHours(6),
            Variants = [new ProductVariant { VariantId = 501, ProductId = 5, SKU = "PAUSED-1", VariantName = "Default", Price = 500000m, IsActive = true }]
        });
        repo.Products.Add(new Product
        {
            ProductId = 6,
            ShopId = 13,
            Shop = suspendedShop,
            CategoryId = 2,
            Category = catKeyboards,
            ProductName = "Suspended Seller Product",
            ProductStatus = ProductStatus.Active,
            CreatedAt = baseTime.AddHours(7),
            Variants = [new ProductVariant { VariantId = 601, ProductId = 6, SKU = "SUSP-1", VariantName = "Default", Price = 500000m, IsActive = true }]
        });
        repo.Products.Add(new Product
        {
            ProductId = 7,
            ShopId = 10,
            Shop = shop1,
            CategoryId = 4,
            Category = catInactive,
            ProductName = "Hidden Category Product",
            ProductStatus = ProductStatus.Active,
            CreatedAt = baseTime.AddHours(8),
            Variants = [new ProductVariant { VariantId = 701, ProductId = 7, SKU = "HID-1", VariantName = "Default", Price = 500000m, IsActive = true }]
        });

        var service = new CatalogProductService(repo, catRepo, new PublicProductQueryValidator());
        return (service, repo, catRepo);
    }

    [Fact]
    public async Task GetPublicProducts_ExcludesUnapprovedAndComputesMinPriceThumbnailAndInStock()
    {
        var (service, _, _) = CreateSut();

        var page = await service.GetPublicProductsAsync(new PublicProductQueryDto { Sort = "-createdAt" });

        Assert.Equal(2, page.TotalItems);
        Assert.Equal(2, page.Items[0].ProductId); // newest first
        Assert.False(page.Items[0].InStock);
        Assert.Equal(0, page.Items[0].AvailableQuantity);
        Assert.Equal(5500000m, page.Items[0].MinPrice);

        var keyboard = page.Items[1];
        Assert.Equal(1, keyboard.ProductId);
        Assert.Equal("/uploads/k2-main.png", keyboard.ThumbnailUrl);
        Assert.Equal(2200000m, keyboard.MinPrice); // inactive variant (1M) excluded
        Assert.Equal(2400000m, keyboard.MaxPrice);
        Assert.True(keyboard.InStock);
        Assert.Equal(5, keyboard.AvailableQuantity); // inactive variant stock (99) excluded
    }

    [Fact]
    public async Task GetPublicProducts_SupportsParentCategoryExpansionFiltersAndSorting()
    {
        var (service, _, _) = CreateSut();

        // Parent categoryId=1 includes both keyboards (2) and audio (3)
        var byParentPriceAsc = await service.GetPublicProductsAsync(new PublicProductQueryDto
        {
            CategoryId = 1,
            Sort = "price"
        });
        Assert.Equal(2, byParentPriceAsc.TotalItems);
        Assert.Equal([1L, 2L], byParentPriceAsc.Items.Select(x => x.ProductId).ToArray());

        var byPriceDesc = await service.GetPublicProductsAsync(new PublicProductQueryDto { Sort = "-price" });
        Assert.Equal([2L, 1L], byPriceDesc.Items.Select(x => x.ProductId).ToArray());

        var byShopAndStock = await service.GetPublicProductsAsync(new PublicProductQueryDto
        {
            ShopId = 10,
            InStockOnly = true,
            MinPrice = 2000000m,
            MaxPrice = 3000000m,
            Q = "K2P-RED"
        });
        Assert.Single(byShopAndStock.Items);
        Assert.Equal(1, byShopAndStock.Items[0].ProductId);

        // Inactive or non-existent category returns empty result
        var inactiveCategoryResult = await service.GetPublicProductsAsync(new PublicProductQueryDto { CategoryId = 4 });
        Assert.Empty(inactiveCategoryResult.Items);
    }

    [Fact]
    public async Task GetPublicProducts_InvalidPriceRange_ThrowsValidationException()
    {
        var (service, _, _) = CreateSut();

        await Assert.ThrowsAsync<ValidationException>(() => service.GetPublicProductsAsync(new PublicProductQueryDto
        {
            MinPrice = 500000m,
            MaxPrice = 100000m
        }));
    }

    [Fact]
    public async Task GetPublicProductById_ReturnsActiveDetailWithVariantAvailability_And404ForHidden()
    {
        var (service, _, _) = CreateSut();

        var detail = await service.GetPublicProductByIdAsync(1);
        Assert.Equal("Keychron K2 Pro", detail.ProductName);
        Assert.Equal("Modu Flagship", detail.Shop.ShopName);
        Assert.Equal(2, detail.Variants.Count); // inactive variant filtered out
        Assert.All(detail.Variants, v => Assert.NotEqual(102, v.VariantId));
        Assert.Equal(5, detail.Variants.First(v => v.VariantId == 101).AvailableQuantity);
        Assert.True(detail.Variants.First(v => v.VariantId == 101).InStock);
        Assert.Equal(0, detail.Variants.First(v => v.VariantId == 103).AvailableQuantity);
        Assert.False(detail.Variants.First(v => v.VariantId == 103).InStock);
        Assert.True(detail.InStock);
        Assert.Equal(5, detail.AvailableQuantity);

        await Assert.ThrowsAsync<NotFoundException>(() => service.GetPublicProductByIdAsync(3)); // Draft
        await Assert.ThrowsAsync<NotFoundException>(() => service.GetPublicProductByIdAsync(4)); // PendingReview
        await Assert.ThrowsAsync<NotFoundException>(() => service.GetPublicProductByIdAsync(5)); // Paused Shop
        await Assert.ThrowsAsync<NotFoundException>(() => service.GetPublicProductByIdAsync(6)); // Suspended Seller
    }
}

