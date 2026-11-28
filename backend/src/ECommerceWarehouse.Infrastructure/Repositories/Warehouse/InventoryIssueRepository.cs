using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Warehouse;
using ECommerceWarehouse.Domain.Entities.Warehouse;
using ECommerceWarehouse.Infrastructure.Data;
using ECommerceWarehouse.Infrastructure.Extensions;
using Microsoft.EntityFrameworkCore;

namespace ECommerceWarehouse.Infrastructure.Repositories;

public class InventoryIssueRepository : IInventoryIssueRepository
{
    private readonly ApplicationDbContext _context;

    public InventoryIssueRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<IssueDto>> GetPagedAsync(
        IssueQueryDto query,
        CancellationToken cancellationToken = default)
    {
        var baseQuery = _context.InventoryIssues
            .AsNoTracking()
            .Include(i => i.Warehouse)
            .Include(i => i.SellerOrder)
                .ThenInclude(so => so!.Order)
            .Include(i => i.CreatedByUser)
            .Include(i => i.ApprovedByUser)
            .Include(i => i.DispatchedByUser)
            .Include(i => i.Details)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Status))
        {
            baseQuery = baseQuery.Where(i => i.Status == query.Status);
        }

        if (query.WarehouseId.HasValue)
        {
            baseQuery = baseQuery.Where(i => i.WarehouseId == query.WarehouseId.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLower();
            baseQuery = baseQuery.Where(i =>
                i.IssueCode.ToLower().Contains(search) ||
                (i.SellerOrder != null && i.SellerOrder.Order.OrderCode.ToLower().Contains(search)));
        }

        var projected = baseQuery
            .OrderByDescending(i => i.CreatedAt)
            .Select(i => new IssueDto
            {
                IssueId = i.IssueId,
                IssueCode = i.IssueCode,
                WarehouseId = i.WarehouseId,
                WarehouseName = i.Warehouse.WarehouseName,
                SellerOrderId = i.SellerOrderId,
                OrderCode = i.SellerOrder != null ? i.SellerOrder.Order.OrderCode : null,
                IssueType = i.IssueType,
                Status = i.Status,
                Note = i.Note,
                CreatedBy = i.CreatedBy,
                CreatedByName = i.CreatedByUser.FullName,
                ApprovedBy = i.ApprovedBy,
                ApprovedByName = i.ApprovedByUser != null ? i.ApprovedByUser.FullName : null,
                DispatchedBy = i.DispatchedBy,
                DispatchedByName = i.DispatchedByUser != null ? i.DispatchedByUser.FullName : null,
                CreatedAt = i.CreatedAt,
                ApprovedAt = i.ApprovedAt,
                DispatchedAt = i.DispatchedAt,
                TotalQuantity = i.Details.Sum(d => d.Quantity),
                TotalPickedQuantity = i.Details.Sum(d => d.PickedQuantity)
            });

        return await projected.ToPagedResultAsync(query, cancellationToken);
    }

    public async Task<InventoryIssue?> GetByIdWithDetailsAsync(
        long issueId,
        CancellationToken cancellationToken = default)
        => await _context.InventoryIssues
            .Include(i => i.Warehouse)
            .Include(i => i.SellerOrder)
                .ThenInclude(so => so!.Order)
                    .ThenInclude(o => o.SellerOrders)
            .Include(i => i.SellerOrder)
                .ThenInclude(so => so!.Order)
                    .ThenInclude(o => o.Payments)
            .Include(i => i.Details)
                .ThenInclude(d => d.Variant)
                    .ThenInclude(v => v.Product)
            .Include(i => i.Details)
                .ThenInclude(d => d.Location)
            .Include(i => i.Details)
                .ThenInclude(d => d.Reservation)
            .FirstOrDefaultAsync(i => i.IssueId == issueId, cancellationToken);

    public async Task<IssueDto?> GetDtoByIdAsync(
        long issueId,
        CancellationToken cancellationToken = default)
    {
        var issue = await _context.InventoryIssues
            .AsNoTracking()
            .Include(i => i.Warehouse)
            .Include(i => i.SellerOrder)
                .ThenInclude(so => so!.Order)
            .Include(i => i.CreatedByUser)
            .Include(i => i.ApprovedByUser)
            .Include(i => i.DispatchedByUser)
            .Include(i => i.Details)
                .ThenInclude(d => d.Variant)
                    .ThenInclude(v => v.Product)
            .Include(i => i.Details)
                .ThenInclude(d => d.Location)
            .FirstOrDefaultAsync(i => i.IssueId == issueId, cancellationToken);

        if (issue == null) return null;

        return new IssueDto
        {
            IssueId = issue.IssueId,
            IssueCode = issue.IssueCode,
            WarehouseId = issue.WarehouseId,
            WarehouseName = issue.Warehouse.WarehouseName,
            SellerOrderId = issue.SellerOrderId,
            OrderCode = issue.SellerOrder?.Order.OrderCode,
            IssueType = issue.IssueType,
            Status = issue.Status,
            Note = issue.Note,
            CreatedBy = issue.CreatedBy,
            CreatedByName = issue.CreatedByUser.FullName,
            ApprovedBy = issue.ApprovedBy,
            ApprovedByName = issue.ApprovedByUser?.FullName,
            DispatchedBy = issue.DispatchedBy,
            DispatchedByName = issue.DispatchedByUser?.FullName,
            CreatedAt = issue.CreatedAt,
            ApprovedAt = issue.ApprovedAt,
            DispatchedAt = issue.DispatchedAt,
            TotalQuantity = issue.Details.Sum(d => d.Quantity),
            TotalPickedQuantity = issue.Details.Sum(d => d.PickedQuantity),
            Details = issue.Details.Select(d => new IssueDetailDto
            {
                IssueDetailId = d.IssueDetailId,
                VariantId = d.VariantId,
                SKU = d.Variant.SKU,
                Barcode = d.Variant.Barcode,
                ProductName = d.Variant.Product.ProductName,
                VariantName = d.Variant.VariantName,
                LocationId = d.LocationId,
                LocationCode = d.Location.LocationCode,
                Quantity = d.Quantity,
                PickedQuantity = d.PickedQuantity,
                ReservationId = d.ReservationId
            }).ToList()
        };
    }

    public async Task<bool> ExistsForSellerOrderAsync(long sellerOrderId, CancellationToken cancellationToken = default)
        => await _context.InventoryIssues
            .AsNoTracking()
            .AnyAsync(i => i.SellerOrderId == sellerOrderId && i.Status != "Cancelled", cancellationToken);

    public async Task AddAsync(InventoryIssue issue, CancellationToken cancellationToken = default)
        => await _context.InventoryIssues.AddAsync(issue, cancellationToken);
}
