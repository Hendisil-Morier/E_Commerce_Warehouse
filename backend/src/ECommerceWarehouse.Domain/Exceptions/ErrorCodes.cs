namespace ECommerceWarehouse.Domain.Exceptions;

/// <summary>
/// Hằng số mã lỗi chuẩn hóa cho ProblemDetails.code (khớp với docs/error-codes.md).
/// </summary>
public static class ErrorCodes
{
    // 1. Lỗi chung
    public const string ValidationError = "VALIDATION_ERROR";
    public const string Unauthorized = "UNAUTHORIZED";
    public const string Forbidden = "FORBIDDEN";
    public const string NotFound = "NOT_FOUND";
    public const string InternalError = "INTERNAL_ERROR";

    // 2. Xác thực & Tài khoản
    public const string InvalidCredentials = "INVALID_CREDENTIALS";
    public const string EmailAlreadyExists = "EMAIL_ALREADY_EXISTS";
    public const string UsernameAlreadyExists = "USERNAME_ALREADY_EXISTS";
    public const string AccountLocked = "ACCOUNT_LOCKED";
    public const string InvalidRefreshToken = "INVALID_REFRESH_TOKEN";

    // 3. Nghiệp vụ lõi
    public const string InsufficientStock = "INSUFFICIENT_STOCK";
    public const string InvalidStatusTransition = "INVALID_STATUS_TRANSITION";
    public const string OrderExpired = "ORDER_EXPIRED";
    public const string SelfApprovalNotAllowed = "SELF_APPROVAL_NOT_ALLOWED";
    public const string ConcurrencyConflict = "CONCURRENCY_CONFLICT";
    public const string BusinessRuleViolation = "BUSINESS_RULE_VIOLATION";

    // 4. Mã theo module
    public const string SellerAlreadyExists = "SELLER_ALREADY_EXISTS";
    public const string SellerNotApproved = "SELLER_NOT_APPROVED";
    public const string ProductNotAvailable = "PRODUCT_NOT_AVAILABLE";
    public const string DuplicateSku = "DUPLICATE_SKU";
    public const string PaymentAlreadyProcessed = "PAYMENT_ALREADY_PROCESSED";
    public const string RefundExceedsPaid = "REFUND_EXCEEDS_PAID";
    public const string ReturnNotEligible = "RETURN_NOT_ELIGIBLE";
    public const string InvalidLocation = "INVALID_LOCATION";
}

