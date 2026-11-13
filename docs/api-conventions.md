# Quy ước REST API và danh sách endpoint MVP

Tài liệu này để cả nhóm (BE và FE) thống nhất cách đặt tên, mã lỗi và định dạng dữ liệu **trước khi viết code**.

## 1. Quy ước chung

| Mục | Quy ước |
|---|---|
| Base URL | `/api/v1/...` (có số phiên bản để sau này đổi API không vỡ FE) |
| Tên tài nguyên | Danh từ **số nhiều**, chữ thường, nối bằng gạch ngang: `/products`, `/seller-orders`, `/stock-movements` |
| Động từ HTTP | `GET` đọc, `POST` tạo hoặc thực hiện hành động, `PUT` thay toàn bộ, `PATCH` sửa một phần, `DELETE` xóa |
| Chuyển trạng thái | Dùng **hành động con**: `POST /orders/{id}/cancel`, `POST /receipts/{id}/confirm`. Không cho FE tự sửa cột `status` bằng PUT |
| JSON | `camelCase`. Thời gian theo **UTC ISO-8601** (`2026-11-03T14:00:00Z`), FE tự đổi sang giờ địa phương |
| Xác thực | Header `Authorization: Bearer <accessToken>`. Phân quyền bằng policy theo role |
| DTO | API chỉ nhận/trả **DTO**, không bao giờ trả thẳng Entity (lộ cột nội bộ, vòng lặp tham chiếu) |
| Quyền sở hữu | Khách chỉ xem đơn của mình, seller chỉ thấy dữ liệu shop của mình. Kiểm tra ở service, không chỉ ở FE |

### Mã trạng thái HTTP

| Mã | Khi nào |
|---|---|
| 200 OK | Đọc/sửa thành công |
| 201 Created | Tạo mới, kèm header `Location` |
| 204 No Content | Xóa/hành động không có dữ liệu trả về |
| 400 Bad Request | Dữ liệu sai định dạng (FluentValidation) |
| 401 Unauthorized | Chưa đăng nhập hoặc token hết hạn |
| 403 Forbidden | Đã đăng nhập nhưng không đủ quyền |
| 404 Not Found | Không có tài nguyên (hoặc không thuộc về bạn) |
| 409 Conflict | Vi phạm nghiệp vụ/đồng thời: hết hàng, sai trạng thái, sửa trùng lúc người khác sửa |
| 422 Unprocessable Entity | Đúng định dạng nhưng vi phạm quy tắc nghiệp vụ (tùy nhóm chọn 409 hoặc 422, **chọn một và dùng nhất quán**) |
| 500 | Lỗi không lường trước (middleware ghi log, không lộ chi tiết ra ngoài) |

### Định dạng lỗi (ProblemDetails, dùng chung cho mọi lỗi)

```json
{
  "type": "https://httpstatuses.com/409",
  "title": "Không đủ tồn kho",
  "status": 409,
  "code": "INSUFFICIENT_STOCK",
  "detail": "Biến thể SKU-001 chỉ còn 2, bạn yêu cầu 5.",
  "traceId": "00-abc..."
}
```

`code` là chuỗi cố định để FE dịch/hiển thị. Ví dụ: `INSUFFICIENT_STOCK`, `INVALID_STATUS_TRANSITION`, `ORDER_EXPIRED`, `SELF_APPROVAL_NOT_ALLOWED`, `CONCURRENCY_CONFLICT`.

### Phân trang, lọc, sắp xếp

`GET /products?categoryId=3&q=ao&page=1&pageSize=20&sort=-createdAt`

```json
{ "items": [ ... ], "page": 1, "pageSize": 20, "totalItems": 134, "totalPages": 7 }
```

`pageSize` tối đa 100. `sort=-createdAt` là giảm dần.

### Các quy tắc đặc biệt

- **Idempotency:** `POST /orders` và callback thanh toán nhận header `Idempotency-Key` (hoặc dùng `TransactionCode`). Gửi lại cùng khóa chỉ xử lý một lần.
- **Đồng thời:** sửa bản ghi có `rowVersion` thì FE gửi lại giá trị đã đọc; lệch thì trả 409 `CONCURRENCY_CONFLICT`.
- **Giữ chỗ tồn kho** nằm trong cùng transaction với tạo đơn; không có endpoint "giữ chỗ" riêng cho FE.
- **Swagger:** mọi endpoint phải có `[ProducesResponseType]` cho các mã trả về để FE đọc được hợp đồng.

