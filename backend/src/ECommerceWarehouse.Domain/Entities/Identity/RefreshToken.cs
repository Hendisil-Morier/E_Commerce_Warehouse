namespace ECommerceWarehouse.Domain.Entities.Identity;

public class RefreshToken
{
    public long RefreshTokenId { get; set; }
    public long UserId { get; set; }
    public string TokenHash { get; set; } = null!;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedByIp { get; set; }
    public DateTime? RevokedAt { get; set; }
    public string? ReplacedByHash { get; set; }

    public User User { get; set; } = null!;
}
