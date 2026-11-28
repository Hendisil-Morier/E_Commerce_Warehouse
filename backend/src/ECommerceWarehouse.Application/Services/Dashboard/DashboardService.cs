using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.Contracts.Services;
using ECommerceWarehouse.Application.DTOs.Dashboard;
using ECommerceWarehouse.Domain.Exceptions;

namespace ECommerceWarehouse.Application.Services;

public class DashboardService : IDashboardService
{
    private readonly IDashboardRepository _dashboardRepository;
    private readonly ICurrentUser _currentUser;

    public DashboardService(IDashboardRepository dashboardRepository, ICurrentUser currentUser)
    {
        _dashboardRepository = dashboardRepository;
        _currentUser = currentUser;
    }

    public Task<AdminDashboardDto> GetAdminDashboardAsync(CancellationToken cancellationToken = default)
        => _dashboardRepository.GetAdminDashboardAsync(cancellationToken);

    public async Task<SellerDashboardDto> GetSellerDashboardAsync(
        int lowStockThreshold = 10,
        CancellationToken cancellationToken = default)
    {
        var sellerId = await _currentUser.GetSellerIdAsync(cancellationToken)
            ?? throw new BusinessException(ErrorCodes.SellerNotApproved, "Tài khoản chưa có hồ sơ Seller hợp lệ.", 403);

        var normalizedThreshold = Math.Max(0, lowStockThreshold);
        return await _dashboardRepository.GetSellerDashboardAsync(sellerId, normalizedThreshold, cancellationToken);
    }

    public Task<WarehouseDashboardDto> GetWarehouseDashboardAsync(
        int lowStockThreshold = 10,
        CancellationToken cancellationToken = default)
        => _dashboardRepository.GetWarehouseDashboardAsync(Math.Max(0, lowStockThreshold), cancellationToken);
}
