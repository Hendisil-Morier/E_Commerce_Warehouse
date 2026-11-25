using ECommerceWarehouse.Application.DTOs.Dashboard;

namespace ECommerceWarehouse.Application.Contracts.Persistence;

public interface IDashboardRepository
{
    Task<AdminDashboardDto> GetAdminDashboardAsync(CancellationToken cancellationToken = default);
    Task<SellerDashboardDto> GetSellerDashboardAsync(long sellerId, int lowStockThreshold, CancellationToken cancellationToken = default);
    Task<WarehouseDashboardDto> GetWarehouseDashboardAsync(int lowStockThreshold, CancellationToken cancellationToken = default);
}
