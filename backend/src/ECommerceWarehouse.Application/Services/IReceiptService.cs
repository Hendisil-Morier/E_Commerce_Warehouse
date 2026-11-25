using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Warehouse;

namespace ECommerceWarehouse.Application.Services;

public interface IReceiptService
{
    Task<PagedResult<ReceiptDto>> GetReceiptsAsync(ReceiptQueryDto query, CancellationToken cancellationToken = default);
    Task<ReceiptDto> GetReceiptByIdAsync(long receiptId, CancellationToken cancellationToken = default);
    Task<ReceiptDto> CreateReceiptAsync(CreateReceiptRequestDto request, CancellationToken cancellationToken = default);
    Task<ReceiptDto> ConfirmReceiptAsync(long receiptId, CancellationToken cancellationToken = default);
    Task<ReceiptDto> CancelReceiptAsync(long receiptId, CancellationToken cancellationToken = default);
}
