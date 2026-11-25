using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Order;
using ECommerceWarehouse.Domain.Entities.Order;

namespace ECommerceWarehouse.Application.Contracts.Persistence;

public interface IRefundRepository
{
    Task<PagedResult<RefundDto>> GetPagedAsync(RefundQueryDto query, CancellationToken cancellationToken = default);
    Task<Refund?> GetByIdWithDetailsAsync(long refundId, CancellationToken cancellationToken = default);
    Task<RefundDto?> GetDtoByIdAsync(long refundId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Khóa dòng Payment bằng SELECT ... FOR UPDATE (trong transaction) để chống vượt tổng hoàn tiền khi đồng thời.
    /// </summary>
    Task<Payment?> GetPaymentForUpdateAsync(long paymentId, CancellationToken cancellationToken = default);

    Task<decimal> GetTotalNonRejectedRefundsForPaymentAsync(long paymentId, CancellationToken cancellationToken = default);
    Task<bool> ExistsForReturnRequestAsync(long returnRequestId, CancellationToken cancellationToken = default);
    Task AddAsync(Refund refund, CancellationToken cancellationToken = default);
}
