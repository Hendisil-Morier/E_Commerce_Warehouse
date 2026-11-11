# Bảng mã lỗi (`ProblemDetails.code`)

BE trả lỗi theo định dạng ở `api-conventions.md`. Trường `code` là chuỗi cố định, **FE dựa vào `code` (không dựa vào `title`/`detail`) để quyết định hiển thị**.

> Trạng thái: **bản đề xuất**. Mã đánh dấu ✅ đã thống nhất trong quy ước; mã đánh dấu 🆕 là đề xuất thêm, cần BE xác nhận. Thêm mã mới thì sửa file này **trước**, rồi báo nhóm.
>
> Còn một điểm chờ chốt: lỗi nghiệp vụ dùng **409 hay 422**. Cột HTTP bên dưới ghi 409 theo `10-backend-dotnet.md`; nếu nhóm chọn 422 thì đổi cả cột.

## 1. Lỗi chung

| code | HTTP | Ý nghĩa | Thông báo gợi ý cho người dùng | FE xử lý |
|---|---|---|---|---|
| `VALIDATION_ERROR` 🆕 | 400 | Dữ liệu sai định dạng | Dữ liệu chưa hợp lệ, vui lòng kiểm tra lại. | Hiện lỗi cạnh từng ô nhập (nếu BE trả danh sách lỗi theo trường) |
| `UNAUTHORIZED` 🆕 | 401 | Chưa đăng nhập hoặc token hết hạn | Phiên đăng nhập đã hết hạn. | Thử refresh token, thất bại thì về `/login` |
| `FORBIDDEN` 🆕 | 403 | Không đủ quyền | Bạn không có quyền thực hiện thao tác này. | Chuyển sang trang không đủ quyền |
| `NOT_FOUND` 🆕 | 404 | Không có hoặc không thuộc về bạn | Không tìm thấy nội dung yêu cầu. | Trang 404 hoặc thông báo |
| `INTERNAL_ERROR` 🆕 | 500 | Lỗi không lường trước | Có lỗi hệ thống, vui lòng thử lại sau. | Toast + nút thử lại |

## 2. Xác thực và tài khoản (Identity)

| code | HTTP | Ý nghĩa | Thông báo gợi ý |
|---|---|---|---|
| `INVALID_CREDENTIALS` 🆕 | 401 | Sai email/tên đăng nhập hoặc mật khẩu | Thông tin đăng nhập không đúng. |
| `EMAIL_ALREADY_EXISTS` 🆕 | 409 | Email đã đăng ký | Email này đã được sử dụng. |
| `USERNAME_ALREADY_EXISTS` 🆕 | 409 | Tên đăng nhập đã tồn tại (bảng `Users` có `UQ_Users_Username`) | Tên đăng nhập này đã được sử dụng. |
| `ACCOUNT_LOCKED` 🆕 | 403 | Tài khoản bị khóa | Tài khoản của bạn đang bị khóa. |
| `INVALID_REFRESH_TOKEN` 🆕 | 401 | Refresh token sai, đã thu hồi hoặc hết hạn | Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại. |

## 3. Nghiệp vụ lõi

| code | HTTP | Ý nghĩa | Thông báo gợi ý | FE xử lý |
|---|---|---|---|---|
| `INSUFFICIENT_STOCK` ✅ | 409 | Không đủ tồn khi giữ chỗ | Sản phẩm không đủ hàng. | Tải lại giỏ hàng, báo dòng nào thiếu |
| `INVALID_STATUS_TRANSITION` ✅ | 409 | Chuyển trạng thái sai thứ tự | Không thể thực hiện thao tác ở trạng thái hiện tại. | Tải lại dữ liệu vì trạng thái đã đổi |
| `ORDER_EXPIRED` ✅ | 409 | Đơn quá hạn thanh toán | Đơn hàng đã hết hạn thanh toán. | Hướng dẫn đặt lại |
| `SELF_APPROVAL_NOT_ALLOWED` ✅ | 409 | Người tạo phiếu tự duyệt phiếu | Bạn không thể tự duyệt chứng từ do chính mình tạo. | Ẩn/khóa nút với người tạo |
| `CONCURRENCY_CONFLICT` ✅ | 409 | `rowVersion` lệch: người khác vừa sửa | Dữ liệu vừa được người khác cập nhật, vui lòng tải lại. | Tải lại rồi cho sửa lại |
| `BUSINESS_RULE_VIOLATION` 🆕 | 409 | Lỗi từ trigger MySQL (SQLSTATE 45000), kèm thông điệp trigger | Thao tác vi phạm quy tắc nghiệp vụ. | Hiện `detail` |

## 4. Mã đề xuất theo module (BE bổ sung khi làm tới)

| code | Module | Khi nào | Thông báo gợi ý |
|---|---|---|---|
| `SELLER_NOT_APPROVED` 🆕 | Seller | Seller chưa được duyệt mà tạo shop/sản phẩm | Tài khoản người bán chưa được duyệt. |
| `PRODUCT_NOT_AVAILABLE` 🆕 | Catalog/Cart | Sản phẩm chưa duyệt hoặc đã ngừng bán | Sản phẩm hiện không còn bán. |
| `DUPLICATE_SKU` 🆕 | Catalog | Trùng SKU | SKU này đã tồn tại. |
| `PAYMENT_ALREADY_PROCESSED` 🆕 | Payment | Callback lặp (đã xử lý) | (Không hiện cho người dùng) |
| `REFUND_EXCEEDS_PAID` 🆕 | Payment | Tổng hoàn tiền vượt số đã thanh toán | Số tiền hoàn vượt quá số đã thanh toán. |
| `RETURN_NOT_ELIGIBLE` 🆕 | Returns/Reviews | Đơn con chưa `Delivered` hoặc không phải khách đã mua | Chỉ có thể thực hiện với đơn đã giao. |
| `INVALID_LOCATION` 🆕 | Warehouse | Vị trí không bán được/không hoạt động | Vị trí kho không hợp lệ. |

## 5. Cách dùng ở FE

1. Tạo `src/constants/errorCodes.ts`: object ánh xạ `code` → thông báo tiếng Việt (cột "Thông báo gợi ý").
2. Hàm `getErrorMessage(error)` trong `src/utils/`: ưu tiên bảng ánh xạ theo `code`, nếu không có thì dùng `detail` của BE, cuối cùng dùng thông báo chung.
3. Gặp `UNAUTHORIZED` thì thử refresh token một lần; lỗi nữa thì về đăng nhập. Gặp `FORBIDDEN` thì sang trang không đủ quyền.
4. Gặp mã chưa có trong bảng: không báo lỗi trắng; hiện thông báo chung và (khi dev) log `code` để bổ sung vào file này.
