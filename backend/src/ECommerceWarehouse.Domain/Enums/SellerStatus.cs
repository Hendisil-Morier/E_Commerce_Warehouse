namespace ECommerceWarehouse.Domain.Enums;

/// <summary>
/// Trạng thái hồ sơ đăng ký người bán (khớp CK_Sellers_Status trong database).
/// Luồng chuẩn: Pending -> Approved / Rejected; Rejected -> Pending (gửi lại); Approved -> Suspended.
/// </summary>
public enum SellerStatus
{
    Pending,
    Approved,
    Rejected,
    Suspended
}

