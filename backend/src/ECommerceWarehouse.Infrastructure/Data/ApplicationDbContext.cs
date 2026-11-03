
using Microsoft.EntityFrameworkCore;

namespace ECommerceWarehouse.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    // Identity
    // Sẽ khai báo DbSet khi tạo các Entity.

    // Product Catalog
    // Sẽ khai báo DbSet cho Products, Categories...

    // Orders
    // Sẽ khai báo DbSet cho Orders, SellerOrders...

    // Warehouse
    // Sẽ khai báo DbSet cho Warehouses, Inventory...

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Áp dụng cấu hình Entity từ thư mục Configurations.
        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(ApplicationDbContext).Assembly);
    }
}
