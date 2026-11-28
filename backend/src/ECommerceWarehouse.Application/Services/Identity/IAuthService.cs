using ECommerceWarehouse.Application.DTOs.Identity;

namespace ECommerceWarehouse.Application.Services;

public interface IAuthService
{
    Task SendRegisterOtpAsync(SendRegisterOtpRequestDto model, CancellationToken cancellationToken = default);
    Task<AuthResponseDto> RegisterAsync(RegisterRequestDto model, string ipAddress);
    Task<AuthResponseDto> LoginAsync(LoginRequestDto model, string ipAddress);
    Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenRequestDto model, string ipAddress, CancellationToken cancellationToken = default);
    Task LogoutAsync(LogoutRequestDto model, CancellationToken cancellationToken = default);
    Task ForgotPasswordAsync(ForgotPasswordRequestDto model, CancellationToken cancellationToken = default);
    Task VerifyOtpAsync(VerifyOtpRequestDto model, CancellationToken cancellationToken = default);
    Task ResetPasswordAsync(ResetPasswordRequestDto model, CancellationToken cancellationToken = default);
    Task<AuthResponseDto> ChangePasswordAsync(long userId, ChangePasswordRequestDto model, string ipAddress, CancellationToken cancellationToken = default);
    Task<AuthResponseDto> GoogleLoginAsync(GoogleLoginRequestDto model, string ipAddress, CancellationToken cancellationToken = default);
}
