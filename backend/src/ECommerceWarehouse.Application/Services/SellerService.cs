using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.Contracts.Services;
using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Seller;
using ECommerceWarehouse.Application.Mappings;
using ECommerceWarehouse.Domain.Constants;
using ECommerceWarehouse.Domain.Entities.Identity;
using ECommerceWarehouse.Domain.Enums;
using ECommerceWarehouse.Domain.Exceptions;
using FluentValidation;
using DomainSeller = ECommerceWarehouse.Domain.Entities.Seller.Seller;

namespace ECommerceWarehouse.Application.Services;

public class SellerService : ISellerService
{
    private readonly ISellerRepository _sellerRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUser _currentUser;
    private readonly IValidator<RegisterSellerRequestDto> _registerValidator;
    private readonly IValidator<RejectSellerRequestDto> _rejectValidator;
    private readonly IValidator<SuspendSellerRequestDto> _suspendValidator;
    private readonly IValidator<SellerListQueryDto> _listQueryValidator;

    public SellerService(
        ISellerRepository sellerRepository,
        IUnitOfWork unitOfWork,
        ICurrentUser currentUser,
        IValidator<RegisterSellerRequestDto> registerValidator,
        IValidator<RejectSellerRequestDto> rejectValidator,
        IValidator<SuspendSellerRequestDto> suspendValidator,
        IValidator<SellerListQueryDto> listQueryValidator)
    {
        _sellerRepository = sellerRepository;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _registerValidator = registerValidator;
        _rejectValidator = rejectValidator;
        _suspendValidator = suspendValidator;
        _listQueryValidator = listQueryValidator;
    }

    public async Task<SellerSubmissionResult> RegisterOrResubmitAsync(
        RegisterSellerRequestDto request,
        CancellationToken cancellationToken = default)
    {
        await _registerValidator.ValidateAndThrowAsync(request, cancellationToken);

        var userId = RequireAuthenticatedUserId();
        var existingSeller = await _sellerRepository.GetByUserIdWithUserAsync(userId, cancellationToken);

        if (existingSeller != null)
        {
            if (existingSeller.Status != SellerStatus.Rejected)
            {
                throw BusinessException.SellerAlreadyExists(GetAlreadyExistsMessage(existingSeller.Status));
            }

            existingSeller.BusinessName = request.BusinessName.Trim();
            existingSeller.TaxCode = NormalizeOptionalText(request.TaxCode);
            existingSeller.Description = NormalizeOptionalText(request.Description);
            existingSeller.Status = SellerStatus.Pending;
            existingSeller.ApprovedAt = null;
            existingSeller.RejectReason = null;
            existingSeller.UpdatedAt = DateTime.UtcNow;

            _sellerRepository.Update(existingSeller);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return new SellerSubmissionResult(existingSeller.ToDto(), IsCreated: false);
        }

        var user = await _unitOfWork.Repository<User>().GetByIdAsync(userId)
            ?? throw new NotFoundException("User", userId);

        var seller = new DomainSeller
        {
            UserId = userId,
            BusinessName = request.BusinessName.Trim(),
            TaxCode = NormalizeOptionalText(request.TaxCode),
            Description = NormalizeOptionalText(request.Description),
            CommissionRate = 5.00m,
            Status = SellerStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        await _sellerRepository.AddAsync(seller, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new SellerSubmissionResult(seller.ToDto(user), IsCreated: true);
    }

    public async Task<SellerDto> GetMySellerAsync(CancellationToken cancellationToken = default)
    {
        var userId = RequireAuthenticatedUserId();
        var seller = await _sellerRepository.GetByUserIdWithUserAsNoTrackingAsync(userId, cancellationToken)
            ?? throw new NotFoundException("Hồ sơ người bán không tồn tại.");

        return seller.ToDto();
    }

    public async Task<PagedResult<SellerDto>> GetAdminSellersAsync(
        SellerListQueryDto query,
        CancellationToken cancellationToken = default)
    {
        await _listQueryValidator.ValidateAndThrowAsync(query, cancellationToken);

        var pagedSellers = await _sellerRepository.GetPagedAsync(query, cancellationToken);
        var mappedItems = pagedSellers.Items.Select(s => s.ToDto()).ToList();

        return PagedResult<SellerDto>.Create(
            mappedItems,
            pagedSellers.Page,
            pagedSellers.PageSize,
            pagedSellers.TotalItems);
    }

    public async Task<SellerDto> ApproveAsync(long sellerId, CancellationToken cancellationToken = default)
    {
        var seller = await GetSellerForTransitionAsync(sellerId, SellerStatus.Pending, "duyệt", cancellationToken);

        var sellerRoles = await _unitOfWork.Repository<Role>().FindAsync(r => r.RoleName == RoleNames.Seller);
        var sellerRole = sellerRoles.FirstOrDefault()
            ?? throw new InvalidOperationException("Vai trò Seller chưa được khởi tạo trong hệ thống.");

        var utcNow = DateTime.UtcNow;

        await _unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            var existingUserRoles = await _unitOfWork.Repository<UserRole>()
                .FindAsync(ur => ur.UserId == seller.UserId && ur.RoleId == sellerRole.RoleId);

            if (!existingUserRoles.Any())
            {
                await _unitOfWork.Repository<UserRole>().AddAsync(new UserRole
                {
                    UserId = seller.UserId,
                    RoleId = sellerRole.RoleId,
                    AssignedAt = utcNow
                });
            }

            seller.Status = SellerStatus.Approved;
            seller.ApprovedAt = utcNow;
            seller.RejectReason = null;
            seller.UpdatedAt = utcNow;

            _sellerRepository.Update(seller);
            await _unitOfWork.SaveChangesAsync(ct);
        }, cancellationToken);

        return seller.ToDto();
    }

