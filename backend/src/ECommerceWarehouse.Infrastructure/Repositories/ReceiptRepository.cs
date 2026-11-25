using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Warehouse;
using ECommerceWarehouse.Domain.Entities.Warehouse;
using ECommerceWarehouse.Infrastructure.Data;
using ECommerceWarehouse.Infrastructure.Extensions;
using Microsoft.EntityFrameworkCore;

namespace ECommerceWarehouse.Infrastructure.Repositories;

public class ReceiptRepository : IReceiptRepository
{
    private readonly ApplicationDbContext _context;

    public ReceiptRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<ReceiptDto>> GetPagedAsync(
        ReceiptQueryDto query,
        CancellationToken cancellationToken = default)
    {
        var baseQuery = _context.InventoryReceipts
            .AsNoTracking()
            .Include(r => r.Warehouse)
            .Include(r => r.SenderSeller)
            .Include(r => r.CreatedByUser)
            .Include(r => r.ConfirmedByUser)
            .Include(r => r.Details)
            .AsQueryable();

        if (query.WarehouseId.HasValue)
        {
            baseQuery = baseQuery.Where(r => r.WarehouseId == query.WarehouseId.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.Status))
        {
            baseQuery = baseQuery.Where(r => r.Status == query.Status);
        }

        if (!string.IsNullOrWhiteSpace(query.ReceiptType))
        {
            baseQuery = baseQuery.Where(r => r.ReceiptType == query.ReceiptType);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLower();
            baseQuery = baseQuery.Where(r =>
                r.ReceiptCode.ToLower().Contains(search) ||
                (r.Note != null && r.Note.ToLower().Contains(search)));
        }

        var projected = baseQuery
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new ReceiptDto
            {
                ReceiptId = r.ReceiptId,
                ReceiptCode = r.ReceiptCode,
                WarehouseId = r.WarehouseId,
                WarehouseName = r.Warehouse.WarehouseName,
                ReceiptType = r.ReceiptType,
                Status = r.Status,
                SenderSellerId = r.SenderSellerId,
                SenderSellerName = r.SenderSeller != null ? r.SenderSeller.BusinessName : null,
                Note = r.Note,
                CreatedBy = r.CreatedBy,
                CreatedByName = r.CreatedByUser.FullName,
                ConfirmedBy = r.ConfirmedBy,
                ConfirmedByName = r.ConfirmedByUser != null ? r.ConfirmedByUser.FullName : null,
                CreatedAt = r.CreatedAt,
                ConfirmedAt = r.ConfirmedAt,
                TotalLines = r.Details.Count,
                TotalQuantity = r.Details.Sum(d => d.Quantity)
            });

        return await projected.ToPagedResultAsync(query, cancellationToken);
    }

    public async Task<InventoryReceipt?> GetByIdWithDetailsAsync(
        long receiptId,
        CancellationToken cancellationToken = default)
        => await _context.InventoryReceipts
            .Include(r => r.Warehouse)
            .Include(r => r.SenderSeller)
            .Include(r => r.CreatedByUser)
            .Include(r => r.ConfirmedByUser)
            .Include(r => r.Details)
                .ThenInclude(d => d.Variant)
                    .ThenInclude(v => v.Product)
            .Include(r => r.Details)
                .ThenInclude(d => d.Location)
            .FirstOrDefaultAsync(r => r.ReceiptId == receiptId, cancellationToken);

    public async Task<ReceiptDto?> GetDtoByIdAsync(long receiptId, CancellationToken cancellationToken = default)
    {
        var receipt = await _context.InventoryReceipts
            .AsNoTracking()
            .Include(r => r.Warehouse)
            .Include(r => r.SenderSeller)
            .Include(r => r.CreatedByUser)
            .Include(r => r.ConfirmedByUser)
            .Include(r => r.Details)
                .ThenInclude(d => d.Variant)
                    .ThenInclude(v => v.Product)
            .Include(r => r.Details)
                .ThenInclude(d => d.Location)
            .FirstOrDefaultAsync(r => r.ReceiptId == receiptId, cancellationToken);

        if (receipt == null) return null;

        return new ReceiptDto
        {
            ReceiptId = receipt.ReceiptId,
            ReceiptCode = receipt.ReceiptCode,
            WarehouseId = receipt.WarehouseId,
            WarehouseName = receipt.Warehouse.WarehouseName,
            ReceiptType = receipt.ReceiptType,
            Status = receipt.Status,
            SenderSellerId = receipt.SenderSellerId,
            SenderSellerName = receipt.SenderSeller?.BusinessName,
            Note = receipt.Note,
            CreatedBy = receipt.CreatedBy,
            CreatedByName = receipt.CreatedByUser.FullName,
            ConfirmedBy = receipt.ConfirmedBy,
            ConfirmedByName = receipt.ConfirmedByUser?.FullName,
            CreatedAt = receipt.CreatedAt,
            ConfirmedAt = receipt.ConfirmedAt,
            TotalLines = receipt.Details.Count,
            TotalQuantity = receipt.Details.Sum(d => d.Quantity),
            Details = receipt.Details.Select(d => new ReceiptDetailDto
            {
                ReceiptDetailId = d.ReceiptDetailId,
                VariantId = d.VariantId,
                SKU = d.Variant.SKU,
                ProductName = d.Variant.Product.ProductName,
                VariantName = d.Variant.VariantName,
                LocationId = d.LocationId,
                LocationCode = d.Location.LocationCode,
                Quantity = d.Quantity,
                UnitCost = d.UnitCost
            }).ToList()
        };
    }

    public async Task<bool> VariantExistsAsync(long variantId, CancellationToken cancellationToken = default)
        => await _context.ProductVariants.AsNoTracking().AnyAsync(v => v.VariantId == variantId, cancellationToken);

    public async Task<long?> GetVariantSellerIdAsync(long variantId, CancellationToken cancellationToken = default)
        => await _context.ProductVariants
            .AsNoTracking()
            .Where(v => v.VariantId == variantId)
            .Select(v => (long?)v.Product.Shop.SellerId)
            .FirstOrDefaultAsync(cancellationToken);

    public async Task AddAsync(InventoryReceipt receipt, CancellationToken cancellationToken = default)
        => await _context.InventoryReceipts.AddAsync(receipt, cancellationToken);

    public void Update(InventoryReceipt receipt)
        => _context.InventoryReceipts.Update(receipt);
}
