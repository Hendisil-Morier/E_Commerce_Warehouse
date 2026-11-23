using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.Contracts.Services;
using ECommerceWarehouse.Application.DTOs.Catalog;
using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Customer;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Application.Validators.Customer;
using ECommerceWarehouse.Domain.Constants;
using ECommerceWarehouse.Domain.Entities.Catalog;
using ECommerceWarehouse.Domain.Entities.Customer;
using ECommerceWarehouse.Domain.Entities.Seller;
using ECommerceWarehouse.Domain.Enums;
using ECommerceWarehouse.Domain.Exceptions;
using FluentValidation;
using Microsoft.Extensions.Logging.Abstractions;
using DomainSeller = ECommerceWarehouse.Domain.Entities.Seller.Seller;

namespace ECommerceWarehouse.UnitTests.Services;

public class CartServiceTests
{
    private sealed class FakeCurrentUser : ICurrentUser
    {
        public bool IsAuthenticated { get; set; } = true;
        public long? UserId { get; set; } = 100;
        public IReadOnlyList<string> Roles { get; set; } = [RoleNames.Customer];
        public long? SellerId { get; set; }

        public bool IsInRole(string role) => Roles.Contains(role, StringComparer.OrdinalIgnoreCase);

        public Task<long?> GetSellerIdAsync(CancellationToken cancellationToken = default)
            => Task.FromResult(SellerId);
    }

    private sealed class InMemoryCartRepository : ICartRepository
    {
        private long _nextCartId = 1;
        private long _nextCartItemId = 10;

        public List<Cart> Carts { get; } = [];
        public List<ProductVariant> Variants { get; } = [];
        public Exception? SaveExceptionToThrow { get; set; }
        public int SaveChangesCalls { get; private set; }

        public Task<Cart?> GetByUserIdWithDetailsAsNoTrackingAsync(
            long userId,
            CancellationToken cancellationToken = default)
            => Task.FromResult(Carts.FirstOrDefault(c => c.UserId == userId));

        public Task<Cart?> GetByUserIdWithItemsAsync(
            long userId,
            CancellationToken cancellationToken = default)
            => Task.FromResult(Carts.FirstOrDefault(c => c.UserId == userId));

        public Task<CartItem?> GetItemByIdForUserWithCatalogAsync(
            long cartItemId,
            long userId,
            CancellationToken cancellationToken = default)
            => Task.FromResult(
                Carts
                    .Where(c => c.UserId == userId)
                    .SelectMany(c => c.Items)
                    .FirstOrDefault(ci => ci.CartItemId == cartItemId));

        public Task<CartItem?> GetItemByIdForUserAsync(
            long cartItemId,
            long userId,
            CancellationToken cancellationToken = default)
            => GetItemByIdForUserWithCatalogAsync(cartItemId, userId, cancellationToken);

        public Task<ProductVariant?> GetVariantWithCatalogAsNoTrackingAsync(
            long variantId,
            CancellationToken cancellationToken = default)
            => Task.FromResult(Variants.FirstOrDefault(v => v.VariantId == variantId));

        public Task AddCartAsync(Cart cart, CancellationToken cancellationToken = default)
        {
            if (cart.CartId == 0)
            {
                cart.CartId = _nextCartId++;
            }

            foreach (var item in cart.Items)
            {
                AssignCartItemLinks(cart, item);
            }

            Carts.Add(cart);
            return Task.CompletedTask;
        }

        public Task AddCartItemAsync(CartItem item, CancellationToken cancellationToken = default)
        {
            var cart = Carts.First(c => c.CartId == item.CartId);
            AssignCartItemLinks(cart, item);
            if (!cart.Items.Contains(item))
            {
                cart.Items.Add(item);
            }

            return Task.CompletedTask;
        }

        public void RemoveCartItem(CartItem item)
        {
            var cart = Carts.FirstOrDefault(c => c.CartId == item.CartId);
            cart?.Items.Remove(item);
        }

        public Task SaveChangesHandlingConcurrencyAsync(CancellationToken cancellationToken = default)
        {
            SaveChangesCalls++;
            if (SaveExceptionToThrow != null)
            {
                throw SaveExceptionToThrow;
            }

            return Task.CompletedTask;
        }

