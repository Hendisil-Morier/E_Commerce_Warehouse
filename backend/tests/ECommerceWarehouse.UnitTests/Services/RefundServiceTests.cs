using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.Contracts.Services;
using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Order;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Application.Validators.Order;
using ECommerceWarehouse.Domain.Constants;
using ECommerceWarehouse.Domain.Entities.Order;
using ECommerceWarehouse.Domain.Entities.Review;
using ECommerceWarehouse.Domain.Exceptions;

namespace ECommerceWarehouse.UnitTests.Services;

public class RefundServiceTests
{
    private sealed class StubUnitOfWork : IUnitOfWork
    {
        public IGenericRepository<T> Repository<T>() where T : class => throw new NotImplementedException();
        public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) => Task.FromResult(1);
        public Task ExecuteInTransactionAsync(Func<CancellationToken, Task> operation, CancellationToken cancellationToken = default)
            => operation(cancellationToken);
        public void Dispose() { }
    }

    private sealed class StubCurrentUser : ICurrentUser
    {
        public long? UserId { get; set; } = 1;
        public IReadOnlyList<string> Roles { get; set; } = [RoleNames.Admin];
        public long? SellerId => null;
        public bool IsAuthenticated => UserId.HasValue;
        public bool IsInRole(string role) => Roles.Contains(role);
        public Task<long?> GetSellerIdAsync(CancellationToken cancellationToken = default) => Task.FromResult<long?>(null);
    }

    private sealed class InMemoryRefundRepo : IRefundRepository
    {
        public List<Payment> Payments { get; } = [];
        public List<Refund> Refunds { get; } = [];

        public Task<PagedResult<RefundDto>> GetPagedAsync(RefundQueryDto query, CancellationToken cancellationToken = default)
            => Task.FromResult(PagedResult<RefundDto>.Create([], query.NormalizedPage, query.NormalizedPageSize, 0));

        public Task<Refund?> GetByIdWithDetailsAsync(long refundId, CancellationToken cancellationToken = default)
            => Task.FromResult(Refunds.FirstOrDefault(r => r.RefundId == refundId));

        public Task<RefundDto?> GetDtoByIdAsync(long refundId, CancellationToken cancellationToken = default)
        {
            var r = Refunds.FirstOrDefault(x => x.RefundId == refundId);
            if (r == null) return Task.FromResult<RefundDto?>(null);
            return Task.FromResult<RefundDto?>(new RefundDto
            {
                RefundId = r.RefundId,
                PaymentId = r.PaymentId,
                OrderId = r.Payment.OrderId,
                OrderCode = r.Payment.Order.OrderCode,
                Amount = r.Amount,
                RefundStatus = r.RefundStatus,
                ApprovedBy = r.ApprovedBy
            });
        }

        public Task<Payment?> GetPaymentForUpdateAsync(long paymentId, CancellationToken cancellationToken = default)
            => Task.FromResult(Payments.FirstOrDefault(p => p.PaymentId == paymentId));

        public Task<decimal> GetTotalNonRejectedRefundsForPaymentAsync(long paymentId, CancellationToken cancellationToken = default)
            => Task.FromResult(Refunds.Where(r => r.PaymentId == paymentId && r.RefundStatus != RefundStatuses.Rejected).Sum(r => r.Amount));

        public Task<bool> ExistsForReturnRequestAsync(long returnRequestId, CancellationToken cancellationToken = default)
            => Task.FromResult(Refunds.Any(r => r.ReturnRequestId == returnRequestId && r.RefundStatus != RefundStatuses.Rejected));

        public Task AddAsync(Refund refund, CancellationToken cancellationToken = default) => Task.CompletedTask;
    }

    private static (RefundService Service, InMemoryRefundRepo Repo) CreateSut()
    {
        var repo = new InMemoryRefundRepo();
        var service = new RefundService(
            repo,
            new StubUnitOfWork(),
            new StubCurrentUser(),
            new RefundQueryValidator(),
            new RejectRefundRequestValidator());
        return (service, repo);
    }

    [Fact]
    public async Task ApproveAsync_TotalRefundsExceedPaid_ThrowsRefundExceedsPaid()
    {
        var (service, repo) = CreateSut();
        var order = new Order { OrderId = 1, OrderCode = "ORD-1" };
        var payment = new Payment { PaymentId = 10, OrderId = 1, Amount = 100_000m, Order = order };
        repo.Payments.Add(payment);

        repo.Refunds.Add(new Refund { RefundId = 1, PaymentId = 10, Payment = payment, Amount = 80_000m, RefundStatus = RefundStatuses.Completed });
        repo.Refunds.Add(new Refund { RefundId = 2, PaymentId = 10, Payment = payment, Amount = 30_000m, RefundStatus = RefundStatuses.Pending });

        var ex = await Assert.ThrowsAsync<BusinessException>(() => service.ApproveAsync(2));
        Assert.Equal(ErrorCodes.RefundExceedsPaid, ex.Code);
    }

    [Fact]
    public async Task CompleteAsync_ApprovedRefund_UpdatesPaymentAndReturnRequest()
    {
        var (service, repo) = CreateSut();
        var order = new Order { OrderId = 1, OrderCode = "ORD-1" };
        var so = new SellerOrder { SellerOrderId = 5, OrderId = 1, Status = SellerOrderStatuses.Delivered, Order = order };
        var rr = new ReturnRequest { ReturnRequestId = 3, SellerOrderId = 5, SellerOrder = so, Status = ReturnStatuses.Inspected };
        var payment = new Payment { PaymentId = 10, OrderId = 1, Amount = 100_000m, PaymentStatus = PaymentStatuses.Paid, Order = order };
        repo.Payments.Add(payment);
        repo.Refunds.Add(new Refund { RefundId = 1, PaymentId = 10, Payment = payment, ReturnRequestId = 3, ReturnRequest = rr, Amount = 100_000m, RefundStatus = RefundStatuses.Approved });

        var dto = await service.CompleteAsync(1);

        Assert.Equal(RefundStatuses.Completed, dto.RefundStatus);
        Assert.Equal(PaymentStatuses.Refunded, payment.PaymentStatus);
        Assert.Equal(ReturnStatuses.Completed, rr.Status);
        Assert.Equal(SellerOrderStatuses.Returned, so.Status);
    }
}
