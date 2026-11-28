namespace ECommerceWarehouse.Domain.Entities.Identity;

public class PasswordResetOtp
{
    public long OtpId { get; set; }
    public long UserId { get; set; }
    public string Email { get; set; } = null!;
    public string OtpHash { get; set; } = null!;
    public DateTime ExpiresAt { get; set; }
    public int AttemptCount { get; set; }
    public bool IsUsed { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}
