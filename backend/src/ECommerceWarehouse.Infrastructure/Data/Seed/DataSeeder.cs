using ECommerceWarehouse.Domain.Entities.Identity;
using ECommerceWarehouse.Domain.Entities.Seller;
using ECommerceWarehouse.Domain.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace ECommerceWarehouse.Infrastructure.Data.Seed;

public static class DataSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var configuration = scope.ServiceProvider.GetService<IConfiguration>();
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

            // 2. Lấy mật khẩu seed mẫu từ cấu hình dev (không ghi cứng mật khẩu thật trong code)
            var seedPassword = configuration?["SeedSettings:DefaultPassword"];
            if (string.IsNullOrWhiteSpace(seedPassword))
            {
                var env = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
                if (!string.Equals(env, "Development", StringComparison.OrdinalIgnoreCase))
                {
                    logger?.LogInformation("[DataSeeder] Bỏ qua seed tài khoản mẫu ngoài môi trường Development.");
                    return;
                }

                // Hằng fallback chỉ dùng cho môi trường dev cục bộ khi chưa cấu hình SeedSettings
                seedPassword = "DevSeed@123";
            }

            var allRoles = await context.Roles.ToDictionaryAsync(r => r.RoleName, r => r.RoleId);
            var passwordHasher = new PasswordHasher<User>();

            // 3. Seed 5 tài khoản mẫu cho 4 vai trò (bao gồm manager1 & manager2 cho nghiệp vụ tách quyền kho)
            var demoUsers = new List<(string Email, string Username, string FullName, string RoleName)>
            {
                ("admin@gmail.com", "admin", "Quản trị viên Hệ thống", "Admin"),
                ("manager1@gmail.com", "manager1", "Nguyễn Văn Kho 1 (Thủ kho 1)", "WarehouseManager"),
                ("manager2@gmail.com", "manager2", "Trần Văn Kho 2 (Thủ kho 2)", "WarehouseManager"),
                ("seller@gmail.com", "seller", "Trần Thị Shop (Người bán)", "Seller"),
                ("customer@gmail.com", "customer", "Lê Hoàng Khách (Khách hàng)", "Customer"),
            };

            var createdCount = 0;
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
                    user.PasswordHash = passwordHasher.HashPassword(user, seedPassword);

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
                            Status = SellerStatus.Approved,
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

            if (createdCount > 0)
            {
                logger?.LogInformation("[DataSeeder] Đã nạp {Count} tài khoản mẫu mới vào CSDL.", createdCount);
            }
        }
        catch (Exception ex)
        {
            logger?.LogWarning(ex, "[DataSeeder] Lỗi xảy ra trong quá trình seed dữ liệu ban đầu.");
        }
    }
}
