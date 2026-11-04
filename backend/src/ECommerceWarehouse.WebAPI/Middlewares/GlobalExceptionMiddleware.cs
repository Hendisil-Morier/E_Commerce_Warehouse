using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using MySqlConnector;

namespace ECommerceWarehouse.WebAPI.Middlewares;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";
        var statusCode = HttpStatusCode.InternalServerError;
        var message = "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.";

        // 1. Bắt lỗi Concurrency (2 người cùng mua món hàng cuối cùng trên bảng Inventory/Orders)
        if (exception is DbUpdateConcurrencyException)
        {
            statusCode = HttpStatusCode.Conflict; // 409 Conflict
            message = "Dữ liệu tồn kho hoặc đơn hàng vừa được thay đổi bởi giao dịch khác. Vui lòng thử lại.";
        }
        // 2. Bắt lỗi Trigger MySQL (SIGNAL SQLSTATE '45000' -> Error Number 1644)
        else if (exception.InnerException is MySqlException mySqlEx && (mySqlEx.Number == 1644 || mySqlEx.SqlState == "45000"))
        {
            statusCode = HttpStatusCode.BadRequest; // 400 Bad Request
            message = mySqlEx.Message; // Lấy nguyên văn thông báo tiếng Việt từ Trigger
        }
        else if (exception is UnauthorizedAccessException)
        {
            statusCode = HttpStatusCode.Unauthorized;
            message = exception.Message;
        }
        else if (exception is ArgumentException or InvalidOperationException)
        {
            statusCode = HttpStatusCode.BadRequest;
            message = exception.Message;
        }
        else
        {
            _logger.LogError(exception, "Unhandled Exception");
        }

        context.Response.StatusCode = (int)statusCode;
        var payload = JsonSerializer.Serialize(new
        {
            success = false,
            message,
            statusCode = (int)statusCode
        });

        await context.Response.WriteAsync(payload);
    }
}