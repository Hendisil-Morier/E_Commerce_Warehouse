using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.Contracts.Services;
using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Review;
using ECommerceWarehouse.Application.DTOs.Warehouse;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Application.Validators.Review;
using ECommerceWarehouse.Domain.Constants;
using ECommerceWarehouse.Domain.Entities.Order;
using ECommerceWarehouse.Domain.Entities.Review;
using ECommerceWarehouse.Domain.Entities.Warehouse;
using ECommerceWarehouse.Domain.Exceptions;

namespace ECommerceWarehouse.UnitTests.Services;

public class ReturnServiceTests
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
        public long? UserId { get; set; } = 100;
        public IReadOnlyList<string> Roles { get; set; } = [RoleNames.Customer];
        public long? SellerId { get; set; }
        public bool IsAuthenticated => UserId.HasValue;
        public bool IsInRole(string role) => Roles.Contains(role);
        public Task<long?> GetSellerIdAsync(CancellationToken cancellationToken = default) => Task.FromResult(SellerId);
    }

    private sealed class SpyInventoryLedger : IInventoryLedgerService
    {
        public List<(long LocationId, long VariantId, int Qty, string MovementType)> IncreasedCalls { get; } = [];
        public List<(long Src, long Dest, long VariantId, int Qty)> TransferCalls { get; } = [];

        public Task IncreaseOnHandAsync(long warehouseId, long locationId, long variantId, int quantity, string movementType, string referenceType, long referenceId, long? createdBy, string? note = null, CancellationToken cancellationToken = default)
        {
            IncreasedCalls.Add((locationId, variantId, quantity, movementType));
            return Task.CompletedTask;
        }
        public Task AdjustOnHandAsync(long warehouseId, long locationId, long variantId, int deltaQuantity, string movementType, string referenceType, long referenceId, long? createdBy, string? note = null, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task ReserveStockAtomicAsync(long inventoryId, int quantity, long referenceId, long? createdBy, string? note = null, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task ReleaseReservationAsync(long locationId, long variantId, int quantity, long referenceId, long? createdBy, string? note = null, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task DispatchReservedStockAsync(long locationId, long variantId, int quantity, long referenceId, long? createdBy, string? note = null, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task TransferAdjustmentAsync(long warehouseId, long sourceLocationId, long destinationLocationId, long variantId, int quantity, string referenceType, long referenceId, long? createdBy, string? note = null, CancellationToken cancellationToken = default)
        {
            TransferCalls.Add((sourceLocationId, destinationLocationId, variantId, quantity));
            return Task.CompletedTask;
        }
        public Task PutawayAsync(PutawayRequestDto request, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task<PagedResult<InventoryItemDto>> GetInventoryAsync(InventoryQueryDto query, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<VariantAvailabilityDto> GetVariantAvailabilityAsync(long variantId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<PagedResult<StockMovementDto>> GetStockMovementsAsync(StockMovementQueryDto query, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<List<StockReconciliationItemDto>> GetReconciliationDiscrepanciesAsync(CancellationToken cancellationToken = default) => throw new NotImplementedException();
    }

    private sealed class InMemoryReturnRepo : IReturnRepository
    {
        public List<SellerOrder> SellerOrders { get; } = [];
        public List<ReturnRequest> ReturnRequests { get; } = [];
        public List<WarehouseLocation> Locations { get; } = [];

        public Task<SellerOrder?> GetSellerOrderForReturnAsync(long sellerOrderId, CancellationToken cancellationToken = default)
            => Task.FromResult(SellerOrders.FirstOrDefault(s => s.SellerOrderId == sellerOrderId));

        public Task<int> GetAlreadyReturnedQuantityAsync(long orderItemId, CancellationToken cancellationToken = default)
            => Task.FromResult(ReturnRequests
                .Where(r => r.Status != ReturnStatuses.Rejected && r.Status != ReturnStatuses.Cancelled)
                .SelectMany(r => r.Items)
                .Where(i => i.OrderItemId == orderItemId)
                .Sum(i => i.Quantity));

        public Task<PagedResult<ReturnRequestDto>> GetPagedAsync(ReturnQueryDto query, long? customerIdFilter = null, long? sellerIdFilter = null, CancellationToken cancellationToken = default)
            => Task.FromResult(PagedResult<ReturnRequestDto>.Create([], query.NormalizedPage, query.NormalizedPageSize, 0));

        public Task<ReturnRequest?> GetByIdWithDetailsAsync(long returnRequestId, CancellationToken cancellationToken = default)
            => Task.FromResult(ReturnRequests.FirstOrDefault(r => r.ReturnRequestId == returnRequestId));

        public Task<ReturnRequestDto?> GetDtoByIdAsync(long returnRequestId, CancellationToken cancellationToken = default)
        {
            var r = ReturnRequests.FirstOrDefault(x => x.ReturnRequestId == returnRequestId);
            if (r == null) return Task.FromResult<ReturnRequestDto?>(null);
            return Task.FromResult<ReturnRequestDto?>(new ReturnRequestDto
            {
                ReturnRequestId = r.ReturnRequestId,
                RequestCode = r.RequestCode,
                SellerOrderId = r.SellerOrderId,
                CustomerId = r.CustomerId,
                Status = r.Status,
                Items = r.Items.Select(i => new ReturnItemDto
                {
                    ReturnItemId = i.ReturnItemId,
                    OrderItemId = i.OrderItemId,
                    Quantity = i.Quantity,
                    InspectionResult = i.InspectionResult,
                    RestockLocationId = i.RestockLocationId
                }).ToList()
            });
        }

        public Task<WarehouseLocation?> GetReturnZoneLocationAsync(long warehouseId, long? preferredLocationId, CancellationToken cancellationToken = default)
            => Task.FromResult(Locations.FirstOrDefault(l => l.WarehouseId == warehouseId && l.StorageType == StorageTypes.Returns && l.IsActive));

        public Task<WarehouseLocation?> GetLocationByIdAsync(long locationId, CancellationToken cancellationToken = default)
            => Task.FromResult(Locations.FirstOrDefault(l => l.LocationId == locationId));

        public Task AddAsync(ReturnRequest returnRequest, CancellationToken cancellationToken = default)
        {
            returnRequest.ReturnRequestId = ReturnRequests.Count + 1;
            ReturnRequests.Add(returnRequest);
            return Task.CompletedTask;
        }
    }

    private sealed class StubRefundRepo : IRefundRepository
    {
        public List<Refund> Refunds { get; } = [];
        public Task<PagedResult<Application.DTOs.Order.RefundDto>> GetPagedAsync(Application.DTOs.Order.RefundQueryDto query, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<Refund?> GetByIdWithDetailsAsync(long refundId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<Application.DTOs.Order.RefundDto?> GetDtoByIdAsync(long refundId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<Payment?> GetPaymentForUpdateAsync(long paymentId, CancellationToken cancellationToken = default) => Task.FromResult<Payment?>(null);
        public Task<decimal> GetTotalNonRejectedRefundsForPaymentAsync(long paymentId, CancellationToken cancellationToken = default) => Task.FromResult(0m);
        public Task<bool> ExistsForReturnRequestAsync(long returnRequestId, CancellationToken cancellationToken = default) => Task.FromResult(false);
        public Task AddAsync(Refund refund, CancellationToken cancellationToken = default)
        {
            refund.RefundId = Refunds.Count + 1;
            Refunds.Add(refund);
            return Task.CompletedTask;
        }
    }

    private static (ReturnService Service, InMemoryReturnRepo ReturnRepo, StubRefundRepo RefundRepo, SpyInventoryLedger Ledger, StubCurrentUser User) CreateSut()
    {
        var returnRepo = new InMemoryReturnRepo();
        var refundRepo = new StubRefundRepo();
        var ledger = new SpyInventoryLedger();
        var user = new StubCurrentUser();

        returnRepo.Locations.AddRange(new[]
        {
            new WarehouseLocation { LocationId = 10, WarehouseId = 1, LocationCode = "RETURNS-01", StorageType = StorageTypes.Returns, IsSellable = false, IsActive = true },
            new WarehouseLocation { LocationId = 11, WarehouseId = 1, LocationCode = "A-01-01", StorageType = StorageTypes.Standard, IsSellable = true, IsActive = true },
            new WarehouseLocation { LocationId = 12, WarehouseId = 1, LocationCode = "DAMAGED-01", StorageType = StorageTypes.Damaged, IsSellable = false, IsActive = true },
        });

        var service = new ReturnService(
            returnRepo,
            refundRepo,
            ledger,
            new StubUnitOfWork(),
            user,
            new ReturnQueryValidator(),
            new CreateReturnRequestValidator(),
            new RejectReturnRequestValidator(),
            new InspectReturnItemRequestValidator());

        return (service, returnRepo, refundRepo, ledger, user);
    }

    [Fact]
    public async Task CreateReturnRequestAsync_NonDeliveredOrder_ThrowsReturnNotEligible()
    {
        var (service, repo, _, _, user) = CreateSut();
        user.UserId = 100;
        var order = new Order { OrderId = 1, CustomerId = 100, OrderCode = "ORD-1" };
        repo.SellerOrders.Add(new SellerOrder
        {
            SellerOrderId = 1,
            OrderId = 1,
            Order = order,
            Status = SellerOrderStatuses.Shipped,
            Items = [new OrderItem { OrderItemId = 5, Quantity = 1 }]
        });

        var ex = await Assert.ThrowsAsync<BusinessException>(() =>
            service.CreateReturnRequestAsync(1, new CreateReturnRequestDto { Reason = "Hỏng", Items = [new CreateReturnItemDto { OrderItemId = 5, Quantity = 1 }] }));

        Assert.Equal(ErrorCodes.ReturnNotEligible, ex.Code);
    }

    [Fact]
    public async Task InspectItemAsync_GoodToDamagedZone_ThrowsInvalidLocation()
    {
        var (service, repo, _, _, user) = CreateSut();
        user.UserId = 20;
        user.Roles = [RoleNames.WarehouseStaff];

        var order = new Order { OrderId = 1, CustomerId = 100, OrderCode = "ORD-1" };
        var so = new SellerOrder { SellerOrderId = 1, OrderId = 1, WarehouseId = 1, Order = order };
        repo.ReturnRequests.Add(new ReturnRequest
        {
            ReturnRequestId = 1,
            RequestCode = "RT-1",
            SellerOrderId = 1,
            SellerOrder = so,
            Status = ReturnStatuses.ItemsReceived,
            Items = [new ReturnRequestItem { ReturnItemId = 1, OrderItem = new OrderItem { VariantId = 101, UnitPrice = 100_000m }, Quantity = 1, InspectionResult = InspectionResults.Pending, RestockLocationId = 10 }]
        });

        var ex = await Assert.ThrowsAsync<BusinessException>(() =>
            service.InspectItemAsync(1, 1, new InspectReturnItemRequestDto { InspectionResult = InspectionResults.Good, RestockLocationId = 12 }));

        Assert.Equal(ErrorCodes.InvalidLocation, ex.Code);
    }

    [Fact]
    public async Task InspectItemAsync_AllItemsInspected_TransitionsToInspectedAndCreatesPendingRefund()
    {
        var (service, repo, refundRepo, ledger, user) = CreateSut();
        user.UserId = 20;
        user.Roles = [RoleNames.WarehouseStaff];

        var order = new Order
        {
            OrderId = 1,
            CustomerId = 100,
            OrderCode = "ORD-1",
            Payments = [new Payment { PaymentId = 7, Amount = 200_000m, PaymentStatus = PaymentStatuses.Paid }]
        };
        var so = new SellerOrder { SellerOrderId = 1, OrderId = 1, WarehouseId = 1, Order = order };
        repo.ReturnRequests.Add(new ReturnRequest
        {
            ReturnRequestId = 1,
            RequestCode = "RT-1",
            SellerOrderId = 1,
            SellerOrder = so,
            Status = ReturnStatuses.ItemsReceived,
            Items = [new ReturnRequestItem { ReturnItemId = 1, OrderItem = new OrderItem { VariantId = 101, UnitPrice = 100_000m }, Quantity = 1, InspectionResult = InspectionResults.Pending, RestockLocationId = 10 }]
        });

        var dto = await service.InspectItemAsync(1, 1, new InspectReturnItemRequestDto { InspectionResult = InspectionResults.Good, RestockLocationId = 11 });

        Assert.Equal(ReturnStatuses.Inspected, dto.Status);
        var transfer = Assert.Single(ledger.TransferCalls);
        Assert.Equal((10, 11, 101, 1), transfer);
        var refund = Assert.Single(refundRepo.Refunds);
        Assert.Equal(100_000m, refund.Amount);
        Assert.Equal(RefundStatuses.Pending, refund.RefundStatus);
    }
}
