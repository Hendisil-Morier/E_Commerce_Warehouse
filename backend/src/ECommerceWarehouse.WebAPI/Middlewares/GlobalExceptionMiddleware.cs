using System.Diagnostics;
using System.Net;
using System.Text.Json;
using ECommerceWarehouse.Domain.Exceptions;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MySqlConnector;

namespace ECommerceWarehouse.WebAPI.Middlewares;

/// <summary>
/// Middleware toàn cục chuyển đổi mọi exception chưa xử lý thành ProblemDetails chuẩn RFC 7807 kèm trường "code" và "traceId".
/// </summary>
public class GlobalExceptionMiddleware
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(
        RequestDelegate next,
        ILogger<GlobalExceptionMiddleware> logger)
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
        var problemDetails = BuildProblemDetails(context, exception);

        if ((problemDetails.Status ?? StatusCodes.Status500InternalServerError) >= StatusCodes.Status500InternalServerError)
        {
            _logger.LogError(exception, "Unhandled server exception. TraceId: {TraceId}", problemDetails.Extensions["traceId"]);
        }
        else
        {
            _logger.LogWarning("Handled business/client exception {Code}: {Message}",
                problemDetails.Extensions["code"], exception.Message);
        }

        context.Response.ContentType = "application/problem+json; charset=utf-8";
        context.Response.StatusCode = problemDetails.Status ?? (int)HttpStatusCode.InternalServerError;

        var payload = JsonSerializer.Serialize(problemDetails, JsonOptions);
        await context.Response.WriteAsync(payload);
    }

    private static ProblemDetails BuildProblemDetails(HttpContext context, Exception exception)
    {
        var traceId = Activity.Current?.Id ?? context.TraceIdentifier;

        int status;
        string code;
        string title;
        string detail;
        IDictionary<string, string[]>? errors = null;

        switch (exception)
        {
            case ValidationException validationEx:
                status = StatusCodes.Status400BadRequest;
                code = ErrorCodes.ValidationError;
                title = "Dữ liệu chưa hợp lệ";
                detail = "Dữ liệu chưa hợp lệ, vui lòng kiểm tra lại.";
                errors = validationEx.Errors
                    .GroupBy(e => ToCamelCase(e.PropertyName))
                    .ToDictionary(
                        g => g.Key,
                        g => g.Select(e => e.ErrorMessage).Distinct().ToArray());
                break;

            case NotFoundException notFoundEx:
                status = StatusCodes.Status404NotFound;
                code = notFoundEx.Code;
                title = "Không tìm thấy tài nguyên";
                detail = notFoundEx.Message;
                break;

            case BusinessException businessEx:
                status = businessEx.HttpStatus;
                code = businessEx.Code;
                title = GetDefaultTitleForStatus(status);
                detail = businessEx.Message;
                break;

            case DbUpdateConcurrencyException:
                status = StatusCodes.Status409Conflict;
                code = ErrorCodes.ConcurrencyConflict;
                title = "Xung đột dữ liệu đồng thời";
                detail = "Dữ liệu vừa được người khác cập nhật, vui lòng tải lại.";
                break;

            case UnauthorizedAccessException unauthorizedEx:
                status = StatusCodes.Status401Unauthorized;
                code = ErrorCodes.Unauthorized;
                title = "Chưa xác thực";
                detail = string.IsNullOrWhiteSpace(unauthorizedEx.Message)
                    ? "Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn."
                    : unauthorizedEx.Message;
                break;

            default:
                var mySqlTriggerEx = FindMySqlTriggerException(exception);
                if (mySqlTriggerEx != null)
                {
                    status = StatusCodes.Status409Conflict;
                    code = ErrorCodes.BusinessRuleViolation;
                    title = "Vi phạm quy tắc nghiệp vụ";
                    detail = mySqlTriggerEx.Message;
                }
                else
                {
                    status = StatusCodes.Status500InternalServerError;
                    code = ErrorCodes.InternalError;
                    title = "Lỗi hệ thống";
                    detail = "Có lỗi hệ thống, vui lòng thử lại sau.";
                }
                break;
        }

        var problem = new ProblemDetails
        {
            Type = $"https://httpstatuses.com/{status}",
            Title = title,
            Status = status,
            Detail = detail
        };

        problem.Extensions["code"] = code;
        problem.Extensions["traceId"] = traceId;

        if (errors != null)
        {
            problem.Extensions["errors"] = errors;
        }

        return problem;
    }

    private static MySqlException? FindMySqlTriggerException(Exception? ex)
    {
        while (ex != null)
        {
            if (ex is MySqlException mySqlEx &&
                (mySqlEx.Number == 1644 || string.Equals(mySqlEx.SqlState, "45000", StringComparison.Ordinal)))
            {
                return mySqlEx;
            }
            ex = ex.InnerException;
        }

        return null;
    }

    private static string GetDefaultTitleForStatus(int status) => status switch
    {
        StatusCodes.Status400BadRequest => "Yêu cầu không hợp lệ",
        StatusCodes.Status401Unauthorized => "Chưa xác thực",
        StatusCodes.Status403Forbidden => "Không có quyền truy cập",
        StatusCodes.Status404NotFound => "Không tìm thấy tài nguyên",
        StatusCodes.Status409Conflict => "Vi phạm quy tắc nghiệp vụ",
        _ => "Lỗi xử lý yêu cầu"
    };

    private static string ToCamelCase(string name)
    {
        if (string.IsNullOrEmpty(name)) return "general";
        if (name.Length == 1) return name.ToLowerInvariant();
        return char.ToLowerInvariant(name[0]) + name[1..];
    }
}
