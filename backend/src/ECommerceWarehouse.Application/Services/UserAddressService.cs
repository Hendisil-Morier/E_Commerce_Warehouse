using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.Contracts.Services;
using ECommerceWarehouse.Application.DTOs.Customer;
using ECommerceWarehouse.Domain.Entities.Customer;
using ECommerceWarehouse.Domain.Exceptions;
using FluentValidation;

namespace ECommerceWarehouse.Application.Services;

public class UserAddressService : IUserAddressService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUser _currentUser;
    private readonly IValidator<CreateAddressRequestDto> _createValidator;
    private readonly IValidator<UpdateAddressRequestDto> _updateValidator;

    public UserAddressService(
        IUnitOfWork unitOfWork,
        ICurrentUser currentUser,
        IValidator<CreateAddressRequestDto> createValidator,
        IValidator<UpdateAddressRequestDto> updateValidator)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
    }

    public async Task<IReadOnlyList<UserAddressDto>> GetMyAddressesAsync(CancellationToken cancellationToken = default)
    {
        var userId = RequireAuthenticatedUserId();
        var addresses = await _unitOfWork.Repository<UserAddress>()
            .FindAsync(a => a.UserId == userId);

        return addresses
            .OrderByDescending(a => a.IsDefault)
            .ThenByDescending(a => a.CreatedAt)
            .Select(MapToDto)
            .ToList();
    }

    public async Task<UserAddressDto> GetAddressByIdAsync(long addressId, CancellationToken cancellationToken = default)
    {
        var userId = RequireAuthenticatedUserId();
        var address = await GetUserAddressAsync(addressId, userId);
        return MapToDto(address);
    }

    public async Task<UserAddressDto> CreateAddressAsync(
        CreateAddressRequestDto request,
        CancellationToken cancellationToken = default)
    {
        await _createValidator.ValidateAndThrowAsync(request, cancellationToken);
        var userId = RequireAuthenticatedUserId();

        var existingAddresses = (await _unitOfWork.Repository<UserAddress>()
            .FindAsync(a => a.UserId == userId)).ToList();

        // Nếu là địa chỉ đầu tiên của user, bắt buộc là địa chỉ mặc định
        var shouldBeDefault = existingAddresses.Count == 0 || request.IsDefault;

        var cleanPhone = request.PhoneNumber.Trim().Replace(" ", "").Replace("-", "").Replace(".", "");
        var now = DateTime.UtcNow;

        var newAddress = new UserAddress
        {
            UserId = userId,
            RecipientName = request.RecipientName.Trim(),
            PhoneNumber = cleanPhone,
            Province = request.Province.Trim(),
            District = request.District.Trim(),
            Ward = request.Ward.Trim(),
            StreetAddress = request.StreetAddress.Trim(),
            IsDefault = shouldBeDefault,
            CreatedAt = now,
            UpdatedAt = now
        };

        if (shouldBeDefault && existingAddresses.Count > 0)
        {
            await _unitOfWork.ExecuteInTransactionAsync(async ct =>
            {
                foreach (var oldAddr in existingAddresses.Where(a => a.IsDefault))
                {
                    oldAddr.IsDefault = false;
                    oldAddr.UpdatedAt = now;
                    _unitOfWork.Repository<UserAddress>().Update(oldAddr);
                }

                await _unitOfWork.Repository<UserAddress>().AddAsync(newAddress);
                await _unitOfWork.SaveChangesAsync(ct);
            }, cancellationToken);
        }
        else
        {
            await _unitOfWork.Repository<UserAddress>().AddAsync(newAddress);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        return MapToDto(newAddress);
    }

    public async Task<UserAddressDto> UpdateAddressAsync(
        long addressId,
        UpdateAddressRequestDto request,
        CancellationToken cancellationToken = default)
    {
        await _updateValidator.ValidateAndThrowAsync(request, cancellationToken);
        var userId = RequireAuthenticatedUserId();

        var address = await GetUserAddressAsync(addressId, userId);
        var existingAddresses = (await _unitOfWork.Repository<UserAddress>()
            .FindAsync(a => a.UserId == userId)).ToList();

        var cleanPhone = request.PhoneNumber.Trim().Replace(" ", "").Replace("-", "").Replace(".", "");
        var now = DateTime.UtcNow;

        // Nếu người dùng muốn bật mặc định cho địa chỉ này
        if (request.IsDefault && !address.IsDefault)
        {
            await _unitOfWork.ExecuteInTransactionAsync(async ct =>
            {
                foreach (var oldAddr in existingAddresses.Where(a => a.IsDefault && a.AddressId != addressId))
                {
                    oldAddr.IsDefault = false;
                    oldAddr.UpdatedAt = now;
                    _unitOfWork.Repository<UserAddress>().Update(oldAddr);
                }

                address.RecipientName = request.RecipientName.Trim();
                address.PhoneNumber = cleanPhone;
                address.Province = request.Province.Trim();
                address.District = request.District.Trim();
                address.Ward = request.Ward.Trim();
                address.StreetAddress = request.StreetAddress.Trim();
                address.IsDefault = true;
                address.UpdatedAt = now;

                _unitOfWork.Repository<UserAddress>().Update(address);
                await _unitOfWork.SaveChangesAsync(ct);
            }, cancellationToken);
        }
        else
        {
            // Nếu bỏ mặc định nhưng đây là địa chỉ duy nhất, giữ nguyên mặc định
            var isDefault = request.IsDefault;
            if (!isDefault && address.IsDefault && existingAddresses.Count == 1)
            {
                isDefault = true;
            }

            address.RecipientName = request.RecipientName.Trim();
            address.PhoneNumber = cleanPhone;
            address.Province = request.Province.Trim();
            address.District = request.District.Trim();
            address.Ward = request.Ward.Trim();
            address.StreetAddress = request.StreetAddress.Trim();
            address.IsDefault = isDefault;
            address.UpdatedAt = now;

            _unitOfWork.Repository<UserAddress>().Update(address);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        return MapToDto(address);
    }

    public async Task DeleteAddressAsync(long addressId, CancellationToken cancellationToken = default)
    {
        var userId = RequireAuthenticatedUserId();
        var address = await GetUserAddressAsync(addressId, userId);

        var existingAddresses = (await _unitOfWork.Repository<UserAddress>()
            .FindAsync(a => a.UserId == userId)).ToList();

        if (address.IsDefault && existingAddresses.Count > 1)
        {
            var nextDefault = existingAddresses.FirstOrDefault(a => a.AddressId != addressId);
            if (nextDefault != null)
            {
                await _unitOfWork.ExecuteInTransactionAsync(async ct =>
                {
                    nextDefault.IsDefault = true;
                    nextDefault.UpdatedAt = DateTime.UtcNow;
                    _unitOfWork.Repository<UserAddress>().Update(nextDefault);

                    _unitOfWork.Repository<UserAddress>().Remove(address);
                    await _unitOfWork.SaveChangesAsync(ct);
                }, cancellationToken);
                return;
            }
        }

        _unitOfWork.Repository<UserAddress>().Remove(address);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<UserAddressDto> SetDefaultAddressAsync(long addressId, CancellationToken cancellationToken = default)
    {
        var userId = RequireAuthenticatedUserId();
        var address = await GetUserAddressAsync(addressId, userId);

        if (address.IsDefault)
        {
            return MapToDto(address);
        }

        var existingAddresses = (await _unitOfWork.Repository<UserAddress>()
            .FindAsync(a => a.UserId == userId)).ToList();

        var now = DateTime.UtcNow;

        await _unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            foreach (var oldAddr in existingAddresses.Where(a => a.IsDefault && a.AddressId != addressId))
            {
                oldAddr.IsDefault = false;
                oldAddr.UpdatedAt = now;
                _unitOfWork.Repository<UserAddress>().Update(oldAddr);
            }

            address.IsDefault = true;
            address.UpdatedAt = now;
            _unitOfWork.Repository<UserAddress>().Update(address);

            await _unitOfWork.SaveChangesAsync(ct);
        }, cancellationToken);

        return MapToDto(address);
    }

    private async Task<UserAddress> GetUserAddressAsync(long addressId, long userId)
    {
        var addresses = await _unitOfWork.Repository<UserAddress>()
            .FindAsync(a => a.AddressId == addressId && a.UserId == userId);

        return addresses.FirstOrDefault()
            ?? throw new NotFoundException("UserAddress", addressId);
    }

    private static UserAddressDto MapToDto(UserAddress address)
    {
        return new UserAddressDto
        {
            AddressId = address.AddressId,
            UserId = address.UserId,
            RecipientName = address.RecipientName,
            PhoneNumber = address.PhoneNumber,
            Province = address.Province,
            District = address.District,
            Ward = address.Ward,
            StreetAddress = address.StreetAddress,
            FullAddress = $"{address.StreetAddress}, {address.Ward}, {address.District}, {address.Province}",
            IsDefault = address.IsDefault,
            CreatedAt = address.CreatedAt,
            UpdatedAt = address.UpdatedAt
        };
    }

    private long RequireAuthenticatedUserId()
    {
        if (!_currentUser.IsAuthenticated || !_currentUser.UserId.HasValue)
        {
            throw BusinessException.Unauthorized();
        }

        return _currentUser.UserId.Value;
    }
}
