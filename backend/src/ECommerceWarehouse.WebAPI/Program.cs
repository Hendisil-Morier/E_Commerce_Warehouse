using ECommerceWarehouse.Infrastructure;
using ECommerceWarehouse.Infrastructure.Data.Seed;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();

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

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapGet("/", () => Results.Redirect("/openapi/v1.json"));
}

// CORS phải được áp dụng trước Authorization
app.UseCors("AllowFrontend");

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
