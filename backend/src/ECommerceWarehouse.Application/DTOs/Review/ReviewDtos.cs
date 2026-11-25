using ECommerceWarehouse.Application.DTOs.Common;
using FluentValidation;

namespace ECommerceWarehouse.Application.DTOs.Review;

public class ReviewQueryDto : PaginationQuery
{
}

public class ProductReviewsSummaryDto
{
    public double AverageRating { get; set; }
    public int TotalReviews { get; set; }
    public PagedResult<ReviewDto> Reviews { get; set; } = null!;
}

public class ReviewDto
{
    public long ReviewId { get; set; }
    public long CustomerId { get; set; }
    public string CustomerName { get; set; } = null!;
    public long OrderItemId { get; set; }
    public long VariantId { get; set; }
    public string SKU { get; set; } = null!;
    public sbyte Rating { get; set; }
    public string? Comment { get; set; }
    public bool IsVisible { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateReviewRequestDto
{
    public long OrderItemId { get; set; }
    public sbyte Rating { get; set; }
    public string? Comment { get; set; }
}

public class UpdateReviewVisibilityRequestDto
{
    public bool IsVisible { get; set; }
}

public class CreateReviewRequestValidator : AbstractValidator<CreateReviewRequestDto>
{
    public CreateReviewRequestValidator()
    {
        RuleFor(x => x.OrderItemId).GreaterThan(0);
        RuleFor(x => x.Rating).InclusiveBetween((sbyte)1, (sbyte)5)
            .WithMessage("Số sao đánh giá phải từ 1 đến 5.");
        RuleFor(x => x.Comment).MaximumLength(1000);
    }
}