        private void AssignCartItemLinks(Cart cart, CartItem item)
        {
            item.CartId = cart.CartId;
            item.Cart = cart;
            if (item.CartItemId == 0)
            {
                item.CartItemId = _nextCartItemId++;
            }

            if (item.Variant == null!)
            {
                item.Variant = Variants.First(v => v.VariantId == item.VariantId);
            }
        }
    }

    private sealed class StubAvailabilityProductRepository : IProductRepository
    {
        public Dictionary<long, int> AvailabilityByVariantId { get; } = new();
        public int AvailabilityQueryCalls { get; private set; }

        public Task<IReadOnlyDictionary<long, int>> GetVariantAvailabilityByIdsAsync(
            IReadOnlyCollection<long> variantIds,
            CancellationToken cancellationToken = default)
        {
            AvailabilityQueryCalls++;
            IReadOnlyDictionary<long, int> result = variantIds
                .Distinct()
                .Where(id => AvailabilityByVariantId.ContainsKey(id))
                .ToDictionary(id => id, id => AvailabilityByVariantId[id]);

            return Task.FromResult(result);
        }

        public Task<PagedResult<Product>> GetSellerPagedAsync(long sellerId, SellerProductQueryDto query, CancellationToken cancellationToken = default)
            => throw new NotSupportedException();
        public Task<Product?> GetByIdForSellerWithDetailsAsync(long productId, long sellerId, bool asNoTracking = false, CancellationToken cancellationToken = default)
            => throw new NotSupportedException();
        public Task<PagedResult<Product>> GetAdminPagedAsync(AdminProductQueryDto query, CancellationToken cancellationToken = default)
            => throw new NotSupportedException();
        public Task<Product?> GetByIdWithDetailsAsync(long productId, bool asNoTracking = false, CancellationToken cancellationToken = default)
            => throw new NotSupportedException();
        public Task<PagedResult<Product>> GetPublicPagedAsync(PublicProductQueryDto query, IReadOnlyCollection<long>? expandedCategoryIds = null, CancellationToken cancellationToken = default)
            => throw new NotSupportedException();
        public Task<Product?> GetPublicByIdWithDetailsAsync(long productId, CancellationToken cancellationToken = default)
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

    private sealed class TestFixture
    {
        public FakeCurrentUser CurrentUser { get; } = new();
        public InMemoryCartRepository CartRepo { get; } = new();
        public StubAvailabilityProductRepository ProductRepo { get; } = new();
        public CartService Service { get; }

        public ProductVariant VariantShopA1 { get; }
        public ProductVariant VariantShopA2 { get; }
        public ProductVariant VariantShopB1 { get; }
        public ProductVariant InactiveVariant { get; }
        public ProductVariant DraftProductVariant { get; }
        public ProductVariant InactiveShopVariant { get; }
        public ProductVariant SuspendedSellerVariant { get; }
        public ProductVariant InactiveCategoryVariant { get; }

