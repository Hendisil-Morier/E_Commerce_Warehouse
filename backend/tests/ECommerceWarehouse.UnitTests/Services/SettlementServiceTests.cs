using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.Contracts.Services;
using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Seller;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Domain.Constants;
using ECommerceWarehouse.Domain.Entities.Seller;
using ECommerceWarehouse.Domain.Exceptions;

namespace ECommerceWarehouse.UnitTests.Services;

public class SettlementServiceTests
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
        public long? SellerId { get; set; } = 10;
        public bool IsAuthenticated => true;
        public bool IsInRole(string role) => Roles.Contains(role);
        public Task<long?> GetSellerIdAsync(CancellationToken cancellationToken = default) => Task.FromResult(SellerId);
    }

    private sealed class InMemorySettlementRepo : ISettlementRepository
    {
        public List<Seller> Sellers { get; } = [];
        public List<EligibleSettlementOrderData> EligibleOrders { get; } = [];
        public List<SellerSettlement> Settlements { get; } = [];

        public Task<PagedResult<SettlementListItemDto>> GetPagedAsync(SettlementQueryDto query, CancellationToken cancellationToken = default)
            => Task.FromResult(PagedResult<SettlementListItemDto>.Create([], query.NormalizedPage, query.NormalizedPageSize, 0));

        public Task<SettlementDetailDto?> GetDetailDtoAsync(long settlementId, CancellationToken cancellationToken = default)
        {
            var s = Settlements.FirstOrDefault(x => x.SettlementId == settlementId);
            if (s == null) return Task.FromResult<SettlementDetailDto?>(null);
            return Task.FromResult<SettlementDetailDto?>(new SettlementDetailDto
            {
                SettlementId = s.SettlementId,
                SellerId = s.SellerId,
                SellerBusinessName = $"Seller {s.SellerId}",
                SettlementCode = s.SettlementCode,
                PeriodStart = s.PeriodStart,
                PeriodEnd = s.PeriodEnd,
                GrossAmount = s.GrossAmount,
                RefundDeductionAmount = s.RefundDeductionAmount,
                CommissionRateSnapshot = s.CommissionRateSnapshot,
                CommissionAmount = s.CommissionAmount,
                NetPayoutAmount = s.NetPayoutAmount,
                Status = s.Status,
                PaymentReference = s.PaymentReference,
                Items = s.Items.Select(i => new SettlementItemDto
                {
                    SettlementItemId = i.SettlementItemId,
                    SellerOrderId = i.SellerOrderId,
                    OrderCode = $"ORD-{i.SellerOrderId}",
                    GrossAmount = i.GrossAmount,
                    RefundAmount = i.RefundAmount,
                    CommissionAmount = i.CommissionAmount,
                    NetAmount = i.NetAmount
                }).ToList()
            });
        }

        public Task<SellerSettlement?> GetByIdAsync(long settlementId, CancellationToken cancellationToken = default)
            => Task.FromResult(Settlements.FirstOrDefault(x => x.SettlementId == settlementId));

        public Task<Seller?> GetSellerForUpdateAsync(long sellerId, CancellationToken cancellationToken = default)
            => Task.FromResult(Sellers.FirstOrDefault(s => s.SellerId == sellerId));

        public Task<List<EligibleSettlementOrderData>> GetEligibleOrdersForSellerAsync(
            long sellerId, DateTime periodStart, DateTime periodEnd, CancellationToken cancellationToken = default)
            => Task.FromResult(EligibleOrders.ToList());

        public Task<SellerFinanceSummaryDto> GetSellerFinanceSummaryAsync(long sellerId, CancellationToken cancellationToken = default)
            => Task.FromResult(new SellerFinanceSummaryDto());

        public Task AddAsync(SellerSettlement settlement, CancellationToken cancellationToken = default)
        {
            settlement.SettlementId = Settlements.Count + 1;
            long itemId = 1;
            foreach (var item in settlement.Items) item.SettlementItemId = itemId++;
            Settlements.Add(settlement);
            return Task.CompletedTask;
        }
    }

    [Fact]
    public async Task GenerateApproveMarkPaid_CalculatesCommissionAndRefundsAccurately()
    {
        var repo = new InMemorySettlementRepo();
        repo.Sellers.Add(new Seller { SellerId = 10, BusinessName = "Shop A", CommissionRate = 10m });
        repo.EligibleOrders.AddRange([
            new EligibleSettlementOrderData { SellerOrderId = 101, OrderCode = "ORD-101", Subtotal = 1_000_000m, NonRejectedRefundAmount = 0m },
            new EligibleSettlementOrderData { SellerOrderId = 102, OrderCode = "ORD-102", Subtotal = 500_000m, NonRejectedRefundAmount = 100_000m }
        ]);

        var service = new SettlementService(
            repo,
            new StubUnitOfWork(),
            new StubCurrentUser(),
            new GenerateSettlementRequestValidator(),
            new MarkSettlementPaidRequestValidator(),
            new UpdateSellerCommissionRequestValidator());

        var generated = await service.GenerateSettlementAsync(new GenerateSettlementRequestDto
        {
            SellerId = 10,
            PeriodStart = DateTime.UtcNow.AddDays(-7),
            PeriodEnd = DateTime.UtcNow
        });

        Assert.Equal(SettlementStatuses.Pending, generated.Status);
        Assert.Equal(1_500_000m, generated.GrossAmount);
        Assert.Equal(100_000m, generated.RefundDeductionAmount);
        Assert.Equal(10m, generated.CommissionRateSnapshot);
        Assert.Equal(140_000m, generated.CommissionAmount); // 10% of (1,500,000 - 100,000)
        Assert.Equal(1_260_000m, generated.NetPayoutAmount);

        var approved = await service.ApproveSettlementAsync(generated.SettlementId);
        Assert.Equal(SettlementStatuses.Approved, approved.Status);

        var paid = await service.MarkPaidAsync(generated.SettlementId, new MarkSettlementPaidRequestDto
        {
            PaymentReference = "VCB-999888"
        });
        Assert.Equal(SettlementStatuses.Paid, paid.Status);
        Assert.Equal("VCB-999888", paid.PaymentReference);
    }

    [Fact]
    public async Task MarkPaidAsync_ThrowsBusinessException_WhenNotApproved()
    {
        var repo = new InMemorySettlementRepo();
        repo.Settlements.Add(new SellerSettlement
        {
            SettlementId = 1,
            SellerId = 10,
            SettlementCode = "STL-1",
            Status = SettlementStatuses.Pending
        });

        var service = new SettlementService(
            repo,
            new StubUnitOfWork(),
            new StubCurrentUser(),
            new GenerateSettlementRequestValidator(),
            new MarkSettlementPaidRequestValidator(),
            new UpdateSellerCommissionRequestValidator());

        await Assert.ThrowsAsync<BusinessException>(() =>
            service.MarkPaidAsync(1, new MarkSettlementPaidRequestDto { PaymentReference = "TX-1" }));
    }
}
