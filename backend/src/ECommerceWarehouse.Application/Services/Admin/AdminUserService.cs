using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.Contracts.Services;
using ECommerceWarehouse.Application.DTOs.Admin;
using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Domain.Constants;
using ECommerceWarehouse.Domain.Entities.Identity;
using ECommerceWarehouse.Domain.Exceptions;
using FluentValidation;

namespace ECommerceWarehouse.Application.Services;

public class AdminUserService : IAdminUserService
{
    private readonly IUserRepository _userRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUser _currentUser;
    private readonly IValidator<AdminUserQueryDto> _queryValidator;
    private readonly IValidator<UpdateUserStatusRequestDto> _statusValidator;
    private readonly IValidator<UpdateUserRolesRequestDto> _rolesValidator;

    public AdminUserService(
        IUserRepository userRepository,
        IUnitOfWork unitOfWork,
        ICurrentUser currentUser,
        IValidator<AdminUserQueryDto> queryValidator,
        IValidator<UpdateUserStatusRequestDto> statusValidator,
        IValidator<UpdateUserRolesRequestDto> rolesValidator)
    {
        _userRepository = userRepository;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _queryValidator = queryValidator;
        _statusValidator = statusValidator;
        _rolesValidator = rolesValidator;
    }

    public async Task<PagedResult<AdminUserListItemDto>> GetUsersAsync(
        AdminUserQueryDto query,
        CancellationToken cancellationToken = default)
    {
        await _queryValidator.ValidateAndThrowAsync(query, cancellationToken);

        var pagedUsers = await _userRepository.GetPagedAsync(query, cancellationToken);

        var items = pagedUsers.Items.Select(MapToListItemDto).ToList();

        return PagedResult<AdminUserListItemDto>.Create(
            items,
            pagedUsers.Page,
            pagedUsers.PageSize,
            pagedUsers.TotalItems);
    }

    public async Task<AdminUserDetailDto> GetUserByIdAsync(long userId, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdWithDetailsAsync(userId, cancellationToken)
            ?? throw new NotFoundException("User", userId);

        var addressCount = await _userRepository.GetAddressCountAsync(userId, cancellationToken);

        var detail = new AdminUserDetailDto
        {
            UserId = user.UserId,
            Username = user.Username,
            FullName = user.FullName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            AvatarUrl = user.AvatarUrl,
            IsActive = user.IsActive,
            Roles = user.UserRoles.Select(ur => ur.Role.RoleName).ToList(),
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt,
            AddressCount = addressCount,
            IsSeller = user.Seller != null,
            SellerStatus = user.Seller?.Status.ToString(),
            BusinessName = user.Seller?.BusinessName
        };

        return detail;
    }

    public async Task<AdminUserListItemDto> UpdateUserStatusAsync(
        long userId,
        UpdateUserStatusRequestDto request,
        CancellationToken cancellationToken = default)
    {
        await _statusValidator.ValidateAndThrowAsync(request, cancellationToken);

        var currentUserId = _currentUser.UserId;
        if (currentUserId.HasValue && currentUserId.Value == userId && !request.IsActive)
        {
            throw new BusinessException(
                ErrorCodes.AdminCannotLockSelf,
                "Bạn không thể tự khóa tài khoản Quản trị viên của chính mình.",
                409);
        }

        var user = await _userRepository.GetByIdWithRolesAsync(userId, cancellationToken)
            ?? throw new NotFoundException("User", userId);

        var now = DateTime.UtcNow;
        user.IsActive = request.IsActive;
        user.UpdatedAt = now;

        if (!request.IsActive)
        {
            await _userRepository.RevokeAllRefreshTokensAsync(userId, now, cancellationToken);
        }

        _userRepository.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToListItemDto(user);
    }

    public async Task<AdminUserListItemDto> UpdateUserRolesAsync(
        long userId,
        UpdateUserRolesRequestDto request,
        CancellationToken cancellationToken = default)
    {
        await _rolesValidator.ValidateAndThrowAsync(request, cancellationToken);

        var requestedRoleNames = request.Roles
            .Where(r => !string.IsNullOrWhiteSpace(r))
            .Select(r => r.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (requestedRoleNames.Count == 0)
        {
            throw new BusinessException(
                ErrorCodes.ValidationError,
                "Người dùng phải có ít nhất một vai trò.",
                400);
        }

        var allRoles = await _userRepository.GetAllRolesAsync(cancellationToken);
        var validRoleMap = allRoles.ToDictionary(r => r.RoleName, StringComparer.OrdinalIgnoreCase);

        foreach (var roleName in requestedRoleNames)
        {
            if (!validRoleMap.ContainsKey(roleName))
            {
                throw new BusinessException(
                    ErrorCodes.InvalidRole,
                    $"Vai trò '{roleName}' không tồn tại trong hệ thống.",
                    400);
            }
        }

        var currentUserId = _currentUser.UserId;
        if (currentUserId.HasValue && currentUserId.Value == userId)
        {
            var keepsAdminRole = requestedRoleNames.Any(r => string.Equals(r, RoleNames.Admin, StringComparison.OrdinalIgnoreCase));
            if (!keepsAdminRole)
            {
                throw new BusinessException(
                    ErrorCodes.AdminCannotRevokeOwnAdminRole,
                    "Bạn không thể tự tước quyền Quản trị viên (Admin) của chính mình.",
                    409);
            }
        }

        var user = await _userRepository.GetByIdWithRolesAsync(userId, cancellationToken)
            ?? throw new NotFoundException("User", userId);

        await _unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            _userRepository.RemoveUserRoles(user.UserRoles.ToList());

            foreach (var roleName in requestedRoleNames)
            {
                var roleEntity = validRoleMap[roleName];
                await _userRepository.AddUserRoleAsync(new UserRole
                {
                    UserId = user.UserId,
                    RoleId = roleEntity.RoleId,
                    AssignedAt = DateTime.UtcNow
                }, ct);
            }

            user.UpdatedAt = DateTime.UtcNow;
            _userRepository.Update(user);
            await _unitOfWork.SaveChangesAsync(ct);
        }, cancellationToken);

        var refreshedUser = await _userRepository.GetByIdWithRolesAsync(userId, cancellationToken) ?? user;
        return MapToListItemDto(refreshedUser);
    }

    public async Task<List<RoleDto>> GetRolesAsync(CancellationToken cancellationToken = default)
    {
        var roles = await _userRepository.GetAllRolesAsync(cancellationToken);
        return roles.Select(r => new RoleDto
        {
            RoleId = r.RoleId,
            RoleName = r.RoleName,
            Description = r.Description
        }).ToList();
    }

    private static AdminUserListItemDto MapToListItemDto(User user)
    {
        return new AdminUserListItemDto
        {
            UserId = user.UserId,
            Username = user.Username,
            FullName = user.FullName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            AvatarUrl = user.AvatarUrl,
            IsActive = user.IsActive,
            Roles = user.UserRoles.Select(ur => ur.Role.RoleName).ToList(),
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt
        };
    }
}
