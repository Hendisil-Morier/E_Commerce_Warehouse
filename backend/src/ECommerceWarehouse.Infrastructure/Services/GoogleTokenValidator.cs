using ECommerceWarehouse.Application.Contracts.Services;
using ECommerceWarehouse.Domain.Exceptions;
using Google.Apis.Auth;
using Microsoft.Extensions.Configuration;

namespace ECommerceWarehouse.Infrastructure.Services;

public class GoogleTokenValidator : IGoogleTokenValidator
{
    private readonly IConfiguration _configuration;

    public GoogleTokenValidator(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task<GoogleTokenPayload> ValidateAsync(string idToken, CancellationToken cancellationToken = default)
    {
        var clientId = _configuration["GoogleAuth:ClientId"]?.Trim();
        if (string.IsNullOrWhiteSpace(clientId))
        {
            throw new BusinessException(
                ErrorCodes.GoogleTokenInvalid,
                "Đăng nhập Google chưa được cấu hình trên máy chủ.",
                401);
        }

        try
        {
            var settings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = [clientId]
            };

            var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, settings);
            if (!payload.EmailVerified || string.IsNullOrWhiteSpace(payload.Email) || string.IsNullOrWhiteSpace(payload.Subject))
            {
                throw new BusinessException(
                    ErrorCodes.GoogleTokenInvalid,
                    "Tài khoản Google chưa xác minh email hoặc thiếu thông tin định danh.",
                    401);
            }

            return new GoogleTokenPayload(
                payload.Subject,
                payload.Email,
                payload.EmailVerified,
                payload.Name,
                payload.Picture);
        }
        catch (BusinessException)
        {
            throw;
        }
        catch (Exception)
        {
            throw new BusinessException(
                ErrorCodes.GoogleTokenInvalid,
                "Xác thực Google thất bại, vui lòng thử lại.",
                401);
        }
    }
}