        public TestFixture()
        {
            var approvedSeller1 = new DomainSeller { SellerId = 1, UserId = 10, BusinessName = "Alpha Corp", Status = SellerStatus.Approved };
            var approvedSeller2 = new DomainSeller { SellerId = 2, UserId = 20, BusinessName = "Beta Corp", Status = SellerStatus.Approved };
            var suspendedSeller = new DomainSeller { SellerId = 3, UserId = 30, BusinessName = "Blocked Corp", Status = SellerStatus.Suspended };

            var shopA = new Shop { ShopId = 11, SellerId = 1, Seller = approvedSeller1, ShopName = "Alpha Gear", LogoUrl = "/uploads/alpha.png", IsActive = true };
            var shopB = new Shop { ShopId = 12, SellerId = 2, Seller = approvedSeller2, ShopName = "Beta Tech", LogoUrl = "/uploads/beta.png", IsActive = true };
            var inactiveShop = new Shop { ShopId = 13, SellerId = 1, Seller = approvedSeller1, ShopName = "Paused Shop", IsActive = false };
            var suspendedShop = new Shop { ShopId = 14, SellerId = 3, Seller = suspendedSeller, ShopName = "Suspended Shop", IsActive = true };

            var activeCategory = new Category { CategoryId = 1, CategoryName = "Điện tử", IsActive = true };
            var inactiveCategory = new Category { CategoryId = 2, CategoryName = "Ẩn", IsActive = false };

            var productA = new Product
            {
                ProductId = 100,
                ShopId = shopA.ShopId,
                Shop = shopA,
                CategoryId = activeCategory.CategoryId,
                Category = activeCategory,
                ProductName = "Bàn phím cơ Alpha",
                ProductStatus = ProductStatus.Active,
                Images =
                [
                    new ProductImage { ImageId = 1, ProductId = 100, ImageUrl = "/uploads/kb-sub.jpg", IsPrimary = false, DisplayOrder = 1 },
                    new ProductImage { ImageId = 2, ProductId = 100, ImageUrl = "/uploads/kb-main.jpg", IsPrimary = true, DisplayOrder = 2 }
                ]
            };

            var productB = new Product
            {
                ProductId = 200,
                ShopId = shopB.ShopId,
                Shop = shopB,
                CategoryId = activeCategory.CategoryId,
                Category = activeCategory,
                ProductName = "Chuột không dây Beta",
                ProductStatus = ProductStatus.Active,
                Images =
                [
                    new ProductImage { ImageId = 3, ProductId = 200, ImageUrl = "/uploads/mouse-2.jpg", IsPrimary = false, DisplayOrder = 2 },
                    new ProductImage { ImageId = 4, ProductId = 200, ImageUrl = "/uploads/mouse-1.jpg", IsPrimary = false, DisplayOrder = 1 }
                ]
            };

            var draftProduct = new Product
            {
                ProductId = 300,
                ShopId = shopA.ShopId,
                Shop = shopA,
                CategoryId = activeCategory.CategoryId,
                Category = activeCategory,
                ProductName = "Sản phẩm nháp",
                ProductStatus = ProductStatus.Draft
            };

            var inactiveShopProduct = new Product
            {
                ProductId = 301,
                ShopId = inactiveShop.ShopId,
                Shop = inactiveShop,
                CategoryId = activeCategory.CategoryId,
                Category = activeCategory,
                ProductName = "Sản phẩm shop tắt",
                ProductStatus = ProductStatus.Active
            };

            var suspendedSellerProduct = new Product
            {
                ProductId = 302,
                ShopId = suspendedShop.ShopId,
                Shop = suspendedShop,
                CategoryId = activeCategory.CategoryId,
                Category = activeCategory,
                ProductName = "Sản phẩm seller bị khóa",
                ProductStatus = ProductStatus.Active
            };

            var inactiveCategoryProduct = new Product
            {
                ProductId = 303,
                ShopId = shopA.ShopId,
                Shop = shopA,
                CategoryId = inactiveCategory.CategoryId,
                Category = inactiveCategory,
                ProductName = "Sản phẩm danh mục ẩn",
                ProductStatus = ProductStatus.Active
            };

            VariantShopA1 = new ProductVariant
            {
                VariantId = 1001,
                ProductId = productA.ProductId,
                Product = productA,
                VariantName = "Switch Đỏ",
                SKU = "ALPHA-KB-RED",
                Price = 1_500_000m,
                IsActive = true
            };

            VariantShopA2 = new ProductVariant
            {
                VariantId = 1002,
                ProductId = productA.ProductId,
                Product = productA,
                VariantName = "Switch Nâu",
                SKU = "ALPHA-KB-BROWN",
                Price = 1_600_000m,
                IsActive = true
            };

            VariantShopB1 = new ProductVariant
            {
                VariantId = 2001,
                ProductId = productB.ProductId,
                Product = productB,
                VariantName = "Đen",
                SKU = "BETA-MS-BLK",
                Price = 850_000m,
                IsActive = true
            };

            InactiveVariant = new ProductVariant
            {
                VariantId = 3001,
                ProductId = productA.ProductId,
                Product = productA,
                VariantName = "Switch Cũ",
                SKU = "ALPHA-KB-OLD",
                Price = 1_200_000m,
                IsActive = false
            };

            DraftProductVariant = new ProductVariant
            {
                VariantId = 3002,
                ProductId = draftProduct.ProductId,
                Product = draftProduct,
                VariantName = "Mặc định",
                SKU = "DRAFT-01",
                Price = 500_000m,
                IsActive = true
            };

            InactiveShopVariant = new ProductVariant
            {
                VariantId = 3003,
                ProductId = inactiveShopProduct.ProductId,
                Product = inactiveShopProduct,
                VariantName = "Mặc định",
                SKU = "PAUSED-01",
                Price = 500_000m,
                IsActive = true
            };

            SuspendedSellerVariant = new ProductVariant
            {
                VariantId = 3004,
                ProductId = suspendedSellerProduct.ProductId,
                Product = suspendedSellerProduct,
                VariantName = "Mặc định",
                SKU = "SUSP-01",
                Price = 500_000m,
                IsActive = true
            };

            InactiveCategoryVariant = new ProductVariant
            {
                VariantId = 3005,
                ProductId = inactiveCategoryProduct.ProductId,
                Product = inactiveCategoryProduct,
                VariantName = "Mặc định",
                SKU = "INACT-CAT-01",
                Price = 500_000m,
                IsActive = true
            };

            CartRepo.Variants.AddRange([
                VariantShopA1,
                VariantShopA2,
                VariantShopB1,
                InactiveVariant,
                DraftProductVariant,
                InactiveShopVariant,
                SuspendedSellerVariant,
                InactiveCategoryVariant
            ]);

            ProductRepo.AvailabilityByVariantId[VariantShopA1.VariantId] = 5;
            ProductRepo.AvailabilityByVariantId[VariantShopA2.VariantId] = 10;
            ProductRepo.AvailabilityByVariantId[VariantShopB1.VariantId] = 3;
            ProductRepo.AvailabilityByVariantId[InactiveVariant.VariantId] = 20;
            ProductRepo.AvailabilityByVariantId[DraftProductVariant.VariantId] = 20;
            ProductRepo.AvailabilityByVariantId[InactiveShopVariant.VariantId] = 20;
            ProductRepo.AvailabilityByVariantId[SuspendedSellerVariant.VariantId] = 20;
            ProductRepo.AvailabilityByVariantId[InactiveCategoryVariant.VariantId] = 20;

            Service = new CartService(
                CartRepo,
                ProductRepo,
                CurrentUser,
                new AddCartItemRequestValidator(),
                new UpdateCartItemRequestValidator(),
                NullLogger<CartService>.Instance);
        }
    }

