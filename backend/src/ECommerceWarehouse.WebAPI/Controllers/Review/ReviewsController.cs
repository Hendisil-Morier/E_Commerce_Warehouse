using ECommerceWarehouse.Application.DTOs.Review;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerceWarehouse.WebAPI.Controllers.Review;

[ApiController]
[Produces("application/json")]
public class ReviewsController : ControllerBase
{
    private readonly IReviewService _reviewService;

    public ReviewsController(IReviewService reviewService)
    {
        _reviewService = reviewService;
    }

    [HttpGet("api/v1/products/{productId:long}/reviews")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ProductReviewsSummaryDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProductReviews(
        long productId,
        [FromQuery] ReviewQueryDto query,
        CancellationToken cancellationToken)
    {
        var result = await _reviewService.GetProductReviewsAsync(productId, query, cancellationToken);
        return Ok(result);
    }

    [HttpPost("api/v1/reviews")]
    [Authorize(Policy = RoleNames.Customer)]
    [ProducesResponseType(typeof(ReviewDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateReview(
        [FromBody] CreateReviewRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _reviewService.CreateReviewAsync(request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, result);
    }

    [HttpPatch("api/v1/admin/reviews/{id:long}/visibility")]
    [Authorize(Policy = RoleNames.Admin)]
    [ProducesResponseType(typeof(ReviewDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SetVisibility(
        long id,
        [FromBody] UpdateReviewVisibilityRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _reviewService.SetVisibilityAsync(id, request, cancellationToken);
        return Ok(result);
    }
}
