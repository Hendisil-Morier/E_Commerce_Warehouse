using ECommerceWarehouse.Application.Services;

namespace ECommerceWarehouse.WebAPI.BackgroundServices;

/// <summary>
/// Job nền chạy định kỳ mỗi 45 giây để tự động hủy các đơn PendingPayment quá hạn và nhả tồn giữ chỗ.
/// </summary>
public class OrderExpirationBackgroundService : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromSeconds(45);
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<OrderExpirationBackgroundService> _logger;

    public OrderExpirationBackgroundService(
        IServiceScopeFactory scopeFactory,
        ILogger<OrderExpirationBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(Interval, stoppingToken);

                using var scope = _scopeFactory.CreateScope();
                var orderService = scope.ServiceProvider.GetRequiredService<IOrderService>();
                var expiredCount = await orderService.ExpireOverdueOrdersAsync(stoppingToken);

                if (expiredCount > 0)
                {
                    _logger.LogInformation(
                        "[OrderExpirationJob] Đã tự động hết hạn {Count} đơn hàng và nhả giữ chỗ.",
                        expiredCount);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[OrderExpirationJob] Lỗi khi quét đơn hàng quá hạn.");
            }
        }
    }
}
