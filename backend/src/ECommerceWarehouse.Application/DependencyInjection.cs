using ECommerceWarehouse.Application.Contracts.Services;
using ECommerceWarehouse.Application.Services;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace ECommerceWarehouse.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.TryAddSingleton(new FileStorageOptions());
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);
        services.AddScoped<IApprovedSellerResolver, ApprovedSellerResolver>();
        services.AddScoped<ISellerService, SellerService>();
        services.AddScoped<IShopService, ShopService>();
        services.AddScoped<ICategoryService, CategoryService>();
        services.AddScoped<ISellerMediaService, SellerMediaService>();
        services.AddScoped<ISellerProductService, SellerProductService>();
        services.AddScoped<IAdminProductService, AdminProductService>();
        services.AddScoped<ICatalogProductService, CatalogProductService>();
        return services;
    }
}

