using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.Contracts.Services;
using ECommerceWarehouse.Application.DTOs.Identity;
using ECommerceWarehouse.Application.Validators.Identity;
using ECommerceWarehouse.Domain.Entities.Identity;
using ECommerceWarehouse.Domain.Entities.Seller;
using ECommerceWarehouse.Domain.Enums;
using ECommerceWarehouse.Domain.Exceptions;
using FluentValidation;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;

namespace ECommerceWarehouse.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IConfiguration _configuration;
    private readonly IPasswordHasher<User> _passwordHasher;
    private readonly IValidator<RefreshTokenRequestDto> _refreshTokenValidator;
    private readonly IValidator<SendRegisterOtpRequestDto> _sendRegisterOtpValidator;
    private readonly IValidator<ForgotPasswordRequestDto> _forgotPasswordValidator;
    private readonly IValidator<VerifyOtpRequestDto> _verifyOtpValidator;
    private readonly IValidator<ResetPasswordRequestDto> _resetPasswordValidator;
    private readonly IValidator<ChangePasswordRequestDto> _changePasswordValidator;
    private readonly IValidator<GoogleLoginRequestDto> _googleLoginValidator;
    private readonly IEmailSender? _emailSender;
    private readonly IGoogleTokenValidator? _googleTokenValidator;
    private readonly ILogger<AuthService>? _logger;

    public AuthService(
        IUnitOfWork unitOfWork,
        IConfiguration configuration,
        IValidator<RefreshTokenRequestDto> refreshTokenValidator,
        IEmailSender? emailSender = null,
        ILogger<AuthService>? logger = null,
        IValidator<ForgotPasswordRequestDto>? forgotPasswordValidator = null,
        IValidator<VerifyOtpRequestDto>? verifyOtpValidator = null,
        IValidator<ResetPasswordRequestDto>? resetPasswordValidator = null,
        IValidator<ChangePasswordRequestDto>? changePasswordValidator = null,
        IGoogleTokenValidator? googleTokenValidator = null,
        IValidator<GoogleLoginRequestDto>? googleLoginValidator = null)
    {
        _unitOfWork = unitOfWork;
        _configuration = configuration;
        _refreshTokenValidator = refreshTokenValidator;
        _emailSender = emailSender;
        _googleTokenValidator = googleTokenValidator;
        _logger = logger;
        _forgotPasswordValidator = forgotPasswordValidator ?? new ForgotPasswordRequestValidator();
        _sendRegisterOtpValidator = new SendRegisterOtpRequestValidator();
        _verifyOtpValidator = verifyOtpValidator ?? new VerifyOtpRequestValidator();
        _resetPasswordValidator = resetPasswordValidator ?? new ResetPasswordRequestValidator();
        _changePasswordValidator = changePasswordValidator ?? new ChangePasswordRequestValidator();
        _googleLoginValidator = googleLoginValidator ?? new GoogleLoginRequestValidator();
        _passwordHasher = new PasswordHasher<User>();
    }

    public async Task SendRegisterOtpAsync(SendRegisterOtpRequestDto model, CancellationToken cancellationToken = default)
    {
        await _sendRegisterOtpValidator.ValidateAndThrowAsync(model, cancellationToken);

        var cleanEmail = model.Email.Trim().ToLowerInvariant();
        if (!Regex.IsMatch(cleanEmail, @"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"))
        {
            throw new BusinessException(ErrorCodes.ValidationError, "Vui lòng nhập địa chỉ email hợp lệ.", 400);
        }

        var existingUsers = await _unitOfWork.Repository<User>().FindAsync(u => u.Email == cleanEmail);
        if (existingUsers.Any())
        {
            throw new BusinessException(ErrorCodes.EmailAlreadyExists, "Email này đã được sử dụng.", 409);
        }

        var utcNow = DateTime.UtcNow;
        var allEmailOtps = (await _unitOfWork.Repository<EmailVerificationOtp>()
                .FindAsync(o => o.Email == cleanEmail))
            .OrderByDescending(o => o.CreatedAt)
            .ToList();

        var oneHourAgo = utcNow.AddHours(-1);
        var otpsInLastHour = allEmailOtps.Where(o => o.CreatedAt >= oneHourAgo).ToList();
        if (otpsInLastHour.Count >= 5)
        {
            var oldestInWindow = otpsInLastHour.Min(o => o.CreatedAt);
            var retryAfter = Math.Max(1, (int)Math.Ceiling((oldestInWindow.AddHours(1) - utcNow).TotalSeconds));
            throw new BusinessException(
                ErrorCodes.OtpResendTooSoon,
                "Bạn đã yêu cầu quá 5 mã OTP trong 1 giờ cho email này. Vui lòng thử lại sau.",
                429,
                extensions: new Dictionary<string, object?> { ["retryAfterSeconds"] = retryAfter });
        }

        var latestOtp = allEmailOtps.FirstOrDefault();
        if (latestOtp != null && !latestOtp.IsUsed && (utcNow - latestOtp.CreatedAt).TotalSeconds < 60)
        {
            var retryAfter = Math.Max(1, (int)Math.Ceiling(60 - (utcNow - latestOtp.CreatedAt).TotalSeconds));
            throw new BusinessException(
                ErrorCodes.OtpResendTooSoon,
                $"Vui lòng chờ {retryAfter} giây trước khi yêu cầu gửi lại mã OTP.",
                429,
                extensions: new Dictionary<string, object?> { ["retryAfterSeconds"] = retryAfter });
        }

        foreach (var oldOtp in allEmailOtps.Where(o => !o.IsUsed))
        {
            oldOtp.IsUsed = true;
            _unitOfWork.Repository<EmailVerificationOtp>().Update(oldOtp);
        }

        var rawOtp = RandomNumberGenerator.GetInt32(100000, 1000000).ToString("D6");
        var otpEntity = new EmailVerificationOtp
        {
            Email = cleanEmail,
            OtpHash = ComputeOtpHmacHex(rawOtp),
            ExpiresAt = utcNow.AddMinutes(5),
            AttemptCount = 0,
            IsUsed = false,
            CreatedAt = utcNow
        };

        await _unitOfWork.Repository<EmailVerificationOtp>().AddAsync(otpEntity);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        if (_emailSender != null)
        {
            var subject = "[KHO SÀN+] Mã OTP xác thực đăng ký tài khoản";
            var plainText = $"Mã OTP xác thực email đăng ký tài khoản KHO SÀN+ của bạn là: {rawOtp}\nMã có hiệu lực trong 5 phút. Tuyệt đối không chia sẻ mã này cho bất kỳ ai.";
            var htmlBody = $@"
<div style=""font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;"">
  <h2 style=""color: #0f766e;"">Xác thực email đăng ký tài khoản</h2>
  <p>Mã OTP xác thực của bạn là:</p>
  <div style=""font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #0f766e; padding: 12px 18px; background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; display: inline-block;"">{rawOtp}</div>
  <p>Mã OTP này có hiệu lực trong <strong>5 phút</strong>. Nếu bạn không thực hiện đăng ký, vui lòng bỏ qua email này.</p>
</div>";

            var emailSender = _emailSender;
            var logger = _logger;
            _ = Task.Run(async () =>
            {
                try
                {
                    await emailSender.SendEmailAsync(cleanEmail, subject, htmlBody, plainText, CancellationToken.None);
                }
                catch (Exception ex)
                {
                    logger?.LogError(ex, "Không thể gửi email OTP đăng ký tài khoản.");
                }
            }, CancellationToken.None);
        }
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto model, string ipAddress)
    {
        // 1. Kiểm tra định dạng Email hợp lệ (không ép cứng @gmail.com)
        if (string.IsNullOrWhiteSpace(model.Email) ||
            !Regex.IsMatch(model.Email.Trim(), @"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"))
        {
            throw new BusinessException(ErrorCodes.ValidationError, "Vui lòng nhập địa chỉ email hợp lệ.", 400);
        }

        // 2. Kiểm tra số điện thoại (bắt buộc đúng 10 chữ số và các đầu số nhà mạng VN quy định)
        if (string.IsNullOrWhiteSpace(model.PhoneNumber))
        {
            throw new BusinessException(ErrorCodes.ValidationError, "Vui lòng nhập số điện thoại liên hệ.", 400);
        }

        var cleanPhone = model.PhoneNumber.Trim().Replace(" ", "").Replace("-", "").Replace(".", "");
        if (!Regex.IsMatch(cleanPhone, @"^(03[2-9]|05[2689]|07[06-9]|08[1-689]|09[0-46-9])\d{7}$"))
        {
            throw new BusinessException(ErrorCodes.ValidationError, "Số điện thoại không hợp lệ. Số điện thoại phải gồm đúng 10 chữ số và thuộc các đầu số nhà mạng VN.", 400);
        }

        // 3. Kiểm tra email đã tồn tại chưa
        var cleanEmail = model.Email.Trim().ToLowerInvariant();
        var existingUsers = await _unitOfWork.Repository<User>().FindAsync(u => u.Email == cleanEmail);
        if (existingUsers.Any())
        {
            throw new BusinessException(ErrorCodes.EmailAlreadyExists, "Email này đã được sử dụng.", 409);
        }

        // 4. Kiểm tra mã OTP xác thực email (tăng AttemptCount commit riêng ngoài transaction tạo User)
        var cleanOtp = model.Otp?.Trim() ?? string.Empty;
        if (!Regex.IsMatch(cleanOtp, @"^\d{6}$"))
        {
            throw new BusinessException(ErrorCodes.ValidationError, "Mã OTP phải gồm đúng 6 chữ số.", 400);
        }

        var utcNow = DateTime.UtcNow;
        var latestOtp = (await _unitOfWork.Repository<EmailVerificationOtp>()
                .FindAsync(o => o.Email == cleanEmail))
            .OrderByDescending(o => o.CreatedAt)
            .FirstOrDefault();

        if (latestOtp == null || latestOtp.IsUsed || latestOtp.ExpiresAt <= utcNow)
        {
            throw new BusinessException(ErrorCodes.OtpExpired, "Mã OTP đã hết hạn hoặc đã được sử dụng.", 400);
        }

        if (latestOtp.AttemptCount >= 5)
        {
            throw new BusinessException(ErrorCodes.OtpTooManyAttempts, "Bạn đã nhập sai OTP quá 5 lần. Vui lòng yêu cầu mã mới.", 429);
        }

        var expectedOtpBytes = Convert.FromHexString(latestOtp.OtpHash);
        var actualOtpBytes = ComputeOtpHmacBytes(cleanOtp);
        var isOtpMatch = expectedOtpBytes.Length == actualOtpBytes.Length &&
                         CryptographicOperations.FixedTimeEquals(expectedOtpBytes, actualOtpBytes);

        if (!isOtpMatch)
        {
            latestOtp.AttemptCount += 1;
            if (latestOtp.AttemptCount >= 5)
            {
                latestOtp.IsUsed = true;
            }
            _unitOfWork.Repository<EmailVerificationOtp>().Update(latestOtp);
            await _unitOfWork.SaveChangesAsync();

            if (latestOtp.AttemptCount >= 5)
            {
                throw new BusinessException(ErrorCodes.OtpTooManyAttempts, "Bạn đã nhập sai OTP quá 5 lần. Vui lòng yêu cầu mã mới.", 429);
            }

            throw new BusinessException(ErrorCodes.OtpInvalid, "Mã OTP không chính xác.", 400);
        }

        // 5. Kiểm tra tên đăng nhập (Username) nếu có nhập
        if (!string.IsNullOrWhiteSpace(model.Username))
        {
            var cleanUsername = model.Username.Trim();
            var existingUsername = await _unitOfWork.Repository<User>().FindAsync(u => u.Username == cleanUsername);
            if (existingUsername.Any())
            {
                throw new BusinessException(ErrorCodes.UsernameAlreadyExists, "Tên đăng nhập này đã có người sử dụng. Vui lòng chọn tên khác!", 409);
            }
        }

        var user = new User
        {
            FullName = model.FullName.Trim(),
            Email = cleanEmail,
            Username = !string.IsNullOrWhiteSpace(model.Username) ? model.Username.Trim() : null,
            PhoneNumber = cleanPhone,
            IsActive = true,
            CreatedAt = utcNow
        };
        user.PasswordHash = _passwordHasher.HashPassword(user, model.Password);

        var roles = await _unitOfWork.Repository<Role>().GetAllAsync();
        var customerRole = roles.FirstOrDefault(r => r.RoleName == "Customer");
        var userRolesList = new List<string>();
        if (customerRole != null) userRolesList.Add("Customer");
        if (string.Equals(model.AccountType, "seller", StringComparison.OrdinalIgnoreCase))
        {
            userRolesList.Add("SellerPending");
        }

        var primaryRole = userRolesList.FirstOrDefault() ?? "Customer";
        var accessToken = string.Empty;
        var refreshToken = null as RefreshToken;

        try
        {
            await _unitOfWork.ExecuteInTransactionAsync(async ct =>
            {
                latestOtp.IsUsed = true;
                _unitOfWork.Repository<EmailVerificationOtp>().Update(latestOtp);

                await _unitOfWork.Repository<User>().AddAsync(user);
                await _unitOfWork.SaveChangesAsync(ct);

                if (customerRole != null)
                {
                    await _unitOfWork.Repository<UserRole>().AddAsync(new UserRole
                    {
                        UserId = user.UserId,
                        RoleId = customerRole.RoleId,
                        AssignedAt = utcNow
                    });
                }

                if (string.Equals(model.AccountType, "seller", StringComparison.OrdinalIgnoreCase))
                {
                    await _unitOfWork.Repository<Seller>().AddAsync(new Seller
                    {
                        UserId = user.UserId,
                        BusinessName = !string.IsNullOrWhiteSpace(model.ShopName) ? model.ShopName : model.FullName,
                        Status = SellerStatus.Pending,
                        CommissionRate = 5.00m,
                        CreatedAt = utcNow
                    });
                }

                accessToken = GenerateJwtToken(user, userRolesList);
                refreshToken = GenerateRefreshToken(ipAddress, user.UserId);
                await _unitOfWork.Repository<RefreshToken>().AddAsync(refreshToken);
                await _unitOfWork.SaveChangesAsync(ct);
            });
        }
        catch (Exception ex) when (IsUniqueEmailViolation(ex))
        {
            throw new BusinessException(ErrorCodes.EmailAlreadyExists, "Email này đã được sử dụng.", 409);
        }

        return BuildAuthResponse(user, primaryRole, userRolesList, accessToken, refreshToken!.TokenHash);
    }

    private static bool IsUniqueEmailViolation(Exception ex)
    {
        var current = ex;
        while (current != null)
        {
            var msg = current.Message;
            if (msg.Contains("UQ_Users_Email", StringComparison.OrdinalIgnoreCase) ||
                (msg.Contains("Duplicate entry", StringComparison.OrdinalIgnoreCase) &&
                 msg.Contains("Email", StringComparison.OrdinalIgnoreCase)))
            {
                return true;
            }
            current = current.InnerException;
        }
        return false;
    }

    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto model, string ipAddress)
    {
        // Cho phép đăng nhập bằng cả Email hoặc Tên đăng nhập (Username)
        var users = await _unitOfWork.Repository<User>().FindAsync(u =>
            u.Email == model.Email || (u.Username != null && u.Username == model.Email));
        var user = users.FirstOrDefault();

        if (user == null)
        {
            throw new BusinessException(ErrorCodes.InvalidCredentials, "Email hoặc mật khẩu không chính xác.", 401);
        }

        if (!user.IsActive)
        {
            throw new BusinessException(ErrorCodes.AccountLocked, "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.", 403);
        }

        var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, model.Password);
        if (result == PasswordVerificationResult.Failed)
        {
            throw new BusinessException(ErrorCodes.InvalidCredentials, "Email hoặc mật khẩu không chính xác.", 401);
        }

        var roleNames = await GetUserRolesAsync(user.UserId);
        var primaryRole = DeterminePrimaryRole(roleNames);

        var accessToken = GenerateJwtToken(user, roleNames);
        var refreshToken = GenerateRefreshToken(ipAddress, user.UserId);

        await _unitOfWork.Repository<RefreshToken>().AddAsync(refreshToken);
        await _unitOfWork.SaveChangesAsync();

        return BuildAuthResponse(user, primaryRole, roleNames, accessToken, refreshToken.TokenHash);
    }

    public async Task<AuthResponseDto> RefreshTokenAsync(
        RefreshTokenRequestDto model,
        string ipAddress,
        CancellationToken cancellationToken = default)
    {
        await _refreshTokenValidator.ValidateAndThrowAsync(model, cancellationToken);

        var incomingToken = model.RefreshToken.Trim();
        var matchingTokens = await _unitOfWork.Repository<RefreshToken>()
            .FindAsync(rt => rt.TokenHash == incomingToken);
        var existingToken = matchingTokens.FirstOrDefault();

        var utcNow = DateTime.UtcNow;
        if (existingToken == null || existingToken.RevokedAt != null || existingToken.ExpiresAt <= utcNow)
        {
            throw new BusinessException(
                ErrorCodes.InvalidRefreshToken,
                "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.",
                401);
        }

        var user = await _unitOfWork.Repository<User>().GetByIdAsync(existingToken.UserId);
        if (user == null)
        {
            throw new BusinessException(
                ErrorCodes.InvalidRefreshToken,
                "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.",
                401);
        }

        if (!user.IsActive)
        {
            throw new BusinessException(
                ErrorCodes.AccountLocked,
                "Tài khoản của bạn đang bị khóa.",
                403);
        }

        // Tải lại danh sách Role mới nhất từ UserRoles (ví dụ ngay sau khi Customer được duyệt thành Seller)
        var roleNames = await GetUserRolesAsync(user.UserId);
        var primaryRole = DeterminePrimaryRole(roleNames);

        var accessToken = GenerateJwtToken(user, roleNames);
        var newRefreshToken = GenerateRefreshToken(ipAddress, user.UserId);

        await _unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            existingToken.RevokedAt = utcNow;
            existingToken.ReplacedByHash = newRefreshToken.TokenHash;

            _unitOfWork.Repository<RefreshToken>().Update(existingToken);
            await _unitOfWork.Repository<RefreshToken>().AddAsync(newRefreshToken);
            await _unitOfWork.SaveChangesAsync(ct);
        }, cancellationToken);

        return BuildAuthResponse(user, primaryRole, roleNames, accessToken, newRefreshToken.TokenHash);
    }

    public async Task LogoutAsync(LogoutRequestDto model, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(model?.RefreshToken))
        {
            return;
        }

        var incomingToken = model.RefreshToken.Trim();
        var matchingTokens = await _unitOfWork.Repository<RefreshToken>()
            .FindAsync(rt => rt.TokenHash == incomingToken);
        var existingToken = matchingTokens.FirstOrDefault();

        if (existingToken != null && existingToken.RevokedAt == null)
        {
            existingToken.RevokedAt = DateTime.UtcNow;
            _unitOfWork.Repository<RefreshToken>().Update(existingToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task ForgotPasswordAsync(ForgotPasswordRequestDto model, CancellationToken cancellationToken = default)
    {
        await _forgotPasswordValidator.ValidateAndThrowAsync(model, cancellationToken);

        var cleanEmail = model.Email.Trim().ToLowerInvariant();
        var users = await _unitOfWork.Repository<User>().FindAsync(u => u.Email == cleanEmail);
        var user = users.FirstOrDefault();

        if (user == null || !user.IsActive)
        {
            return;
        }

        var utcNow = DateTime.UtcNow;
        var existingOtps = (await _unitOfWork.Repository<PasswordResetOtp>()
                .FindAsync(o => o.Email == cleanEmail))
            .OrderByDescending(o => o.CreatedAt)
            .ToList();

        var latestOtp = existingOtps.FirstOrDefault();
        if (latestOtp != null && !latestOtp.IsUsed && (utcNow - latestOtp.CreatedAt).TotalSeconds < 60)
        {
            var retryAfter = Math.Max(1, (int)Math.Ceiling(60 - (utcNow - latestOtp.CreatedAt).TotalSeconds));
            throw new BusinessException(
                ErrorCodes.OtpResendTooSoon,
                $"Vui lòng chờ {retryAfter} giây trước khi yêu cầu gửi lại mã OTP.",
                429,
                extensions: new Dictionary<string, object?> { ["retryAfterSeconds"] = retryAfter });
        }

        foreach (var oldOtp in existingOtps.Where(o => !o.IsUsed))
        {
            oldOtp.IsUsed = true;
            _unitOfWork.Repository<PasswordResetOtp>().Update(oldOtp);
        }

        var rawOtp = RandomNumberGenerator.GetInt32(100000, 1000000).ToString("D6");
        var otpHash = ComputeOtpHmacHex(rawOtp);

        var otpEntity = new PasswordResetOtp
        {
            UserId = user.UserId,
            Email = cleanEmail,
            OtpHash = otpHash,
            ExpiresAt = utcNow.AddMinutes(5),
            AttemptCount = 0,
            IsUsed = false,
            CreatedAt = utcNow
        };

        await _unitOfWork.Repository<PasswordResetOtp>().AddAsync(otpEntity);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        if (_emailSender != null)
        {
            var subject = "[KHO SÀN+] Mã OTP đặt lại mật khẩu";
            var plainText = $"Xin chào {user.FullName},\nMã OTP đặt lại mật khẩu của bạn là: {rawOtp}\nMã có hiệu lực trong 5 phút. Tuyệt đối không chia sẻ mã này cho bất kỳ ai.";
            var htmlBody = $@"
<div style=""font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;"">
  <h2 style=""color: #0f766e;"">Yêu cầu đặt lại mật khẩu</h2>
  <p>Xin chào <strong>{System.Net.WebUtility.HtmlEncode(user.FullName)}</strong>,</p>
  <p>Mã OTP xác thực của bạn là:</p>
  <div style=""font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #0f766e; padding: 12px 18px; background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; display: inline-block;"">{rawOtp}</div>
  <p>Mã OTP này có hiệu lực trong <strong>5 phút</strong>. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.</p>
</div>";

            var emailSender = _emailSender;
            var logger = _logger;
            var userId = user.UserId;
            _ = Task.Run(async () =>
            {
                try
                {
                    await emailSender.SendEmailAsync(cleanEmail, subject, htmlBody, plainText, CancellationToken.None);
                }
                catch (Exception ex)
                {
                    logger?.LogError(ex, "Không thể gửi email OTP đặt lại mật khẩu cho UserId {UserId}", userId);
                }
            }, CancellationToken.None);
        }
    }

    public async Task VerifyOtpAsync(VerifyOtpRequestDto model, CancellationToken cancellationToken = default)
    {
        await _verifyOtpValidator.ValidateAndThrowAsync(model, cancellationToken);
        await ValidateLatestOtpAsync(model.Email, model.Otp, cancellationToken);
    }

    public async Task ResetPasswordAsync(ResetPasswordRequestDto model, CancellationToken cancellationToken = default)
    {
        await _resetPasswordValidator.ValidateAndThrowAsync(model, cancellationToken);
        var (user, latestOtp) = await ValidateLatestOtpAsync(model.Email, model.Otp, cancellationToken);

        var utcNow = DateTime.UtcNow;
        await _unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            user.PasswordHash = _passwordHasher.HashPassword(user, model.NewPassword);
            user.UpdatedAt = utcNow;
            _unitOfWork.Repository<User>().Update(user);

            latestOtp.IsUsed = true;
            _unitOfWork.Repository<PasswordResetOtp>().Update(latestOtp);

            var activeTokens = await _unitOfWork.Repository<RefreshToken>()
                .FindAsync(rt => rt.UserId == user.UserId && rt.RevokedAt == null);
            foreach (var token in activeTokens)
            {
                token.RevokedAt = utcNow;
                _unitOfWork.Repository<RefreshToken>().Update(token);
            }

            await _unitOfWork.SaveChangesAsync(ct);
        }, cancellationToken);
    }

    public async Task<AuthResponseDto> ChangePasswordAsync(
        long userId,
        ChangePasswordRequestDto model,
        string ipAddress,
        CancellationToken cancellationToken = default)
    {
        await _changePasswordValidator.ValidateAndThrowAsync(model, cancellationToken);

        var user = await _unitOfWork.Repository<User>().GetByIdAsync(userId);
        if (user == null)
        {
            throw new NotFoundException("User", userId);
        }

        if (!user.IsActive)
        {
            throw new BusinessException(ErrorCodes.AccountLocked, "Tài khoản của bạn đang bị khóa.", 403);
        }

        var verifyResult = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, model.CurrentPassword);
        if (verifyResult == PasswordVerificationResult.Failed)
        {
            throw new BusinessException(
                ErrorCodes.WrongCurrentPassword,
                "Mật khẩu hiện tại không chính xác.",
                400);
        }

        var utcNow = DateTime.UtcNow;
        var roleNames = await GetUserRolesAsync(user.UserId);
        var primaryRole = DeterminePrimaryRole(roleNames);
        var accessToken = GenerateJwtToken(user, roleNames);
        var newRefreshToken = GenerateRefreshToken(ipAddress, user.UserId);

        await _unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            user.PasswordHash = _passwordHasher.HashPassword(user, model.NewPassword);
            user.UpdatedAt = utcNow;
            _unitOfWork.Repository<User>().Update(user);

            var activeTokens = await _unitOfWork.Repository<RefreshToken>()
                .FindAsync(rt => rt.UserId == user.UserId && rt.RevokedAt == null);
            foreach (var token in activeTokens)
            {
                token.RevokedAt = utcNow;
                _unitOfWork.Repository<RefreshToken>().Update(token);
            }

            await _unitOfWork.Repository<RefreshToken>().AddAsync(newRefreshToken);
            await _unitOfWork.SaveChangesAsync(ct);
        }, cancellationToken);

        return BuildAuthResponse(user, primaryRole, roleNames, accessToken, newRefreshToken.TokenHash);
    }

    public async Task<AuthResponseDto> GoogleLoginAsync(
        GoogleLoginRequestDto model,
        string ipAddress,
        CancellationToken cancellationToken = default)
    {
        await _googleLoginValidator.ValidateAndThrowAsync(model, cancellationToken);

        if (_googleTokenValidator == null)
        {
            throw new BusinessException(ErrorCodes.GoogleTokenInvalid, "Dịch vụ xác thực Google chưa được cấu hình.", 401);
        }

        var payload = await _googleTokenValidator.ValidateAsync(model.IdToken.Trim(), cancellationToken);
        if (!payload.EmailVerified || string.IsNullOrWhiteSpace(payload.Email) || string.IsNullOrWhiteSpace(payload.Subject))
        {
            throw new BusinessException(ErrorCodes.GoogleTokenInvalid, "Tài khoản Google chưa xác minh email.", 401);
        }

        var cleanEmail = payload.Email.Trim().ToLowerInvariant();
        var utcNow = DateTime.UtcNow;

        var bySubject = (await _unitOfWork.Repository<User>()
                .FindAsync(u => u.GoogleSubject == payload.Subject))
            .FirstOrDefault();

        User user;
        RefreshToken refreshToken = null!;

        if (bySubject != null)
        {
            if (!bySubject.IsActive)
            {
                throw new BusinessException(ErrorCodes.AccountLocked, "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.", 403);
            }

            user = bySubject;
            if (string.IsNullOrWhiteSpace(user.AvatarUrl) && !string.IsNullOrWhiteSpace(payload.AvatarUrl))
            {
                user.AvatarUrl = payload.AvatarUrl;
                user.UpdatedAt = utcNow;
                _unitOfWork.Repository<User>().Update(user);
            }

            refreshToken = GenerateRefreshToken(ipAddress, user.UserId);
            await _unitOfWork.Repository<RefreshToken>().AddAsync(refreshToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
        else
        {
            var byEmail = (await _unitOfWork.Repository<User>()
                    .FindAsync(u => u.Email == cleanEmail))
                .FirstOrDefault();

            if (byEmail != null)
            {
                if (!string.IsNullOrWhiteSpace(byEmail.GoogleSubject) && byEmail.GoogleSubject != payload.Subject)
                {
                    throw new BusinessException(
                        ErrorCodes.GoogleTokenInvalid,
                        "Email này đã được liên kết với một tài khoản Google khác.",
                        401);
                }

                if (!byEmail.IsActive)
                {
                    throw new BusinessException(ErrorCodes.AccountLocked, "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.", 403);
                }

                user = byEmail;
                var randomPassword = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));

                await _unitOfWork.ExecuteInTransactionAsync(async ct =>
                {
                    user.GoogleSubject = payload.Subject;
                    user.PasswordHash = _passwordHasher.HashPassword(user, randomPassword);
                    if (string.IsNullOrWhiteSpace(user.AvatarUrl) && !string.IsNullOrWhiteSpace(payload.AvatarUrl))
                    {
                        user.AvatarUrl = payload.AvatarUrl;
                    }
                    user.UpdatedAt = utcNow;
                    _unitOfWork.Repository<User>().Update(user);

                    var activeTokens = await _unitOfWork.Repository<RefreshToken>()
                        .FindAsync(rt => rt.UserId == user.UserId && rt.RevokedAt == null);
                    foreach (var token in activeTokens)
                    {
                        token.RevokedAt = utcNow;
                        _unitOfWork.Repository<RefreshToken>().Update(token);
                    }

                    refreshToken = GenerateRefreshToken(ipAddress, user.UserId);
                    await _unitOfWork.Repository<RefreshToken>().AddAsync(refreshToken);
                    await _unitOfWork.SaveChangesAsync(ct);
                }, cancellationToken);
            }
            else
            {
                var displayName = string.IsNullOrWhiteSpace(payload.FullName)
                    ? cleanEmail.Split('@')[0]
                    : payload.FullName.Trim();

                user = new User
                {
                    FullName = displayName,
                    Email = cleanEmail,
                    AvatarUrl = payload.AvatarUrl,
                    GoogleSubject = payload.Subject,
                    IsActive = true,
                    CreatedAt = utcNow
                };
                var randomPassword = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
                user.PasswordHash = _passwordHasher.HashPassword(user, randomPassword);

                await _unitOfWork.ExecuteInTransactionAsync(async ct =>
                {
                    await _unitOfWork.Repository<User>().AddAsync(user);
                    await _unitOfWork.SaveChangesAsync(ct);

                    var roles = await _unitOfWork.Repository<Role>().GetAllAsync();
                    var customerRole = roles.FirstOrDefault(r => r.RoleName == "Customer");
                    if (customerRole != null)
                    {
                        await _unitOfWork.Repository<UserRole>().AddAsync(new UserRole
                        {
                            UserId = user.UserId,
                            RoleId = customerRole.RoleId,
                            AssignedAt = utcNow
                        });
                    }

                    refreshToken = GenerateRefreshToken(ipAddress, user.UserId);
                    await _unitOfWork.Repository<RefreshToken>().AddAsync(refreshToken);
                    await _unitOfWork.SaveChangesAsync(ct);
                }, cancellationToken);
            }
        }

        var roleNames = await GetUserRolesAsync(user.UserId);
        var primaryRole = DeterminePrimaryRole(roleNames);
        var accessToken = GenerateJwtToken(user, roleNames);
        return BuildAuthResponse(user, primaryRole, roleNames, accessToken, refreshToken.TokenHash);
    }

    private async Task<(User User, PasswordResetOtp Otp)> ValidateLatestOtpAsync(
        string email,
        string rawOtp,
        CancellationToken cancellationToken)
    {
        var cleanEmail = email.Trim().ToLowerInvariant();
        var utcNow = DateTime.UtcNow;

        var latestOtp = (await _unitOfWork.Repository<PasswordResetOtp>()
                .FindAsync(o => o.Email == cleanEmail))
            .OrderByDescending(o => o.CreatedAt)
            .FirstOrDefault();

        if (latestOtp == null || latestOtp.IsUsed || latestOtp.ExpiresAt <= utcNow)
        {
            throw new BusinessException(
                ErrorCodes.OtpExpired,
                "Mã OTP đã hết hạn hoặc đã được sử dụng.",
                400);
        }

        if (latestOtp.AttemptCount >= 5)
        {
            throw new BusinessException(
                ErrorCodes.OtpTooManyAttempts,
                "Bạn đã nhập sai OTP quá 5 lần. Vui lòng yêu cầu mã mới.",
                429);
        }

        var expectedBytes = Convert.FromHexString(latestOtp.OtpHash);
        var actualBytes = ComputeOtpHmacBytes(rawOtp.Trim());
        var isMatch = expectedBytes.Length == actualBytes.Length &&
                      CryptographicOperations.FixedTimeEquals(expectedBytes, actualBytes);

        if (!isMatch)
        {
            latestOtp.AttemptCount += 1;
            if (latestOtp.AttemptCount >= 5)
            {
                latestOtp.IsUsed = true;
            }
            _unitOfWork.Repository<PasswordResetOtp>().Update(latestOtp);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            if (latestOtp.AttemptCount >= 5)
            {
                throw new BusinessException(
                    ErrorCodes.OtpTooManyAttempts,
                    "Bạn đã nhập sai OTP quá 5 lần. Vui lòng yêu cầu mã mới.",
                    429);
            }

            throw new BusinessException(
                ErrorCodes.OtpInvalid,
                "Mã OTP không chính xác.",
                400);
        }

        var user = await _unitOfWork.Repository<User>().GetByIdAsync(latestOtp.UserId);
        if (user == null || !user.IsActive)
        {
            throw new BusinessException(
                ErrorCodes.OtpExpired,
                "Mã OTP đã hết hạn hoặc không còn hợp lệ.",
                400);
        }

        return (user, latestOtp);
    }

    private byte[] ComputeOtpHmacBytes(string otp)
    {
        var secret = _configuration["Auth:OtpSecret"];
        if (string.IsNullOrWhiteSpace(secret))
        {
            secret = _configuration["JwtSettings:Secret"];
        }
        if (string.IsNullOrWhiteSpace(secret))
        {
            throw new InvalidOperationException("Auth:OtpSecret chưa được cấu hình.");
        }

        var keyBytes = Encoding.UTF8.GetBytes(secret);
        var otpBytes = Encoding.UTF8.GetBytes(otp);
        return HMACSHA256.HashData(keyBytes, otpBytes);
    }

    private string ComputeOtpHmacHex(string otp)
        => Convert.ToHexString(ComputeOtpHmacBytes(otp)).ToLowerInvariant();

    private async Task<List<string>> GetUserRolesAsync(long userId)
    {
        var userRoles = await _unitOfWork.Repository<UserRole>().FindAsync(ur => ur.UserId == userId);
        var allRoles = await _unitOfWork.Repository<Role>().GetAllAsync();

        var roleNames = (from ur in userRoles
                         join r in allRoles on ur.RoleId equals r.RoleId
                         select r.RoleName)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (!roleNames.Any())
        {
            roleNames.Add("Customer");
        }

        return roleNames;
    }

    private static string DeterminePrimaryRole(IReadOnlyCollection<string> roleNames)
    {
        if (roleNames.Contains("Admin")) return "Admin";
        if (roleNames.Contains("WarehouseManager")) return "WarehouseManager";
        if (roleNames.Contains("WarehouseStaff")) return "WarehouseStaff";
        if (roleNames.Contains("Seller")) return "Seller";
        return roleNames.FirstOrDefault() ?? "Customer";
    }

    private static AuthResponseDto BuildAuthResponse(
        User user,
        string primaryRole,
        List<string> roleNames,
        string accessToken,
        string refreshToken)
    {
        return new AuthResponseDto
        {
            UserId = user.UserId,
            Username = user.Username,
            FullName = user.FullName,
            Email = user.Email,
            Role = primaryRole,
            Roles = roleNames,
            AccessToken = accessToken,
            RefreshToken = refreshToken
        };
    }

    private string GenerateJwtToken(User user, IEnumerable<string> roles)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["Secret"] ?? throw new InvalidOperationException("JWT Secret not configured");
        var key = Encoding.ASCII.GetBytes(secretKey);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.FullName)
        };

        if (!string.IsNullOrEmpty(user.Username))
        {
            claims.Add(new Claim("username", user.Username));
        }

        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(double.Parse(jwtSettings["AccessTokenExpirationMinutes"] ?? "60")),
            Issuer = jwtSettings["Issuer"],
            Audience = jwtSettings["Audience"],
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    private RefreshToken GenerateRefreshToken(string ipAddress, long userId)
    {
        var randomNumber = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        var tokenHash = Convert.ToHexString(SHA256.HashData(randomNumber)).ToLowerInvariant();

        return new RefreshToken
        {
            UserId = userId,
            TokenHash = tokenHash,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow,
            CreatedByIp = ipAddress
        };
    }
}
