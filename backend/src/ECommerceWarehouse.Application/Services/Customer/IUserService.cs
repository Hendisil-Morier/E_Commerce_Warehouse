using ECommerceWarehouse.Application.DTOs.Customer;

namespace ECommerceWarehouse.Application.Services;

public interface IUserService
{
    Task<UserProfileDto> GetCurrentUserProfileAsync(CancellationToken cancellationToken = default);
    Task<UserProfileDto> UpdateCurrentUserProfileAsync(UpdateProfileRequestDto request, CancellationToken cancellationToken = default);
    Task ChangePasswordAsync(ChangePasswordRequestDto request, CancellationToken cancellationToken = default);
}
