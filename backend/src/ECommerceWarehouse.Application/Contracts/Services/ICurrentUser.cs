namespace ECommerceWarehouse.Application.Contracts.Services;

/// <summary>
/// Dịch vụ đọc thông tin người dùng hiện tại từ HTTP Context / JWT Claims.
/// </summary>
public interface ICurrentUser
{
    long? UserId { get; }
    IReadOnlyList<string> Roles { get; }
    long? SellerId { get; }
    bool IsAuthenticated { get; }

    bool IsInRole(string role);
    Task<long?> GetSellerIdAsync(CancellationToken cancellationToken = default);
}

