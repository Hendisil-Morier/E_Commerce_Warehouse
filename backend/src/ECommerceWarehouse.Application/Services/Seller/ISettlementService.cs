using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Seller;

namespace ECommerceWarehouse.Application.Services;

public interface ISettlementService
{
    Task<PagedResult<SettlementListItemDto>> GetSettlementsAsync(SettlementQueryDto query, CancellationToken cancellationToken = default);
    Task<SettlementDetailDto> GetSettlementByIdAsync(long settlementId, CancellationToken cancellationToken = default);
    Task<SettlementDetailDto> GenerateSettlementAsync(GenerateSettlementRequestDto request, CancellationToken cancellationToken = default);
    Task<SettlementDetailDto> ApproveSettlementAsync(long settlementId, CancellationToken cancellationToken = default);
    Task<SettlementDetailDto> MarkPaidAsync(long settlementId, MarkSettlementPaidRequestDto request, CancellationToken cancellationToken = default);
    Task<decimal> UpdateSellerCommissionRateAsync(long sellerId, UpdateSellerCommissionRequestDto request, CancellationToken cancellationToken = default);
    Task<SellerFinanceSummaryDto> GetMyFinanceSummaryAsync(CancellationToken cancellationToken = default);
    Task<PagedResult<SettlementListItemDto>> GetMySettlementsAsync(SettlementQueryDto query, CancellationToken cancellationToken = default);
    Task<SettlementDetailDto> GetMySettlementByIdAsync(long settlementId, CancellationToken cancellationToken = default);
}