---

## 2. Endpoint MVP theo module

Ký hiệu quyền: 🌐 công khai · 🔐 đã đăng nhập · C = Customer · S = Seller · A = Admin · WM = WarehouseManager · WS = WarehouseStaff

### Identity

| Method | URL | Quyền | Mô tả |
|---|---|---|---|
| POST | `/auth/register` | 🌐 | Đăng ký (mặc định vai trò Customer) |
| POST | `/auth/login` | 🌐 | Trả accessToken + refreshToken |
| POST | `/auth/refresh` | 🌐 | Đổi refreshToken lấy cặp token mới |
| POST | `/auth/logout` | 🔐 | Thu hồi refreshToken |
| GET / PUT | `/users/me` | 🔐 | Xem / sửa hồ sơ |
| GET / POST / PUT / DELETE | `/users/me/addresses[/{id}]` | C | Sổ địa chỉ |

### Seller và Shop

| Method | URL | Quyền | Mô tả |
|---|---|---|---|
| POST | `/sellers` | C | Đăng ký làm người bán (trạng thái Pending) |
| GET | `/sellers/me` | S | Hồ sơ seller của tôi |
| GET | `/admin/sellers?status=Pending` | A | Danh sách chờ duyệt |
| POST | `/admin/sellers/{id}/approve` · `/reject` · `/suspend` | A | Duyệt / từ chối / khóa |
| GET / POST | `/seller/shops` | S | Danh sách / tạo shop của mình |
| GET / PUT | `/seller/shops/{id}` | S | Xem chi tiết / sửa shop của mình |
| GET | `/shops/{id}` | 🌐 | Xem thông tin công khai của shop đang hoạt động |

### Catalog

| Method | URL | Quyền | Mô tả |
|---|---|---|---|
| GET | `/categories` | 🌐 | Cây danh mục |
| POST | `/seller/uploads/images` | S | Tải ảnh sản phẩm/shop lên máy chủ (`multipart/form-data`, jpg/png/webp) |
| GET | `/products?categoryId&shopId&q&minPrice&maxPrice&inStockOnly&sort&page&pageSize` | 🌐 | Danh sách đang bán (`Active`, kèm `minPrice`, `maxPrice`, ảnh đại diện, `inStock`, `availableQuantity`; hỗ trợ `sort=-createdAt\|price\|-price`) |
| GET | `/products/{id}` | 🌐 | Chi tiết sản phẩm đang bán, ảnh, shop, các biến thể active kèm giá và tồn khả dụng (`availableQuantity`, `inStock`) |
| GET / POST | `/seller/products` | S | Sản phẩm của shop mình (`status`, `shopId`, `q`) / tạo mới (Draft) |
| GET / PUT | `/seller/products/{id}` | S | Xem chi tiết / sửa sản phẩm (không sửa khi `PendingReview`) |
| POST | `/seller/products/{id}/submit` | S | Gửi duyệt (`Draft` / `Rejected` → `PendingReview`) |
| POST | `/seller/products/{id}/variants` · PUT `/seller/variants/{id}` | S | Quản lý biến thể (SKU, barcode, giá) |
| GET | `/admin/products` | A | Hàng đợi duyệt sản phẩm (`status`, `shopId`, `categoryId`, `q`) |
| GET | `/admin/products/{id}` | A | Xem chi tiết sản phẩm trước khi duyệt/từ chối |
| POST | `/admin/products/{id}/approve` · `/reject` | A | Duyệt (`→ Active`) / từ chối kèm lý do (`→ Rejected`) |

### Giỏ hàng và đơn hàng

