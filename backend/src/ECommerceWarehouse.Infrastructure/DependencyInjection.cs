using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.Contracts.Services;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Infrastructure.Data;
using ECommerceWarehouse.Infrastructure.Repositories;
using ECommerceWarehouse.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ECommerceWarehouse.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration,
        string? contentRootPath = null,
        bool isDevelopment = false)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseMySql(
                connectionString,
                ServerVersion.AutoDetect(connectionString),
                mySqlOptions => mySqlOptions.EnableRetryOnFailure(3)
            ));

        var fileStorageOptions = BuildFileStorageOptions(configuration, contentRootPath);
        services.AddSingleton(fileStorageOptions);
        services.AddScoped<IFileStorageService, LocalFileStorageService>();

        var emailSection = configuration.GetSection(EmailSettings.SectionName);
        var emailSettings = new EmailSettings
        {
            Host = emailSection[nameof(EmailSettings.Host)]?.Trim() ?? string.Empty,
            Port = int.TryParse(emailSection[nameof(EmailSettings.Port)], out var port) && port > 0 ? port : 587,
            User = emailSection[nameof(EmailSettings.User)]?.Trim() ?? string.Empty,
            Password = emailSection[nameof(EmailSettings.Password)] ?? string.Empty,
            FromName = string.IsNullOrWhiteSpace(emailSection[nameof(EmailSettings.FromName)])
                ? "KHO SÀN+"
                : emailSection[nameof(EmailSettings.FromName)]!.Trim(),
            FromAddress = emailSection[nameof(EmailSettings.FromAddress)]?.Trim() ?? string.Empty,
            IsDevelopment = isDevelopment
        };
        if (!isDevelopment &&
            (string.IsNullOrWhiteSpace(emailSettings.Host) ||
             string.IsNullOrWhiteSpace(emailSettings.User) ||
             string.IsNullOrWhiteSpace(emailSettings.Password) ||
             string.IsNullOrWhiteSpace(emailSettings.FromAddress)))
        {
            throw new InvalidOperationException(
                "EmailSettings SMTP chưa được cấu hình đầy đủ (Host, User, Password, FromAddress) cho môi trường hiện tại.");
        }
        services.AddSingleton(emailSettings);
        services.AddSingleton<IEmailSender, MailKitEmailSender>();
        services.AddScoped<IGoogleTokenValidator, GoogleTokenValidator>();

        services.AddScoped<ISellerRepository, SellerRepository>();
        services.AddScoped<IShopRepository, ShopRepository>();
        services.AddScoped<ICategoryRepository, CategoryRepository>();
        services.AddScoped<IProductRepository, ProductRepository>();
        services.AddScoped<ICartRepository, CartRepository>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IWarehouseRepository, WarehouseRepository>();
        services.AddScoped<IInventoryRepository, InventoryRepository>();
        services.AddScoped<IReceiptRepository, ReceiptRepository>();
        services.AddScoped<IOrderRepository, OrderRepository>();
        services.AddScoped<IInventoryIssueRepository, InventoryIssueRepository>();
        services.AddScoped<IShipmentRepository, ShipmentRepository>();
        services.AddScoped<IReturnRepository, ReturnRepository>();
        services.AddScoped<IRefundRepository, RefundRepository>();
        services.AddScoped<IStockCountRepository, StockCountRepository>();
        services.AddScoped<IStockTransferRepository, StockTransferRepository>();
        services.AddScoped<IDashboardRepository, DashboardRepository>();
        services.AddScoped<IReviewRepository, ReviewRepository>();
        services.AddScoped<IWishlistRepository, WishlistRepository>();
        services.AddScoped<ISettlementRepository, SettlementRepository>();
        services.AddScoped<IUnitOfWork, ECommerceWarehouse.Infrastructure.UnitOfWork.UnitOfWork>();
        services.AddScoped<IAuthService, AuthService>();
        return services;
    }

    private static FileStorageOptions BuildFileStorageOptions(IConfiguration configuration, string? contentRootPath)
    {
        var section = configuration.GetSection(FileStorageOptions.SectionName);
        var uploadRootPath = section[nameof(FileStorageOptions.UploadRootPath)];
        var requestPath = section[nameof(FileStorageOptions.RequestPath)];
        var maxSizeRaw = section[nameof(FileStorageOptions.MaxImageSizeBytes)];

        var normalizedUploadRoot = string.IsNullOrWhiteSpace(uploadRootPath)
            ? "wwwroot/uploads"
            : uploadRootPath.Trim();

        var baseRoot = string.IsNullOrWhiteSpace(contentRootPath)
            ? Directory.GetCurrentDirectory()
            : contentRootPath;

        var resolvedRootPath = Path.IsPathRooted(normalizedUploadRoot)
            ? Path.GetFullPath(normalizedUploadRoot)
            : Path.GetFullPath(Path.Combine(baseRoot, normalizedUploadRoot));

        var maxImageSizeBytes = long.TryParse(maxSizeRaw, out var parsed) && parsed > 0
            ? parsed
            : 5 * 1024 * 1024;

        return new FileStorageOptions
        {
            UploadRootPath = normalizedUploadRoot,
            RequestPath = string.IsNullOrWhiteSpace(requestPath) ? "/uploads" : requestPath.Trim(),
            MaxImageSizeBytes = maxImageSizeBytes,
            ResolvedRootPath = resolvedRootPath
        };
    }
}
