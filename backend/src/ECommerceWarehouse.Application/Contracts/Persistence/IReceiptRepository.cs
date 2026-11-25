using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Warehouse;
using ECommerceWarehouse.Domain.Entities.Warehouse;

namespace ECommerceWarehouse.Application.Contracts.Persistence;

public interface IReceiptRepository
{
    Task<PagedResult<ReceiptDto>> GetPagedAsync(ReceiptQueryDto query, CancellationToken cancellationToken = default);
    Task<InventoryReceipt?> GetByIdWithDetailsAsync(long receiptId, CancellationToken cancellationToken = default);
    Task<ReceiptDto?> GetDtoByIdAsync(long receiptId, CancellationToken cancellationToken = default);
    Task<bool> VariantExistsAsync(long variantId, CancellationToken cancellationToken = default);
    Task<long?> GetVariantSellerIdAsync(long variantId, CancellationToken cancellationToken = default);
    Task AddAsync(InventoryReceipt receipt, CancellationToken cancellationToken = default);
    void Update(InventoryReceipt receipt);
}
