using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.Contracts.Services;
using ECommerceWarehouse.Application.DTOs.Review;
using ECommerceWarehouse.Domain.Constants;
using ECommerceWarehouse.Domain.Entities.Review;
using ECommerceWarehouse.Domain.Exceptions;
using FluentValidation;

namespace ECommerceWarehouse.Application.Services;

public class ReviewService : IReviewService
{
    private readonly IReviewRepository _reviewRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUser _currentUser;
    private readonly IValidator<CreateReviewRequestDto> _createValidator;

    public ReviewService(
        IReviewRepository reviewRepository,
        IUnitOfWork unitOfWork,
        ICurrentUser currentUser,
        IValidator<CreateReviewRequestDto> createValidator)
    {
        _reviewRepository = reviewRepository;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _createValidator = createValidator;
    }

    public Task<ProductReviewsSummaryDto> GetProductReviewsAsync(
        long productId,
        ReviewQueryDto query,
        CancellationToken cancellationToken = default)
        => _reviewRepository.GetProductReviewsAsync(productId, query, cancellationToken);

    public async Task<ReviewDto> CreateReviewAsync(
        CreateReviewRequestDto request,
        CancellationToken cancellationToken = default)
    {
        await _createValidator.ValidateAndThrowAsync(request, cancellationToken);
        var customerId = _currentUser.UserId ?? throw BusinessException.Unauthorized();

        var orderItem = await _reviewRepository.GetOrderItemWithOrderAsync(request.OrderItemId, cancellationToken);
        if (orderItem == null || orderItem.SellerOrder.Order.CustomerId != customerId)
        {
            throw new NotFoundException("OrderItem", request.OrderItemId);
        }

        if (orderItem.SellerOrder.Status != SellerOrderStatuses.Delivered &&
            orderItem.SellerOrder.Order.OrderStatus != OrderStatuses.Completed)
        {
            throw new BusinessException(
                ErrorCodes.BusinessRuleViolation,
                "Chỉ có thể đánh giá sản phẩm sau khi đơn hàng đã được giao thành công.",
                409);
        }

        if (await _reviewRepository.ExistsForOrderItemAsync(request.OrderItemId, cancellationToken))
        {
            throw new BusinessException(
                ErrorCodes.BusinessRuleViolation,
                "Bạn đã đánh giá sản phẩm trong đơn hàng này rồi.",
                409);
        }

        var review = new Review
        {
            CustomerId = customerId,
            OrderItemId = request.OrderItemId,
            Rating = request.Rating,
            Comment = string.IsNullOrWhiteSpace(request.Comment) ? null : request.Comment.Trim(),
            IsVisible = true,
            CreatedAt = DateTime.UtcNow
        };

        await _reviewRepository.AddAsync(review, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await _reviewRepository.GetDtoByIdAsync(review.ReviewId, cancellationToken)
            ?? throw new NotFoundException("Review", review.ReviewId);
    }

    public async Task<ReviewDto> SetVisibilityAsync(
        long reviewId,
        UpdateReviewVisibilityRequestDto request,
        CancellationToken cancellationToken = default)
    {
        _ = _currentUser.UserId ?? throw BusinessException.Unauthorized();
        var review = await _reviewRepository.GetByIdAsync(reviewId, cancellationToken)
            ?? throw new NotFoundException("Review", reviewId);

        review.IsVisible = request.IsVisible;
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await _reviewRepository.GetDtoByIdAsync(review.ReviewId, cancellationToken)
            ?? throw new NotFoundException("Review", review.ReviewId);
    }
}
