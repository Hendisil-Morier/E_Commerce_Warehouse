using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.Contracts.Services;
using ECommerceWarehouse.Application.DTOs.Customer;
using ECommerceWarehouse.Domain.Entities.Identity;
using ECommerceWarehouse.Domain.Exceptions;
using FluentValidation;
using Microsoft.AspNetCore.Identity;

namespace ECommerceWarehouse.Application.Services;

public class UserService : IUserService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUser _currentUser;
    private readonly IPasswordHasher<User> _passwordHasher;
    private readonly IValidator<UpdateProfileRequestDto> _updateProfileValidator;
    private readonly IValidator<ChangePasswordRequestDto> _changePasswordValidator;

    public UserService(
        IUnitOfWork unitOfWork,
        ICurrentUser currentUser,
        IValidator<UpdateProfileRequestDto> updateProfileValidator,
        IValidator<ChangePasswordRequestDto> changePasswordValidator)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _updateProfileValidator = updateProfileValidator;
        _changePasswordValidator = changePasswordValidator;
        _passwordHasher = new PasswordHasher<User>();
    }

    public async Task<UserProfileDto> GetCurrentUserProfileAsync(CancellationToken cancellationToken = default)
    {
        var userId = RequireAuthenticatedUserId();
        var user = await _unitOfWork.Repository<User>().GetByIdAsync(userId)
            ?? throw new NotFoundException("User", userId);

        var roles = await GetUserRolesAsync(userId);

        return new UserProfileDto
        {
            UserId = user.UserId,
            Username = user.Username,
            FullName = user.FullName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            AvatarUrl = user.AvatarUrl,
            Roles = roles,
            CreatedAt = user.CreatedAt
        };
    }

    public async Task<UserProfileDto> UpdateCurrentUserProfileAsync(
        UpdateProfileRequestDto request,
        CancellationToken cancellationToken = default)
    {
        await _updateProfileValidator.ValidateAndThrowAsync(request, cancellationToken);
        var userId = RequireAuthenticatedUserId();

        var user = await _unitOfWork.Repository<User>().GetByIdAsync(userId)
            ?? throw new NotFoundException("User", userId);

        user.FullName = request.FullName.Trim();
        user.PhoneNumber = !string.IsNullOrWhiteSpace(request.PhoneNumber)
            ? request.PhoneNumber.Trim().Replace(" ", "").Replace("-", "").Replace(".", "")
            : null;

        if (request.AvatarUrl != null)
        {
            user.AvatarUrl = string.IsNullOrWhiteSpace(request.AvatarUrl) ? null : request.AvatarUrl.Trim();
        }

        user.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Repository<User>().Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var roles = await GetUserRolesAsync(userId);

        return new UserProfileDto
        {
            UserId = user.UserId,
            Username = user.Username,
            FullName = user.FullName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            AvatarUrl = user.AvatarUrl,
            Roles = roles,
            CreatedAt = user.CreatedAt
        };
    }

    public async Task ChangePasswordAsync(
        ChangePasswordRequestDto request,
        CancellationToken cancellationToken = default)
    {
        await _changePasswordValidator.ValidateAndThrowAsync(request, cancellationToken);
        var userId = RequireAuthenticatedUserId();

        var user = await _unitOfWork.Repository<User>().GetByIdAsync(userId)
            ?? throw new NotFoundException("User", userId);

        var verifyResult = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.CurrentPassword);
        if (verifyResult == PasswordVerificationResult.Failed)
        {
            throw new BusinessException(ErrorCodes.InvalidCredentials, "Mật khẩu hiện tại không chính xác.", 400);
        }

        user.PasswordHash = _passwordHasher.HashPassword(user, request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Repository<User>().Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task<List<string>> GetUserRolesAsync(long userId)
    {
        var userRoles = await _unitOfWork.Repository<UserRole>().FindAsync(ur => ur.UserId == userId);
        var allRoles = await _unitOfWork.Repository<Role>().GetAllAsync();

        var roleNames = (from ur in userRoles
                         join r in allRoles on ur.RoleId equals r.RoleId
                         select r.RoleName)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (!roleNames.Any())
        {
            roleNames.Add("Customer");
        }

        return roleNames;
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
