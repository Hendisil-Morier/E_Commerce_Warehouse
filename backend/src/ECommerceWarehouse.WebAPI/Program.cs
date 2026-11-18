using System.Diagnostics;
using System.Text.Json.Serialization;
using ECommerceWarehouse.Application;
using ECommerceWarehouse.Application.Contracts.Services;
using ECommerceWarehouse.Domain.Exceptions;
using ECommerceWarehouse.Infrastructure;
using ECommerceWarehouse.Infrastructure.Data.Seed;
using ECommerceWarehouse.WebAPI.Extensions;
using ECommerceWarehouse.WebAPI.Middlewares;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.FileProviders;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    })
    .ConfigureApiBehaviorOptions(options =>
    {
        options.InvalidModelStateResponseFactory = context =>
        {
            var errors = context.ModelState
                .Where(kvp => kvp.Value?.Errors.Count > 0)
                .ToDictionary(
                    kvp => string.IsNullOrEmpty(kvp.Key)
                        ? "general"
                        : char.ToLowerInvariant(kvp.Key[0]) + kvp.Key[1..],
                    kvp => kvp.Value!.Errors.Select(e => e.ErrorMessage).ToArray());

            var problem = new ProblemDetails
            {
                Type = "https://httpstatuses.com/400",
                Title = "Dữ liệu chưa hợp lệ",
                Status = StatusCodes.Status400BadRequest,
                Detail = "Dữ liệu chưa hợp lệ, vui lòng kiểm tra lại."
            };
            problem.Extensions["code"] = ErrorCodes.ValidationError;
            problem.Extensions["traceId"] = Activity.Current?.Id ?? context.HttpContext.TraceIdentifier;
            problem.Extensions["errors"] = errors;

            return new BadRequestObjectResult(problem)
            {
                ContentTypes = { "application/problem+json; charset=utf-8" }
            };
        };
    });

builder.Services.AddEndpointsApiExplorer();

// Cấu hình Swagger với nút Authorize cho JWT Bearer
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "E-Commerce Warehouse API",
        Version = "v1",
        Description = "Tài liệu API hệ sinh thái sàn thương mại điện tử kết nối kho vận E-Warehouse"
    });

    // Cấu hình Authorize Bearer JWT
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Nhập token JWT theo định dạng: Bearer {your_token} hoặc dán chuỗi token vào bên dưới."
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Đăng ký Application (FluentValidation Validators, Application Services...)
builder.Services.AddApplication();

// Đăng ký Infrastructure (DbContext, UnitOfWork, Repositories, AuthService, Storage...)
builder.Services.AddInfrastructure(builder.Configuration, builder.Environment.ContentRootPath);

// Đăng ký JWT Bearer Authentication, Role Policies và ICurrentUser
builder.Services.AddJwtAuthenticationAndPolicies(builder.Configuration);

// Cấu hình CORS cho React Frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173", "http://localhost:5174", "http://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

// Tự động seed dữ liệu mẫu nếu chưa có
await DataSeeder.SeedAsync(app.Services);

// Chỉ bật Swagger/SwaggerUI ở môi trường Development, đặt trước UseAuthentication
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "E-Commerce Warehouse API v1");
        options.RoutePrefix = "swagger";
    });

    // Điều hướng trang gốc "/" sang "/swagger" để tiện kiểm tra
    app.MapGet("/", () => Results.Redirect("/swagger"));
}

// Middleware xử lý lỗi toàn cục (ProblemDetails + code + traceId)
app.UseMiddleware<GlobalExceptionMiddleware>();

// CORS phải được áp dụng trước Authorization và StaticFiles
app.UseCors("AllowFrontend");

// Phục vụ file tĩnh an toàn chỉ cho thư mục ảnh upload đã cấu hình
var fileStorageOptions = app.Services.GetRequiredService<FileStorageOptions>();
Directory.CreateDirectory(fileStorageOptions.ResolvedRootPath);
var imageContentTypeProvider = new FileExtensionContentTypeProvider(
    new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
    {
        [".jpg"] = "image/jpeg",
        [".jpeg"] = "image/jpeg",
        [".png"] = "image/png",
        [".webp"] = "image/webp"
    });

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(fileStorageOptions.ResolvedRootPath),
    RequestPath = fileStorageOptions.NormalizedRequestPath,
    ContentTypeProvider = imageContentTypeProvider,
    ServeUnknownFileTypes = false,
    OnPrepareResponse = ctx =>
    {
        ctx.Context.Response.Headers.XContentTypeOptions = "nosniff";
        ctx.Context.Response.Headers.CacheControl = "public,max-age=604800";
    }
});

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