    public async Task<SellerDto> RejectAsync(
        long sellerId,
        RejectSellerRequestDto request,
        CancellationToken cancellationToken = default)
    {
        await _rejectValidator.ValidateAndThrowAsync(request, cancellationToken);

        var seller = await GetSellerForTransitionAsync(sellerId, SellerStatus.Pending, "từ chối", cancellationToken);

        seller.Status = SellerStatus.Rejected;
        seller.RejectReason = request.Reason.Trim();
        seller.ApprovedAt = null;
        seller.UpdatedAt = DateTime.UtcNow;

        _sellerRepository.Update(seller);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return seller.ToDto();
    }

    public async Task<SellerDto> SuspendAsync(
        long sellerId,
        SuspendSellerRequestDto? request,
        CancellationToken cancellationToken = default)
    {
        var normalizedRequest = request ?? new SuspendSellerRequestDto();
        await _suspendValidator.ValidateAndThrowAsync(normalizedRequest, cancellationToken);

        var seller = await GetSellerForTransitionAsync(sellerId, SellerStatus.Approved, "đình chỉ", cancellationToken);

        seller.Status = SellerStatus.Suspended;
        seller.RejectReason = NormalizeOptionalText(normalizedRequest.Reason);
        seller.UpdatedAt = DateTime.UtcNow;

        _sellerRepository.Update(seller);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return seller.ToDto();
    }

    private long RequireAuthenticatedUserId()
    {
        if (!_currentUser.IsAuthenticated || !_currentUser.UserId.HasValue)
        {
            throw BusinessException.Unauthorized();
        }

        return _currentUser.UserId.Value;
    }

    private async Task<DomainSeller> GetSellerForTransitionAsync(
        long sellerId,
        SellerStatus expectedStatus,
        string actionLabel,
        CancellationToken cancellationToken)
    {
        var seller = await _sellerRepository.GetByIdWithUserAsync(sellerId, cancellationToken)
            ?? throw new NotFoundException("Seller", sellerId);

        if (seller.Status != expectedStatus)
        {
            throw BusinessException.InvalidStatusTransition(
                $"Không thể {actionLabel} hồ sơ người bán đang ở trạng thái '{seller.Status}'.");
        }

        return seller;
    }

    private static string GetAlreadyExistsMessage(SellerStatus currentStatus) => currentStatus switch
    {
        SellerStatus.Pending => "Hồ sơ người bán của bạn đang chờ xét duyệt.",
        SellerStatus.Approved => "Tài khoản này đã là người bán được duyệt.",
        SellerStatus.Suspended => "Tài khoản người bán của bạn đang bị tạm đình chỉ, không thể đăng ký mới.",
        _ => "Tài khoản này đã có hồ sơ người bán."
    };

    private static string? NormalizeOptionalText(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}

