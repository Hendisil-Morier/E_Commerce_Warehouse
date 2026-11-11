using ECommerceWarehouse.Infrastructure;
using ECommerceWarehouse.Infrastructure.Data.Seed;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
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

// Đăng ký Infrastructure (DbContext, UnitOfWork, AuthService...)
builder.Services.AddInfrastructure(builder.Configuration);

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

// Tự động seed dữ liệu mẫu 4 tài khoản nếu chưa có
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

// CORS phải được áp dụng trước Authorization
app.UseCors("AllowFrontend");

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
