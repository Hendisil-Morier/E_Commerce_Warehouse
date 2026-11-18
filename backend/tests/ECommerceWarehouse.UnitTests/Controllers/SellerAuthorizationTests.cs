using System.Reflection;
using System.Security.Claims;
using ECommerceWarehouse.Domain.Constants;
using ECommerceWarehouse.WebAPI.Controllers.Admin;
using ECommerceWarehouse.WebAPI.Controllers.Seller;
using ECommerceWarehouse.WebAPI.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ECommerceWarehouse.UnitTests.Controllers;

public class SellerAuthorizationTests
{
    private static IAuthorizationService BuildAuthorizationService()
    {
        var services = new ServiceCollection();
        services.AddLogging();

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["JwtSettings:Secret"] = "SuperSecretTestSigningKeyForUnitTests1234567890!",
                ["JwtSettings:Issuer"] = "TestIssuer",
                ["JwtSettings:Audience"] = "TestAudience"
            })
            .Build();

        services.AddJwtAuthenticationAndPolicies(config);
        return services.BuildServiceProvider().GetRequiredService<IAuthorizationService>();
    }

    private static ClaimsPrincipal CreateUserWithRoles(params string[] roles)
    {
        var claims = new List<Claim> { new(ClaimTypes.NameIdentifier, "99") };
        claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));
        return new ClaimsPrincipal(new ClaimsIdentity(claims, "Bearer"));
    }

    [Fact]
    public async Task AdminSellersController_HasAdminPolicy_CustomerRoleIsForbidden()
    {
        var authorizeAttr = typeof(AdminSellersController).GetCustomAttribute<AuthorizeAttribute>();
        Assert.NotNull(authorizeAttr);
        Assert.Equal(RoleNames.Admin, authorizeAttr.Policy);

        var authService = BuildAuthorizationService();
        var customerUser = CreateUserWithRoles(RoleNames.Customer);
        var adminUser = CreateUserWithRoles(RoleNames.Admin);

        var customerResult = await authService.AuthorizeAsync(customerUser, resource: null, authorizeAttr.Policy!);
        var adminResult = await authService.AuthorizeAsync(adminUser, resource: null, authorizeAttr.Policy!);

        Assert.False(customerResult.Succeeded);
        Assert.True(adminResult.Succeeded);
    }

    [Fact]
    public async Task SellersController_Register_RequiresCustomerPolicy()
    {
        var method = typeof(SellersController).GetMethod(nameof(SellersController.Register));
        Assert.NotNull(method);

        var authorizeAttr = method.GetCustomAttribute<AuthorizeAttribute>();
        Assert.NotNull(authorizeAttr);
        Assert.Equal(RoleNames.Customer, authorizeAttr.Policy);

        var authService = BuildAuthorizationService();
        var customerResult = await authService.AuthorizeAsync(CreateUserWithRoles(RoleNames.Customer), null, authorizeAttr.Policy!);
        var warehouseResult = await authService.AuthorizeAsync(CreateUserWithRoles(RoleNames.WarehouseManager), null, authorizeAttr.Policy!);

        Assert.True(customerResult.Succeeded);
        Assert.False(warehouseResult.Succeeded);
    }

    [Fact]
    public void SellersController_GetMySeller_AllowsCustomerOrSeller()
    {
        var method = typeof(SellersController).GetMethod(nameof(SellersController.GetMySeller));
        Assert.NotNull(method);

        var authorizeAttr = method.GetCustomAttribute<AuthorizeAttribute>();
        Assert.NotNull(authorizeAttr);
        Assert.NotNull(authorizeAttr.Roles);

        var allowedRoles = authorizeAttr.Roles
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        Assert.Contains(RoleNames.Customer, allowedRoles);
        Assert.Contains(RoleNames.Seller, allowedRoles);
    }
}

