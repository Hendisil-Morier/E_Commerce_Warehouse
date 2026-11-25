using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Seller;
using ECommerceWarehouse.Domain.Constants;
using ECommerceWarehouse.Domain.Entities.Seller;
using ECommerceWarehouse.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ECommerceWarehouse.Infrastructure.Repositories;

public class SettlementRepository : ISettlementRepository
{
    private readonly ApplicationDbContext _context;

    public SettlementRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<SettlementListItemDto>> GetPagedAsync(
        SettlementQueryDto query,
        CancellationToken cancellationToken = default)
    {
        var q = _context.SellerSettlements.AsNoTracking();

        if (query.SellerId.HasValue)
        {
            q = q.Where(x => x.SellerId == query.SellerId.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.Status))
        {
            var status = query.Status.Trim();
            q = q.Where(x => x.Status == status);
        }

        var totalCount = await q.CountAsync(cancellationToken);

        var items = await q
            .OrderByDescending(x => x.CreatedAt)
            .ThenByDescending(x => x.SettlementId)
            .Skip((query.NormalizedPage - 1) * query.NormalizedPageSize)
            .Take(query.NormalizedPageSize)
            .Select(x => new SettlementListItemDto
            {
                SettlementId = x.SettlementId,
                SellerId = x.SellerId,
                SellerBusinessName = x.Seller.BusinessName,
                SettlementCode = x.SettlementCode,
                PeriodStart = x.PeriodStart,
                PeriodEnd = x.PeriodEnd,
                GrossAmount = x.GrossAmount,
                RefundDeductionAmount = x.RefundDeductionAmount,
                CommissionRateSnapshot = x.CommissionRateSnapshot,
                CommissionAmount = x.CommissionAmount,
                NetPayoutAmount = x.NetPayoutAmount,
                Status = x.Status,
                PaymentReference = x.PaymentReference,
                CreatedAt = x.CreatedAt,
                ApprovedAt = x.ApprovedAt,
                PaidAt = x.PaidAt
            })
            .ToListAsync(cancellationToken);

        return PagedResult<SettlementListItemDto>.Create(items, query.NormalizedPage, query.NormalizedPageSize, totalCount);
    }

    public async Task<SettlementDetailDto?> GetDetailDtoAsync(long settlementId, CancellationToken cancellationToken = default)
        => await _context.SellerSettlements
            .AsNoTracking()
            .Where(x => x.SettlementId == settlementId)
            .Select(x => new SettlementDetailDto
            {
                SettlementId = x.SettlementId,
                SellerId = x.SellerId,
                SellerBusinessName = x.Seller.BusinessName,
                SettlementCode = x.SettlementCode,
                PeriodStart = x.PeriodStart,
                PeriodEnd = x.PeriodEnd,
                GrossAmount = x.GrossAmount,
                RefundDeductionAmount = x.RefundDeductionAmount,
                CommissionRateSnapshot = x.CommissionRateSnapshot,
                CommissionAmount = x.CommissionAmount,
                NetPayoutAmount = x.NetPayoutAmount,
                Status = x.Status,
                PaymentReference = x.PaymentReference,
                Note = x.Note,
                CreatedBy = x.CreatedBy,
                ApprovedBy = x.ApprovedBy,
                CreatedAt = x.CreatedAt,
                ApprovedAt = x.ApprovedAt,
                PaidAt = x.PaidAt,
                Items = x.Items.Select(i => new SettlementItemDto
                {
                    SettlementItemId = i.SettlementItemId,
                    SellerOrderId = i.SellerOrderId,
                    OrderCode = i.SellerOrder.Order.OrderCode,
                    GrossAmount = i.GrossAmount,
                    RefundAmount = i.RefundAmount,
                    CommissionAmount = i.CommissionAmount,
                    NetAmount = i.NetAmount
                }).ToList()
            })
            .FirstOrDefaultAsync(cancellationToken);

    public Task<SellerSettlement?> GetByIdAsync(long settlementId, CancellationToken cancellationToken = default)
        => _context.SellerSettlements.FirstOrDefaultAsync(x => x.SettlementId == settlementId, cancellationToken);

