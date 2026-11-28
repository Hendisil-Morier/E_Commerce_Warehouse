using ECommerceWarehouse.Application.DTOs.Review;

namespace ECommerceWarehouse.Application.Services;

public interface IReviewService
{
    Task<ProductReviewsSummaryDto> GetProductReviewsAsync(long productId, ReviewQueryDto query, CancellationToken cancellationToken = default);
    Task<ReviewDto> CreateReviewAsync(CreateReviewRequestDto request, CancellationToken cancellationToken = default);
    Task<ReviewDto> SetVisibilityAsync(long reviewId, UpdateReviewVisibilityRequestDto request, CancellationToken cancellationToken = default);
}
