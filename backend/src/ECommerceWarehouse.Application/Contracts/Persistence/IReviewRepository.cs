using ECommerceWarehouse.Application.DTOs.Review;
using ECommerceWarehouse.Domain.Entities.Order;
using ECommerceWarehouse.Domain.Entities.Review;

namespace ECommerceWarehouse.Application.Contracts.Persistence;

public interface IReviewRepository
{
    Task<ProductReviewsSummaryDto> GetProductReviewsAsync(long productId, ReviewQueryDto query, CancellationToken cancellationToken = default);
    Task<OrderItem?> GetOrderItemWithOrderAsync(long orderItemId, CancellationToken cancellationToken = default);
    Task<bool> ExistsForOrderItemAsync(long orderItemId, CancellationToken cancellationToken = default);
    Task<Review?> GetByIdAsync(long reviewId, CancellationToken cancellationToken = default);
    Task<ReviewDto?> GetDtoByIdAsync(long reviewId, CancellationToken cancellationToken = default);
    Task AddAsync(Review review, CancellationToken cancellationToken = default);
}
