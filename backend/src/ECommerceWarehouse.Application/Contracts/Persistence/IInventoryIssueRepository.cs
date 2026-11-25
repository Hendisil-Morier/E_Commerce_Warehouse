using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Warehouse;
using ECommerceWarehouse.Domain.Entities.Warehouse;

namespace ECommerceWarehouse.Application.Contracts.Persistence;

public interface IInventoryIssueRepository
{
    Task<PagedResult<IssueDto>> GetPagedAsync(IssueQueryDto query, CancellationToken cancellationToken = default);
    Task<InventoryIssue?> GetByIdWithDetailsAsync(long issueId, CancellationToken cancellationToken = default);
    Task<IssueDto?> GetDtoByIdAsync(long issueId, CancellationToken cancellationToken = default);
    Task<bool> ExistsForSellerOrderAsync(long sellerOrderId, CancellationToken cancellationToken = default);
    Task AddAsync(InventoryIssue issue, CancellationToken cancellationToken = default);
}
