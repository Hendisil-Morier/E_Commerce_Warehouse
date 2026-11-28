namespace ECommerceWarehouse.Application.Contracts.Services;

public sealed record GoogleTokenPayload(
    string Subject,
    string Email,
    bool EmailVerified,
    string? FullName,
    string? AvatarUrl);

public interface IGoogleTokenValidator
{
    Task<GoogleTokenPayload> ValidateAsync(string idToken, CancellationToken cancellationToken = default);
}
