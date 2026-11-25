using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.Contracts.Services;
using ECommerceWarehouse.Application.DTOs.Customer;
using ECommerceWarehouse.Application.DTOs.Review;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Domain.Constants;
using ECommerceWarehouse.Domain.Entities.Customer;
using ECommerceWarehouse.Domain.Entities.Order;
using ECommerceWarehouse.Domain.Entities.Review;
using ECommerceWarehouse.Domain.Exceptions;

namespace ECommerceWarehouse.UnitTests.Services;

public class ReviewAndWishlistServiceTests
{
    private sealed class StubUnitOfWork : IUnitOfWork
    {
        public IGenericRepository<T> Repository<T>() where T : class => throw new NotImplementedException();
        public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) => Task.FromResult(1);
        public Task ExecuteInTransactionAsync(Func<CancellationToken, Task> operation, CancellationToken cancellationToken = default)
            => operation(cancellationToken);
        public void Dispose() { }
    }

    private sealed class StubCurrentUser : ICurrentUser
    {
        public long? UserId { get; set; } = 100;
        public IReadOnlyList<string> Roles { get; set; } = [RoleNames.Customer];
        public long? SellerId => null;
        public bool IsAuthenticated => UserId.HasValue;
        public bool IsInRole(string role) => Roles.Contains(role);
        public Task<long?> GetSellerIdAsync(CancellationToken cancellationToken = default) => Task.FromResult<long?>(null);
    }

    private sealed class InMemoryReviewRepo : IReviewRepository
    {
        public List<OrderItem> OrderItems { get; } = [];
        public List<Review> Reviews { get; } = [];

        public Task<ProductReviewsSummaryDto> GetProductReviewsAsync(long productId, ReviewQueryDto query, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();

        public Task<OrderItem?> GetOrderItemWithOrderAsync(long orderItemId, CancellationToken cancellationToken = default)
            => Task.FromResult(OrderItems.FirstOrDefault(oi => oi.OrderItemId == orderItemId));

        public Task<bool> ExistsForOrderItemAsync(long orderItemId, CancellationToken cancellationToken = default)
            => Task.FromResult(Reviews.Any(r => r.OrderItemId == orderItemId));

        public Task<Review?> GetByIdAsync(long reviewId, CancellationToken cancellationToken = default)
            => Task.FromResult(Reviews.FirstOrDefault(r => r.ReviewId == reviewId));

        public Task<ReviewDto?> GetDtoByIdAsync(long reviewId, CancellationToken cancellationToken = default)
        {
            var r = Reviews.FirstOrDefault(x => x.ReviewId == reviewId);
            if (r == null) return Task.FromResult<ReviewDto?>(null);
            return Task.FromResult<ReviewDto?>(new ReviewDto
            {
                ReviewId = r.ReviewId,
                CustomerId = r.CustomerId,
                CustomerName = "Khách A",
                OrderItemId = r.OrderItemId,
                VariantId = 1,
                SKU = "SKU-1",
                Rating = r.Rating,
                Comment = r.Comment,
                IsVisible = r.IsVisible,
                CreatedAt = r.CreatedAt
            });
        }

        public Task AddAsync(Review review, CancellationToken cancellationToken = default)
        {
            review.ReviewId = Reviews.Count + 1;
            Reviews.Add(review);
            return Task.CompletedTask;
        }
    }

    private sealed class InMemoryWishlistRepo : IWishlistRepository
    {
        public List<Wishlist> Wishlists { get; } = [];
        public HashSet<long> ActiveProducts { get; } = [10, 20];

        public Task<WishlistDto?> GetWishlistDtoAsync(long userId, CancellationToken cancellationToken = default)
        {
            var w = Wishlists.FirstOrDefault(x => x.UserId == userId);
            if (w == null) return Task.FromResult<WishlistDto?>(null);
            return Task.FromResult<WishlistDto?>(new WishlistDto
            {
                WishlistId = w.WishlistId,
                WishlistName = w.WishlistName,
                Items = w.Items.Select(i => new WishlistItemDto
                {
                    WishlistItemId = i.WishlistItemId,
                    ProductId = i.ProductId,
                    ProductName = $"SP {i.ProductId}",
                    AddedAt = i.AddedAt
                }).ToList()
            });
        }

        public Task<Wishlist?> GetByUserIdWithItemsAsync(long userId, CancellationToken cancellationToken = default)
            => Task.FromResult(Wishlists.FirstOrDefault(x => x.UserId == userId));

        public Task<bool> ActiveProductExistsAsync(long productId, CancellationToken cancellationToken = default)
            => Task.FromResult(ActiveProducts.Contains(productId));

        public Task AddWishlistAsync(Wishlist wishlist, CancellationToken cancellationToken = default)
        {
            wishlist.WishlistId = Wishlists.Count + 1;
            Wishlists.Add(wishlist);
            return Task.CompletedTask;
        }

        public void RemoveItem(WishlistItem item)
        {
            foreach (var w in Wishlists) w.Items.Remove(item);
        }
    }

    [Fact]
    public async Task CreateReviewAsync_CreatesReview_WhenDeliveredAndNotReviewed()
    {
        var repo = new InMemoryReviewRepo();
        repo.OrderItems.Add(new OrderItem
        {
            OrderItemId = 500,
            SellerOrder = new SellerOrder
            {
                Status = SellerOrderStatuses.Delivered,
                Order = new Order { CustomerId = 100, OrderStatus = OrderStatuses.Completed }
            }
        });

        var service = new ReviewService(repo, new StubUnitOfWork(), new StubCurrentUser(), new CreateReviewRequestValidator());
        var result = await service.CreateReviewAsync(new CreateReviewRequestDto
        {
            OrderItemId = 500,
            Rating = 5,
            Comment = "Rất tốt"
        });

        Assert.Equal((sbyte)5, result.Rating);
        Assert.True(result.IsVisible);
    }

    [Fact]
    public async Task CreateReviewAsync_ThrowsBusinessException_WhenOrderNotDelivered()
    {
        var repo = new InMemoryReviewRepo();
        repo.OrderItems.Add(new OrderItem
        {
            OrderItemId = 501,
            SellerOrder = new SellerOrder
            {
                Status = SellerOrderStatuses.Preparing,
                Order = new Order { CustomerId = 100, OrderStatus = OrderStatuses.Processing }
            }
        });

        var service = new ReviewService(repo, new StubUnitOfWork(), new StubCurrentUser(), new CreateReviewRequestValidator());

        await Assert.ThrowsAsync<BusinessException>(() => service.CreateReviewAsync(new CreateReviewRequestDto
        {
            OrderItemId = 501,
            Rating = 4
        }));
    }

    [Fact]
    public async Task Wishlist_AddAndRemove_WorksIdempotently()
    {
        var repo = new InMemoryWishlistRepo();
        var service = new WishlistService(repo, new StubUnitOfWork(), new StubCurrentUser(), new AddWishlistItemRequestValidator());

        var afterAdd = await service.AddItemAsync(new AddWishlistItemRequestDto { ProductId = 10 });
        Assert.Single(afterAdd.Items);

        // Idempotent add
        var afterDuplicateAdd = await service.AddItemAsync(new AddWishlistItemRequestDto { ProductId = 10 });
        Assert.Single(afterDuplicateAdd.Items);

        var afterRemove = await service.RemoveItemAsync(10);
        Assert.Empty(afterRemove.Items);
    }
}
