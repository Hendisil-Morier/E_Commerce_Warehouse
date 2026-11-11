namespace ECommerceWarehouse.Domain.Exceptions;

/// <summary>
/// Exception nghiệp vụ chuẩn của hệ thống, mang theo mã lỗi cố định và HTTP status code.
/// Middleware toàn cục sẽ chuyển exception này thành ProblemDetails kèm trường "code".
/// </summary>
public class BusinessException : Exception
{
    public string Code { get; }
    public int HttpStatus { get; }

    public BusinessException(string code, string message, int httpStatus = 409, Exception? innerException = null)
        : base(message, innerException)
    {
        Code = code;
        HttpStatus = httpStatus;
    }

    public static BusinessException InsufficientStock(string? message = null)
        => new(ErrorCodes.InsufficientStock, message ?? "Sản phẩm không đủ tồn kho khả dụng.");

    public static BusinessException InvalidStatusTransition(string? message = null)
        => new(ErrorCodes.InvalidStatusTransition, message ?? "Không thể chuyển trạng thái ở trạng thái hiện tại.");

    public static BusinessException OrderExpired(string? message = null)
        => new(ErrorCodes.OrderExpired, message ?? "Đơn hàng đã hết hạn thanh toán.");

    public static BusinessException SelfApprovalNotAllowed(string? message = null)
        => new(ErrorCodes.SelfApprovalNotAllowed, message ?? "Bạn không thể tự duyệt chứng từ do chính mình tạo.");

    public static BusinessException ConcurrencyConflict(string? message = null)
        => new(ErrorCodes.ConcurrencyConflict, message ?? "Dữ liệu vừa được người khác cập nhật, vui lòng tải lại.");

    public static BusinessException SellerAlreadyExists(string? message = null)
        => new(ErrorCodes.SellerAlreadyExists, message ?? "Tài khoản này đã có hồ sơ người bán.");

    public static BusinessException SellerNotApproved(string? message = null)
        => new(ErrorCodes.SellerNotApproved, message ?? "Tài khoản người bán chưa được duyệt.");

    public static BusinessException ProductNotAvailable(string? message = null)
        => new(ErrorCodes.ProductNotAvailable, message ?? "Sản phẩm hiện không còn bán.");

    public static BusinessException DuplicateSku(string? message = null)
        => new(ErrorCodes.DuplicateSku, message ?? "Mã SKU này đã tồn tại.");

    public static BusinessException RefundExceedsPaid(string? message = null)
        => new(ErrorCodes.RefundExceedsPaid, message ?? "Tổng số tiền hoàn vượt quá số tiền đã thanh toán.");

    public static BusinessException ReturnNotEligible(string? message = null)
        => new(ErrorCodes.ReturnNotEligible, message ?? "Đơn hàng không đủ điều kiện yêu cầu trả hàng.");

    public static BusinessException Forbidden(string? message = null)
        => new(ErrorCodes.Forbidden, message ?? "Bạn không có quyền thực hiện thao tác này.", httpStatus: 403);

    public static BusinessException Unauthorized(string? message = null)
        => new(ErrorCodes.Unauthorized, message ?? "Bạn chưa đăng nhập hoặc phiên đã hết hạn.", httpStatus: 401);
}

