using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Shipping;
using ECommerceWarehouse.Domain.Entities.Order;
using ECommerceWarehouse.Domain.Entities.Review;
using ECommerceWarehouse.Infrastructure.Data;
using ECommerceWarehouse.Infrastructure.Extensions;
using Microsoft.EntityFrameworkCore;

namespace ECommerceWarehouse.Infrastructure.Repositories;

public class ShipmentRepository : IShipmentRepository
{
    private readonly ApplicationDbContext _context;

    public ShipmentRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<CarrierDto>> GetActiveCarriersAsync(CancellationToken cancellationToken = default)
        => await _context.Carriers
            .AsNoTracking()
            .Where(c => c.IsActive)
            .OrderBy(c => c.CarrierId)
            .Select(c => new CarrierDto
            {
                CarrierId = c.CarrierId,
                CarrierCode = c.CarrierCode,
                CarrierName = c.CarrierName,
                IsActive = c.IsActive
            })
            .ToListAsync(cancellationToken);

    public async Task<List<CarrierDto>> GetAllCarriersAsync(CancellationToken cancellationToken = default)
        => await _context.Carriers
            .AsNoTracking()
            .OrderBy(c => c.CarrierId)
            .Select(c => new CarrierDto
            {
                CarrierId = c.CarrierId,
                CarrierCode = c.CarrierCode,
                CarrierName = c.CarrierName,
                IsActive = c.IsActive
            })
            .ToListAsync(cancellationToken);

    public async Task<Carrier?> GetCarrierByIdAsync(int carrierId, CancellationToken cancellationToken = default)
        => await _context.Carriers.AsNoTracking().FirstOrDefaultAsync(c => c.CarrierId == carrierId, cancellationToken);

    public async Task<Carrier?> GetCarrierByIdForUpdateAsync(int carrierId, CancellationToken cancellationToken = default)
        => await _context.Carriers.FirstOrDefaultAsync(c => c.CarrierId == carrierId, cancellationToken);

    public Task<bool> CarrierCodeExistsAsync(string carrierCode, int? excludeCarrierId = null, CancellationToken cancellationToken = default)
        => _context.Carriers.AnyAsync(
            c => c.CarrierCode == carrierCode && (!excludeCarrierId.HasValue || c.CarrierId != excludeCarrierId.Value),
            cancellationToken);

    public async Task AddCarrierAsync(Carrier carrier, CancellationToken cancellationToken = default)
        => await _context.Carriers.AddAsync(carrier, cancellationToken);