    // -------------------------------------------------------------------------
    // GET /api/v1/cart
    // -------------------------------------------------------------------------

    [Fact]
    public async Task GetMyCartAsync_WhenUserHasNoCart_ReturnsEmptyCartDto()
    {
        var fx = new TestFixture();

        var cart = await fx.Service.GetMyCartAsync();

        Assert.Null(cart.CartId);
        Assert.Equal(0, cart.TotalItems);
        Assert.Equal(0, cart.TotalQuantity);
        Assert.Equal(0, cart.UnavailableItemCount);
        Assert.False(cart.HasWarnings);
        Assert.Equal(0m, cart.Subtotal);
        Assert.Null(cart.UpdatedAt);
        Assert.Empty(cart.Shops);
        Assert.Equal(0, fx.ProductRepo.AvailabilityQueryCalls);
    }

    [Fact]
    public async Task GetMyCartAsync_WhenUnauthenticated_ThrowsUnauthorizedBusinessException()
    {
        var fx = new TestFixture();
        fx.CurrentUser.IsAuthenticated = false;
        fx.CurrentUser.UserId = null;

        var ex = await Assert.ThrowsAsync<BusinessException>(() => fx.Service.GetMyCartAsync());

        Assert.Equal(ErrorCodes.Unauthorized, ex.Code);
        Assert.Equal(401, ex.HttpStatus);
    }

