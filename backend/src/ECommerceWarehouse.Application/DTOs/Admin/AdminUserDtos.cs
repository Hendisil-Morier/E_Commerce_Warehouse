using ECommerceWarehouse.Application.DTOs.Common;

namespace ECommerceWarehouse.Application.DTOs.Admin;

/// <summary>
/// Tham số truy vấn danh sách người dùng cho Admin (phân trang, tìm kiếm, lọc theo vai trò và trạng thái).
/// </summary>
public class AdminUserQueryDto : PaginationQuery
{
    public string? Search { get; set; }
    public string? Role { get; set; }
    public bool? IsActive { get; set; }
}

/// <summary>
/// Thông tin rút gọn của người dùng trên bảng danh sách quản trị.
/// </summary>
public class AdminUserListItemDto
{
    public long UserId { get; set; }
    public string? Username { get; set; }
    public string FullName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? PhoneNumber { get; set; }
    public string? AvatarUrl { get; set; }
    public bool IsActive { get; set; }
    public List<string> Roles { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

/// <summary>
/// Chi tiết người dùng kèm thông tin bổ trợ (số lượng địa chỉ, thông tin người bán nếu có).
/// </summary>
public class AdminUserDetailDto : AdminUserListItemDto
{
    public int AddressCount { get; set; }
    public bool IsSeller { get; set; }
    public string? SellerStatus { get; set; }
    public string? BusinessName { get; set; }
}

/// <summary>
/// DTO cập nhật trạng thái hoạt động (Khóa / Mở khóa tài khoản).
/// </summary>
public class UpdateUserStatusRequestDto
{
    public bool IsActive { get; set; }
    public string? Reason { get; set; }
}

/// <summary>
/// DTO gán / cập nhật danh sách vai trò cho người dùng.
/// </summary>
public class UpdateUserRolesRequestDto
{
    public List<string> Roles { get; set; } = new();
}

/// <summary>
/// DTO vai trò hệ thống dùng cho dropdown / checkbox phân quyền.
/// </summary>
public class RoleDto
{
    public int RoleId { get; set; }
    public string RoleName { get; set; } = null!;
    public string? Description { get; set; }
}
