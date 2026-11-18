using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.Contracts.Services;
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

public class SellerProductServiceTests
{
    private sealed class FakeApprovedSellerResolver : IApprovedSellerResolver
    {
        public DomainSeller Seller { get; set; } = new()
        {
            SellerId = 1,
            UserId = 10,
            BusinessName = "Modu Official",
            Status = SellerStatus.Approved
        };

        public bool ThrowNotApproved { get; set; }

        public Task<DomainSeller> RequireApprovedSellerAsync(CancellationToken cancellationToken = default)
        {
            if (ThrowNotApproved)
            {
                throw BusinessException.SellerNotApproved("Tài khoản người bán chưa được duyệt.");
            }

            return Task.FromResult(Seller);
        }
    }

    private sealed class InMemoryShopRepository : IShopRepository
    {
        public List<Shop> Shops { get; } = [];

        public Task<IReadOnlyList<Shop>> GetBySellerIdAsNoTrackingAsync(long sellerId, bool? isActive = null, CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<Shop>>(Shops.Where(s => s.SellerId == sellerId).ToList());

        public Task<Shop?> GetByIdAndSellerIdAsync(long shopId, long sellerId, CancellationToken cancellationToken = default)
            => Task.FromResult(Shops.FirstOrDefault(s => s.ShopId == shopId && s.SellerId == sellerId));

        public Task<Shop?> GetPublicActiveByIdWithSellerAsNoTrackingAsync(long shopId, CancellationToken cancellationToken = default)
            => Task.FromResult<Shop?>(null);

        public Task<int> CountActiveProductsByShopIdAsync(long shopId, CancellationToken cancellationToken = default)
            => Task.FromResult(0);

        public Task<bool> ExistsShopNameForSellerAsync(long sellerId, string shopName, long? excludeShopId = null, CancellationToken cancellationToken = default)
            => Task.FromResult(false);

        public Task AddAsync(Shop shop, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public void Update(Shop shop) { }
    }

    private sealed class InMemoryCategoryRepository : ICategoryRepository
    {
        public List<Category> Categories { get; } = [];

        public Task<IReadOnlyList<Category>> GetActiveAsNoTrackingAsync(CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<Category>>(Categories.Where(c => c.IsActive).ToList());

        public Task<Category?> GetActiveByIdAsNoTrackingAsync(long categoryId, CancellationToken cancellationToken = default)
            => Task.FromResult(Categories.FirstOrDefault(c => c.CategoryId == categoryId && c.IsActive));
    }

    private sealed class InMemoryProductRepository : IProductRepository
    {
        private long _nextProductId = 100;
        private long _nextImageId = 1000;
        private long _nextVariantId = 5000;

        public List<Product> Products { get; } = [];
        public InMemoryShopRepository ShopRepo { get; }
        public InMemoryCategoryRepository CategoryRepo { get; }

        public InMemoryProductRepository(InMemoryShopRepository shopRepo, InMemoryCategoryRepository categoryRepo)
        {
            ShopRepo = shopRepo;
            CategoryRepo = categoryRepo;
        }

        public Task<PagedResult<Product>> GetSellerPagedAsync(
            long sellerId,
            SellerProductQueryDto query,
            CancellationToken cancellationToken = default)
        {
            IEnumerable<Product> items = Products.Where(p => p.Shop.SellerId == sellerId);
            if (query.ShopId.HasValue)
            {
                items = items.Where(p => p.ShopId == query.ShopId.Value);
            }

            if (query.Status.HasValue)
            {
                items = items.Where(p => p.ProductStatus == query.Status.Value);
            }

            if (!string.IsNullOrWhiteSpace(query.Q))
            {
                var kw = query.Q.Trim();
                items = items.Where(p =>
                    p.ProductName.Contains(kw, StringComparison.OrdinalIgnoreCase) ||
                    p.Variants.Any(v => v.SKU.Contains(kw, StringComparison.OrdinalIgnoreCase)));
            }

            var list = items.OrderByDescending(p => p.ProductId).ToList();
            var pageItems = list.Skip(query.Skip).Take(query.NormalizedPageSize).ToList();
            return Task.FromResult(PagedResult<Product>.Create(pageItems, query.NormalizedPage, query.NormalizedPageSize, list.Count));
        }

        public Task<Product?> GetByIdForSellerWithDetailsAsync(
            long productId,
            long sellerId,
            bool asNoTracking = false,
            CancellationToken cancellationToken = default)
        {
            var product = Products.FirstOrDefault(p => p.ProductId == productId && p.Shop.SellerId == sellerId);
            if (product != null)
            {
                HydrateNavigations(product);
            }

            return Task.FromResult(product);
        }

        public Task<PagedResult<Product>> GetAdminPagedAsync(AdminProductQueryDto query, CancellationToken cancellationToken = default)
            => throw new NotSupportedException();

        public Task<Product?> GetByIdWithDetailsAsync(long productId, bool asNoTracking = false, CancellationToken cancellationToken = default)
            => throw new NotSupportedException();

        public Task<PagedResult<Product>> GetPublicPagedAsync(PublicProductQueryDto query, IReadOnlyCollection<long>? expandedCategoryIds = null, CancellationToken cancellationToken = default)
            => throw new NotSupportedException();

        public Task<Product?> GetPublicByIdWithDetailsAsync(long productId, CancellationToken cancellationToken = default)
            => throw new NotSupportedException();

        public Task<IReadOnlyDictionary<long, int>> GetVariantAvailabilityByIdsAsync(IReadOnlyCollection<long> variantIds, CancellationToken cancellationToken = default)
            => throw new NotSupportedException();

        public Task<ProductVariant?> GetVariantByIdForSellerAsync(
            long variantId,
            long sellerId,
            CancellationToken cancellationToken = default)
        {
            var variant = Products
                .Where(p => p.Shop.SellerId == sellerId)
                .SelectMany(p => p.Variants)
                .FirstOrDefault(v => v.VariantId == variantId);

            return Task.FromResult(variant);
        }

        public Task<bool> ExistsSkuAsync(string sku, long? excludeVariantId = null, CancellationToken cancellationToken = default)
        {
            var exists = Products
                .SelectMany(p => p.Variants)
                .Any(v => (!excludeVariantId.HasValue || v.VariantId != excludeVariantId.Value) &&
                          string.Equals(v.SKU, sku, StringComparison.OrdinalIgnoreCase));

            return Task.FromResult(exists);
        }

        public Task<bool> ExistsBarcodeAsync(string barcode, long? excludeVariantId = null, CancellationToken cancellationToken = default)
        {
            var exists = Products
                .SelectMany(p => p.Variants)
                .Any(v => (!excludeVariantId.HasValue || v.VariantId != excludeVariantId.Value) &&
                          v.Barcode != null &&
                          string.Equals(v.Barcode, barcode, StringComparison.OrdinalIgnoreCase));

            return Task.FromResult(exists);
        }

        public Task AddAsync(Product product, CancellationToken cancellationToken = default)
        {
            if (product.ProductId == 0)
            {
                product.ProductId = ++_nextProductId;
            }

            HydrateNavigations(product);
            AssignChildIds(product);
            Products.Add(product);
            return Task.CompletedTask;
        }

        public Task AddVariantAsync(ProductVariant variant, CancellationToken cancellationToken = default)
        {
            var product = Products.First(p => p.ProductId == variant.ProductId);
            if (variant.VariantId == 0)
            {
                variant.VariantId = ++_nextVariantId;
            }

            variant.Product = product;
            product.Variants.Add(variant);
            return Task.CompletedTask;
        }

        public void Update(Product product)
        {
            HydrateNavigations(product);
            AssignChildIds(product);
        }

        public void UpdateVariant(ProductVariant variant) { }

        public void RemoveImages(IEnumerable<ProductImage> images)
        {
            foreach (var image in images.ToList())
            {
                foreach (var p in Products)
                {
                    p.Images.Remove(image);
                }
            }
        }

        private void HydrateNavigations(Product product)
        {
            product.Shop = ShopRepo.Shops.First(s => s.ShopId == product.ShopId);
            product.Category = CategoryRepo.Categories.First(c => c.CategoryId == product.CategoryId);
        }

        private void AssignChildIds(Product product)
        {
            foreach (var image in product.Images)
            {
                if (image.ImageId == 0)
                {
                    image.ImageId = ++_nextImageId;
                }

                image.ProductId = product.ProductId;
            }

            foreach (var variant in product.Variants)
            {
                if (variant.VariantId == 0)
                {
                    variant.VariantId = ++_nextVariantId;
                }

                variant.ProductId = product.ProductId;
                variant.Product = product;
            }
        }
    }

    private sealed class FakeUnitOfWork : IUnitOfWork
    {
        public IGenericRepository<T> Repository<T>() where T : class => throw new NotSupportedException();
        public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) => Task.FromResult(1);
        public Task ExecuteInTransactionAsync(Func<CancellationToken, Task> operation, CancellationToken cancellationToken = default)
            => operation(cancellationToken);
        public void Dispose() { }
    }

    private static (SellerProductService Service, InMemoryProductRepository ProductRepo, InMemoryShopRepository ShopRepo, FakeApprovedSellerResolver Resolver)
        CreateSut()
    {
        var seller1 = new DomainSeller { SellerId = 1, UserId = 10, BusinessName = "Modu Official", Status = SellerStatus.Approved };
        var seller2 = new DomainSeller { SellerId = 2, UserId = 20, BusinessName = "Other Seller", Status = SellerStatus.Approved };

        var shopRepo = new InMemoryShopRepository();
        shopRepo.Shops.Add(new Shop { ShopId = 10, SellerId = 1, Seller = seller1, ShopName = "Modu Flagship", IsActive = true });
        shopRepo.Shops.Add(new Shop { ShopId = 11, SellerId = 1, Seller = seller1, ShopName = "Paused Shop", IsActive = false });
        shopRepo.Shops.Add(new Shop { ShopId = 20, SellerId = 2, Seller = seller2, ShopName = "Other Store", IsActive = true });

        var categoryRepo = new InMemoryCategoryRepository();
        categoryRepo.Categories.Add(new Category { CategoryId = 1, CategoryName = "Bàn phím cơ", IsActive = true });
        categoryRepo.Categories.Add(new Category { CategoryId = 2, CategoryName = "Danh mục ẩn", IsActive = false });

        var productRepo = new InMemoryProductRepository(shopRepo, categoryRepo);
        var resolver = new FakeApprovedSellerResolver { Seller = seller1 };

        var service = new SellerProductService(
            productRepo,
            shopRepo,
            categoryRepo,
            new FakeUnitOfWork(),
            resolver,
            new SellerProductQueryValidator(),
            new CreateProductRequestValidator(),
            new UpdateProductRequestValidator(),
            new UpsertVariantRequestValidator());

        return (service, productRepo, shopRepo, resolver);
    }

    [Fact]
    public async Task CreateProduct_ApprovedSeller_CreatesDraftWithImagesAndVariants()
    {
        var (service, _, _, _) = CreateSut();

        var created = await service.CreateProductAsync(new CreateProductRequestDto
        {
            ShopId = 10,
            CategoryId = 1,
            ProductName = "  Keychron Q1 Pro  ",
            Description = "  Aluminum wireless custom keyboard  ",
            Images =
            [
                new ProductImageInputDto { ImageUrl = "/uploads/products/2026/11/main.png", IsPrimary = true, DisplayOrder = 0 },
                new ProductImageInputDto { ImageUrl = "/uploads/products/2026/11/side.png", IsPrimary = false, DisplayOrder = 1 }
            ],
            Variants =
            [
                new UpsertVariantRequestDto
                {
                    SKU = "KC-Q1P-BLK",
                    Barcode = "893000000001",
                    VariantName = "Black / Red Switch",
                    Price = 4200000m,
                    WeightGrams = 1700,
                    IsActive = true
                }
            ]
        });

        Assert.Equal("Draft", created.ProductStatus);
        Assert.Equal("Keychron Q1 Pro", created.ProductName);
        Assert.Equal("Modu Flagship", created.ShopName);
        Assert.Equal("Bàn phím cơ", created.CategoryName);
        Assert.Equal(2, created.Images.Count);
        Assert.Single(created.Variants);
        Assert.Equal("KC-Q1P-BLK", created.Variants[0].SKU);
    }

    [Fact]
    public async Task CreateProduct_SellerNotApproved_ThrowsConflictSellerNotApproved()
    {
        var (service, _, _, resolver) = CreateSut();
        resolver.ThrowNotApproved = true;

        var ex = await Assert.ThrowsAsync<BusinessException>(() => service.CreateProductAsync(new CreateProductRequestDto
        {
            ShopId = 10,
            CategoryId = 1,
            ProductName = "Mouse"
        }));

        Assert.Equal(ErrorCodes.SellerNotApproved, ex.Code);
        Assert.Equal(409, ex.HttpStatus);
    }

    [Fact]
    public async Task CreateProduct_MultiplePrimaryImages_ThrowsValidationException()
    {
        var (service, _, _, _) = CreateSut();

        await Assert.ThrowsAsync<ValidationException>(() => service.CreateProductAsync(new CreateProductRequestDto
        {
            ShopId = 10,
            CategoryId = 1,
            ProductName = "Mouse",
            Images =
            [
                new ProductImageInputDto { ImageUrl = "/uploads/products/2026/11/a.png", IsPrimary = true, DisplayOrder = 0 },
                new ProductImageInputDto { ImageUrl = "/uploads/products/2026/11/b.png", IsPrimary = true, DisplayOrder = 1 }
            ]
        }));
    }

    [Fact]
    public async Task CreateProduct_DuplicateSkuOrBarcodeInDb_ThrowsConflictErrorCodes()
    {
        var (service, _, _, _) = CreateSut();
        await service.CreateProductAsync(new CreateProductRequestDto
        {
            ShopId = 10,
            CategoryId = 1,
            ProductName = "Product 1",
            Variants =
            [
                new UpsertVariantRequestDto { SKU = "SKU-UNIQUE-1", Barcode = "BC-100", VariantName = "M", Price = 100000m }
            ]
        });

        var dupSkuEx = await Assert.ThrowsAsync<BusinessException>(() => service.CreateProductAsync(new CreateProductRequestDto
        {
            ShopId = 10,
            CategoryId = 1,
            ProductName = "Product 2",
            Variants = [new UpsertVariantRequestDto { SKU = "SKU-UNIQUE-1", Barcode = "BC-200", VariantName = "L", Price = 120000m }]
        }));
        Assert.Equal(ErrorCodes.DuplicateSku, dupSkuEx.Code);

        var dupBarcodeEx = await Assert.ThrowsAsync<BusinessException>(() => service.CreateProductAsync(new CreateProductRequestDto
        {
            ShopId = 10,
            CategoryId = 1,
            ProductName = "Product 3",
            Variants = [new UpsertVariantRequestDto { SKU = "SKU-UNIQUE-2", Barcode = "BC-100", VariantName = "XL", Price = 150000m }]
        }));
        Assert.Equal(ErrorCodes.DuplicateBarcode, dupBarcodeEx.Code);
    }

    [Fact]
    public async Task GetMyProductById_OtherSellerProduct_ThrowsNotFoundException()
    {
        var (service, productRepo, _, _) = CreateSut();
        await productRepo.AddAsync(new Product
        {
            ShopId = 20,
            CategoryId = 1,
            ProductName = "Secret Other Product",
            ProductStatus = ProductStatus.Draft,
            CreatedAt = DateTime.UtcNow
        });

        await Assert.ThrowsAsync<NotFoundException>(() => service.GetMyProductByIdAsync(productRepo.Products[0].ProductId));
    }

    [Fact]
    public async Task UpdateProduct_PendingReview_ThrowsInvalidStatusTransition()
    {
        var (service, productRepo, _, _) = CreateSut();
        await productRepo.AddAsync(new Product
        {
            ShopId = 10,
            CategoryId = 1,
            ProductName = "Locked Product",
            ProductStatus = ProductStatus.PendingReview,
            CreatedAt = DateTime.UtcNow
        });

        var ex = await Assert.ThrowsAsync<BusinessException>(() => service.UpdateProductAsync(
            productRepo.Products[0].ProductId,
            new UpdateProductRequestDto
            {
                ShopId = 10,
                CategoryId = 1,
                ProductName = "New Name"
            }));

        Assert.Equal(ErrorCodes.InvalidStatusTransition, ex.Code);
    }

    [Fact]
    public async Task UpdateProduct_ReplacesImagesCleanlyAndPreservesVariants()
    {
        var (service, _, _, _) = CreateSut();
        var created = await service.CreateProductAsync(new CreateProductRequestDto
        {
            ShopId = 10,
            CategoryId = 1,
            ProductName = "Old Name",
            Images = [new ProductImageInputDto { ImageUrl = "/uploads/products/2026/11/old.png", IsPrimary = true, DisplayOrder = 0 }],
            Variants = [new UpsertVariantRequestDto { SKU = "SKU-KEEP", VariantName = "Default", Price = 50000m }]
        });

        var updated = await service.UpdateProductAsync(created.ProductId, new UpdateProductRequestDto
        {
            ShopId = 10,
            CategoryId = 1,
            ProductName = "Updated Name",
            Description = "New desc",
            Images =
            [
                new ProductImageInputDto { ImageUrl = "/uploads/products/2026/11/new1.png", IsPrimary = false, DisplayOrder = 0 },
                new ProductImageInputDto { ImageUrl = "/uploads/products/2026/11/new2.png", IsPrimary = true, DisplayOrder = 1 }
            ]
        });

        Assert.Equal("Updated Name", updated.ProductName);
        Assert.Equal(2, updated.Images.Count);
        Assert.DoesNotContain(updated.Images, i => i.ImageUrl.Contains("old.png"));
        Assert.Single(updated.Variants);
        Assert.Equal("SKU-KEEP", updated.Variants[0].SKU);
    }

    [Fact]
    public async Task SubmitProduct_ValidatesPrerequisitesAndTransitionsFromDraftOrRejected()
    {
        var (service, productRepo, _, _) = CreateSut();
        var draft = await service.CreateProductAsync(new CreateProductRequestDto
        {
            ShopId = 10,
            CategoryId = 1,
            ProductName = "Submit Test"
        });

        // No images
        var noImageEx = await Assert.ThrowsAsync<BusinessException>(() => service.SubmitProductAsync(draft.ProductId));
        Assert.Equal(ErrorCodes.BusinessRuleViolation, noImageEx.Code);

        // Add image, still no active variant
        await service.UpdateProductAsync(draft.ProductId, new UpdateProductRequestDto
        {
            ShopId = 10,
            CategoryId = 1,
            ProductName = "Submit Test",
            Images = [new ProductImageInputDto { ImageUrl = "/uploads/products/2026/11/cover.png", IsPrimary = true, DisplayOrder = 0 }]
        });
        await service.AddVariantAsync(draft.ProductId, new UpsertVariantRequestDto
        {
            SKU = "SKU-INACTIVE",
            VariantName = "Inactive",
            Price = 100000m,
            IsActive = false
        });

        var noActiveVariantEx = await Assert.ThrowsAsync<BusinessException>(() => service.SubmitProductAsync(draft.ProductId));
        Assert.Equal(ErrorCodes.BusinessRuleViolation, noActiveVariantEx.Code);

        // Add active variant -> submit succeeds
        await service.AddVariantAsync(draft.ProductId, new UpsertVariantRequestDto
        {
            SKU = "SKU-ACTIVE",
            VariantName = "Active",
            Price = 100000m,
            IsActive = true
        });
        var submitted = await service.SubmitProductAsync(draft.ProductId);
        Assert.Equal("PendingReview", submitted.ProductStatus);

        // Simulate rejection then resubmit -> clears RejectReason
        var stored = productRepo.Products.Single(p => p.ProductId == draft.ProductId);
        stored.ProductStatus = ProductStatus.Rejected;
        stored.RejectReason = "Ảnh mờ";

        var resubmitted = await service.SubmitProductAsync(draft.ProductId);
        Assert.Equal("PendingReview", resubmitted.ProductStatus);
        Assert.Null(resubmitted.RejectReason);
    }

    [Fact]
    public async Task UpdateVariant_ChecksOwnershipAndBlocksDisablingLastActiveOnActiveProduct()
    {
        var (service, productRepo, _, _) = CreateSut();
        var created = await service.CreateProductAsync(new CreateProductRequestDto
        {
            ShopId = 10,
            CategoryId = 1,
            ProductName = "Active Product",
            Images = [new ProductImageInputDto { ImageUrl = "/uploads/products/2026/11/a.png", IsPrimary = true, DisplayOrder = 0 }],
            Variants = [new UpsertVariantRequestDto { SKU = "SKU-ONLY-ACTIVE", VariantName = "Default", Price = 250000m, IsActive = true }]
        });

        var variantId = created.Variants[0].VariantId;
        productRepo.Products.Single(p => p.ProductId == created.ProductId).ProductStatus = ProductStatus.Active;

        // Disabling last active variant on Active product fails
        var disableEx = await Assert.ThrowsAsync<BusinessException>(() => service.UpdateVariantAsync(variantId, new UpsertVariantRequestDto
        {
            SKU = "SKU-ONLY-ACTIVE",
            VariantName = "Default",
            Price = 250000m,
            IsActive = false
        }));
        Assert.Equal(ErrorCodes.BusinessRuleViolation, disableEx.Code);

        // Same SKU on self passes and updates price
        var updatedVariant = await service.UpdateVariantAsync(variantId, new UpsertVariantRequestDto
        {
            SKU = "SKU-ONLY-ACTIVE",
            Barcode = "893111",
            VariantName = "Default V2",
            Price = 280000m,
            IsActive = true
        });
        Assert.Equal("Default V2", updatedVariant.VariantName);
        Assert.Equal(280000m, updatedVariant.Price);

        // AddVariant with duplicate SKU fails
        var dupSkuEx = await Assert.ThrowsAsync<BusinessException>(() => service.AddVariantAsync(created.ProductId, new UpsertVariantRequestDto
        {
            SKU = "SKU-ONLY-ACTIVE",
            VariantName = "Dup",
            Price = 100000m
        }));
        Assert.Equal(ErrorCodes.DuplicateSku, dupSkuEx.Code);

        // Another seller's variant throws NotFoundException
        await productRepo.AddAsync(new Product
        {
            ShopId = 20,
            CategoryId = 1,
            ProductName = "Other Seller Item",
            ProductStatus = ProductStatus.Draft,
            Variants = [new ProductVariant { VariantId = 999, SKU = "OTHER-SKU", VariantName = "X", Price = 10000m, IsActive = true }],
            CreatedAt = DateTime.UtcNow
        });

        await Assert.ThrowsAsync<NotFoundException>(() => service.UpdateVariantAsync(999, new UpsertVariantRequestDto
        {
            SKU = "OTHER-SKU-NEW",
            VariantName = "X",
            Price = 10000m
        }));
    }

    [Fact]
    public async Task GetMyProducts_FiltersByStatusAndKeyword_ExcludesOtherSeller()
    {
        var (service, productRepo, _, _) = CreateSut();
        await service.CreateProductAsync(new CreateProductRequestDto
        {
            ShopId = 10,
            CategoryId = 1,
            ProductName = "Alpha Keyboard",
            Variants = [new UpsertVariantRequestDto { SKU = "ALP-01", VariantName = "Black", Price = 500000m }]
        });
        await productRepo.AddAsync(new Product
        {
            ShopId = 20,
            CategoryId = 1,
            ProductName = "Alpha Competitor",
            ProductStatus = ProductStatus.Draft,
            Variants = [new ProductVariant { SKU = "ALP-99", VariantName = "White", Price = 600000m, IsActive = true }],
            CreatedAt = DateTime.UtcNow
        });

        var page = await service.GetMyProductsAsync(new SellerProductQueryDto
        {
            Status = ProductStatus.Draft,
            Q = "Alpha"
        });

        Assert.Single(page.Items);
        Assert.Equal("Alpha Keyboard", page.Items[0].ProductName);
        Assert.Equal(500000m, page.Items[0].MinPrice);
    }
}
