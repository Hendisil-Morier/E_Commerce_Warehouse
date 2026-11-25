using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Warehouse;

namespace ECommerceWarehouse.Application.Services;

public interface IIssueService
{
    Task<PagedResult<IssueDto>> GetIssuesAsync(IssueQueryDto query, CancellationToken cancellationToken = default);
    Task<IssueDto> GetIssueByIdAsync(long issueId, CancellationToken cancellationToken = default);
    Task<IssueDto> ApproveAsync(long issueId, CancellationToken cancellationToken = default);
    Task<IssueDto> StartPickingAsync(long issueId, CancellationToken cancellationToken = default);
    Task<IssueDto> ScanLineAsync(long issueId, long lineId, ScanIssueLineRequestDto request, CancellationToken cancellationToken = default);
    Task<IssueDto> PackAsync(long issueId, CancellationToken cancellationToken = default);
    Task<IssueDto> DispatchAsync(long issueId, CancellationToken cancellationToken = default);
}
