namespace ECommerceWarehouse.Domain.Entities.Identity;

public class EmailVerificationOtp
{
    public long OtpId { get; set; }
    public string Email { get; set; } = null!;
    public string OtpHash { get; set; } = null!;
    public DateTime ExpiresAt { get; set; }
    public int AttemptCount { get; set; }
    public bool IsUsed { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
