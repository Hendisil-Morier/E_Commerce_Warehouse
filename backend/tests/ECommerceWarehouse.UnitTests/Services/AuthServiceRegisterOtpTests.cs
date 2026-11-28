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
using Microsoft.Extensions.Configuration;

namespace ECommerceWarehouse.UnitTests.Services;

public class AuthServiceRegisterOtpTests
{
    private sealed class InMemoryRepo<T> : IGenericRepository<T> where T : class
    {
        private readonly Func<T, long>? _idSelector;
        private readonly Action<T, long>? _idSetter;
        private long _seq = 10;
        public List<T> Items { get; } = [];

        public InMemoryRepo(Func<T, long>? idSelector = null, Action<T, long>? idSetter = null)
        {
            _idSelector = idSelector;
            _idSetter = idSetter;
        }

        public Task<T?> GetByIdAsync(long id)
            => Task.FromResult(_idSelector == null ? null : Items.FirstOrDefault(x => _idSelector(x) == id));

        public Task<IEnumerable<T>> GetAllAsync() => Task.FromResult<IEnumerable<T>>(Items.ToList());

        public Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate)
            => Task.FromResult<IEnumerable<T>>(Items.Where(predicate.Compile()).ToList());

        public Task AddAsync(T entity)
        {
            if (_idSetter != null && _idSelector != null && _idSelector(entity) == 0)
            {
                _idSetter(entity, ++_seq);
            }
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

    private const string OtpSecret = "UnitTestRegisterOtpSecret2026!";

    private static (AuthService Service, InMemoryRepo<User> Users, InMemoryRepo<EmailVerificationOtp> Otps, InMemoryRepo<RefreshToken> Tokens, CaptureEmailSender EmailSender) BuildSut()
    {
        var uow = new TestUnitOfWork();
        var users = new InMemoryRepo<User>(u => u.UserId, (u, id) => u.UserId = id);
        var roles = new InMemoryRepo<Role>(r => r.RoleId);
        var userRoles = new InMemoryRepo<UserRole>();
        var otps = new InMemoryRepo<EmailVerificationOtp>(o => o.OtpId, (o, id) => o.OtpId = id);
        var tokens = new InMemoryRepo<RefreshToken>(t => t.RefreshTokenId, (t, id) => t.RefreshTokenId = id);

        roles.Items.Add(new Role { RoleId = 1, RoleName = "Customer" });

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
        return (service, users, otps, tokens, emailSender);
    }

    private static string HashOtp(string otp)
    {
        var hash = HMACSHA256.HashData(Encoding.UTF8.GetBytes(OtpSecret), Encoding.UTF8.GetBytes(otp));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    [Fact]
    public async Task SendRegisterOtp_ExistingEmail_ThrowsEmailAlreadyExists409()
    {
        var (service, users, _, _, _) = BuildSut();
        users.Items.Add(new User { UserId = 1, Email = "taken@gmail.com", FullName = "Taken", PasswordHash = "x" });

        var ex = await Assert.ThrowsAsync<BusinessException>(() =>
            service.SendRegisterOtpAsync(new SendRegisterOtpRequestDto { Email = "  TAKEN@gmail.com " }));

        Assert.Equal(ErrorCodes.EmailAlreadyExists, ex.Code);
        Assert.Equal(409, ex.HttpStatus);
    }

    [Fact]
    public async Task SendRegisterOtp_MoreThan5PerHour_Throws429()
    {
        var (service, _, otps, _, _) = BuildSut();
        var now = DateTime.UtcNow;
        for (var i = 0; i < 5; i++)
        {
            otps.Items.Add(new EmailVerificationOtp
            {
                OtpId = i + 1,
                Email = "spam@gmail.com",
                OtpHash = HashOtp("111111"),
                ExpiresAt = now.AddMinutes(5),
                CreatedAt = now.AddMinutes(-10 - i),
                IsUsed = true
            });
        }

        var ex = await Assert.ThrowsAsync<BusinessException>(() =>
            service.SendRegisterOtpAsync(new SendRegisterOtpRequestDto { Email = "spam@gmail.com" }));

        Assert.Equal(ErrorCodes.OtpResendTooSoon, ex.Code);
        Assert.Equal(429, ex.HttpStatus);
    }

    [Fact]
    public async Task SendRegisterOtp_AndRegister_ValidOtp_CreatesUserAndMarksOtpUsed()
    {
        var (service, users, otps, tokens, emailSender) = BuildSut();

        await service.SendRegisterOtpAsync(new SendRegisterOtpRequestDto { Email = "  NewBuyer@gmail.com " });
        await emailSender.SentSignal.Task.WaitAsync(TimeSpan.FromSeconds(5));

        var match = Regex.Match(emailSender.Sent[0].Plain ?? string.Empty, @"\b(\d{6})\b");
        Assert.True(match.Success);
        var rawOtp = match.Groups[1].Value;

        var res = await service.RegisterAsync(new RegisterRequestDto
        {
            FullName = "Nguyen Van Moi",
            Username = "newbuyer",
            Email = "NewBuyer@gmail.com",
            Otp = rawOtp,
            PhoneNumber = "0912345678",
            Password = "Password123!"
        }, "127.0.0.1");

        Assert.Single(users.Items);
        Assert.Equal("newbuyer@gmail.com", users.Items[0].Email);
        Assert.True(otps.Items[0].IsUsed);
        Assert.Single(tokens.Items);
        Assert.Equal("Customer", res.Role);
    }

    [Fact]
    public async Task Register_WrongOtp_IncrementsAttemptCountOutsideTransaction()
    {
        var (service, users, otps, _, _) = BuildSut();
        otps.Items.Add(new EmailVerificationOtp
        {
            OtpId = 1,
            Email = "buyer@gmail.com",
            OtpHash = HashOtp("222333"),
            ExpiresAt = DateTime.UtcNow.AddMinutes(5),
            CreatedAt = DateTime.UtcNow,
            IsUsed = false
        });

        var ex = await Assert.ThrowsAsync<BusinessException>(() =>
            service.RegisterAsync(new RegisterRequestDto
            {
                FullName = "Buyer",
                Username = "buyer1",
                Email = "buyer@gmail.com",
                Otp = "000000",
                PhoneNumber = "0912345678",
                Password = "Password123!"
            }, "127.0.0.1"));

        Assert.Equal(ErrorCodes.OtpInvalid, ex.Code);
        Assert.Equal(1, otps.Items[0].AttemptCount);
        Assert.Empty(users.Items);
    }
}
