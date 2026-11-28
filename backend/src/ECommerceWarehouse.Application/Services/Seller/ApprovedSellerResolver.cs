using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.Contracts.Services;
using ECommerceWarehouse.Domain.Enums;
using ECommerceWarehouse.Domain.Exceptions;
using DomainSeller = ECommerceWarehouse.Domain.Entities.Seller.Seller;

namespace ECommerceWarehouse.Application.Services;

public class ApprovedSellerResolver : IApprovedSellerResolver
{
    private readonly ISellerRepository _sellerRepository;
    private readonly ICurrentUser _currentUser;

    public ApprovedSellerResolver(
        ISellerRepository sellerRepository,
        ICurrentUser currentUser)
    {
        _sellerRepository = sellerRepository;
        _currentUser = currentUser;
    }

    public async Task<DomainSeller> RequireApprovedSellerAsync(CancellationToken cancellationToken = default)
    {
        if (!_currentUser.IsAuthenticated || !_currentUser.UserId.HasValue)
        {
            throw BusinessException.Unauthorized();
        }

        var seller = await _sellerRepository.GetByUserIdWithUserAsNoTrackingAsync(
            _currentUser.UserId.Value,
            cancellationToken);

        if (seller == null || seller.Status != SellerStatus.Approved)
        {
            throw BusinessException.SellerNotApproved(
                seller == null
                    ? "Tài khoản này chưa có hồ sơ người bán được duyệt."
                    : $"Hồ sơ người bán hiện đang ở trạng thái '{seller.Status}', chỉ người bán đã được duyệt (Approved) mới có thể thực hiện thao tác này.");
        }

        return seller;
    }
}

