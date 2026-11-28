namespace ECommerceWarehouse.Application.DTOs.Identity;

public class SendRegisterOtpRequestDto
{
    public string Email { get; set; } = null!;
}

public class ForgotPasswordRequestDto
{
    public string Email { get; set; } = null!;
}

public class VerifyOtpRequestDto
{
    public string Email { get; set; } = null!;
    public string Otp { get; set; } = null!;
}

public class ResetPasswordRequestDto
{
    public string Email { get; set; } = null!;
    public string Otp { get; set; } = null!;
    public string NewPassword { get; set; } = null!;
}

public class ChangePasswordRequestDto
{
    public string CurrentPassword { get; set; } = null!;
    public string NewPassword { get; set; } = null!;
}
