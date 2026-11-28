using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Review;
using ECommerceWarehouse.Domain.Constants;
using ECommerceWarehouse.Domain.Entities.Order;
using ECommerceWarehouse.Domain.Entities.Review;
using ECommerceWarehouse.Domain.Entities.Warehouse;
using ECommerceWarehouse.Infrastructure.Data;
using ECommerceWarehouse.Infrastructure.Extensions;
using Microsoft.EntityFrameworkCore;

namespace ECommerceWarehouse.Infrastructure.Repositories;

public class ReturnRepository : IReturnRepository
{
    private readonly ApplicationDbContext _context;

    public ReturnRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SellerOrder?> GetSellerOrderForReturnAsync(
        long sellerOrderId,
        CancellationToken cancellationToken = default)
        => await _context.SellerOrders
            .Include(so => so.Order)
            .Include(so => so.Items)
            .FirstOrDefaultAsync(so => so.SellerOrderId == sellerOrderId, cancellationToken);

    public async Task<int> GetAlreadyReturnedQuantityAsync(
        long orderItemId,
        CancellationToken cancellationToken = default)
        => await _context.ReturnRequestItems
            .AsNoTracking()
            .Where(ri =>
                ri.OrderItemId == orderItemId &&
                ri.ReturnRequest.Status != ReturnStatuses.Rejected &&
                ri.ReturnRequest.Status != ReturnStatuses.Cancelled)
            .SumAsync(ri => (int?)ri.Quantity, cancellationToken) ?? 0;

    public async Task<PagedResult<ReturnRequestDto>> GetPagedAsync(
        ReturnQueryDto query,
        long? customerIdFilter = null,
        long? sellerIdFilter = null,
        CancellationToken cancellationToken = default)
    {
        var baseQuery = _context.ReturnRequests
            .AsNoTracking()
            .Include(r => r.SellerOrder)
                .ThenInclude(so => so.Order)
            .Include(r => r.Customer)
            .Include(r => r.Items)
                .ThenInclude(i => i.OrderItem)
            .Include(r => r.Items)
                .ThenInclude(i => i.RestockLocation)
            .AsQueryable();

        if (customerIdFilter.HasValue)
        {
            baseQuery = baseQuery.Where(r => r.CustomerId == customerIdFilter.Value);
        }

        if (sellerIdFilter.HasValue)
        {
            baseQuery = baseQuery.Where(r => r.SellerOrder.SellerId == sellerIdFilter.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.Status))
        {
            baseQuery = baseQuery.Where(r => r.Status == query.Status);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLower();
            baseQuery = baseQuery.Where(r =>
                r.RequestCode.ToLower().Contains(search) ||
                r.SellerOrder.Order.OrderCode.ToLower().Contains(search));
        }

        var projected = baseQuery
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new ReturnRequestDto
            {
                ReturnRequestId = r.ReturnRequestId,
                RequestCode = r.RequestCode,
                SellerOrderId = r.SellerOrderId,
                OrderId = r.SellerOrder.OrderId,
                OrderCode = r.SellerOrder.Order.OrderCode,
                CustomerId = r.CustomerId,
                CustomerName = r.Customer.FullName,
                SellerId = r.SellerOrder.SellerId,
                Reason = r.Reason,
                Status = r.Status,
                ReviewedBy = r.ReviewedBy,
                ReviewedAt = r.ReviewedAt,
                RejectReason = r.RejectReason,
                CreatedAt = r.CreatedAt,
                UpdatedAt = r.UpdatedAt,
                Items = r.Items.Select(i => new ReturnItemDto
                {
                    ReturnItemId = i.ReturnItemId,
                    OrderItemId = i.OrderItemId,
                    VariantId = i.OrderItem.VariantId,
                    ProductName = i.OrderItem.ProductNameSnapshot,
                    SKU = i.OrderItem.SKUSnapshot,
                    UnitPrice = i.OrderItem.UnitPrice,
                    Quantity = i.Quantity,
                    InspectionResult = i.InspectionResult,
                    InspectionNote = i.InspectionNote,
                    InspectedBy = i.InspectedBy,
                    InspectedAt = i.InspectedAt,
                    RestockLocationId = i.RestockLocationId,
                    RestockLocationCode = i.RestockLocation != null ? i.RestockLocation.LocationCode : null
                }).ToList()
            });

