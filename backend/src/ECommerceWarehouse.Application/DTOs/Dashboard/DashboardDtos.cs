namespace ECommerceWarehouse.Application.DTOs.Dashboard;

public class AdminDashboardDto
{
    public int TotalUsers { get; set; }
    public int TotalSellers { get; set; }
    public int PendingSellers { get; set; }
    public int TotalProducts { get; set; }
    public int PendingProducts { get; set; }
    public int TotalOrders { get; set; }
    public int ActiveOrders { get; set; }
    public decimal TotalRevenue { get; set; }
    public int PendingRefunds { get; set; }
    public decimal PendingRefundAmount { get; set; }
}

public class SellerDashboardDto
{
    public int TotalProducts { get; set; }
    public int ApprovedProducts { get; set; }
    public int PendingProducts { get; set; }
    public int TotalOrders { get; set; }
    public int PendingOrders { get; set; }
    public int CompletedOrders { get; set; }
    public decimal TotalRevenue { get; set; }
    public int OpenReturns { get; set; }
    public int LowStockVariantCount { get; set; }
}

public class WarehouseDashboardDto
{
    public int TotalWarehouses { get; set; }
    public int TotalLocations { get; set; }
    public int DraftReceipts { get; set; }
    public int PendingIssues { get; set; }
    public int PendingStockCounts { get; set; }
    public int InTransitTransfers { get; set; }
    public List<LowStockAlertItemDto> LowStockItems { get; set; } = [];
}

public class LowStockAlertItemDto
{
    public long WarehouseId { get; set; }
    public string WarehouseName { get; set; } = null!;
    public long LocationId { get; set; }
    public string LocationCode { get; set; } = null!;
    public long VariantId { get; set; }
    public string SKU { get; set; } = null!;
    public string ProductName { get; set; } = null!;
    public int QuantityOnHand { get; set; }
    public int QuantityReserved { get; set; }
    public int AvailableQuantity { get; set; }
}