    [Fact]
    public async Task GetMyCartAsync_GroupsByShop_CalculatesServerPrices_AndFlagsAllWarningStatuses()
    {
        var fx = new TestFixture();
        var t1 = new DateTime(2026, 11, 10, 8, 0, 0, DateTimeKind.Utc);
        var t2 = new DateTime(2026, 11, 10, 9, 0, 0, DateTimeKind.Utc);
        var t3 = new DateTime(2026, 11, 10, 10, 0, 0, DateTimeKind.Utc);

        // Giả lập tồn kho thay đổi sau khi khách đã thêm hàng vào giỏ trước đó
        fx.ProductRepo.AvailabilityByVariantId[fx.VariantShopA1.VariantId] = 5; // Available (qty 2 <= 5)
        fx.ProductRepo.AvailabilityByVariantId[fx.VariantShopA2.VariantId] = 1; // InsufficientStock (qty 3 > 1)
        fx.ProductRepo.AvailabilityByVariantId[fx.VariantShopB1.VariantId] = 0; // OutOfStock

        var cart = new Cart
        {
            CartId = 50,
            UserId = fx.CurrentUser.UserId!.Value,
            CreatedAt = t1,
            UpdatedAt = t3
        };
        cart.Items.Add(new CartItem { CartItemId = 1, CartId = 50, Cart = cart, VariantId = fx.VariantShopA1.VariantId, Variant = fx.VariantShopA1, Quantity = 2, AddedAt = t1 });
        cart.Items.Add(new CartItem { CartItemId = 2, CartId = 50, Cart = cart, VariantId = fx.VariantShopA2.VariantId, Variant = fx.VariantShopA2, Quantity = 3, AddedAt = t2 });
        cart.Items.Add(new CartItem { CartItemId = 3, CartId = 50, Cart = cart, VariantId = fx.InactiveVariant.VariantId, Variant = fx.InactiveVariant, Quantity = 1, AddedAt = t3 });
        cart.Items.Add(new CartItem { CartItemId = 4, CartId = 50, Cart = cart, VariantId = fx.VariantShopB1.VariantId, Variant = fx.VariantShopB1, Quantity = 1, AddedAt = t1 });
        fx.CartRepo.Carts.Add(cart);

        var dto = await fx.Service.GetMyCartAsync();

        Assert.Equal(50, dto.CartId);
        Assert.Equal(4, dto.TotalItems);
        Assert.Equal(7, dto.TotalQuantity);
        Assert.Equal(3, dto.UnavailableItemCount);
        Assert.True(dto.HasWarnings);
        // Chỉ dòng Available (VariantShopA1: 2 x 1.500.000 = 3.000.000) được tính vào Subtotal
        Assert.Equal(3_000_000m, dto.Subtotal);
        Assert.Equal(2, dto.Shops.Count);

        // Sắp xếp shop theo tên tăng dần: Alpha Gear -> Beta Tech
        var shopA = dto.Shops[0];
        Assert.Equal("Alpha Gear", shopA.ShopName);
        Assert.Equal(3_000_000m, shopA.ShopSubtotal);
        Assert.Equal(3, shopA.Items.Count);
        // Trong shop sắp xếp AddedAt giảm dần: item 3 (t3) -> item 2 (t2) -> item 1 (t1)
        Assert.Equal(3, shopA.Items[0].CartItemId);
        Assert.Equal(CartAvailabilityStatus.ProductUnavailable, shopA.Items[0].AvailabilityStatus);
        Assert.False(shopA.Items[0].IsAvailable);
        Assert.NotNull(shopA.Items[0].WarningMessage);

        Assert.Equal(2, shopA.Items[1].CartItemId);
        Assert.Equal(CartAvailabilityStatus.InsufficientStock, shopA.Items[1].AvailabilityStatus);
        Assert.False(shopA.Items[1].IsAvailable);
        Assert.Equal(1, shopA.Items[1].AvailableQuantity);
        Assert.NotNull(shopA.Items[1].WarningMessage);

        Assert.Equal(1, shopA.Items[2].CartItemId);
        Assert.Equal(CartAvailabilityStatus.Available, shopA.Items[2].AvailabilityStatus);
        Assert.True(shopA.Items[2].IsAvailable);
        Assert.Null(shopA.Items[2].WarningMessage);
        Assert.Equal("/uploads/kb-main.jpg", shopA.Items[2].ThumbnailUrl); // Ưu tiên IsPrimary
        Assert.Equal(3_000_000m, shopA.Items[2].LineTotal);

        var shopB = dto.Shops[1];
        Assert.Equal("Beta Tech", shopB.ShopName);
        Assert.Equal(0m, shopB.ShopSubtotal);
        var itemB = Assert.Single(shopB.Items);
        Assert.Equal(CartAvailabilityStatus.OutOfStock, itemB.AvailabilityStatus);
        Assert.False(itemB.IsAvailable);
        Assert.Equal("/uploads/mouse-1.jpg", itemB.ThumbnailUrl); // Không có IsPrimary -> DisplayOrder nhỏ nhất
    }

