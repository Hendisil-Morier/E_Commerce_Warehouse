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
        string? contentRootPath = null)
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

        services.AddScoped<ISellerRepository, SellerRepository>();
        services.AddScoped<IShopRepository, ShopRepository>();
        services.AddScoped<ICategoryRepository, CategoryRepository>();
        services.AddScoped<IProductRepository, ProductRepository>();
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
