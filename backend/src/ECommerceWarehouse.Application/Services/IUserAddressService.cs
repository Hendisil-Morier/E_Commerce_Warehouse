using ECommerceWarehouse.Application.DTOs.Customer;

namespace ECommerceWarehouse.Application.Services;

public interface IUserAddressService
{
    Task<IReadOnlyList<UserAddressDto>> GetMyAddressesAsync(CancellationToken cancellationToken = default);
    Task<UserAddressDto> GetAddressByIdAsync(long addressId, CancellationToken cancellationToken = default);
    Task<UserAddressDto> CreateAddressAsync(CreateAddressRequestDto request, CancellationToken cancellationToken = default);
    Task<UserAddressDto> UpdateAddressAsync(long addressId, UpdateAddressRequestDto request, CancellationToken cancellationToken = default);
    Task DeleteAddressAsync(long addressId, CancellationToken cancellationToken = default);
    Task<UserAddressDto> SetDefaultAddressAsync(long addressId, CancellationToken cancellationToken = default);
}