        return await projected.ToPagedResultAsync(query, cancellationToken);
    }

    public async Task<ReturnRequest?> GetByIdWithDetailsAsync(
        long returnRequestId,
        CancellationToken cancellationToken = default)
        => await _context.ReturnRequests
            .Include(r => r.SellerOrder)
                .ThenInclude(so => so.Order)
                    .ThenInclude(o => o.Payments)
            .Include(r => r.Customer)
            .Include(r => r.Items)
                .ThenInclude(i => i.OrderItem)
            .Include(r => r.Items)
                .ThenInclude(i => i.RestockLocation)
            .FirstOrDefaultAsync(r => r.ReturnRequestId == returnRequestId, cancellationToken);

    public async Task<ReturnRequestDto?> GetDtoByIdAsync(
        long returnRequestId,
        CancellationToken cancellationToken = default)
    {
        var r = await _context.ReturnRequests
            .AsNoTracking()
            .Include(x => x.SellerOrder)
                .ThenInclude(so => so.Order)
            .Include(x => x.Customer)
            .Include(x => x.Items)
                .ThenInclude(i => i.OrderItem)
            .Include(x => x.Items)
                .ThenInclude(i => i.RestockLocation)
            .FirstOrDefaultAsync(x => x.ReturnRequestId == returnRequestId, cancellationToken);

        if (r == null) return null;

        return new ReturnRequestDto
        {
            ReturnRequestId = r.ReturnRequestId,
            RequestCode = r.RequestCode,
            SellerOrderId = r.SellerOrderId,
            OrderId = r.SellerOrder.OrderId,
            OrderCode = r.SellerOrder.Order.OrderCode,
            CustomerId = r.CustomerId,
            CustomerName = r.Customer.FullName,
            SellerId = r.SellerOrder.SellerId,
            Reason = r.Reason,
            Status = r.Status,
            ReviewedBy = r.ReviewedBy,
            ReviewedAt = r.ReviewedAt,
            RejectReason = r.RejectReason,
            CreatedAt = r.CreatedAt,
            UpdatedAt = r.UpdatedAt,
            Items = r.Items.Select(i => new ReturnItemDto
            {
                ReturnItemId = i.ReturnItemId,
                OrderItemId = i.OrderItemId,
                VariantId = i.OrderItem.VariantId,
                ProductName = i.OrderItem.ProductNameSnapshot,
                SKU = i.OrderItem.SKUSnapshot,
                UnitPrice = i.OrderItem.UnitPrice,
                Quantity = i.Quantity,
                InspectionResult = i.InspectionResult,
                InspectionNote = i.InspectionNote,
                InspectedBy = i.InspectedBy,
                InspectedAt = i.InspectedAt,
                RestockLocationId = i.RestockLocationId,
                RestockLocationCode = i.RestockLocation?.LocationCode
            }).ToList()
        };
    }

    public async Task<WarehouseLocation?> GetReturnZoneLocationAsync(
        long warehouseId,
        long? preferredLocationId,
        CancellationToken cancellationToken = default)
    {
        if (preferredLocationId.HasValue)
        {
            return await _context.WarehouseLocations
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    l => l.LocationId == preferredLocationId.Value &&
                         l.WarehouseId == warehouseId &&
                         l.StorageType == StorageTypes.Returns &&
                         l.IsActive,
                    cancellationToken);
        }

        return await _context.WarehouseLocations
            .AsNoTracking()
            .Where(l => l.WarehouseId == warehouseId && l.StorageType == StorageTypes.Returns && l.IsActive)
            .OrderBy(l => l.LocationId)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<WarehouseLocation?> GetLocationByIdAsync(long locationId, CancellationToken cancellationToken = default)
        => await _context.WarehouseLocations.AsNoTracking().FirstOrDefaultAsync(l => l.LocationId == locationId, cancellationToken);

    public async Task AddAsync(ReturnRequest returnRequest, CancellationToken cancellationToken = default)
        => await _context.ReturnRequests.AddAsync(returnRequest, cancellationToken);
}
