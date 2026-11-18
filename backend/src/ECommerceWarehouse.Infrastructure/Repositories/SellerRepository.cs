using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Seller;
using ECommerceWarehouse.Domain.Entities.Seller;
using ECommerceWarehouse.Infrastructure.Data;
using ECommerceWarehouse.Infrastructure.Extensions;
using Microsoft.EntityFrameworkCore;

namespace ECommerceWarehouse.Infrastructure.Repositories;

public class SellerRepository : ISellerRepository
{
    private readonly ApplicationDbContext _context;

    public SellerRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Seller?> GetByIdWithUserAsync(long sellerId, CancellationToken cancellationToken = default)
        => await _context.Sellers
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.SellerId == sellerId, cancellationToken);

    public async Task<Seller?> GetByUserIdWithUserAsync(long userId, CancellationToken cancellationToken = default)
        => await _context.Sellers
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.UserId == userId, cancellationToken);

    public async Task<Seller?> GetByUserIdWithUserAsNoTrackingAsync(long userId, CancellationToken cancellationToken = default)
        => await _context.Sellers
            .AsNoTracking()
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.UserId == userId, cancellationToken);

    public async Task<PagedResult<Seller>> GetPagedAsync(SellerListQueryDto query, CancellationToken cancellationToken = default)
    {
        IQueryable<Seller> sellersQuery = _context.Sellers
            .AsNoTracking()
            .Include(s => s.User);

        if (query.Status.HasValue)
        {
            var status = query.Status.Value;
            sellersQuery = sellersQuery.Where(s => s.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var keyword = query.Search.Trim();
            sellersQuery = sellersQuery.Where(s =>
                s.BusinessName.Contains(keyword) ||
                (s.TaxCode != null && s.TaxCode.Contains(keyword)) ||
                s.User.Email.Contains(keyword) ||
                s.User.FullName.Contains(keyword));
        }

        sellersQuery = ApplySorting(sellersQuery, query);
        return await sellersQuery.ToPagedResultAsync(query, cancellationToken);
    }

    public async Task AddAsync(Seller seller, CancellationToken cancellationToken = default)
        => await _context.Sellers.AddAsync(seller, cancellationToken);

    public void Update(Seller seller)
        => _context.Sellers.Update(seller);

    private static IQueryable<Seller> ApplySorting(IQueryable<Seller> query, PaginationQuery pagination)
    {
        var (field, isDescending) = pagination.ParseSort();

        return (field.ToLowerInvariant(), isDescending) switch
        {
            ("businessname", true) => query.OrderByDescending(s => s.BusinessName).ThenByDescending(s => s.SellerId),
            ("businessname", false) => query.OrderBy(s => s.BusinessName).ThenBy(s => s.SellerId),
            ("status", true) => query.OrderByDescending(s => s.Status).ThenByDescending(s => s.SellerId),
            ("status", false) => query.OrderBy(s => s.Status).ThenBy(s => s.SellerId),
            ("approvedat", true) => query.OrderByDescending(s => s.ApprovedAt).ThenByDescending(s => s.SellerId),
            ("approvedat", false) => query.OrderBy(s => s.ApprovedAt).ThenBy(s => s.SellerId),
            ("commissionrate", true) => query.OrderByDescending(s => s.CommissionRate).ThenByDescending(s => s.SellerId),
            ("commissionrate", false) => query.OrderBy(s => s.CommissionRate).ThenBy(s => s.SellerId),
            ("sellerid", true) => query.OrderByDescending(s => s.SellerId),
            ("sellerid", false) => query.OrderBy(s => s.SellerId),
            (_, true) => query.OrderByDescending(s => s.CreatedAt).ThenByDescending(s => s.SellerId),
            (_, false) => query.OrderBy(s => s.CreatedAt).ThenBy(s => s.SellerId)
        };
    }
}
