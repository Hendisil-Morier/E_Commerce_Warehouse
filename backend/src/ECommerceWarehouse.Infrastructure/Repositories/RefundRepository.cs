using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Order;
using ECommerceWarehouse.Domain.Constants;
using ECommerceWarehouse.Domain.Entities.Order;
using ECommerceWarehouse.Infrastructure.Data;
using ECommerceWarehouse.Infrastructure.Extensions;
using Microsoft.EntityFrameworkCore;

namespace ECommerceWarehouse.Infrastructure.Repositories;

public class RefundRepository : IRefundRepository
{
    private readonly ApplicationDbContext _context;

    public RefundRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<RefundDto>> GetPagedAsync(
        RefundQueryDto query,
        CancellationToken cancellationToken = default)
    {
        var baseQuery = _context.Refunds
            .AsNoTracking()
            .Include(r => r.Payment)
                .ThenInclude(p => p.Order)
            .Include(r => r.Payment)
                .ThenInclude(p => p.Refunds)
            .Include(r => r.ReturnRequest)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Status))
        {
            baseQuery = baseQuery.Where(r => r.RefundStatus == query.Status);
        }

        var projected = baseQuery
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new RefundDto
            {
                RefundId = r.RefundId,
                PaymentId = r.PaymentId,
                OrderId = r.Payment.OrderId,
                OrderCode = r.Payment.Order.OrderCode,
                SellerOrderId = r.SellerOrderId,
                ReturnRequestId = r.ReturnRequestId,
                ReturnRequestCode = r.ReturnRequest != null ? r.ReturnRequest.RequestCode : null,
                PaymentAmount = r.Payment.Amount,
                TotalRefundedOnPayment = r.Payment.Refunds
                    .Where(x => x.RefundStatus == RefundStatuses.Completed)
                    .Sum(x => x.Amount),
                Amount = r.Amount,
                Reason = r.Reason,
                RefundStatus = r.RefundStatus,
                ApprovedBy = r.ApprovedBy,
                ProcessedAt = r.ProcessedAt,
                CreatedAt = r.CreatedAt
            });

        return await projected.ToPagedResultAsync(query, cancellationToken);
    }

    public async Task<Refund?> GetByIdWithDetailsAsync(
        long refundId,
        CancellationToken cancellationToken = default)
        => await _context.Refunds
            .Include(r => r.Payment)
                .ThenInclude(p => p.Order)
                    .ThenInclude(o => o.SellerOrders)
            .Include(r => r.ReturnRequest)
                .ThenInclude(rr => rr!.SellerOrder)
            .FirstOrDefaultAsync(r => r.RefundId == refundId, cancellationToken);

    public async Task<RefundDto?> GetDtoByIdAsync(
        long refundId,
        CancellationToken cancellationToken = default)
    {
        var r = await _context.Refunds
            .AsNoTracking()
            .Include(x => x.Payment)
                .ThenInclude(p => p.Order)
            .Include(x => x.Payment)
                .ThenInclude(p => p.Refunds)
            .Include(x => x.ReturnRequest)
            .FirstOrDefaultAsync(x => x.RefundId == refundId, cancellationToken);

        if (r == null) return null;

        return new RefundDto
        {
            RefundId = r.RefundId,
            PaymentId = r.PaymentId,
            OrderId = r.Payment.OrderId,
            OrderCode = r.Payment.Order.OrderCode,
            SellerOrderId = r.SellerOrderId,
            ReturnRequestId = r.ReturnRequestId,
            ReturnRequestCode = r.ReturnRequest?.RequestCode,
            PaymentAmount = r.Payment.Amount,
            TotalRefundedOnPayment = r.Payment.Refunds
                .Where(x => x.RefundStatus == RefundStatuses.Completed)
                .Sum(x => x.Amount),
            Amount = r.Amount,
            Reason = r.Reason,
            RefundStatus = r.RefundStatus,
            ApprovedBy = r.ApprovedBy,
            ProcessedAt = r.ProcessedAt,
            CreatedAt = r.CreatedAt
        };
    }

    public async Task<Payment?> GetPaymentForUpdateAsync(
        long paymentId,
        CancellationToken cancellationToken = default)
    {
        // Khóa dòng Payments bằng SELECT ... FOR UPDATE trong transaction hiện tại
        return await _context.Payments
            .FromSqlInterpolated($"SELECT * FROM Payments WHERE PaymentId = {paymentId} FOR UPDATE")
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<decimal> GetTotalNonRejectedRefundsForPaymentAsync(
        long paymentId,
        CancellationToken cancellationToken = default)
        => await _context.Refunds
            .AsNoTracking()
            .Where(r => r.PaymentId == paymentId && r.RefundStatus != RefundStatuses.Rejected)
            .SumAsync(r => (decimal?)r.Amount, cancellationToken) ?? 0m;

    public async Task<bool> ExistsForReturnRequestAsync(
        long returnRequestId,
        CancellationToken cancellationToken = default)
        => await _context.Refunds
            .AsNoTracking()
            .AnyAsync(r => r.ReturnRequestId == returnRequestId && r.RefundStatus != RefundStatuses.Rejected, cancellationToken);

    public async Task AddAsync(Refund refund, CancellationToken cancellationToken = default)
        => await _context.Refunds.AddAsync(refund, cancellationToken);
}
