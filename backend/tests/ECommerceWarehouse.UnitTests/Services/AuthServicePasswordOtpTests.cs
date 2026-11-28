using System.Linq.Expressions;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.Contracts.Services;
using ECommerceWarehouse.Application.DTOs.Identity;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Application.Validators.Identity;
using ECommerceWarehouse.Domain.Entities.Identity;
using ECommerceWarehouse.Domain.Exceptions;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;

namespace ECommerceWarehouse.UnitTests.Services;

public class AuthServicePasswordOtpTests
{
    private sealed class InMemoryRepo<T> : IGenericRepository<T> where T : class
    {
        private readonly Func<T, long>? _idSelector;
        public List<T> Items { get; } = [];

        public InMemoryRepo(Func<T, long>? idSelector = null) => _idSelector = idSelector;

        public Task<T?> GetByIdAsync(long id)
            => Task.FromResult(_idSelector == null ? null : Items.FirstOrDefault(x => _idSelector(x) == id));

        public Task<IEnumerable<T>> GetAllAsync() => Task.FromResult<IEnumerable<T>>(Items.ToList());

        public Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate)
            => Task.FromResult<IEnumerable<T>>(Items.Where(predicate.Compile()).ToList());

        public Task AddAsync(T entity)
        {
            Items.Add(entity);
            return Task.CompletedTask;
        }

        public void Update(T entity) { }

