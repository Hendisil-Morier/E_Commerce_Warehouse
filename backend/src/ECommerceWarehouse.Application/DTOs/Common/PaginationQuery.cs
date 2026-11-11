namespace ECommerceWarehouse.Application.DTOs.Common;

/// <summary>
/// Tham số truy vấn phân trang và sắp xếp dùng chung (mặc định sort=-createdAt, pageSize tối đa 100).
/// </summary>
public class PaginationQuery
{
    public const int DefaultPage = 1;
    public const int DefaultPageSize = 20;
    public const int MaxPageSize = 100;
    public const string DefaultSort = "-createdAt";

    public int Page { get; set; } = DefaultPage;
    public int PageSize { get; set; } = DefaultPageSize;
    public string? Sort { get; set; } = DefaultSort;

    public int NormalizedPage => Math.Max(DefaultPage, Page);
    public int NormalizedPageSize => Math.Clamp(PageSize, 1, MaxPageSize);
    public int Skip => (NormalizedPage - 1) * NormalizedPageSize;

    /// <summary>
    /// Phân tích chuỗi sort (ví dụ "-createdAt" -> field: "createdAt", isDescending: true).
    /// </summary>
    public (string Field, bool IsDescending) ParseSort()
    {
        var raw = string.IsNullOrWhiteSpace(Sort) ? DefaultSort : Sort.Trim();
        if (raw.StartsWith('-'))
        {
            var field = raw[1..].Trim();
            return (string.IsNullOrEmpty(field) ? "createdAt" : field, true);
        }

        if (raw.StartsWith('+'))
        {
            var field = raw[1..].Trim();
            return (string.IsNullOrEmpty(field) ? "createdAt" : field, false);
        }

        return (raw, false);
    }
}

