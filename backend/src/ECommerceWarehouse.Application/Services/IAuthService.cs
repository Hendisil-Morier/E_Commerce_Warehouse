using ECommerceWarehouse.Application.DTOs.Identity;

namespace ECommerceWarehouse.Application.Services;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterRequestDto model, string ipAddress);
    Task<AuthResponseDto> LoginAsync(LoginRequestDto model, string ipAddress);
    Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenRequestDto model, string ipAddress, CancellationToken cancellationToken = default);
}
