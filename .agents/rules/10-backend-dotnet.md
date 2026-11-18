# Quy tắc Backend (.NET 9, Clean Architecture)

## Hướng phụ thuộc giữa các project
`WebAPI → Application, Infrastructure` · `Infrastructure → Application` · `Application → Domain`. **Domain không phụ thuộc project nào.** Không thêm tham chiếu ngược chiều.

## Phân tầng trách nhiệm
- **Controller mỏng**: nhận request, gọi một service, trả kết quả. Không chứa logic nghiệp vụ, không truy cập DbContext.
- **Application Service**: chứa luồng nghiệp vụ, kiểm tra quyền sở hữu, gọi Repository/UnitOfWork.
- **Repository + UnitOfWork** ở Infrastructure; interface đặt ở Application (`Contracts`/`Interfaces`, theo cách module Identity đang làm).
- **DTO**: API chỉ nhận/trả DTO, **không bao giờ trả thẳng Entity**. Mapping đặt trong `Mappings/` theo cách đang dùng.
- **Validator**: FluentValidation cho mọi request DTO; lỗi định dạng trả 400.
- Chia file theo module (Catalog, Order, Warehouse...). Không dồn mọi thứ vào một thư mục phẳng.

## Quy ước REST API
- Đường dẫn `/api/v1/...`; tài nguyên là danh từ **số nhiều, chữ thường, nối bằng gạch ngang** (`/seller-orders`, `/stock-movements`).
- JSON `camelCase`. Thời gian là **UTC ISO-8601**.
- **Chuyển trạng thái bằng hành động con**: `POST /orders/{id}/cancel`, `POST /receipts/{id}/confirm`. Không cho client sửa trực tiếp cột trạng thái bằng PUT/PATCH.
- Mã trạng thái: 200 đọc/sửa, 201 tạo (kèm `Location`), 204 không nội dung, 400 sai định dạng, 401 chưa đăng nhập, 403 không đủ quyền, 404 không có hoặc không thuộc về bạn, **409 vi phạm nghiệp vụ hoặc xung đột đồng thời**, 500 lỗi không lường trước.
- Mọi lỗi trả `ProblemDetails` kèm trường `code` cố định (`INSUFFICIENT_STOCK`, `INVALID_STATUS_TRANSITION`, `ORDER_EXPIRED`, `SELF_APPROVAL_NOT_ALLOWED`, `CONCURRENCY_CONFLICT`...). Không lộ stack trace hay chi tiết nội bộ.
- Danh sách có phân trang: `{ items, page, pageSize, totalItems, totalPages }`, `pageSize` tối đa 100, sắp xếp `sort=-createdAt`.
- `POST /orders` và callback thanh toán phải **idempotent** (header `Idempotency-Key` hoặc `TransactionCode`).
- Mỗi endpoint có `[ProducesResponseType]` cho các mã trả về và hiện trong Swagger.

## Xử lý lỗi
- Nghiệp vụ sai → ném exception trong `Domain/Exceptions` (có `Code`), middleware toàn cục đổi thành `ProblemDetails`. Không `catch` rồi nuốt lỗi.
- Lỗi do trigger MySQL (`SQLSTATE 45000`, mã 1644) → đổi thành 409 kèm thông điệp trigger.

## EF Core + Pomelo (MySQL)
- Entity và Fluent API trong `Configurations/` khớp **đúng** tên bảng, cột, kiểu trong script SQL. Tên bảng PascalCase, chữ hoa/thường chính xác (Linux phân biệt).
- `RowVersion` (Orders, SellerOrders, Inventory): `.IsRowVersion()`. Bắt `DbUpdateConcurrencyException` → 409 `CONCURRENCY_CONFLICT`.
- **Cột sinh tự động không được ghi**: `OrderItems.LineTotal`, `StockCountDetails.Difference`, `ProductImages.PrimaryFlag`, `UserAddresses.DefaultFlag` (`ValueGeneratedOnAddOrUpdate`, không map vào lệnh INSERT/UPDATE).
- `UpdatedAt` do ứng dụng gán (override `SaveChangesAsync`), luôn dùng **UTC** (`DateTime.UtcNow`).
- Tiền dùng `decimal`, không `double`/`float`.
- Truy vấn chỉ đọc dùng `AsNoTracking()`; tránh N+1 (dùng `Include` hoặc projection thẳng ra DTO).
- Mọi phương thức I/O là `async` và nhận `CancellationToken`.
- Không viết SQL nối chuỗi; dùng tham số.

## Giao dịch (transaction)
Mọi nghiệp vụ thay đổi tồn kho, trạng thái đơn, thanh toán, hoàn tiền phải chạy **trong một transaction qua UnitOfWork** (xem `30-inventory-order-rules.md`). Không commit từng bước rời rạc.

## Xác thực và phân quyền
- JWT + policy theo role: `Admin`, `Customer`, `Seller`, `WarehouseManager`, `WarehouseStaff`, `CustomerSupport`.
- **Kiểm tra quyền sở hữu ở service**, không chỉ ở attribute: khách chỉ xem đơn của mình; seller chỉ thấy shop, sản phẩm, đơn con của mình.
- Người tạo phiếu kho **không được tự duyệt/xác nhận** (CHECK ở DB đã chặn; service cũng phải kiểm tra và trả `SELF_APPROVAL_NOT_ALLOWED`).
- Không log mật khẩu, token, hash.

## Code style
- C# bật nullable; không dùng `!` để ép bỏ cảnh báo nếu chưa chắc.
- Tên: `PascalCase` cho type/method/property, `_camelCase` cho field riêng, hậu tố `Async` cho phương thức async.
- Enum trạng thái đặt trong `Domain/Enums`, lưu DB dạng chuỗi khớp `CHECK` (dùng `HasConversion<string>()`).