    [Fact]
    public async Task GetMyCartAsync_DoesNotExposeAnotherUsersCart()
    {
        var fx = new TestFixture();
        var otherCart = new Cart { CartId = 99, UserId = 999, CreatedAt = DateTime.UtcNow };
        otherCart.Items.Add(new CartItem
        {
            CartItemId = 999,
            CartId = 99,
            Cart = otherCart,
            VariantId = fx.VariantShopA1.VariantId,
            Variant = fx.VariantShopA1,
            Quantity = 1,
            AddedAt = DateTime.UtcNow
        });
        fx.CartRepo.Carts.Add(otherCart);

        var myCart = await fx.Service.GetMyCartAsync();

        Assert.Null(myCart.CartId);
        Assert.Empty(myCart.Shops);
    }

    // -------------------------------------------------------------------------
    // POST /api/v1/cart/items
    // -------------------------------------------------------------------------

    [Fact]
    public async Task AddItemAsync_WhenNoCartExists_CreatesCartAndItem_ReturnsIsCreatedTrue()
    {
        var fx = new TestFixture();

        var result = await fx.Service.AddItemAsync(new AddCartItemRequestDto
        {
            VariantId = fx.VariantShopA1.VariantId,
            Quantity = 2
        });

        Assert.True(result.IsCreated);
        Assert.True(result.CartItemId > 0);
        Assert.NotNull(result.Cart.CartId);
        Assert.Equal(1, result.Cart.TotalItems);
        Assert.Equal(2, result.Cart.TotalQuantity);
        Assert.Equal(3_000_000m, result.Cart.Subtotal);
        Assert.False(result.Cart.HasWarnings);
        Assert.Equal(1, fx.CartRepo.SaveChangesCalls);
        // Không trừ/giữ chỗ tồn kho khi thêm vào giỏ
        Assert.Equal(5, fx.ProductRepo.AvailabilityByVariantId[fx.VariantShopA1.VariantId]);
    }

    [Fact]
    public async Task AddItemAsync_WhenVariantAlreadyInCart_MergesQuantity_AndReturnsIsCreatedFalse()
    {
        var fx = new TestFixture();

        var first = await fx.Service.AddItemAsync(new AddCartItemRequestDto
        {
            VariantId = fx.VariantShopA1.VariantId,
            Quantity = 2
        });

        var second = await fx.Service.AddItemAsync(new AddCartItemRequestDto
        {
            VariantId = fx.VariantShopA1.VariantId,
            Quantity = 3
        });

        Assert.False(second.IsCreated);
        Assert.Equal(first.CartItemId, second.CartItemId);
        Assert.Equal(1, second.Cart.TotalItems);
        Assert.Equal(5, second.Cart.TotalQuantity);
        Assert.Equal(7_500_000m, second.Cart.Subtotal);
    }

    [Fact]
    public async Task AddItemAsync_WhenAddingSecondVariantToExistingCart_CreatesNewLine_ReturnsIsCreatedTrue()
    {
        var fx = new TestFixture();

        var first = await fx.Service.AddItemAsync(new AddCartItemRequestDto
        {
            VariantId = fx.VariantShopA1.VariantId,
            Quantity = 1
        });

        var second = await fx.Service.AddItemAsync(new AddCartItemRequestDto
        {
            VariantId = fx.VariantShopB1.VariantId,
            Quantity = 2
        });

        Assert.True(second.IsCreated);
        Assert.NotEqual(first.CartItemId, second.CartItemId);
        Assert.Equal(2, second.Cart.TotalItems);
        Assert.Equal(3, second.Cart.TotalQuantity);
        Assert.Equal(2, second.Cart.Shops.Count);
        Assert.Equal(1_500_000m + 2 * 850_000m, second.Cart.Subtotal);
    }

    [Fact]
    public async Task AddItemAsync_WhenMergedQuantityExceedsAvailableStock_ThrowsInsufficientStock_WithoutSaving()
    {
        var fx = new TestFixture();
        await fx.Service.AddItemAsync(new AddCartItemRequestDto
        {
            VariantId = fx.VariantShopA1.VariantId,
            Quantity = 3
        });
        var saveCallsAfterFirstAdd = fx.CartRepo.SaveChangesCalls;

        // Available = 5, existing = 3, thêm 3 -> tổng 6 > 5
        var ex = await Assert.ThrowsAsync<BusinessException>(() =>
            fx.Service.AddItemAsync(new AddCartItemRequestDto
            {
                VariantId = fx.VariantShopA1.VariantId,
                Quantity = 3
            }));

        Assert.Equal(ErrorCodes.InsufficientStock, ex.Code);
        Assert.Equal(409, ex.HttpStatus);
        Assert.Equal(saveCallsAfterFirstAdd, fx.CartRepo.SaveChangesCalls);
        Assert.Equal(3, fx.CartRepo.Carts[0].Items.Single().Quantity);
    }

