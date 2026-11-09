using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.DTOs.Identity;
using ECommerceWarehouse.Domain.Entities.Identity;
using ECommerceWarehouse.Domain.Entities.Seller;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace ECommerceWarehouse.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IConfiguration _configuration;
    private readonly IPasswordHasher<User> _passwordHasher;

    public AuthService(IUnitOfWork unitOfWork, IConfiguration configuration)
    {
        _unitOfWork = unitOfWork;
        _configuration = configuration;
        _passwordHasher = new PasswordHasher<User>();
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto model, string ipAddress)
    {
        // 1. Kiểm tra định dạng Gmail (@gmail.com)
        if (string.IsNullOrWhiteSpace(model.Email) ||
            !Regex.IsMatch(model.Email.Trim(), @"^[a-zA-Z0-9._%+-]+@gmail\.com$", RegexOptions.IgnoreCase))
        {
            throw new InvalidOperationException("Vui lòng nhập địa chỉ Gmail hợp lệ (@gmail.com, ví dụ: yourname@gmail.com).");
        }

        // 2. Kiểm tra số điện thoại (bắt buộc đúng 10 chữ số và các đầu số nhà mạng VN quy định)
        if (string.IsNullOrWhiteSpace(model.PhoneNumber))
        {
            throw new InvalidOperationException("Vui lòng nhập số điện thoại liên hệ.");
        }

        var cleanPhone = model.PhoneNumber.Trim().Replace(" ", "").Replace("-", "").Replace(".", "");
        if (!Regex.IsMatch(cleanPhone, @"^(03[2-9]|05[2689]|07[06-9]|08[1-689]|09[0-46-9])\d{7}$"))
        {
            throw new InvalidOperationException("Số điện thoại không hợp lệ. Số điện thoại phải gồm đúng 10 chữ số và thuộc các đầu số nhà mạng hợp lệ (070, 076-079, 089, 090, 093, 032-039, 086, 096-098, 081-085, 088, 091, 094, 092, 052, 056, 058, 059, 099).");
        }

        // 3. Kiểm tra email đã tồn tại chưa
        var cleanEmail = model.Email.Trim().ToLower();
        var existingUsers = await _unitOfWork.Repository<User>().FindAsync(u => u.Email == cleanEmail);
        if (existingUsers.Any())
        {
            throw new InvalidOperationException("Email này đã được sử dụng.");
        }

        // 4. Kiểm tra tên đăng nhập (Username) nếu có nhập
        if (!string.IsNullOrWhiteSpace(model.Username))
        {
            var cleanUsername = model.Username.Trim();
            var existingUsername = await _unitOfWork.Repository<User>().FindAsync(u => u.Username == cleanUsername);
            if (existingUsername.Any())
            {
                throw new InvalidOperationException("Tên đăng nhập này đã có người sử dụng. Vui lòng chọn tên khác!");
            }
        }

        var user = new User
        {
            FullName = model.FullName.Trim(),
            Email = cleanEmail,
            Username = !string.IsNullOrWhiteSpace(model.Username) ? model.Username.Trim() : null,
            PhoneNumber = cleanPhone,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        // Mã hóa mật khẩu an toàn
        user.PasswordHash = _passwordHasher.HashPassword(user, model.Password);

        await _unitOfWork.Repository<User>().AddAsync(user);
        await _unitOfWork.SaveChangesAsync();

        // 3. Gán Role mặc định (Customer)
        var roles = await _unitOfWork.Repository<Role>().GetAllAsync();
        var customerRole = roles.FirstOrDefault(r => r.RoleName == "Customer");

        var userRolesList = new List<string>();

        if (customerRole != null)
        {
            await _unitOfWork.Repository<UserRole>().AddAsync(new UserRole
            {
                UserId = user.UserId,
                RoleId = customerRole.RoleId,
                AssignedAt = DateTime.UtcNow
            });
            userRolesList.Add("Customer");
        }

        // 4. Nếu người dùng đăng ký dạng Seller -> Tạo hồ sơ Seller chờ Admin duyệt
        if (string.Equals(model.AccountType, "seller", StringComparison.OrdinalIgnoreCase))
        {
            var seller = new Seller
            {
                UserId = user.UserId,
                BusinessName = !string.IsNullOrWhiteSpace(model.ShopName) ? model.ShopName : model.FullName,
                Status = "Pending",
                CommissionRate = 5.00m,
                CreatedAt = DateTime.UtcNow
            };
            await _unitOfWork.Repository<Seller>().AddAsync(seller);
            userRolesList.Add("SellerPending");
        }

        await _unitOfWork.SaveChangesAsync();

        var primaryRole = userRolesList.FirstOrDefault() ?? "Customer";

        // 5. Tạo JWT & Refresh Token
        var accessToken = GenerateJwtToken(user, userRolesList);
        var refreshToken = GenerateRefreshToken(ipAddress, user.UserId);

        await _unitOfWork.Repository<RefreshToken>().AddAsync(refreshToken);
        await _unitOfWork.SaveChangesAsync();

        return new AuthResponseDto
        {
            UserId = user.UserId,
            Username = user.Username,
            FullName = user.FullName,
            Email = user.Email,
            Role = primaryRole,
            Roles = userRolesList,
            AccessToken = accessToken,
            RefreshToken = refreshToken.TokenHash
        };
    }

    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto model, string ipAddress)
    {
        // Cho phép đăng nhập bằng cả Email hoặc Tên đăng nhập (Username)
        var users = await _unitOfWork.Repository<User>().FindAsync(u =>
            u.Email == model.Email || (u.Username != null && u.Username == model.Email));
        var user = users.FirstOrDefault();

        if (user == null || !user.IsActive)
        {
            throw new UnauthorizedAccessException("Email hoặc mật khẩu không chính xác.");
        }

        var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, model.Password);
        if (result == PasswordVerificationResult.Failed)
        {
            throw new UnauthorizedAccessException("Email hoặc mật khẩu không chính xác.");
        }

        // Truy vấn danh sách Role của tài khoản
        var userRoles = await _unitOfWork.Repository<UserRole>().FindAsync(ur => ur.UserId == user.UserId);
        var allRoles = await _unitOfWork.Repository<Role>().GetAllAsync();

        var roleNames = (from ur in userRoles
                         join r in allRoles on ur.RoleId equals r.RoleId
                         select r.RoleName).ToList();

        if (!roleNames.Any())
        {
            roleNames.Add("Customer");
        }

        // Xác định Role chủ đạo để điều hướng UI
        string primaryRole = "Customer";
        if (roleNames.Contains("Admin")) primaryRole = "Admin";
        else if (roleNames.Contains("WarehouseManager")) primaryRole = "WarehouseManager";
        else if (roleNames.Contains("WarehouseStaff")) primaryRole = "WarehouseStaff";
        else if (roleNames.Contains("Seller")) primaryRole = "Seller";
        else primaryRole = roleNames.First();

        var accessToken = GenerateJwtToken(user, roleNames);
        var refreshToken = GenerateRefreshToken(ipAddress, user.UserId);

        await _unitOfWork.Repository<RefreshToken>().AddAsync(refreshToken);
        await _unitOfWork.SaveChangesAsync();

        return new AuthResponseDto
        {
            UserId = user.UserId,
            Username = user.Username,
            FullName = user.FullName,
            Email = user.Email,
            Role = primaryRole,
            Roles = roleNames,
            AccessToken = accessToken,
            RefreshToken = refreshToken.TokenHash
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
        var tokenHash = Convert.ToBase64String(randomNumber);

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
