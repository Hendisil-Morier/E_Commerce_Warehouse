using ECommerceWarehouse.Application.DTOs.Common;
using Microsoft.EntityFrameworkCore;

namespace ECommerceWarehouse.Infrastructure.Extensions;

/// <summary>
/// Tiện ích phân trang EF Core dùng chung cho các truy vấn trả về PagedResult&lt;T&gt;.
/// </summary>
public static class QueryableExtensions
{
    public static async Task<PagedResult<T>> ToPagedResultAsync<T>(
        this IQueryable<T> query,
        PaginationQuery pagination,
        CancellationToken cancellationToken = default)
    {
        var page = pagination.NormalizedPage;
        var pageSize = pagination.NormalizedPageSize;

        var totalItems = await query.CountAsync(cancellationToken);
        var items = totalItems == 0
            ? new List<T>()
            : await query
                .Skip(pagination.Skip)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

        return PagedResult<T>.Create(items, page, pageSize, totalItems);
    }
}