    [Fact]
    public async Task AddItemAsync_WhenVariantOutOfStock_ThrowsInsufficientStock()
    {
        var fx = new TestFixture();
        fx.ProductRepo.AvailabilityByVariantId[fx.VariantShopA1.VariantId] = 0;

        var ex = await Assert.ThrowsAsync<BusinessException>(() =>
            fx.Service.AddItemAsync(new AddCartItemRequestDto
            {
                VariantId = fx.VariantShopA1.VariantId,
                Quantity = 1
            }));

        Assert.Equal(ErrorCodes.InsufficientStock, ex.Code);
        Assert.Equal(409, ex.HttpStatus);
    }

    [Fact]
    public async Task AddItemAsync_WhenVariantNotFound_ThrowsNotFoundException()
    {
        var fx = new TestFixture();

        await Assert.ThrowsAsync<NotFoundException>(() =>
            fx.Service.AddItemAsync(new AddCartItemRequestDto
            {
                VariantId = 999_999,
                Quantity = 1
            }));
    }

    [Theory]
    [InlineData(3001)] // Inactive variant
    [InlineData(3002)] // Draft product
    [InlineData(3003)] // Inactive shop
    [InlineData(3004)] // Suspended seller
    [InlineData(3005)] // Inactive category
    public async Task AddItemAsync_WhenVariantOrCatalogNotSellable_ThrowsProductNotAvailable(long variantId)
    {
        var fx = new TestFixture();

        var ex = await Assert.ThrowsAsync<BusinessException>(() =>
            fx.Service.AddItemAsync(new AddCartItemRequestDto
            {
                VariantId = variantId,
                Quantity = 1
            }));

        Assert.Equal(ErrorCodes.ProductNotAvailable, ex.Code);
        Assert.Equal(409, ex.HttpStatus);
    }

    [Theory]
    [InlineData(0, 1)]
    [InlineData(-1, 1)]
    [InlineData(1001, 0)]
    [InlineData(1001, -5)]
    public async Task AddItemAsync_WithInvalidInput_ThrowsValidationException(long variantId, int quantity)
    {
        var fx = new TestFixture();

        await Assert.ThrowsAsync<ValidationException>(() =>
            fx.Service.AddItemAsync(new AddCartItemRequestDto
            {
                VariantId = variantId,
                Quantity = quantity
            }));

        Assert.Equal(0, fx.CartRepo.SaveChangesCalls);
    }

    [Fact]
    public async Task AddItemAsync_WhenRepositoryThrowsConcurrencyConflict_Propagates409ConcurrencyConflict()
    {
        var fx = new TestFixture();
        fx.CartRepo.SaveExceptionToThrow = BusinessException.ConcurrencyConflict();

        var ex = await Assert.ThrowsAsync<BusinessException>(() =>
            fx.Service.AddItemAsync(new AddCartItemRequestDto
            {
                VariantId = fx.VariantShopA1.VariantId,
                Quantity = 1
            }));

        Assert.Equal(ErrorCodes.ConcurrencyConflict, ex.Code);
        Assert.Equal(409, ex.HttpStatus);
    }

    // -------------------------------------------------------------------------
    // PUT /api/v1/cart/items/{id}
    // -------------------------------------------------------------------------

    [Fact]
    public async Task UpdateItemQuantityAsync_UpdatesOwnItem_AndRecalculatesCart()
    {
        var fx = new TestFixture();
        var added = await fx.Service.AddItemAsync(new AddCartItemRequestDto
        {
            VariantId = fx.VariantShopA1.VariantId,
            Quantity = 1
        });

        var updated = await fx.Service.UpdateItemQuantityAsync(
            added.CartItemId,
            new UpdateCartItemRequestDto { Quantity = 4 });

        Assert.Equal(4, updated.TotalQuantity);
        Assert.Equal(6_000_000m, updated.Subtotal);
        var item = Assert.Single(Assert.Single(updated.Shops).Items);
        Assert.Equal(4, item.Quantity);
        Assert.Equal(6_000_000m, item.LineTotal);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-3)]
    public async Task UpdateItemQuantityAsync_WithInvalidQuantity_ThrowsValidationException(int quantity)
    {
        var fx = new TestFixture();

        await Assert.ThrowsAsync<ValidationException>(() =>
            fx.Service.UpdateItemQuantityAsync(10, new UpdateCartItemRequestDto { Quantity = quantity }));
    }

