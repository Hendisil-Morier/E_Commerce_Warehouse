using System.Reflection;
using System.Security.Claims;
using ECommerceWarehouse.Application.DTOs.Customer;
using ECommerceWarehouse.Application.Mappings;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Domain.Constants;
using ECommerceWarehouse.WebAPI.Controllers.Customer;
using ECommerceWarehouse.WebAPI.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ECommerceWarehouse.UnitTests.Controllers;

public class CartControllerTests
{
    private sealed class StubCartService : ICartService
    {
        public CartDto NextCartDto { get; set; } = CartMapping.CreateEmptyCartDto();
        public CartItemMutationResult? NextAddResult { get; set; }
        public long? LastRemovedCartItemId { get; private set; }
        public long? LastUpdatedCartItemId { get; private set; }
        public int? LastUpdatedQuantity { get; private set; }

        public Task<CartDto> GetMyCartAsync(CancellationToken cancellationToken = default)
            => Task.FromResult(NextCartDto);

        public Task<CartItemMutationResult> AddItemAsync(
            AddCartItemRequestDto request,
            CancellationToken cancellationToken = default)
            => Task.FromResult(NextAddResult ?? new CartItemMutationResult(NextCartDto, 1, true));

        public Task<CartDto> UpdateItemQuantityAsync(
            long cartItemId,
            UpdateCartItemRequestDto request,
            CancellationToken cancellationToken = default)
        {
            LastUpdatedCartItemId = cartItemId;
            LastUpdatedQuantity = request.Quantity;
            return Task.FromResult(NextCartDto);
        }

        public Task RemoveItemAsync(
            long cartItemId,
            CancellationToken cancellationToken = default)
        {
            LastRemovedCartItemId = cartItemId;
            return Task.CompletedTask;
        }
    }

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

    [Fact]
    public async Task CartController_RequiresCustomerPolicy_NonCustomerRolesAreForbidden()
    {
        var authorizeAttr = typeof(CartController).GetCustomAttribute<AuthorizeAttribute>();
        Assert.NotNull(authorizeAttr);
        Assert.Equal(RoleNames.Customer, authorizeAttr.Policy);

        var authService = BuildAuthorizationService();
        var customerResult = await authService.AuthorizeAsync(CreateUserWithRoles(RoleNames.Customer), null, authorizeAttr.Policy!);
        var multiRoleResult = await authService.AuthorizeAsync(CreateUserWithRoles(RoleNames.Customer, RoleNames.Seller), null, authorizeAttr.Policy!);
        var sellerOnlyResult = await authService.AuthorizeAsync(CreateUserWithRoles(RoleNames.Seller), null, authorizeAttr.Policy!);
        var adminResult = await authService.AuthorizeAsync(CreateUserWithRoles(RoleNames.Admin), null, authorizeAttr.Policy!);
        var wmResult = await authService.AuthorizeAsync(CreateUserWithRoles(RoleNames.WarehouseManager), null, authorizeAttr.Policy!);

        Assert.True(customerResult.Succeeded);
        Assert.True(multiRoleResult.Succeeded);
        Assert.False(sellerOnlyResult.Succeeded);
        Assert.False(adminResult.Succeeded);
        Assert.False(wmResult.Succeeded);
    }

    [Fact]
    public async Task GetMyCart_Returns200OkWithCartDto()
    {
        var expected = new CartDto { CartId = 10, TotalItems = 1, TotalQuantity = 2, Subtotal = 500_000m };
        var service = new StubCartService { NextCartDto = expected };
        var controller = new CartController(service);

        var actionResult = await controller.GetMyCart(CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(actionResult.Result);
        Assert.Equal(StatusCodes.Status200OK, ok.StatusCode);
        Assert.Same(expected, ok.Value);
    }

    [Fact]
    public async Task AddItem_WhenCreated_Returns201CreatedWithLocationHeader()
    {
        var cart = new CartDto { CartId = 10, TotalItems = 1, TotalQuantity = 1, Subtotal = 250_000m };
        var service = new StubCartService
        {
            NextAddResult = new CartItemMutationResult(cart, CartItemId: 55, IsCreated: true)
        };
        var controller = new CartController(service);

        var actionResult = await controller.AddItem(
            new AddCartItemRequestDto { VariantId = 1001, Quantity = 1 },
            CancellationToken.None);

        var created = Assert.IsType<CreatedResult>(actionResult.Result);
        Assert.Equal(StatusCodes.Status201Created, created.StatusCode);
        Assert.Equal("/api/v1/cart/items/55", created.Location);
        Assert.Same(cart, created.Value);
    }

    [Fact]
    public async Task AddItem_WhenMergedIntoExistingItem_Returns200Ok()
    {
        var cart = new CartDto { CartId = 10, TotalItems = 1, TotalQuantity = 3, Subtotal = 750_000m };
        var service = new StubCartService
        {
            NextAddResult = new CartItemMutationResult(cart, CartItemId: 55, IsCreated: false)
        };
        var controller = new CartController(service);

        var actionResult = await controller.AddItem(
            new AddCartItemRequestDto { VariantId = 1001, Quantity = 2 },
            CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(actionResult.Result);
        Assert.Equal(StatusCodes.Status200OK, ok.StatusCode);
        Assert.Same(cart, ok.Value);
    }

    [Fact]
    public async Task UpdateItemQuantity_Returns200OkWithUpdatedCartDto()
    {
        var updatedCart = new CartDto { CartId = 10, TotalItems = 1, TotalQuantity = 4, Subtotal = 1_000_000m };
        var service = new StubCartService { NextCartDto = updatedCart };
        var controller = new CartController(service);

        var actionResult = await controller.UpdateItemQuantity(
            55,
            new UpdateCartItemRequestDto { Quantity = 4 },
            CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(actionResult.Result);
        Assert.Equal(StatusCodes.Status200OK, ok.StatusCode);
        Assert.Same(updatedCart, ok.Value);
        Assert.Equal(55, service.LastUpdatedCartItemId);
        Assert.Equal(4, service.LastUpdatedQuantity);
    }

    [Fact]
    public async Task RemoveItem_Returns204NoContent()
    {
        var service = new StubCartService();
        var controller = new CartController(service);

        var result = await controller.RemoveItem(55, CancellationToken.None);

        var noContent = Assert.IsType<NoContentResult>(result);
        Assert.Equal(StatusCodes.Status204NoContent, noContent.StatusCode);
        Assert.Equal(55, service.LastRemovedCartItemId);
    }
}
