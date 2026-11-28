using ECommerceWarehouse.Application.DTOs.Dashboard;

namespace ECommerceWarehouse.Application.Services;

public interface IDashboardService
{
    Task<AdminDashboardDto> GetAdminDashboardAsync(CancellationToken cancellationToken = default);
    Task<SellerDashboardDto> GetSellerDashboardAsync(int lowStockThreshold = 10, CancellationToken cancellationToken = default);
    Task<WarehouseDashboardDto> GetWarehouseDashboardAsync(int lowStockThreshold = 10, CancellationToken cancellationToken = default);
}
