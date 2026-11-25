using ECommerceWarehouse.Domain.Entities.Catalog;
using ECommerceWarehouse.Domain.Entities.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace ECommerceWarehouse.Infrastructure.Data.Seed;

public static class DataSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var logger = scope.ServiceProvider.GetService<ILogger<ApplicationDbContext>>();

        try
        {
            if (!await context.Database.CanConnectAsync())
            {
                logger?.LogWarning("[DataSeeder] Không thể kết nối đến MySQL. Bỏ qua bước seed dữ liệu.");
                return;
            }

            // 1. Seed Roles nếu chưa có
            if (!await context.Roles.AnyAsync())
            {
                var roles = new List<Role>
                {
                    new() { RoleName = "Admin", Description = "Quản trị viên hệ thống" },
                    new() { RoleName = "WarehouseManager", Description = "Quản lý kho hàng" },
                    new() { RoleName = "WarehouseStaff", Description = "Nhân viên vận hành kho" },
                    new() { RoleName = "Seller", Description = "Đối tác người bán hàng" },
                    new() { RoleName = "Customer", Description = "Khách hàng mua sắm" },
                    new() { RoleName = "CustomerSupport", Description = "Hỗ trợ khách hàng" },
                };

                await context.Roles.AddRangeAsync(roles);
                await context.SaveChangesAsync();
            }

            // 2. Seed Danh mục gốc nếu chưa có
            if (!await context.Categories.AnyAsync())
            {
                var defaultCategories = new List<Category>
                {
                    new() { CategoryName = "Điện thoại & Phụ kiện", Description = "Điện thoại, ốp lưng, sạc, tai nghe", IsActive = true },
                    new() { CategoryName = "Máy tính & Laptop", Description = "Laptop, linh kiện, phụ kiện máy tính", IsActive = true },
                    new() { CategoryName = "Thời trang", Description = "Quần áo, giày dép, phụ kiện", IsActive = true },
                    new() { CategoryName = "Nhà cửa & Đời sống", Description = "Đồ gia dụng, nội thất, dụng cụ", IsActive = true },
                    new() { CategoryName = "Sức khỏe & Làm đẹp", Description = "Mỹ phẩm, chăm sóc cá nhân", IsActive = true },
                    new() { CategoryName = "Thực phẩm & Đồ uống", Description = "Thực phẩm khô, đồ uống, đồ ăn vặt", IsActive = true },
                };

                await context.Categories.AddRangeAsync(defaultCategories);
                await context.SaveChangesAsync();
            }
        }
        catch (Exception ex)
        {
            logger?.LogWarning(ex, "[DataSeeder] Lỗi xảy ra trong quá trình seed dữ liệu ban đầu.");
        }
    }
}
