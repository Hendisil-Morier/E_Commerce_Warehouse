using System.Security.Claims;
using ECommerceWarehouse.Application.Contracts.Services;
using ECommerceWarehouse.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ECommerceWarehouse.WebAPI.Services;

/// <summary>
/// Dịch vụ lấy thông tin người dùng đang đăng nhập từ HttpContext Claims và tra cứu SellerId tương ứng.
/// </summary>
public class CurrentUserService : ICurrentUser
{
    public const string SellerIdHttpContextItemKey = "CurrentSellerId";

    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ApplicationDbContext _dbContext;
    private bool _sellerLookupDone;
    private long? _cachedSellerId;

    public CurrentUserService(
        IHttpContextAccessor httpContextAccessor,
        ApplicationDbContext dbContext)
    {
        _httpContextAccessor = httpContextAccessor;
        _dbContext = dbContext;
    }

    public bool IsAuthenticated =>
        _httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated == true;

    public long? UserId
    {
        get
        {
            var rawId = _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier)
                        ?? _httpContextAccessor.HttpContext?.User?.FindFirstValue("sub");

            return long.TryParse(rawId, out var userId) ? userId : null;
        }
    }

    public IReadOnlyList<string> Roles
    {
        get
        {
            var user = _httpContextAccessor.HttpContext?.User;
            if (user == null)
            {
                return Array.Empty<string>();
            }

            return user.FindAll(ClaimTypes.Role)
                .Select(c => c.Value)
                .Concat(user.FindAll("role").Select(c => c.Value))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
        }
    }

    public long? SellerId
    {
        get
        {
            if (_sellerLookupDone)
            {
                return _cachedSellerId;
            }

            var context = _httpContextAccessor.HttpContext;
            if (context?.Items.TryGetValue(SellerIdHttpContextItemKey, out var itemValue) == true)
            {
                _cachedSellerId = itemValue as long?;
                _sellerLookupDone = true;
                return _cachedSellerId;
            }

            var claimValue = context?.User?.FindFirstValue("seller_id");
            if (long.TryParse(claimValue, out var sellerIdFromClaim))
            {
                _cachedSellerId = sellerIdFromClaim;
                _sellerLookupDone = true;
                return _cachedSellerId;
            }

            return null;
        }
    }

    public bool IsInRole(string role) =>
        Roles.Any(r => string.Equals(r, role, StringComparison.OrdinalIgnoreCase));

    public async Task<long?> GetSellerIdAsync(CancellationToken cancellationToken = default)
    {
        if (SellerId.HasValue || _sellerLookupDone)
        {
            return _cachedSellerId;
        }

        if (!IsAuthenticated || !UserId.HasValue)
        {
            _sellerLookupDone = true;
            return null;
        }

        _cachedSellerId = await _dbContext.Sellers
            .AsNoTracking()
            .Where(s => s.UserId == UserId.Value)
            .Select(s => (long?)s.SellerId)
            .FirstOrDefaultAsync(cancellationToken);

        _sellerLookupDone = true;
        return _cachedSellerId;
    }
}

