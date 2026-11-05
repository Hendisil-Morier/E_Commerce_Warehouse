using ECommerceWarehouse.Domain.Entities.Identity;
using ECommerceWarehouse.Domain.Entities.Seller;
using Microsoft.AspNetCore.Identity;
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
            // Kiểm tra kết nối tới Database trước
            if (!await context.Database.CanConnectAsync())
            {
                Console.ForegroundColor = ConsoleColor.Yellow;
                Console.WriteLine(">>> [DataSeeder] Không thể kết nối đến MySQL. Bỏ qua bước seed dữ liệu.");
                Console.ResetColor();
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

            var allRoles = await context.Roles.ToDictionaryAsync(r => r.RoleName, r => r.RoleId);
            var passwordHasher = new PasswordHasher<User>();

            // 2. Seed 4 tài khoản mẫu cho 4 vai trò
            var demoUsers = new List<(string Email, string Username, string FullName, string RoleName)>
            {
                ("admin@emarket.vn", "admin", "Quản trị viên Hệ thống", "Admin"),
                ("warehouse@emarket.vn", "warehouse", "Nguyễn Văn Kho (Thủ kho)", "WarehouseManager"),
                ("seller@emarket.vn", "seller", "Trần Thị Shop (Người bán)", "Seller"),
                ("customer@gmail.com", "customer", "Lê Hoàng Khách (Khách hàng)", "Customer"),
            };

            int createdCount = 0;
            foreach (var (email, username, fullName, roleName) in demoUsers)
            {
                if (!await context.Users.AnyAsync(u => u.Email == email || u.Username == username))
                {
                    var user = new User
                    {
                        FullName = fullName,
                        Email = email,
                        Username = username,
                        PhoneNumber = "0988123456",
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    };
                    user.PasswordHash = passwordHasher.HashPassword(user, "Demo@123");

                    await context.Users.AddAsync(user);
                    await context.SaveChangesAsync();

                    if (allRoles.TryGetValue(roleName, out var roleId))
                    {
                        await context.UserRoles.AddAsync(new UserRole
                        {
                            UserId = user.UserId,
                            RoleId = roleId,
                            AssignedAt = DateTime.UtcNow
                        });
                    }

                    // Nếu là Seller thì tạo thêm bản ghi Seller & Shop mẫu
                    if (roleName == "Seller")
                    {
                        var seller = new Seller
                        {
                            UserId = user.UserId,
                            BusinessName = "Công ty TNHH Thiết Bị Số Modu+",
                            TaxCode = "0109988776",
                            Description = "Chuyên phân phối thiết bị công nghệ & gia dụng cao cấp.",
                            Status = "Approved",
                            ApprovedAt = DateTime.UtcNow,
                            CommissionRate = 5.00m,
                            CreatedAt = DateTime.UtcNow
                        };
                        await context.Sellers.AddAsync(seller);
                        await context.SaveChangesAsync();

                        var shop = new Shop
                        {
                            SellerId = seller.SellerId,
                            ShopName = "Modu Official Flagship Store",
                            Description = "Gian hàng chính hãng thiết bị công nghệ và đời sống",
                            IsActive = true,
                            CreatedAt = DateTime.UtcNow
                        };
                        await context.Shops.AddAsync(shop);
                    }

                    await context.SaveChangesAsync();
                    createdCount++;
                }
            }

            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine(">>> [DataSeeder] Hoàn tất nạp dữ liệu mẫu vào CSDL (Mật khẩu: Demo@123).");
            Console.ResetColor();
        }
        catch (Exception ex)
        {
            logger?.LogWarning(ex, "Lỗi xảy ra trong quá trình seed dữ liệu ban đầu.");
        }
    }
}