    [Fact]
    public async Task UpdateItemQuantityAsync_WhenItemBelongsToAnotherUser_ThrowsNotFoundException()
    {
        var fx = new TestFixture();
        var otherCart = new Cart { CartId = 77, UserId = 202, CreatedAt = DateTime.UtcNow };
        otherCart.Items.Add(new CartItem
        {
            CartItemId = 777,
            CartId = 77,
            Cart = otherCart,
            VariantId = fx.VariantShopA1.VariantId,
            Variant = fx.VariantShopA1,
            Quantity = 1,
            AddedAt = DateTime.UtcNow
        });
        fx.CartRepo.Carts.Add(otherCart);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            fx.Service.UpdateItemQuantityAsync(777, new UpdateCartItemRequestDto { Quantity = 2 }));
    }

    [Fact]
    public async Task UpdateItemQuantityAsync_WhenExceedsAvailableStock_ThrowsInsufficientStock()
    {
        var fx = new TestFixture();
        var added = await fx.Service.AddItemAsync(new AddCartItemRequestDto
        {
            VariantId = fx.VariantShopA1.VariantId,
            Quantity = 2
        });

        // Available = 5, cập nhật thành 6 -> lỗi
        var ex = await Assert.ThrowsAsync<BusinessException>(() =>
            fx.Service.UpdateItemQuantityAsync(added.CartItemId, new UpdateCartItemRequestDto { Quantity = 6 }));

        Assert.Equal(ErrorCodes.InsufficientStock, ex.Code);
        Assert.Equal(409, ex.HttpStatus);
    }

    [Fact]
    public async Task UpdateItemQuantityAsync_WhenProductBecameUnavailable_ThrowsProductNotAvailable()
    {
        var fx = new TestFixture();
        var added = await fx.Service.AddItemAsync(new AddCartItemRequestDto
        {
            VariantId = fx.VariantShopA1.VariantId,
            Quantity = 1
        });

        // Sản phẩm bị tắt sau khi đã nằm trong giỏ
        fx.VariantShopA1.IsActive = false;

        var ex = await Assert.ThrowsAsync<BusinessException>(() =>
            fx.Service.UpdateItemQuantityAsync(added.CartItemId, new UpdateCartItemRequestDto { Quantity = 2 }));

        Assert.Equal(ErrorCodes.ProductNotAvailable, ex.Code);
        Assert.Equal(409, ex.HttpStatus);
    }

    // -------------------------------------------------------------------------
    // DELETE /api/v1/cart/items/{id}
    // -------------------------------------------------------------------------

    [Fact]
    public async Task RemoveItemAsync_RemovesOwnItem_AndPersistsChanges()
    {
        var fx = new TestFixture();
        var added = await fx.Service.AddItemAsync(new AddCartItemRequestDto
        {
            VariantId = fx.VariantShopA1.VariantId,
            Quantity = 2
        });

        await fx.Service.RemoveItemAsync(added.CartItemId);

        var cart = await fx.Service.GetMyCartAsync();
        Assert.Equal(0, cart.TotalItems);
        Assert.Equal(0, cart.TotalQuantity);
        Assert.Equal(0m, cart.Subtotal);
        Assert.Empty(cart.Shops);
    }

    [Fact]
    public async Task RemoveItemAsync_WhenItemNotFoundOrOwnedByAnotherUser_ThrowsNotFoundException()
    {
        var fx = new TestFixture();
        var otherCart = new Cart { CartId = 88, UserId = 303, CreatedAt = DateTime.UtcNow };
        otherCart.Items.Add(new CartItem
        {
            CartItemId = 888,
            CartId = 88,
            Cart = otherCart,
            VariantId = fx.VariantShopA1.VariantId,
            Variant = fx.VariantShopA1,
            Quantity = 1,
            AddedAt = DateTime.UtcNow
        });
        fx.CartRepo.Carts.Add(otherCart);

        await Assert.ThrowsAsync<NotFoundException>(() => fx.Service.RemoveItemAsync(888));
        await Assert.ThrowsAsync<NotFoundException>(() => fx.Service.RemoveItemAsync(123456));
        Assert.Single(otherCart.Items);
    }
}
