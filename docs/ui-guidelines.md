# Hướng dẫn giao diện (FE)

Để các trang nhìn thống nhất dù do nhiều người làm. Giá trị lấy từ bản thiết kế trang chủ; nếu trang chủ trong code khác, **code là nguồn thật**, hãy sửa file này cho khớp.

## 1. Phạm vi

- **Chỉ làm web, không làm mobile.** Thiết kế cho màn hình máy tính **1280px và 1440px** (kiểm tra thêm 1024px nếu có thời gian). Không cần bố cục điện thoại.
- Trang không được tràn ngang ở các độ rộng trên.
- Máy quét mã vạch USB hoạt động như bàn phím: ô quét ở trang kho phải **tự focus** và nhận Enter để xác nhận.

## 2. Màu và chữ

| Mục | Giá trị |
|---|---|
| Màu nhấn (accent) | `#0E7C66` (xanh ngọc), có tông nhạt `accentSoft` dùng cho nền nhãn/nút phụ |
| Font | **Be Vietnam Pro** (hỗ trợ tiếng Việt đầy đủ), dự phòng `system-ui, sans-serif` |
| Tiền tệ | `349.000₫`, luôn dùng hàm `formatCurrency` |
| Ngày giờ | API trả UTC, hiển thị giờ địa phương bằng `formatDate` |

Khai báo màu, cỡ chữ, khoảng cách thành biến CSS (hoặc token trong cấu hình) ở một nơi, không viết cứng màu hex rải rác trong component.

## 3. Nhãn trạng thái (Badge)

Dùng một component `StatusBadge` duy nhất, nhận mã trạng thái và hiển thị nhãn tiếng Việt cùng màu. Nhãn nằm trong `constants/`.

| Tình huống | Nhãn hiển thị |
|---|---|
| Còn hàng | Còn hàng |
| Tồn thấp | Sắp hết hàng |
| Không còn | Hết hàng (khóa nút mua) |
| Nguồn hàng | `Kho sàn` / `Kho người bán` |

Chỉ dựa vào màu thì chưa đủ: luôn kèm chữ (người mù màu vẫn đọc được).

## 4. Bố cục chung

- **Storefront:** thanh trên cùng, header (logo, tìm kiếm, giỏ hàng, tài khoản), menu danh mục, nội dung, chân trang.
- **Seller / Admin / Warehouse:** thanh bên (menu theo role) + vùng nội dung có tiêu đề trang và nút hành động chính.
- Bảng dữ liệu: có phân trang, sắp xếp, trạng thái rỗng; hành động dòng đặt ở cột cuối.

## 5. Ba trạng thái bắt buộc

Mọi màn hình lấy dữ liệu từ API phải có:

1. **Đang tải:** khung xương (skeleton) hoặc spinner, không để trắng trang.
2. **Rỗng:** thông báo rõ và gợi ý việc tiếp theo ("Chưa có sản phẩm nào", nút "Thêm sản phẩm").
3. **Lỗi:** thông báo tiếng Việt từ `getErrorMessage` kèm nút **Thử lại**.

## 6. Form

- Mỗi ô nhập có `<label>`; ô lỗi hiện thông báo ngay dưới ô.
- Kiểm tra phía client chỉ để phản hồi nhanh; vẫn phải hiển thị lỗi 400 từ server.
- Nút gửi bị khóa và hiện trạng thái đang xử lý khi đang gửi, để tránh gửi hai lần.
- Hành động nguy hiểm (hủy đơn, xóa) cần hộp thoại xác nhận.

## 7. Khả năng tiếp cận

- Nút chỉ có biểu tượng phải có `aria-label`.
- Dùng đúng phần tử: `<button>` cho hành động, `<Link>`/`<a>` cho điều hướng.
- Vùng bấm tối thiểu 44px; thứ tự Tab hợp lý; có viền focus nhìn thấy.
- Ảnh sản phẩm có `alt` (tên sản phẩm).

## 8. Component dùng chung (`components/ui`, `components/common`)

Ưu tiên có sẵn trước khi làm trang nghiệp vụ: `Button`, `Input`, `Select`, `Modal`, `Table` (có phân trang), `StatusBadge`, `Toast`, `Skeleton`, `EmptyState`, `ErrorState`, `ProductCard`, `Pagination`, `ProtectedRoute`.

Mỗi component nhỏ (dưới khoảng 200 dòng), có kiểu props rõ ràng, tên file trùng tên component.
