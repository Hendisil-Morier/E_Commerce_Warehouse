using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.DTOs.Dashboard;
using ECommerceWarehouse.Domain.Constants;
using ECommerceWarehouse.Domain.Enums;
using ECommerceWarehouse.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ECommerceWarehouse.Infrastructure.Repositories;

public class DashboardRepository : IDashboardRepository
{
    private readonly ApplicationDbContext _context;

    public DashboardRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<AdminDashboardDto> GetAdminDashboardAsync(CancellationToken cancellationToken = default)
    {
        var totalUsers = await _context.Users.CountAsync(cancellationToken);
        var totalSellers = await _context.Sellers.CountAsync(cancellationToken);
        var pendingSellers = await _context.Sellers.CountAsync(s => s.Status == SellerStatus.Pending, cancellationToken);
        var totalProducts = await _context.Products.CountAsync(cancellationToken);
        var pendingProducts = await _context.Products.CountAsync(p => p.ProductStatus == ProductStatus.PendingReview, cancellationToken);
        var totalOrders = await _context.Orders.CountAsync(cancellationToken);
        var activeOrders = await _context.Orders.CountAsync(
            o => o.OrderStatus != OrderStatuses.Cancelled
              && o.OrderStatus != OrderStatuses.Expired
              && o.OrderStatus != OrderStatuses.Completed,
            cancellationToken);

        var totalRevenue = await _context.Orders
            .Where(o => o.OrderStatus != OrderStatuses.Cancelled && o.OrderStatus != OrderStatuses.Expired)
            .SumAsync(o => (decimal?)o.TotalAmount, cancellationToken) ?? 0m;

        var pendingRefunds = await _context.Refunds.CountAsync(r => r.RefundStatus == RefundStatuses.Pending, cancellationToken);
        var pendingRefundAmount = await _context.Refunds
            .Where(r => r.RefundStatus == RefundStatuses.Pending)
            .SumAsync(r => (decimal?)r.Amount, cancellationToken) ?? 0m;

        return new AdminDashboardDto
        {
            TotalUsers = totalUsers,
            TotalSellers = totalSellers,
            PendingSellers = pendingSellers,
            TotalProducts = totalProducts,
            PendingProducts = pendingProducts,
            TotalOrders = totalOrders,
            ActiveOrders = activeOrders,
            TotalRevenue = totalRevenue,
            PendingRefunds = pendingRefunds,
            PendingRefundAmount = pendingRefundAmount
        };
    }

    public async Task<SellerDashboardDto> GetSellerDashboardAsync(
        long sellerId,
        int lowStockThreshold,
        CancellationToken cancellationToken = default)
    {
        var totalProducts = await _context.Products.CountAsync(p => p.Shop.SellerId == sellerId, cancellationToken);
        var approvedProducts = await _context.Products.CountAsync(
            p => p.Shop.SellerId == sellerId && p.ProductStatus == ProductStatus.Active,
            cancellationToken);
        var pendingProducts = await _context.Products.CountAsync(
            p => p.Shop.SellerId == sellerId && p.ProductStatus == ProductStatus.PendingReview,
            cancellationToken);

        var totalOrders = await _context.SellerOrders.CountAsync(so => so.SellerId == sellerId, cancellationToken);
        var pendingOrders = await _context.SellerOrders.CountAsync(
            so => so.SellerId == sellerId && so.Status == SellerOrderStatuses.Pending,
            cancellationToken);
        var completedOrders = await _context.SellerOrders.CountAsync(
            so => so.SellerId == sellerId && so.Status == SellerOrderStatuses.Delivered,
            cancellationToken);

        var totalRevenue = await _context.SellerOrders
            .Where(so => so.SellerId == sellerId && so.Status != SellerOrderStatuses.Cancelled)
            .SumAsync(so => (decimal?)so.Subtotal, cancellationToken) ?? 0m;

        var openReturns = await _context.ReturnRequests.CountAsync(
            rr => rr.SellerOrder.SellerId == sellerId
               && (rr.Status == ReturnStatuses.Requested
                || rr.Status == ReturnStatuses.Approved
                || rr.Status == ReturnStatuses.ItemsReceived),
            cancellationToken);

        var lowStockVariantCount = await _context.ProductVariants
            .Where(v => v.Product.Shop.SellerId == sellerId)
            .Select(v => new
            {
                v.VariantId,
                Available = _context.Inventories
                    .Where(i => i.VariantId == v.VariantId && i.Location.IsSellable)
                    .Sum(i => (int?)(i.QuantityOnHand - i.QuantityReserved)) ?? 0
            })
            .CountAsync(x => x.Available <= lowStockThreshold, cancellationToken);

        return new SellerDashboardDto
        {
            TotalProducts = totalProducts,
            ApprovedProducts = approvedProducts,
            PendingProducts = pendingProducts,
            TotalOrders = totalOrders,
            PendingOrders = pendingOrders,
            CompletedOrders = completedOrders,
            TotalRevenue = totalRevenue,
            OpenReturns = openReturns,
            LowStockVariantCount = lowStockVariantCount
        };
    }

    public async Task<WarehouseDashboardDto> GetWarehouseDashboardAsync(
        int lowStockThreshold,
        CancellationToken cancellationToken = default)
    {
        var totalWarehouses = await _context.Warehouses.CountAsync(w => w.IsActive, cancellationToken);
        var totalLocations = await _context.WarehouseLocations.CountAsync(l => l.IsActive, cancellationToken);
        var draftReceipts = await _context.InventoryReceipts.CountAsync(r => r.Status == ReceiptStatuses.Draft, cancellationToken);
        var pendingIssues = await _context.InventoryIssues.CountAsync(
            i => i.Status != IssueStatuses.Dispatched && i.Status != IssueStatuses.Cancelled,
            cancellationToken);
        var pendingStockCounts = await _context.StockCounts.CountAsync(
            c => c.Status == StockCountStatuses.Draft
              || c.Status == StockCountStatuses.Counting
              || c.Status == StockCountStatuses.PendingApproval,
            cancellationToken);
        var inTransitTransfers = await _context.StockTransfers.CountAsync(
            t => t.Status == StockTransferStatuses.InTransit,
            cancellationToken);

        var lowStockItems = await _context.Inventories
            .AsNoTracking()
            .Where(i => i.Location.IsSellable && (i.QuantityOnHand - i.QuantityReserved) <= lowStockThreshold)
            .OrderBy(i => i.QuantityOnHand - i.QuantityReserved)
            .Take(20)
            .Select(i => new LowStockAlertItemDto
            {
                WarehouseId = i.WarehouseId,
                WarehouseName = i.Location.Warehouse.WarehouseName,
                LocationId = i.LocationId,
                LocationCode = i.Location.LocationCode,
                VariantId = i.VariantId,
                SKU = i.Variant.SKU,
                ProductName = i.Variant.Product.ProductName,
                QuantityOnHand = i.QuantityOnHand,
                QuantityReserved = i.QuantityReserved,
                AvailableQuantity = i.QuantityOnHand - i.QuantityReserved
            })
            .ToListAsync(cancellationToken);

        return new WarehouseDashboardDto
        {
            TotalWarehouses = totalWarehouses,
            TotalLocations = totalLocations,
            DraftReceipts = draftReceipts,
            PendingIssues = pendingIssues,
            PendingStockCounts = pendingStockCounts,
            InTransitTransfers = inTransitTransfers,
            LowStockItems = lowStockItems
        };
    }
}