    public Task<Domain.Entities.Seller.Seller?> GetSellerForUpdateAsync(long sellerId, CancellationToken cancellationToken = default)
        => _context.Sellers.FirstOrDefaultAsync(s => s.SellerId == sellerId, cancellationToken);

    public async Task<List<EligibleSettlementOrderData>> GetEligibleOrdersForSellerAsync(
        long sellerId,
        DateTime periodStart,
        DateTime periodEnd,
        CancellationToken cancellationToken = default)
    {
        return await _context.SellerOrders
            .AsNoTracking()
            .Where(so => so.SellerId == sellerId
                && so.Status == SellerOrderStatuses.Delivered
                && so.CreatedAt >= periodStart
                && so.CreatedAt <= periodEnd
                && !_context.SellerSettlementItems.Any(si => si.SellerOrderId == so.SellerOrderId)
                && !so.ReturnRequests.Any(rr =>
                    rr.Status == ReturnStatuses.Requested
                    || rr.Status == ReturnStatuses.Approved
                    || rr.Status == ReturnStatuses.ItemsReceived))
            .Select(so => new EligibleSettlementOrderData
            {
                SellerOrderId = so.SellerOrderId,
                OrderCode = so.Order.OrderCode,
                Subtotal = so.Subtotal,
                NonRejectedRefundAmount = _context.Refunds
                    .Where(r => r.SellerOrderId == so.SellerOrderId && r.RefundStatus != RefundStatuses.Rejected)
                    .Sum(r => (decimal?)r.Amount) ?? 0m
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<SellerFinanceSummaryDto> GetSellerFinanceSummaryAsync(
        long sellerId,
        CancellationToken cancellationToken = default)
    {
        var commissionRate = await _context.Sellers
            .AsNoTracking()
            .Where(s => s.SellerId == sellerId)
            .Select(s => s.CommissionRate)
            .FirstOrDefaultAsync(cancellationToken);

        var totalDeliveredGross = await _context.SellerOrders
            .AsNoTracking()
            .Where(so => so.SellerId == sellerId && so.Status == SellerOrderStatuses.Delivered)
            .SumAsync(so => (decimal?)so.Subtotal, cancellationToken) ?? 0m;

        var unsettled = await _context.SellerOrders
            .AsNoTracking()
            .Where(so => so.SellerId == sellerId
                && so.Status == SellerOrderStatuses.Delivered
                && !_context.SellerSettlementItems.Any(si => si.SellerOrderId == so.SellerOrderId))
            .Select(so => new
            {
                so.Subtotal,
                Refunded = _context.Refunds
                    .Where(r => r.SellerOrderId == so.SellerOrderId && r.RefundStatus != RefundStatuses.Rejected)
                    .Sum(r => (decimal?)r.Amount) ?? 0m
            })
            .ToListAsync(cancellationToken);

        var unsettledGross = unsettled.Sum(x => Math.Max(0m, x.Subtotal - x.Refunded));
        var estimatedCommission = Math.Round(unsettledGross * (commissionRate / 100m), 2, MidpointRounding.AwayFromZero);
        var estimatedNet = unsettledGross - estimatedCommission;

        var totalSettledNet = await _context.SellerSettlements
            .AsNoTracking()
            .Where(s => s.SellerId == sellerId && s.Status != SettlementStatuses.Cancelled)
            .SumAsync(s => (decimal?)s.NetPayoutAmount, cancellationToken) ?? 0m;

        var totalPaidNet = await _context.SellerSettlements
            .AsNoTracking()
            .Where(s => s.SellerId == sellerId && s.Status == SettlementStatuses.Paid)
            .SumAsync(s => (decimal?)s.NetPayoutAmount, cancellationToken) ?? 0m;

        return new SellerFinanceSummaryDto
        {
            CommissionRate = commissionRate,
            TotalDeliveredGross = totalDeliveredGross,
            UnsettledGross = unsettledGross,
            UnsettledEstimatedCommission = estimatedCommission,
            UnsettledEstimatedNet = estimatedNet,
            TotalSettledNet = totalSettledNet,
            TotalPaidNet = totalPaidNet,
            UnsettledOrderCount = unsettled.Count
        };
    }

    public async Task AddAsync(SellerSettlement settlement, CancellationToken cancellationToken = default)
        => await _context.SellerSettlements.AddAsync(settlement, cancellationToken);
}
