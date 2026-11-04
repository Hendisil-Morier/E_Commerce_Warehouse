using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ECommerceWarehouse.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseMySql(
                connectionString,
                ServerVersion.AutoDetect(connectionString),
                mySqlOptions => mySqlOptions.EnableRetryOnFailure(3)
            ));

        services.AddScoped<IUnitOfWork, ECommerceWarehouse.Infrastructure.UnitOfWork.UnitOfWork>();
        services.AddScoped<IAuthService, AuthService>();
        return services;
    }
}
