using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Warehouse;

namespace ECommerceWarehouse.Application.Services;

public interface IStockTransferService
{
    Task<PagedResult<StockTransferListItemDto>> GetStockTransfersAsync(StockTransferQueryDto query, CancellationToken cancellationToken = default);
    Task<StockTransferDetailDto> GetByIdAsync(long transferId, CancellationToken cancellationToken = default);
    Task<StockTransferDetailDto> CreateAsync(CreateStockTransferRequestDto request, CancellationToken cancellationToken = default);
    Task<StockTransferDetailDto> ApproveAsync(long transferId, CancellationToken cancellationToken = default);
    Task<StockTransferDetailDto> DispatchAsync(long transferId, CancellationToken cancellationToken = default);
    Task<StockTransferDetailDto> ReceiveAsync(long transferId, ReceiveStockTransferRequestDto request, CancellationToken cancellationToken = default);
    Task<StockTransferDetailDto> CancelAsync(long transferId, CancellationToken cancellationToken = default);
}
