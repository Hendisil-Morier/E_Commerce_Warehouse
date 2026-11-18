export const ERROR_CODES: Record<string, string> = {
  // 1. Lỗi chung
  VALIDATION_ERROR: "Dữ liệu chưa hợp lệ, vui lòng kiểm tra lại.",
  UNAUTHORIZED: "Phiên đăng nhập đã hết hạn.",
  FORBIDDEN: "Bạn không có quyền thực hiện thao tác này.",
  NOT_FOUND: "Không tìm thấy nội dung yêu cầu.",
  INTERNAL_ERROR: "Có lỗi hệ thống, vui lòng thử lại sau.",

  // 2. Xác thực và tài khoản (Identity)
  INVALID_CREDENTIALS: "Thông tin đăng nhập không đúng.",
  EMAIL_ALREADY_EXISTS: "Email này đã được sử dụng.",
  USERNAME_ALREADY_EXISTS: "Tên đăng nhập này đã được sử dụng.",
  ACCOUNT_LOCKED: "Tài khoản của bạn đang bị khóa.",
  INVALID_REFRESH_TOKEN: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.",

  // 3. Nghiệp vụ lõi
  INSUFFICIENT_STOCK: "Sản phẩm không đủ hàng.",
  INVALID_STATUS_TRANSITION: "Không thể thực hiện thao tác ở trạng thái hiện tại.",
  ORDER_EXPIRED: "Đơn hàng đã hết hạn thanh toán.",
  SELF_APPROVAL_NOT_ALLOWED: "Bạn không thể tự duyệt chứng từ do chính mình tạo.",
  CONCURRENCY_CONFLICT: "Dữ liệu vừa được người khác cập nhật, vui lòng tải lại.",
  BUSINESS_RULE_VIOLATION: "Thao tác vi phạm quy tắc nghiệp vụ.",

  // 4. Mã theo module
  SELLER_ALREADY_EXISTS: "Tài khoản này đã có hồ sơ người bán.",
  SELLER_NOT_APPROVED: "Tài khoản người bán chưa được duyệt.",
  SHOP_NAME_ALREADY_EXISTS: "Tên shop đã tồn tại trong tài khoản của bạn.",
  PRODUCT_NOT_AVAILABLE: "Sản phẩm hiện không còn bán.",
  DUPLICATE_SKU: "SKU này đã tồn tại.",
  DUPLICATE_BARCODE: "Mã vạch (barcode) này đã tồn tại.",
  PAYMENT_ALREADY_PROCESSED: "Giao dịch đã được xử lý trước đó.",
  REFUND_EXCEEDS_PAID: "Số tiền hoàn vượt quá số đã thanh toán.",
  RETURN_NOT_ELIGIBLE: "Chỉ có thể thực hiện với đơn đã giao.",
  INVALID_LOCATION: "Vị trí kho không hợp lệ.",
};

export const DEFAULT_ERROR_MESSAGE = "Có lỗi xảy ra, vui lòng thử lại sau.";

