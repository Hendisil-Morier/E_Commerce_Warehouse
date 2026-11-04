
using Microsoft.EntityFrameworkCore;

namespace ECommerceWarehouse.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

   // 1. Identity & Sellers
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Seller> Sellers => Set<Seller>();
    public DbSet<Shop> Shops => Set<Shop>();    

    // 2. Product Catalog
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductVariant> ProductVariants => Set<ProductVariant>();
    public DbSet<ProductImage> ProductImages => Set<ProductImage>();

    // 3. Customer Interactions
    public DbSet<UserAddress> UserAddresses => Set<UserAddress>();
    public DbSet<Cart> Carts => Set<Cart>();
    public DbSet<CartItem> CartItems => Set<CartItem>();
    public DbSet<Wishlist> Wishlists => Set<Wishlist>();
    public DbSet<WishlistItem> WishlistItems => Set<WishlistItem>();

    // 4. Orders & Payments
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<SellerOrder> SellerOrders => Set<SellerOrder>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<OrderStatusHistory> OrderStatusHistories => Set<OrderStatusHistory>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Refund> Refunds => Set<Refund>();

    // 5. Warehouse & Inventory
    public DbSet<Warehouse> Warehouses => Set<Warehouse>();
    public DbSet<WarehouseLocation> WarehouseLocations => Set<WarehouseLocation>();
    public DbSet<Inventory> Inventories => Set<Inventory>();
    public DbSet<StockReservation> StockReservations => Set<StockReservation>();
    public DbSet<InventoryReceipt> InventoryReceipts => Set<InventoryReceipt>();
    public DbSet<ReceiptDetail> ReceiptDetails => Set<ReceiptDetail>();
    public DbSet<InventoryIssue> InventoryIssues => Set<InventoryIssue>();
    public DbSet<IssueDetail> IssueDetails => Set<IssueDetail>();
    public DbSet<StockTransfer> StockTransfers => Set<StockTransfer>();
    public DbSet<StockTransferDetail> StockTransferDetails => Set<StockTransferDetail>();
    public DbSet<StockCount> StockCounts => Set<StockCount>();
    public DbSet<StockCountDetail> StockCountDetails => Set<StockCountDetail>();
    public DbSet<StockMovement> StockMovements => Set<StockMovement>();

    // Views
    public DbSet<VariantAvailabilityView> VariantAvailabilities => Set<VariantAvailabilityView>();
    public DbSet<StockReconciliationView> StockReconciliations => Set<StockReconciliationView>();
    
    // 6. Shipping, Returns & Reviews
    public DbSet<Carrier> Carriers => Set<Carrier>();
    public DbSet<Shipment> Shipments => Set<Shipment>();
    public DbSet<ReturnRequest> ReturnRequests => Set<ReturnRequest>();
    public DbSet<ReturnRequestItem> ReturnRequestItems => Set<ReturnRequestItem>();
    public DbSet<Review> Reviews => Set<Review>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Áp dụng cấu hình Entity từ thư mục Configurations.
        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(ApplicationDbContext).Assembly);
    }
}
