using System.Security.Claims;
using ECommerceWarehouse.Application.DTOs.Identity;
using ECommerceWarehouse.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ECommerceWarehouse.WebAPI.Controllers.Identity;

[ApiController]
[Route("api/v1/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>
    /// Gửi mã OTP 6 số xác thực email trước khi đăng ký tài khoản
    /// </summary>
    [HttpPost("/api/v1/auth/register/send-otp")]
    [EnableRateLimiting("ForgotPasswordPolicy")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> SendRegisterOtp(
        [FromBody] SendRegisterOtpRequestDto model,
        CancellationToken cancellationToken)
    {
        await _authService.SendRegisterOtpAsync(model, cancellationToken);
        return NoContent();
    }

    /// <summary>
    /// Đăng ký tài khoản mới (Customer hoặc Seller)
    /// </summary>
    /// <param name="model">Dữ liệu đăng ký</param>
    /// <returns>Thông tin tài khoản và JWT token</returns>
    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Register([FromBody] RegisterRequestDto model)
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
        var result = await _authService.RegisterAsync(model, ipAddress);
        return Ok(new { success = true, data = result, message = "Đăng ký thành công!" });
    }

    /// <summary>
    /// Đăng nhập tài khoản hệ thống bằng Email hoặc Username
    /// </summary>
    /// <param name="model">Thông tin đăng nhập</param>
    /// <returns>Thông tin tài khoản và JWT token</returns>
    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto model)
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
        var result = await _authService.LoginAsync(model, ipAddress);
        return Ok(new { success = true, data = result, message = "Đăng nhập thành công!" });
    }

    /// <summary>
    /// Đổi Refresh Token lấy Access Token và Refresh Token mới (đồng thời tải lại quyền mới nhất từ DB)
    /// </summary>
    [HttpPost("refresh")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Refresh(
        [FromBody] RefreshTokenRequestDto model,
        CancellationToken cancellationToken)
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
        var result = await _authService.RefreshTokenAsync(model, ipAddress, cancellationToken);
        return Ok(new { success = true, data = result, message = "Làm mới phiên đăng nhập thành công!" });
    }

    /// <summary>
    /// Đăng xuất tài khoản và thu hồi Refresh Token
    /// </summary>
    /// <param name="model">Token cần thu hồi</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpPost("logout")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Logout(
        [FromBody] LogoutRequestDto model,
        CancellationToken cancellationToken)
    {
        await _authService.LogoutAsync(model, cancellationToken);
        return Ok(new { success = true, message = "Đăng xuất thành công!" });
    }

    /// <summary>
    /// Yêu cầu gửi mã OTP đặt lại mật khẩu qua Email (luôn trả 204 dù email có tồn tại hay không)
    /// </summary>
    [HttpPost("forgot-password")]
    [EnableRateLimiting("ForgotPasswordPolicy")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> ForgotPassword(
        [FromBody] ForgotPasswordRequestDto model,
        CancellationToken cancellationToken)
    {
        await _authService.ForgotPasswordAsync(model, cancellationToken);
        return NoContent();
    }

    /// <summary>
    /// Kiểm tra mã OTP đặt lại mật khẩu (không tiêu thụ OTP)
    /// </summary>
    [HttpPost("verify-otp")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> VerifyOtp(
        [FromBody] VerifyOtpRequestDto model,
        CancellationToken cancellationToken)
    {
        await _authService.VerifyOtpAsync(model, cancellationToken);
        return Ok(new { success = true, message = "Mã OTP hợp lệ." });
    }

    /// <summary>
    /// Đặt lại mật khẩu mới bằng mã OTP và thu hồi toàn bộ Refresh Token
    /// </summary>
    [HttpPost("reset-password")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> ResetPassword(
        [FromBody] ResetPasswordRequestDto model,
        CancellationToken cancellationToken)
    {
        await _authService.ResetPasswordAsync(model, cancellationToken);
        return Ok(new { success = true, message = "Đặt lại mật khẩu thành công!" });
    }

    /// <summary>
    /// Đổi mật khẩu khi đã đăng nhập, thu hồi toàn bộ Refresh Token cũ và cấp cặp token mới
    /// </summary>
    [HttpPost("change-password")]
    [Authorize]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ChangePassword(
        [FromBody] ChangePasswordRequestDto model,
        CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!long.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
        var result = await _authService.ChangePasswordAsync(userId, model, ipAddress, cancellationToken);
        return Ok(new { success = true, data = result, message = "Đổi mật khẩu thành công!" });
    }

    /// <summary>
    /// Đăng nhập bằng Google (ID Token Flow)
    /// </summary>
    [HttpPost("google")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GoogleLogin(
        [FromBody] GoogleLoginRequestDto model,
        CancellationToken cancellationToken)
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
        var result = await _authService.GoogleLoginAsync(model, ipAddress, cancellationToken);
        return Ok(new { success = true, data = result, message = "Đăng nhập Google thành công!" });
    }
}
