using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Seller;
using ECommerceWarehouse.Domain.Entities.Order;
using ECommerceWarehouse.Domain.Entities.Seller;

namespace ECommerceWarehouse.Application.Contracts.Persistence;

public interface ISettlementRepository
{
    Task<PagedResult<SettlementListItemDto>> GetPagedAsync(SettlementQueryDto query, CancellationToken cancellationToken = default);
    Task<SettlementDetailDto?> GetDetailDtoAsync(long settlementId, CancellationToken cancellationToken = default);
    Task<SellerSettlement?> GetByIdAsync(long settlementId, CancellationToken cancellationToken = default);
    Task<Domain.Entities.Seller.Seller?> GetSellerForUpdateAsync(long sellerId, CancellationToken cancellationToken = default);
    Task<List<EligibleSettlementOrderData>> GetEligibleOrdersForSellerAsync(
        long sellerId,
        DateTime periodStart,
        DateTime periodEnd,
        CancellationToken cancellationToken = default);
    Task<SellerFinanceSummaryDto> GetSellerFinanceSummaryAsync(long sellerId, CancellationToken cancellationToken = default);
    Task AddAsync(SellerSettlement settlement, CancellationToken cancellationToken = default);
}

public class EligibleSettlementOrderData
{
    public long SellerOrderId { get; set; }
    public string OrderCode { get; set; } = null!;
    public decimal Subtotal { get; set; }
    public decimal NonRejectedRefundAmount { get; set; }
}