    public async Task<PagedResult<ShipmentDto>> GetPagedAsync(
        ShipmentQueryDto query,
        CancellationToken cancellationToken = default)
    {
        var baseQuery = _context.Shipments
            .AsNoTracking()
            .Include(s => s.Carrier)
            .Include(s => s.SellerOrder)
                .ThenInclude(so => so.Order)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Status))
        {
            baseQuery = baseQuery.Where(s => s.ShippingStatus == query.Status);
        }

        if (query.CarrierId.HasValue)
        {
            baseQuery = baseQuery.Where(s => s.CarrierId == query.CarrierId.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLower();
            baseQuery = baseQuery.Where(s =>
                (s.TrackingNumber != null && s.TrackingNumber.ToLower().Contains(search)) ||
                s.SellerOrder.Order.OrderCode.ToLower().Contains(search));
        }

        var projected = baseQuery
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => new ShipmentDto
            {
                ShipmentId = s.ShipmentId,
                SellerOrderId = s.SellerOrderId,
                OrderId = s.SellerOrder.OrderId,
                OrderCode = s.SellerOrder.Order.OrderCode,
                CarrierId = s.CarrierId,
                CarrierCode = s.Carrier != null ? s.Carrier.CarrierCode : null,
                CarrierName = s.Carrier != null ? s.Carrier.CarrierName : null,
                TrackingNumber = s.TrackingNumber,
                ShippingStatus = s.ShippingStatus,
                CodAmount = s.CodAmount,
                FailedReason = s.FailedReason,
                ShippedAt = s.ShippedAt,
                DeliveredAt = s.DeliveredAt,
                CreatedAt = s.CreatedAt,
                UpdatedAt = s.UpdatedAt
            });

        return await projected.ToPagedResultAsync(query, cancellationToken);
    }

    public async Task<Shipment?> GetByIdWithOrderAsync(long shipmentId, CancellationToken cancellationToken = default)
        => await _context.Shipments
            .Include(s => s.Carrier)
            .Include(s => s.SellerOrder)
                .ThenInclude(so => so.Items)
            .Include(s => s.SellerOrder)
                .ThenInclude(so => so.Order)
                    .ThenInclude(o => o.SellerOrders)
            .Include(s => s.SellerOrder)
                .ThenInclude(so => so.Order)
                    .ThenInclude(o => o.Payments)
            .FirstOrDefaultAsync(s => s.ShipmentId == shipmentId, cancellationToken);

    public async Task<long?> GetReturnLocationIdAsync(long warehouseId, CancellationToken cancellationToken = default)
        => await _context.WarehouseLocations
            .AsNoTracking()
            .Where(l => l.WarehouseId == warehouseId && l.IsActive && l.StorageType == Domain.Constants.StorageTypes.Returns)
            .Select(l => (long?)l.LocationId)
            .FirstOrDefaultAsync(cancellationToken);

    public async Task AddReturnReceiptAsync(Domain.Entities.Warehouse.InventoryReceipt receipt, CancellationToken cancellationToken = default)
        => await _context.InventoryReceipts.AddAsync(receipt, cancellationToken);

    public async Task<ShipmentDto?> GetDtoByIdAsync(long shipmentId, CancellationToken cancellationToken = default)
    {
        var s = await _context.Shipments
            .AsNoTracking()
            .Include(x => x.Carrier)
            .Include(x => x.SellerOrder)
                .ThenInclude(so => so.Order)
            .FirstOrDefaultAsync(x => x.ShipmentId == shipmentId, cancellationToken);

        return s == null ? null : MapToDto(s);
    }

    public async Task<ShipmentDto?> GetByTrackingForCustomerAsync(
        long customerId,
        string trackingNumber,
        CancellationToken cancellationToken = default)
    {
        var s = await _context.Shipments
            .AsNoTracking()
            .Include(x => x.Carrier)
            .Include(x => x.SellerOrder)
                .ThenInclude(so => so.Order)
            .FirstOrDefaultAsync(
                x => x.TrackingNumber == trackingNumber && x.SellerOrder.Order.CustomerId == customerId,
                cancellationToken);

        return s == null ? null : MapToDto(s);
    }

    public async Task<SellerOrder?> GetSellerOrderForShipmentAsync(
        long sellerOrderId,
        CancellationToken cancellationToken = default)
        => await _context.SellerOrders
            .Include(so => so.Order)
                .ThenInclude(o => o.Payments)
            .Include(so => so.Shipments)
            .FirstOrDefaultAsync(so => so.SellerOrderId == sellerOrderId, cancellationToken);

    public async Task<bool> TrackingNumberExistsAsync(
        int carrierId,
        string trackingNumber,
        CancellationToken cancellationToken = default)
        => await _context.Shipments
            .AsNoTracking()
            .AnyAsync(s => s.CarrierId == carrierId && s.TrackingNumber == trackingNumber, cancellationToken);

    public async Task AddShipmentAsync(Shipment shipment, CancellationToken cancellationToken = default)
        => await _context.Shipments.AddAsync(shipment, cancellationToken);

    private static ShipmentDto MapToDto(Shipment s) => new()
    {
        ShipmentId = s.ShipmentId,
        SellerOrderId = s.SellerOrderId,
        OrderId = s.SellerOrder.OrderId,
        OrderCode = s.SellerOrder.Order.OrderCode,
        CarrierId = s.CarrierId,
        CarrierCode = s.Carrier?.CarrierCode,
        CarrierName = s.Carrier?.CarrierName,
        TrackingNumber = s.TrackingNumber,
        ShippingStatus = s.ShippingStatus,
        CodAmount = s.CodAmount,
        FailedReason = s.FailedReason,
        ShippedAt = s.ShippedAt,
        DeliveredAt = s.DeliveredAt,
        CreatedAt = s.CreatedAt,
        UpdatedAt = s.UpdatedAt
    };
}
