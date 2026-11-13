using DomainSeller = ECommerceWarehouse.Domain.Entities.Seller.Seller;

namespace ECommerceWarehouse.Application.Contracts.Services;

/// <summary>
/// Kiểm tra và trả về hồ sơ người bán đã được duyệt (Status = Approved) cho tài khoản hiện tại.
/// </summary>
public interface IApprovedSellerResolver
{
    Task<DomainSeller> RequireApprovedSellerAsync(CancellationToken cancellationToken = default);
}

