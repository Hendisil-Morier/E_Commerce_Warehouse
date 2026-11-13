using System.Reflection;
using System.Security.Claims;
using ECommerceWarehouse.Domain.Constants;
using ECommerceWarehouse.WebAPI.Controllers.Admin;
using ECommerceWarehouse.WebAPI.Controllers.Catalog;
using ECommerceWarehouse.WebAPI.Controllers.Seller;
using ECommerceWarehouse.WebAPI.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ECommerceWarehouse.UnitTests.Controllers;

public class CatalogAuthorizationTests
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
        var claims = new List<Claim> { new(ClaimTypes.NameIdentifier, "42") };
        claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));
        return new ClaimsPrincipal(new ClaimsIdentity(claims, "Bearer"));
    }

    [Theory]
    [InlineData(typeof(SellerShopsController))]
    [InlineData(typeof(SellerUploadsController))]
    [InlineData(typeof(SellerProductsController))]
    [InlineData(typeof(SellerVariantsController))]
    public async Task SellerCatalogControllers_RequireSellerPolicy(Type controllerType)
    {
        var authorizeAttr = controllerType.GetCustomAttribute<AuthorizeAttribute>();
        Assert.NotNull(authorizeAttr);
        Assert.Equal(RoleNames.Seller, authorizeAttr.Policy);

        var authService = BuildAuthorizationService();
        var sellerResult = await authService.AuthorizeAsync(CreateUserWithRoles(RoleNames.Seller), null, authorizeAttr.Policy!);
        var customerResult = await authService.AuthorizeAsync(CreateUserWithRoles(RoleNames.Customer), null, authorizeAttr.Policy!);
        var adminResult = await authService.AuthorizeAsync(CreateUserWithRoles(RoleNames.Admin), null, authorizeAttr.Policy!);

        Assert.True(sellerResult.Succeeded);
        Assert.False(customerResult.Succeeded);
        Assert.False(adminResult.Succeeded);
    }

    [Theory]
    [InlineData(typeof(AdminProductsController))]
    public async Task AdminCatalogControllers_RequireAdminPolicy(Type controllerType)
    {
        var authorizeAttr = controllerType.GetCustomAttribute<AuthorizeAttribute>();
        Assert.NotNull(authorizeAttr);
        Assert.Equal(RoleNames.Admin, authorizeAttr.Policy);

        var authService = BuildAuthorizationService();
        var adminResult = await authService.AuthorizeAsync(CreateUserWithRoles(RoleNames.Admin), null, authorizeAttr.Policy!);
        var sellerResult = await authService.AuthorizeAsync(CreateUserWithRoles(RoleNames.Seller), null, authorizeAttr.Policy!);
        var customerResult = await authService.AuthorizeAsync(CreateUserWithRoles(RoleNames.Customer), null, authorizeAttr.Policy!);

        Assert.True(adminResult.Succeeded);
        Assert.False(sellerResult.Succeeded);
        Assert.False(customerResult.Succeeded);
    }

    [Theory]
    [InlineData(typeof(ShopsController))]
    [InlineData(typeof(CategoriesController))]
    [InlineData(typeof(ProductsController))]
    public void PublicCatalogControllers_AllowAnonymous(Type controllerType)
    {
        var allowAnon = controllerType.GetCustomAttribute<AllowAnonymousAttribute>();
        Assert.NotNull(allowAnon);
    }
}

