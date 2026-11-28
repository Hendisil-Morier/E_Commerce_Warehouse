using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Review;
using ECommerceWarehouse.Domain.Entities.Order;
using ECommerceWarehouse.Domain.Entities.Review;
using ECommerceWarehouse.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ECommerceWarehouse.Infrastructure.Repositories;

public class ReviewRepository : IReviewRepository
{
    private readonly ApplicationDbContext _context;

    public ReviewRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ProductReviewsSummaryDto> GetProductReviewsAsync(
        long productId,
        ReviewQueryDto query,
        CancellationToken cancellationToken = default)
    {
        var q = _context.Reviews
            .AsNoTracking()
            .Where(r => r.IsVisible && r.OrderItem.Variant.ProductId == productId);

        var totalCount = await q.CountAsync(cancellationToken);
        var avg = totalCount > 0
            ? Math.Round(await q.AverageAsync(r => (double)r.Rating, cancellationToken), 2)
            : 0d;

        var items = await q
            .OrderByDescending(r => r.CreatedAt)
            .ThenByDescending(r => r.ReviewId)
            .Skip((query.NormalizedPage - 1) * query.NormalizedPageSize)
            .Take(query.NormalizedPageSize)
            .Select(r => new ReviewDto
            {
                ReviewId = r.ReviewId,
                CustomerId = r.CustomerId,
                CustomerName = r.Customer.FullName ?? r.Customer.Username,
                OrderItemId = r.OrderItemId,
                VariantId = r.OrderItem.VariantId,
                SKU = r.OrderItem.SKUSnapshot,
                Rating = r.Rating,
                Comment = r.Comment,
                IsVisible = r.IsVisible,
                CreatedAt = r.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return new ProductReviewsSummaryDto
        {
            AverageRating = avg,
            TotalReviews = totalCount,
            Reviews = PagedResult<ReviewDto>.Create(items, query.NormalizedPage, query.NormalizedPageSize, totalCount)
        };
    }

    public async Task<OrderItem?> GetOrderItemWithOrderAsync(long orderItemId, CancellationToken cancellationToken = default)
        => await _context.OrderItems
            .Include(oi => oi.SellerOrder)
                .ThenInclude(so => so.Order)
            .FirstOrDefaultAsync(oi => oi.OrderItemId == orderItemId, cancellationToken);

    public Task<bool> ExistsForOrderItemAsync(long orderItemId, CancellationToken cancellationToken = default)
        => _context.Reviews.AnyAsync(r => r.OrderItemId == orderItemId, cancellationToken);

    public Task<Review?> GetByIdAsync(long reviewId, CancellationToken cancellationToken = default)
        => _context.Reviews.FirstOrDefaultAsync(r => r.ReviewId == reviewId, cancellationToken);

    public async Task<ReviewDto?> GetDtoByIdAsync(long reviewId, CancellationToken cancellationToken = default)
        => await _context.Reviews
            .AsNoTracking()
            .Where(r => r.ReviewId == reviewId)
            .Select(r => new ReviewDto
            {
                ReviewId = r.ReviewId,
                CustomerId = r.CustomerId,
                CustomerName = r.Customer.FullName ?? r.Customer.Username,
                OrderItemId = r.OrderItemId,
                VariantId = r.OrderItem.VariantId,
                SKU = r.OrderItem.SKUSnapshot,
                Rating = r.Rating,
                Comment = r.Comment,
                IsVisible = r.IsVisible,
                CreatedAt = r.CreatedAt
            })
            .FirstOrDefaultAsync(cancellationToken);

    public async Task AddAsync(Review review, CancellationToken cancellationToken = default)
        => await _context.Reviews.AddAsync(review, cancellationToken);
}
