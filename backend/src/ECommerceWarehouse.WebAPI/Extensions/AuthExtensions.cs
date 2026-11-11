using System.Diagnostics;
using System.Security.Claims;
using System.Text;
using ECommerceWarehouse.Application.Contracts.Services;
using ECommerceWarehouse.Domain.Constants;
using ECommerceWarehouse.Domain.Exceptions;
using ECommerceWarehouse.Infrastructure.Data;
using ECommerceWarehouse.WebAPI.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace ECommerceWarehouse.WebAPI.Extensions;

public static class AuthExtensions
{
    public static IServiceCollection AddJwtAuthenticationAndPolicies(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUser, CurrentUserService>();

        var jwtSettings = configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["Secret"]
            ?? throw new InvalidOperationException("JwtSettings:Secret is not configured.");
        var signingKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(secretKey));

        services
            .AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = jwtSettings["Issuer"],
                    ValidateAudience = true,
                    ValidAudience = jwtSettings["Audience"],
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = signingKey,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                };

                options.Events = new JwtBearerEvents
                {
                    OnTokenValidated = async context =>
                    {
                        var rawUserId = context.Principal?.FindFirstValue(ClaimTypes.NameIdentifier);
                        if (long.TryParse(rawUserId, out var userId))
                        {
                            var dbContext = context.HttpContext.RequestServices
                                .GetRequiredService<ApplicationDbContext>();
                            var sellerId = await dbContext.Sellers
                                .AsNoTracking()
                                .Where(s => s.UserId == userId)
                                .Select(s => (long?)s.SellerId)
                                .FirstOrDefaultAsync(context.HttpContext.RequestAborted);

                            context.HttpContext.Items[CurrentUserService.SellerIdHttpContextItemKey] = sellerId;
                        }
                    },
                    OnChallenge = async context =>
                    {
                        context.HandleResponse();
                        await WriteAuthProblemAsync(
                            context.HttpContext,
                            StatusCodes.Status401Unauthorized,
                            ErrorCodes.Unauthorized,
                            "Chưa xác thực",
                            "Phiên đăng nhập đã hết hạn hoặc bạn chưa đăng nhập.");
                    },
                    OnForbidden = async context =>
                    {
                        await WriteAuthProblemAsync(
                            context.HttpContext,
                            StatusCodes.Status403Forbidden,
                            ErrorCodes.Forbidden,
                            "Không có quyền truy cập",
                            "Bạn không có quyền thực hiện thao tác này.");
                    }
                };
            });

        services.AddAuthorization(options =>
        {
            options.AddPolicy(RoleNames.Customer, policy => policy.RequireRole(RoleNames.Customer));
            options.AddPolicy(RoleNames.Seller, policy => policy.RequireRole(RoleNames.Seller));
            options.AddPolicy(RoleNames.WarehouseManager, policy => policy.RequireRole(RoleNames.WarehouseManager));
            options.AddPolicy(RoleNames.Admin, policy => policy.RequireRole(RoleNames.Admin));
        });

        return services;
    }

    private static async Task WriteAuthProblemAsync(
        HttpContext httpContext,
        int status,
        string code,
        string title,
        string detail)
    {
        if (httpContext.Response.HasStarted)
        {
            return;
        }

        httpContext.Response.StatusCode = status;
        httpContext.Response.ContentType = "application/problem+json; charset=utf-8";

        var problem = new ProblemDetails
        {
            Type = $"https://httpstatuses.com/{status}",
            Title = title,
            Status = status,
            Detail = detail
        };

        problem.Extensions["code"] = code;
        problem.Extensions["traceId"] = Activity.Current?.Id ?? httpContext.TraceIdentifier;

        await httpContext.Response.WriteAsJsonAsync(problem);
    }
}

