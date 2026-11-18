using System.Reflection;
using System.Text.Json;
using ECommerceWarehouse.Domain.Exceptions;
using ECommerceWarehouse.WebAPI.Middlewares;
using FluentValidation;
using FluentValidation.Results;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using MySqlConnector;

namespace ECommerceWarehouse.UnitTests.Middlewares;

public class GlobalExceptionMiddlewareTests
{
    private static async Task<(int StatusCode, string? ContentType, JsonDocument Body)> InvokeMiddlewareAsync(
        RequestDelegate next)
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        context.TraceIdentifier = "trace-test-001";

        var middleware = new GlobalExceptionMiddleware(next, NullLogger<GlobalExceptionMiddleware>.Instance);
        await middleware.InvokeAsync(context);

        context.Response.Body.Position = 0;
        using var reader = new StreamReader(context.Response.Body);
        var rawJson = await reader.ReadToEndAsync();
        var json = JsonDocument.Parse(rawJson);

        return (context.Response.StatusCode, context.Response.ContentType, json);
    }

    private static MySqlException CreateMySqlException(int errorNumber, string sqlState, string message)
    {
        var ctor = typeof(MySqlException).GetConstructor(
            BindingFlags.Instance | BindingFlags.NonPublic,
            binder: null,
            types: [typeof(MySqlErrorCode), typeof(string), typeof(string)],
            modifiers: null);

        Assert.NotNull(ctor);
        return (MySqlException)ctor.Invoke([(MySqlErrorCode)errorNumber, sqlState, message]);
    }

    [Theory]
    [MemberData(nameof(BusinessExceptionCases))]
    public async Task InvokeAsync_BusinessException_ReturnsExpectedStatusAndProblemDetails(
        BusinessException exception,
        int expectedStatus,
        string expectedCode)
    {
        var (statusCode, contentType, body) = await InvokeMiddlewareAsync(_ => throw exception);
        using (body)
        {
            Assert.Equal(expectedStatus, statusCode);
            Assert.Equal("application/problem+json; charset=utf-8", contentType);

            var root = body.RootElement;
            Assert.Equal(expectedStatus, root.GetProperty("status").GetInt32());
            Assert.Equal(expectedCode, root.GetProperty("code").GetString());
            Assert.Equal(exception.Message, root.GetProperty("detail").GetString());
            Assert.Equal("trace-test-001", root.GetProperty("traceId").GetString());
            Assert.False(string.IsNullOrWhiteSpace(root.GetProperty("type").GetString()));
            Assert.False(string.IsNullOrWhiteSpace(root.GetProperty("title").GetString()));
        }
    }

    public static IEnumerable<object[]> BusinessExceptionCases()
    {
        yield return [BusinessException.InsufficientStock(), StatusCodes.Status409Conflict, ErrorCodes.InsufficientStock];
        yield return [BusinessException.InvalidStatusTransition(), StatusCodes.Status409Conflict, ErrorCodes.InvalidStatusTransition];
        yield return [BusinessException.OrderExpired(), StatusCodes.Status409Conflict, ErrorCodes.OrderExpired];
        yield return [BusinessException.SelfApprovalNotAllowed(), StatusCodes.Status409Conflict, ErrorCodes.SelfApprovalNotAllowed];
        yield return [BusinessException.ConcurrencyConflict(), StatusCodes.Status409Conflict, ErrorCodes.ConcurrencyConflict];
        yield return [BusinessException.SellerAlreadyExists(), StatusCodes.Status409Conflict, ErrorCodes.SellerAlreadyExists];
        yield return [BusinessException.SellerNotApproved(), StatusCodes.Status409Conflict, ErrorCodes.SellerNotApproved];
        yield return [BusinessException.ProductNotAvailable(), StatusCodes.Status409Conflict, ErrorCodes.ProductNotAvailable];
        yield return [BusinessException.DuplicateSku(), StatusCodes.Status409Conflict, ErrorCodes.DuplicateSku];
        yield return [BusinessException.RefundExceedsPaid(), StatusCodes.Status409Conflict, ErrorCodes.RefundExceedsPaid];
        yield return [BusinessException.ReturnNotEligible(), StatusCodes.Status409Conflict, ErrorCodes.ReturnNotEligible];
        yield return [BusinessException.Forbidden(), StatusCodes.Status403Forbidden, ErrorCodes.Forbidden];
        yield return [BusinessException.Unauthorized(), StatusCodes.Status401Unauthorized, ErrorCodes.Unauthorized];
    }

    [Fact]
    public async Task InvokeAsync_NotFoundException_Returns404WithNotFoundCode()
    {
        var (statusCode, contentType, body) = await InvokeMiddlewareAsync(
            _ => throw new NotFoundException("Product", 42));

        using (body)
        {
            Assert.Equal(StatusCodes.Status404NotFound, statusCode);
            Assert.Equal("application/problem+json; charset=utf-8", contentType);

            var root = body.RootElement;
            Assert.Equal(StatusCodes.Status404NotFound, root.GetProperty("status").GetInt32());
            Assert.Equal(ErrorCodes.NotFound, root.GetProperty("code").GetString());
            Assert.Contains("Product", root.GetProperty("detail").GetString());
            Assert.Equal("trace-test-001", root.GetProperty("traceId").GetString());
        }
    }

    [Fact]
    public async Task InvokeAsync_ValidationException_Returns400WithCamelCaseErrorsMap()
    {
        var failures = new[]
        {
            new ValidationFailure("ProductName", "Tên sản phẩm không được để trống."),
            new ValidationFailure("Email", "Email không hợp lệ."),
            new ValidationFailure("Email", "Email không đúng định dạng.")
        };

        var (statusCode, contentType, body) = await InvokeMiddlewareAsync(
            _ => throw new ValidationException(failures));

        using (body)
        {
            Assert.Equal(StatusCodes.Status400BadRequest, statusCode);
            Assert.Equal("application/problem+json; charset=utf-8", contentType);

            var root = body.RootElement;
            Assert.Equal(StatusCodes.Status400BadRequest, root.GetProperty("status").GetInt32());
            Assert.Equal(ErrorCodes.ValidationError, root.GetProperty("code").GetString());
            Assert.Equal("trace-test-001", root.GetProperty("traceId").GetString());

            var errors = root.GetProperty("errors");
            var productNameErrors = errors.GetProperty("productName");
            Assert.Equal(1, productNameErrors.GetArrayLength());
            Assert.Equal("Tên sản phẩm không được để trống.", productNameErrors[0].GetString());

            var emailErrors = errors.GetProperty("email");
            Assert.Equal(2, emailErrors.GetArrayLength());
        }
    }

    [Fact]
    public async Task InvokeAsync_DbUpdateConcurrencyException_Returns409WithConcurrencyConflict()
    {
        var (statusCode, contentType, body) = await InvokeMiddlewareAsync(
            _ => throw new DbUpdateConcurrencyException("Concurrency error"));

        using (body)
        {
            Assert.Equal(StatusCodes.Status409Conflict, statusCode);
            Assert.Equal("application/problem+json; charset=utf-8", contentType);

            var root = body.RootElement;
            Assert.Equal(StatusCodes.Status409Conflict, root.GetProperty("status").GetInt32());
            Assert.Equal(ErrorCodes.ConcurrencyConflict, root.GetProperty("code").GetString());
            Assert.Equal("trace-test-001", root.GetProperty("traceId").GetString());
        }
    }

    [Fact]
    public async Task InvokeAsync_MySqlTriggerExceptionWrappedInDbUpdateException_Returns409WithBusinessRuleViolation()
    {
        const string triggerMessage = "Số lượng khả dụng không đủ để giữ chỗ.";
        var mysqlEx = CreateMySqlException(1644, "45000", triggerMessage);
        var dbUpdateEx = new DbUpdateException("An error occurred while saving the entity changes.", mysqlEx);

        var (statusCode, contentType, body) = await InvokeMiddlewareAsync(_ => throw dbUpdateEx);

        using (body)
        {
            Assert.Equal(StatusCodes.Status409Conflict, statusCode);
            Assert.Equal("application/problem+json; charset=utf-8", contentType);

            var root = body.RootElement;
            Assert.Equal(StatusCodes.Status409Conflict, root.GetProperty("status").GetInt32());
            Assert.Equal(ErrorCodes.BusinessRuleViolation, root.GetProperty("code").GetString());
            Assert.Equal(triggerMessage, root.GetProperty("detail").GetString());
            Assert.Equal("trace-test-001", root.GetProperty("traceId").GetString());
        }
    }

    [Fact]
    public async Task InvokeAsync_DirectMySqlSqlState45000_Returns409WithBusinessRuleViolation()
    {
        const string triggerMessage = "Trạng thái chứng từ không hợp lệ.";
        var mysqlEx = CreateMySqlException(0, "45000", triggerMessage);

        var (statusCode, contentType, body) = await InvokeMiddlewareAsync(_ => throw mysqlEx);

        using (body)
        {
            Assert.Equal(StatusCodes.Status409Conflict, statusCode);
            Assert.Equal("application/problem+json; charset=utf-8", contentType);

            var root = body.RootElement;
            Assert.Equal(ErrorCodes.BusinessRuleViolation, root.GetProperty("code").GetString());
            Assert.Equal(triggerMessage, root.GetProperty("detail").GetString());
        }
    }

    [Fact]
    public async Task InvokeAsync_NonTriggerMySqlException_Returns500WithoutLeakingDatabaseDetails()
    {
        const string secretSqlMessage = "Duplicate entry 'secret@corp.local' for key 'users.uq_email'";
        var mysqlEx = CreateMySqlException(1062, "23000", secretSqlMessage);
        var dbUpdateEx = new DbUpdateException("EF wrapper message", mysqlEx);

        var (statusCode, contentType, body) = await InvokeMiddlewareAsync(_ => throw dbUpdateEx);

        using (body)
        {
            Assert.Equal(StatusCodes.Status500InternalServerError, statusCode);
            Assert.Equal("application/problem+json; charset=utf-8", contentType);

            var root = body.RootElement;
            Assert.Equal(ErrorCodes.InternalError, root.GetProperty("code").GetString());
            var detail = root.GetProperty("detail").GetString();
            Assert.Equal("Có lỗi hệ thống, vui lòng thử lại sau.", detail);
            Assert.DoesNotContain(secretSqlMessage, detail);
        }
    }

    [Fact]
    public async Task InvokeAsync_UnauthorizedAccessException_Returns401WithUnauthorized()
    {
        var (statusCode, contentType, body) = await InvokeMiddlewareAsync(
            _ => throw new UnauthorizedAccessException("Raw token detail"));

        using (body)
        {
            Assert.Equal(StatusCodes.Status401Unauthorized, statusCode);
            Assert.Equal("application/problem+json; charset=utf-8", contentType);

            var root = body.RootElement;
            Assert.Equal(StatusCodes.Status401Unauthorized, root.GetProperty("status").GetInt32());
            Assert.Equal(ErrorCodes.Unauthorized, root.GetProperty("code").GetString());
            Assert.Equal("trace-test-001", root.GetProperty("traceId").GetString());
        }
    }

    [Fact]
    public async Task InvokeAsync_UnhandledException_Returns500AndHidesInternalDetails()
    {
        const string internalSecret = "Connection string password=SuperSecret123!";
        var (statusCode, contentType, body) = await InvokeMiddlewareAsync(
            _ => throw new InvalidOperationException(internalSecret));

        using (body)
        {
            Assert.Equal(StatusCodes.Status500InternalServerError, statusCode);
            Assert.Equal("application/problem+json; charset=utf-8", contentType);

            var root = body.RootElement;
            Assert.Equal(StatusCodes.Status500InternalServerError, root.GetProperty("status").GetInt32());
            Assert.Equal(ErrorCodes.InternalError, root.GetProperty("code").GetString());

            var detail = root.GetProperty("detail").GetString();
            Assert.Equal("Có lỗi hệ thống, vui lòng thử lại sau.", detail);
            Assert.DoesNotContain(internalSecret, detail);
            Assert.Equal("trace-test-001", root.GetProperty("traceId").GetString());
        }
    }

    [Fact]
    public async Task InvokeAsync_WhenNextSucceeds_DoesNotModifyResponse()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        var middleware = new GlobalExceptionMiddleware(
            async ctx =>
            {
                ctx.Response.StatusCode = StatusCodes.Status200OK;
                await ctx.Response.WriteAsync("ok");
            },
            NullLogger<GlobalExceptionMiddleware>.Instance);

        await middleware.InvokeAsync(context);

        Assert.Equal(StatusCodes.Status200OK, context.Response.StatusCode);
        context.Response.Body.Position = 0;
        using var reader = new StreamReader(context.Response.Body);
        Assert.Equal("ok", await reader.ReadToEndAsync());
    }
}

