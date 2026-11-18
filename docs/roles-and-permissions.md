# Vai trò và phân quyền

Hệ thống có 6 vai trò (khớp bảng `Roles` đã seed). Một người dùng có thể giữ nhiều vai trò (ví dụ một Customer sau khi được duyệt trở thành Seller).

| Vai trò | Là ai | Khu vực giao diện |
|---|---|---|
| `Customer` | Khách mua hàng | Storefront (`/`, `/products`, `/cart`, `/orders`, `/account`) |
| `Seller` | Người bán, sở hữu shop | Kênh người bán (`/seller/...`) |
| `Admin` | Quản trị sàn | Trang quản trị (`/admin/...`) |
| `WarehouseManager` | Quản lý kho | Trang kho (`/warehouse/...`) |
| `WarehouseStaff` | Nhân viên kho (nhập, soạn, quét mã) | Trang kho (`/warehouse/...`), giao diện tối giản |
| `CustomerSupport` | Hỗ trợ khách (xem đơn, xử lý trả hàng) | Trang quản trị, phạm vi hẹp |

Khách chưa đăng nhập (Guest) chỉ xem được trang công khai: trang chủ, danh mục, danh sách và chi tiết sản phẩm, trang shop.

## 1. Ma trận chức năng × vai trò

Ký hiệu: ✅ được · 🔸 được nhưng giới hạn (ghi chú) · ➖ không

| Chức năng | Guest | Customer | Seller | Admin | WM | WS | CS |
|---|---|---|---|---|---|---|---|
| Xem trang chủ, danh mục, sản phẩm, shop | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Đăng ký, đăng nhập | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Sửa hồ sơ, đổi mật khẩu, sổ địa chỉ | ➖ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Giỏ hàng, đặt hàng, thanh toán | ➖ | ✅ | ➖ | ➖ | ➖ | ➖ | ➖ |
| Xem và hủy đơn của mình | ➖ | ✅ | ➖ | ➖ | ➖ | ➖ | ➖ |
| Theo dõi vận đơn | ➖ | 🔸 đơn của mình | ➖ | ✅ | ➖ | ➖ | ✅ |
| Yêu cầu trả hàng, đánh giá (chỉ đơn đã giao) | ➖ | ✅ | ➖ | ➖ | ➖ | ➖ | ➖ |
| Đăng ký làm seller | ➖ | ✅ | ➖ | ➖ | ➖ | ➖ | ➖ |
| Quản lý shop của mình | ➖ | ➖ | ✅ | ➖ | ➖ | ➖ | ➖ |
| Tạo/sửa sản phẩm và biến thể, gửi duyệt | ➖ | ➖ | 🔸 shop của mình | ➖ | ➖ | ➖ | ➖ |
| Xem và xử lý đơn con của shop | ➖ | ➖ | 🔸 shop của mình | ✅ xem tất cả | ➖ | ➖ | ✅ xem |
| Xem tồn kho | ➖ | ➖ | 🔸 hàng của mình | ➖ | ✅ | ✅ | ➖ |
| Duyệt seller, duyệt sản phẩm | ➖ | ➖ | ➖ | ✅ | ➖ | ➖ | ➖ |
| Khóa tài khoản, quản lý người dùng | ➖ | ➖ | ➖ | ✅ | ➖ | ➖ | ➖ |
| Duyệt, hoàn thành hoàn tiền | ➖ | ➖ | ➖ | ✅ | ➖ | ➖ | ➖ |
| Tạo kho và vị trí | ➖ | ➖ | ➖ | ➖ | ✅ | ➖ | ➖ |
| Tạo phiếu nhập | ➖ | ➖ | ➖ | ➖ | ✅ | ✅ | ➖ |
| Xác nhận phiếu nhập | ➖ | ➖ | ➖ | ➖ | 🔸 khác người tạo | ➖ | ➖ |
| Soạn hàng, quét mã, đóng gói, xuất kho | ➖ | ➖ | ➖ | ➖ | ✅ | ✅ | ➖ |
| Duyệt phiếu xuất (điều chỉnh, tiêu hủy, trả seller) | ➖ | ➖ | ➖ | ➖ | 🔸 khác người tạo | ➖ | ➖ |
| Điều chuyển kho, kiểm kê, duyệt kiểm kê | ➖ | ➖ | ➖ | ➖ | ✅ | ➖ | ➖ |
| Kiểm tra hàng trả về | ➖ | ➖ | ➖ | ➖ | ✅ | ✅ | ➖ |
| Duyệt/từ chối yêu cầu trả hàng | ➖ | ➖ | 🔸 đơn của shop | ✅ | ➖ | ➖ | ✅ |
| Xem thẻ kho (sổ cái `StockMovements`) | ➖ | ➖ | ➖ | ➖ | ✅ | ➖ | ➖ |
| Báo cáo, dashboard | ➖ | ➖ | 🔸 shop của mình | ✅ | 🔸 kho | ➖ | ➖ |

> Ma trận này suy ra từ cột "Quyền" của `api-conventions.md` và các luật nghiệp vụ. Dòng nào chưa rõ (nhất là `CustomerSupport`) cần nhóm chốt lại, vì chưa có endpoint riêng cho vai trò này.

## 2. Quy tắc quan trọng

- **FE chỉ ẩn/hiện cho đỡ rối; BE mới là nơi chặn quyền.** Đừng dựa vào việc ẩn nút để bảo vệ dữ liệu.
- **Quyền sở hữu:** khách chỉ thấy đơn của mình, seller chỉ thấy shop, sản phẩm, đơn con và tồn của mình. BE trả 404 nếu không thuộc về bạn.
- **Tách quyền (separation of duties):** người tạo phiếu nhập/xuất/điều chuyển/kiểm kê **không được tự duyệt hoặc xác nhận** phiếu đó (BE trả `SELF_APPROVAL_NOT_ALLOWED`). FE nên khóa nút khi `createdBy` trùng người đang đăng nhập.

## 3. Áp dụng ở FE

1. **Route guard** (`routes/`): Protected Route nhận danh sách role được phép; chưa đăng nhập → `/login` (lưu lại trang đang xem để quay về); sai role → trang không đủ quyền.
2. **Bốn layout:** Storefront, Seller, Admin, Warehouse (Admin và Warehouse có thể chia chung khung, khác menu).
3. **Menu theo role:** mỗi layout dựng menu từ một mảng cấu hình trong `constants/` có trường `roles`, không viết `if` rải rác.
4. **Đa vai trò:** người dùng có nhiều role thì cho chuyển khu vực (ví dụ nút "Kênh người bán" ở header của Customer đã là Seller).
5. Đường dẫn mặc định sau đăng nhập: Customer → `/`, Seller → `/seller`, Admin → `/admin`, WM/WS → `/warehouse`.
