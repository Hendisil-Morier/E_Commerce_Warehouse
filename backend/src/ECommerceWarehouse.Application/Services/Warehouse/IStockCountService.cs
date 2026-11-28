using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Warehouse;

namespace ECommerceWarehouse.Application.Services;

public interface IStockCountService
{
    Task<PagedResult<StockCountListItemDto>> GetStockCountsAsync(StockCountQueryDto query, CancellationToken cancellationToken = default);
    Task<StockCountDetailDto> GetByIdAsync(long stockCountId, CancellationToken cancellationToken = default);
    Task<StockCountDetailDto> CreateAsync(CreateStockCountRequestDto request, CancellationToken cancellationToken = default);
    Task<StockCountDetailDto> RecordAsync(long stockCountId, RecordStockCountRequestDto request, CancellationToken cancellationToken = default);
    Task<StockCountDetailDto> ApproveAsync(long stockCountId, CancellationToken cancellationToken = default);
    Task<StockCountDetailDto> CancelAsync(long stockCountId, CancellationToken cancellationToken = default);
}