        public void Remove(T entity) => Items.Remove(entity);
    }

    private sealed class TestUnitOfWork : IUnitOfWork
    {
        private readonly Dictionary<Type, object> _repos = new();

        public void Register<T>(InMemoryRepo<T> repo) where T : class => _repos[typeof(T)] = repo;

        public IGenericRepository<T> Repository<T>() where T : class
        {
            if (_repos.TryGetValue(typeof(T), out var repo)) return (IGenericRepository<T>)repo;
            var created = new InMemoryRepo<T>();
            _repos[typeof(T)] = created;
            return created;
        }

        public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) => Task.FromResult(1);

        public Task ExecuteInTransactionAsync(Func<CancellationToken, Task> operation, CancellationToken cancellationToken = default)
            => operation(cancellationToken);

        public void Dispose() { }
    }

    private sealed class CaptureEmailSender : IEmailSender
    {
        public List<(string To, string Subject, string Html, string? Plain)> Sent { get; } = [];
        public TaskCompletionSource<bool> SentSignal { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);

        public Task SendEmailAsync(
            string toEmail,
            string subject,
            string htmlBody,
            string? plainTextBody = null,
            CancellationToken cancellationToken = default)
        {
            Sent.Add((toEmail, subject, htmlBody, plainTextBody));
            SentSignal.TrySetResult(true);
            return Task.CompletedTask;
        }
    }

    private const string OtpSecret = "UnitTestOtpSecretKeyMustBeStrong2026!";

    private static (AuthService Service, TestUnitOfWork Uow, InMemoryRepo<User> Users, InMemoryRepo<PasswordResetOtp> Otps, InMemoryRepo<RefreshToken> Tokens, CaptureEmailSender EmailSender) BuildSut()
    {
        var uow = new TestUnitOfWork();
        var users = new InMemoryRepo<User>(u => u.UserId);
        var roles = new InMemoryRepo<Role>(r => r.RoleId);
        var userRoles = new InMemoryRepo<UserRole>();
        var otps = new InMemoryRepo<PasswordResetOtp>(o => o.OtpId);
        var tokens = new InMemoryRepo<RefreshToken>(t => t.RefreshTokenId);

        roles.Items.Add(new Role { RoleId = 1, RoleName = "Customer" });
        var user = new User
        {
            UserId = 10,
            Email = "user@test.vn",
            FullName = "Nguyen Van A",
            IsActive = true
        };
        user.PasswordHash = new PasswordHasher<User>().HashPassword(user, "OldPass123!");
        users.Items.Add(user);
        userRoles.Items.Add(new UserRole { UserId = 10, RoleId = 1 });
        tokens.Items.Add(new RefreshToken
        {
            RefreshTokenId = 1,
            UserId = 10,
            TokenHash = "old_active_token_hash",
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow.AddHours(-1)
        });

        uow.Register(users);
        uow.Register(roles);
        uow.Register(userRoles);
        uow.Register(otps);
        uow.Register(tokens);

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["JwtSettings:Secret"] = "UnitTestJwtSecretKeyWith32PlusCharacters2026!",
                ["JwtSettings:Issuer"] = "TestIssuer",
                ["JwtSettings:Audience"] = "TestAudience",
                ["JwtSettings:AccessTokenExpirationMinutes"] = "60",
                ["Auth:OtpSecret"] = OtpSecret
            })
            .Build();

        var emailSender = new CaptureEmailSender();
        var service = new AuthService(uow, config, new RefreshTokenRequestValidator(), emailSender);
        return (service, uow, users, otps, tokens, emailSender);
    }

    private static string HashOtpForTest(string otp)
    {
        var hash = HMACSHA256.HashData(Encoding.UTF8.GetBytes(OtpSecret), Encoding.UTF8.GetBytes(otp));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    [Fact]
    public async Task ForgotPassword_UnknownEmail_CompletesWithoutCreatingOtpOrSendingMail()
    {
        var (service, _, _, otps, _, emailSender) = BuildSut();

        await service.ForgotPasswordAsync(new ForgotPasswordRequestDto { Email = "unknown@test.vn" });

        Assert.Empty(otps.Items);
        Assert.Empty(emailSender.Sent);
    }

    [Fact]
    public async Task ForgotPassword_ValidEmail_SavesHashedOtpNeverPlaintext_AndSendsMail()
    {
        var (service, _, _, otps, _, emailSender) = BuildSut();

        await service.ForgotPasswordAsync(new ForgotPasswordRequestDto { Email = "user@test.vn" });
        await emailSender.SentSignal.Task.WaitAsync(TimeSpan.FromSeconds(5));

        var saved = Assert.Single(otps.Items);
        Assert.Single(emailSender.Sent);
        var match = Regex.Match(emailSender.Sent[0].Plain ?? string.Empty, @"\b(\d{6})\b");
        Assert.True(match.Success);
        var rawOtp = match.Groups[1].Value;

        Assert.NotEqual(rawOtp, saved.OtpHash);
        Assert.DoesNotContain(rawOtp, saved.OtpHash);
        Assert.Equal(HashOtpForTest(rawOtp), saved.OtpHash);
    }

    [Fact]
    public async Task ForgotPassword_Within60Seconds_ThrowsOtpResendTooSoonWithRetryAfter()
    {
        var (service, _, _, otps, _, _) = BuildSut();
        otps.Items.Add(new PasswordResetOtp
        {
            OtpId = 1,
            UserId = 10,
            Email = "user@test.vn",
            OtpHash = HashOtpForTest("123456"),
            ExpiresAt = DateTime.UtcNow.AddMinutes(4),
            CreatedAt = DateTime.UtcNow.AddSeconds(-20),
            IsUsed = false
        });

        var ex = await Assert.ThrowsAsync<BusinessException>(() =>
            service.ForgotPasswordAsync(new ForgotPasswordRequestDto { Email = "user@test.vn" }));

        Assert.Equal(ErrorCodes.OtpResendTooSoon, ex.Code);
        Assert.Equal(429, ex.HttpStatus);
        Assert.NotNull(ex.Extensions);
        Assert.True(ex.Extensions!.ContainsKey("retryAfterSeconds"));
    }

    [Fact]
    public async Task VerifyOtp_ValidOtp_DoesNotMarkIsUsed()
    {
        var (service, _, _, otps, _, _) = BuildSut();
        otps.Items.Add(new PasswordResetOtp
        {
            OtpId = 1,
            UserId = 10,
            Email = "user@test.vn",
            OtpHash = HashOtpForTest("654321"),
            ExpiresAt = DateTime.UtcNow.AddMinutes(5),
            CreatedAt = DateTime.UtcNow,
            IsUsed = false
        });

        await service.VerifyOtpAsync(new VerifyOtpRequestDto { Email = "user@test.vn", Otp = "654321" });

        Assert.False(otps.Items[0].IsUsed);
        Assert.Equal(0, otps.Items[0].AttemptCount);
    }

    [Fact]
    public async Task VerifyOtp_WrongOtp_IncrementsAttemptCount_AndLocksAfter5Attempts()
    {
        var (service, _, _, otps, _, _) = BuildSut();
        otps.Items.Add(new PasswordResetOtp
        {
            OtpId = 1,
            UserId = 10,
            Email = "user@test.vn",
            OtpHash = HashOtpForTest("654321"),
            ExpiresAt = DateTime.UtcNow.AddMinutes(5),
            CreatedAt = DateTime.UtcNow,
            IsUsed = false
        });

        for (var i = 1; i <= 4; i++)
        {
            var ex = await Assert.ThrowsAsync<BusinessException>(() =>
                service.VerifyOtpAsync(new VerifyOtpRequestDto { Email = "user@test.vn", Otp = "000000" }));
            Assert.Equal(ErrorCodes.OtpInvalid, ex.Code);
            Assert.Equal(400, ex.HttpStatus);
            Assert.Equal(i, otps.Items[0].AttemptCount);
        }

        var fifthEx = await Assert.ThrowsAsync<BusinessException>(() =>
            service.VerifyOtpAsync(new VerifyOtpRequestDto { Email = "user@test.vn", Otp = "000000" }));
        Assert.Equal(ErrorCodes.OtpTooManyAttempts, fifthEx.Code);
        Assert.Equal(429, fifthEx.HttpStatus);
        Assert.True(otps.Items[0].IsUsed);
    }

    [Fact]
    public async Task VerifyOtp_ExpiredOrUsed_ThrowsOtpExpired()
    {
        var (service, _, _, otps, _, _) = BuildSut();
        otps.Items.Add(new PasswordResetOtp
        {
            OtpId = 1,
            UserId = 10,
            Email = "user@test.vn",
            OtpHash = HashOtpForTest("654321"),
            ExpiresAt = DateTime.UtcNow.AddMinutes(-1),
            CreatedAt = DateTime.UtcNow.AddMinutes(-6),
            IsUsed = false
        });

        var expiredEx = await Assert.ThrowsAsync<BusinessException>(() =>
            service.VerifyOtpAsync(new VerifyOtpRequestDto { Email = "user@test.vn", Otp = "654321" }));
        Assert.Equal(ErrorCodes.OtpExpired, expiredEx.Code);
        Assert.Equal(400, expiredEx.HttpStatus);

        otps.Items[0].ExpiresAt = DateTime.UtcNow.AddMinutes(5);
        otps.Items[0].IsUsed = true;
        var usedEx = await Assert.ThrowsAsync<BusinessException>(() =>
            service.VerifyOtpAsync(new VerifyOtpRequestDto { Email = "user@test.vn", Otp = "654321" }));
        Assert.Equal(ErrorCodes.OtpExpired, usedEx.Code);
        Assert.Equal(400, usedEx.HttpStatus);
    }

    [Fact]
    public async Task ResetPassword_ValidOtp_UpdatesPassword_MarksOtpUsed_AndRevokesRefreshTokens()
    {
        var (service, _, users, otps, tokens, _) = BuildSut();
        otps.Items.Add(new PasswordResetOtp
        {
            OtpId = 1,
            UserId = 10,
            Email = "user@test.vn",
            OtpHash = HashOtpForTest("888999"),
            ExpiresAt = DateTime.UtcNow.AddMinutes(5),
            CreatedAt = DateTime.UtcNow,
            IsUsed = false
        });

        await service.ResetPasswordAsync(new ResetPasswordRequestDto
        {
            Email = "user@test.vn",
            Otp = "888999",
            NewPassword = "NewStrongPass123!"
        });

        Assert.True(otps.Items[0].IsUsed);
        Assert.NotNull(tokens.Items[0].RevokedAt);

        var verify = new PasswordHasher<User>().VerifyHashedPassword(users.Items[0], users.Items[0].PasswordHash, "NewStrongPass123!");
        Assert.NotEqual(PasswordVerificationResult.Failed, verify);
    }

    [Fact]
    public async Task ResetPassword_WrongOtp_IncrementsAttemptCount()
    {
        var (service, _, _, otps, _, _) = BuildSut();
        otps.Items.Add(new PasswordResetOtp
        {
            OtpId = 1,
            UserId = 10,
            Email = "user@test.vn",
            OtpHash = HashOtpForTest("888999"),
            ExpiresAt = DateTime.UtcNow.AddMinutes(5),
            CreatedAt = DateTime.UtcNow,
            IsUsed = false
        });

        var ex = await Assert.ThrowsAsync<BusinessException>(() =>
            service.ResetPasswordAsync(new ResetPasswordRequestDto
            {
                Email = "user@test.vn",
                Otp = "111222",
                NewPassword = "NewStrongPass123!"
            }));

        Assert.Equal(ErrorCodes.OtpInvalid, ex.Code);
        Assert.Equal(1, otps.Items[0].AttemptCount);
    }

    [Fact]
    public async Task ChangePassword_WrongCurrentPassword_ThrowsWrongCurrentPassword400()
    {
        var (service, _, _, _, _, _) = BuildSut();

        var ex = await Assert.ThrowsAsync<BusinessException>(() =>
            service.ChangePasswordAsync(10, new ChangePasswordRequestDto
            {
                CurrentPassword = "WrongPassword!",
                NewPassword = "NewStrongPass123!"
            }, "127.0.0.1"));

        Assert.Equal(ErrorCodes.WrongCurrentPassword, ex.Code);
        Assert.Equal(400, ex.HttpStatus);
    }

    [Fact]
    public async Task ChangePassword_ValidCurrentPassword_RevokesOldTokensAndReturnsNewTokens()
    {
        var (service, _, users, _, tokens, _) = BuildSut();
        var oldToken = tokens.Items[0];

        var res = await service.ChangePasswordAsync(10, new ChangePasswordRequestDto
        {
            CurrentPassword = "OldPass123!",
            NewPassword = "NewStrongPass123!"
        }, "127.0.0.1");

        Assert.NotNull(oldToken.RevokedAt);
        Assert.Equal(2, tokens.Items.Count);
        Assert.Null(tokens.Items[1].RevokedAt);
        Assert.False(string.IsNullOrWhiteSpace(res.AccessToken));
        Assert.Equal(tokens.Items[1].TokenHash, res.RefreshToken);

        var verify = new PasswordHasher<User>().VerifyHashedPassword(users.Items[0], users.Items[0].PasswordHash, "NewStrongPass123!");
        Assert.NotEqual(PasswordVerificationResult.Failed, verify);
    }
}