| Method | URL | Quyền | Mô tả |
|---|---|---|---|
| GET | `/cart` | C | Giỏ của tôi (kèm cảnh báo hết hàng) |
| POST / PUT / DELETE | `/cart/items[/{id}]` | C | Thêm / đổi số lượng / xóa |
| POST | `/orders` | C | **Checkout**: tách đơn theo seller, phân bổ kho, giữ chỗ, tạo đơn |
| GET | `/orders` · `/orders/{id}` | C | Lịch sử và chi tiết đơn |
| POST | `/orders/{id}/cancel` | C | Hủy (chỉ khi chưa bàn giao vận chuyển) |
| GET | `/seller/orders?status=` | S | Đơn con của shop mình |
| POST | `/seller/orders/{id}/confirm` · `/cancel` | S | Xác nhận / hủy đơn con |
| GET | `/admin/orders` | A | Toàn bộ đơn |

### Thanh toán và hoàn tiền

| Method | URL | Quyền | Mô tả |
|---|---|---|---|
| POST | `/orders/{id}/payments` | C | Tạo giao dịch (COD hoặc cổng online) |
| POST | `/payments/callback/{provider}` | 🌐 (xác thực chữ ký) | Callback cổng thanh toán, idempotent |
| GET | `/admin/refunds?status=Pending` | A | Hàng đợi hoàn tiền |
| POST | `/admin/refunds/{id}/approve` · `/reject` · `/complete` | A | Xử lý hoàn tiền |

### Kho (Warehouse)

| Method | URL | Quyền | Mô tả |
|---|---|---|---|
| GET / POST | `/warehouses` · `/warehouses/{id}/locations` | WM | Kho và vị trí |
| GET | `/inventory?warehouseId&variantId` | WM, WS, S (chỉ hàng của mình) | Tồn theo vị trí |
| GET | `/inventory/availability?variantId` | 🌐 | Tồn khả dụng tổng |
| GET | `/stock-movements?variantId&from&to` | WM | Thẻ kho (sổ cái) |
| POST | `/receipts` | WS | Tạo phiếu nhập (Draft) |
| POST | `/receipts/{id}/confirm` · `/cancel` | WM (khác người tạo) | Xác nhận: tăng tồn, ghi sổ cái |
| GET | `/issues?status=` | WM, WS | Phiếu xuất (tự sinh từ đơn) |
| POST | `/issues/{id}/approve` · `/start-picking` · `/pack` · `/dispatch` | WM, WS | Luồng soạn, đóng gói, xuất kho |
| POST | `/issues/{id}/lines/{lineId}/scan` | WS | Quét mã lấy hàng (tăng `pickedQuantity`) |
| POST / GET | `/transfers` · `/transfers/{id}/approve` · `/ship` · `/receive` | WM | Điều chuyển kho |
| POST / GET | `/stock-counts` · `/{id}/submit` · `/{id}/approve` | WM | Kiểm kê |

### Vận chuyển, trả hàng

| Method | URL | Quyền | Mô tả |
|---|---|---|---|
| GET | `/carriers` | 🔐 | Danh sách hãng vận chuyển |
| POST | `/seller-orders/{id}/shipments` | S, WS | Tạo kiện hàng, gắn mã vận đơn |
| PATCH | `/shipments/{id}/status` | WS, A | Cập nhật Đã lấy / Đang giao / Đã giao / Thất bại |
| GET | `/shipments/track/{trackingNumber}` | C | Tra cứu hành trình |
| POST | `/seller-orders/{id}/returns` | C | Tạo yêu cầu trả hàng |
| POST | `/returns/{id}/approve` · `/reject` · `/receive` | S, A | Xử lý yêu cầu |
| POST | `/returns/{id}/items/{itemId}/inspect` | WS | Kiểm tra hàng hoàn (Good / MinorDefect / Damaged) rồi nhập lại kệ |

### Sau MVP

Review (`/products/{id}/reviews`), wishlist (`/users/me/wishlists`), báo cáo (`/reports/...`), dashboard.

---

## 3. Cách làm việc giữa BE và FE

1. BE bật Swagger, mỗi endpoint xong thì đánh dấu ✅ vào bảng trên.
2. FE làm màn hình bằng dữ liệu giả theo đúng JSON của hợp đồng, rồi đổi sang gọi API thật.
3. Muốn đổi hợp đồng (thêm/bớt trường, đổi URL) thì sửa file này **trước**, báo nhóm, rồi mới code.
4. Có thể sinh kiểu TypeScript từ Swagger (`openapi-typescript`) để FE và BE không bị lệch DTO.
