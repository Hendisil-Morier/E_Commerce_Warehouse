# Tiến độ dự án E_Commerce_Warehouse

Cập nhật lần cuối: 2026-11-11. Người phụ trách hiện tại: Frontend (làm một mình đến thời điểm này).

Quy ước: `[x]` đã xong · `[ ]` chưa làm · `[~]` đang làm · `[?]` **chưa chắc, cần xác nhận** (sửa lại thành `[x]` hoặc `[ ]`).

Cách dùng: mỗi lần làm xong một việc, đánh dấu ở mục tương ứng và thêm một dòng vào **Nhật ký** ở cuối file (ngày, việc, nhánh/PR).

---

## 1. Tóm tắt nhanh

| Hạng mục | Trạng thái |
|---|---|
| Khung dự án, cấu trúc thư mục | Xong |
| Xác thực (Auth): đăng ký, đăng nhập, JWT, refresh token | Xong |
| Giao diện Storefront: trang chủ, đăng nhập, đăng ký | Xong |
| Swagger | Xong (còn dọn đoạn vá tạm, xem mục 5) |
| Khung 3 khu vực Seller/Warehouse/Admin (Bước 1) | Chưa làm |
| Màn hình nghiệp vụ Seller, Warehouse, Admin | Chưa làm |
| Giao diện Customer còn lại (danh sách/chi tiết sản phẩm, giỏ hàng, đặt hàng...) | Chưa làm |

---

## 2. Đã hoàn thành

### Nền tảng
- [x] Dựng khung dự án theo Clean Architecture (backend) và cấu trúc `features/` (frontend), repo `E_Commerce_Warehouse`.
- [x] Chọn công nghệ: .NET 9 Web API, EF Core + Pomelo, FluentValidation, JWT; React 19 + TypeScript + Vite, React Router v7, TanStack Query, Zustand, Axios, pnpm.
- [x] CORS cho frontend (cổng 5173, 5174, 3000).
- [x] `DataSeeder` tạo sẵn 4 tài khoản mẫu (Customer, Seller, WarehouseManager, Admin) khi khởi động.

### Xác thực (Auth)
- [x] Backend: đăng ký, đăng nhập, access token JWT, refresh token.
- [x] Frontend: giao diện đăng nhập, đăng ký cho người dùng.

### Giao diện Customer (Storefront)
- [x] Trang chủ (thanh trên, header có tìm kiếm và giỏ hàng, menu danh mục, hero, lưới sản phẩm, shop nổi bật, kêu gọi bán hàng, chân trang).
- [x] Trang đăng nhập và đăng ký.

### Công cụ và môi trường
- [x] Swagger chạy được, có nút Authorize cho JWT Bearer (chỉ bật ở môi trường Development).
- [x] Đã xác định quy ước API, mã lỗi, vai trò và phạm vi (xem mục 4).

---

## 3. Cần xác nhận (mình không biết bạn đã làm chưa)

- [?] Cơ sở dữ liệu MySQL: đã chạy 6 file `database/scripts/01..06_*.sql` thành công trên MySQL thật chưa (bản này chưa được chạy thử trên MySQL thật khi viết). Kiểm tra: 39 bảng, bảng `Roles` có 6 dòng.
- [?] Docker: đã có `docker-compose.yml`, `.env.example`, `backend/Dockerfile` trong repo và chạy được `docker compose up -d` chưa.
- [?] Bộ tài liệu `docs/` (README, setup, git-workflow, business-rules, roles-and-permissions, api-conventions, error-codes, ui-guidelines, ui-screens-by-role, agent-prompts-fe) đã được chép vào repo và commit chưa.
- [?] Thư mục `.agents/rules/` (4 file luật cho Antigravity) đã nằm ở gốc repo chưa, và tên thư mục đúng (`.agents` hay `.agent`) chưa.
- [?] Axios client: đã tự gắn token và tự refresh khi gặp 401 chưa.
- [?] `ProtectedRoute`: đã kiểm tra theo role chưa, hay mới kiểm tra đã đăng nhập.
- [?] Bản đồ route ở frontend hiện có những trang nào ngoài trang chủ, đăng nhập, đăng ký.
- [?] Hàm xử lý lỗi theo `ProblemDetails.code` (`errorCodes.ts`, `getErrorMessage`) đã có chưa.
- [?] Nhánh Git đang dùng, và nhánh `develop` đã tạo chưa.

---

## 4. Quyết định đã chốt

| Quyết định | Nội dung |
|---|---|
| Nền tảng | Chỉ web desktop (1280/1440px), không làm mobile |
| Vai trò | 4 vai trò: Customer, Seller, WarehouseManager, Admin (bỏ WarehouseStaff, CustomerSupport) |
| Kho | Chỉ dùng **kho sàn**; seller không có kho riêng, chỉ xem tồn hàng của mình |
| Tách quyền | Người tạo phiếu kho không được tự xác nhận; cần **2 tài khoản WM** (`manager1`, `manager2`) |
| Cơ sở dữ liệu | Database-first: script SQL là nguồn sự thật, không dùng EF Migrations |
| Làm sau | Điều chuyển kho, kiểm kê, báo cáo/dashboard doanh thu, đánh giá, wishlist, thanh toán online thật |
| Còn mở | Lỗi nghiệp vụ dùng 409 hay 422 (đang ghi 409); danh sách `code` lỗi cuối cùng |

---

## 5. Việc tồn đọng nhỏ (dọn dẹp)

- [ ] Dọn đoạn middleware vá chuỗi `3.0.4` → `3.0.1` trong `Program.cs`: ghim `Microsoft.OpenApi` về 1.6.x rồi xóa middleware (xem prompt đã soạn); không dùng `SerializeAsV2`.
- [ ] Bọc `app.UseHttpsRedirection()` trong `if (!app.Environment.IsDevelopment())` để hết cảnh báo cổng HTTPS.
- [ ] Nhờ BE seed thêm tài khoản `manager2`.
- [ ] Nhờ BE thêm `[ProducesResponseType]` cho các endpoint để Swagger hiện đủ mã lỗi.
- [ ] Chốt 409 hay 422 với bạn BE.

---

## 6. Tiến độ màn hình Frontend

### Customer (Storefront)
| Màn hình | Trạng thái | Ghi chú |
|---|---|---|
| Trang chủ | [x] | |
| Đăng nhập, đăng ký | [x] | |
| Danh sách sản phẩm `/products` | [ ] | |
| Chi tiết sản phẩm `/products/:id` | [ ] | |
| Trang shop `/shops/:id` | [ ] | |
| Giỏ hàng | [ ] | |
| Đặt hàng (checkout) | [ ] | |
| Lịch sử đơn, chi tiết đơn, hủy đơn | [ ] | |
| Theo dõi vận đơn | [ ] | |
| Yêu cầu trả hàng | [ ] | |
| Hồ sơ, sổ địa chỉ | [ ] | |
| Đăng ký làm seller `/become-seller` (S0) | [ ] | Bước 3 |

### Seller (`/seller`)
| Màn hình | Trạng thái | Bước |
|---|---|---|
| Khung layout, menu, phân quyền route | [ ] | 1 |
| S1 Tổng quan | [ ] | 9 |
| S2 Shop | [ ] | 4 |
| S3 Danh sách sản phẩm | [ ] | 4 |
| S4 Tạo/sửa sản phẩm và biến thể | [ ] | 4 |
| S5 Danh sách đơn hàng | [ ] | 6 |
| S6 Chi tiết đơn con | [ ] | 6 |
| S7 Tồn kho (chỉ xem) | [ ] | 9 |
| S8 Trả hàng | [ ] | 8 |
| S9 Hồ sơ | [ ] | 9 |

### Warehouse (`/warehouse`)
| Màn hình | Trạng thái | Bước |
|---|---|---|
| Khung layout, menu, phân quyền route | [ ] | 1 |
| W1 Tổng quan | [ ] | 9 |
| W2 Kho và vị trí | [ ] | 5 |
| W3 Tồn kho | [ ] | 5 |
| W4 Thẻ kho | [ ] | 5 |
| W5 Phiếu nhập | [ ] | 5 |
| W6 Phiếu xuất | [ ] | 7 |
| W7 Soạn hàng, quét mã | [ ] | 7 |
| W8 Vận đơn | [ ] | 7 |
| W9 Hàng trả về | [ ] | 8 |

### Admin (`/admin`)
| Màn hình | Trạng thái | Bước |
|---|---|---|
| Khung layout, menu, phân quyền route | [ ] | 1 |
| A1 Tổng quan | [ ] | 9 |
| A2 Duyệt seller | [ ] | 3 |
| A3 Duyệt sản phẩm | [ ] | 4 |
| A4 Đơn hàng (chỉ xem) | [ ] | 9 |
| A5 Trả hàng | [ ] | 8 |
| A6 Hoàn tiền | [ ] | 8 |
| A7 Người dùng | [ ] | 10 |
| A8 Danh mục | [ ] | 10 |

### Hạ tầng Frontend
| Việc | Trạng thái | Bước |
|---|---|---|
| Component dùng chung (Table, StatusBadge, Modal, Toast, ScanInput...) | [ ] | 2 |
| MSW để mock API khi BE chưa xong | [ ] | 2b |
| Rà soát chất lượng cuối | [ ] | 11 |

---

## 7. Tiến độ API Backend (để FE biết khi nào bỏ mock)

Cập nhật theo bảng endpoint trong `api-conventions.md`. Đánh `[x]` khi endpoint đã chạy được trên Swagger.

| Module | Trạng thái | Ghi chú |
|---|---|---|
| Identity: register, login, refresh, logout | [x] | Xong |
| Identity: `users/me`, địa chỉ | [?] | Hỏi BE |
| Seller và Shop | [ ] | |
| Catalog (categories, products, variants, duyệt) | [ ] | |
| Giỏ hàng, đơn hàng | [ ] | |
| Thanh toán, hoàn tiền | [ ] | |
| Kho (warehouses, inventory, receipts, issues, scan) | [ ] | |
| Vận chuyển, trả hàng | [ ] | |

Các API chưa có trong tài liệu (⚠️) đang chờ BE: xem `docs/ui-screens-by-role.md` mục 6.

---

## 8. Việc kế tiếp

1. Xác nhận các mục `[?]` ở mục 3.
2. **Bước 1:** khung 3 khu vực (layout, menu theo role, `ProtectedRoute`, route placeholder).
3. **Bước 2:** component dùng chung; **Bước 2b:** MSW nếu BE chưa xong API.
4. Tiếp tục theo `docs/agent-prompts-fe.md` (Bước 3 đến Bước 11).

---

## 9. Nhật ký làm việc

Mỗi lần làm xong một việc, thêm một dòng ở **trên cùng** (mới nhất lên đầu).

| Ngày | Việc đã làm | Nhánh / PR |
|---|---|---|
| 2026-11-11 | **FE Bước 2:** Đổi theme sang `#0E7C66` + font `Be Vietnam Pro`; xây dựng bộ component dùng chung (`Button`, `Input`, `Select`, `Textarea`, `FormField`, `SearchInput`, `StatusBadge` + `constants/statusLabels.ts`, `Skeleton`, `Pagination`, `Table`, `Modal`, `ConfirmDialog`, `ToastProvider` + `useToast`, `ScanInput`, `EmptyState`, `ErrorState`, `PageHeader`, `StatusTimeline`), hook `useUrlFilters`, `formatCurrency`/`formatDate`, `PagedResult<T>`; xóa 2 file rỗng cũ (`ErrorMessage.tsx`, `Loading.tsx`). (`pnpm run build` sạch; `lint` lỗi cấu hình `typescript@7.0.2` / `typescript-eslint@8.72.1` có sẵn). | `feature/namnh-full` |
| 2026-11-11 | **BE Bước 1:** Chuẩn hóa `RoleNames`, `ErrorCodes`, `BusinessException`, `NotFoundException`; bổ sung `GlobalExceptionMiddleware` + `InvalidModelStateResponseFactory` trả `ProblemDetails` (`code`, `traceId`, trigger MySQL `1644`/`45000`); cấu hình `JwtBearer`, 4 role policy và `ICurrentUser` (`CurrentUserService`); thêm `PagedResult<T>`, `PaginationQuery`, `ToPagedResultAsync`; cập nhật `DataSeeder` seed 5 tài khoản `@gmail.com` kèm `manager1` & `manager2` lấy mật khẩu từ `SeedSettings:DefaultPassword`; viết unit test `ECommerceWarehouse.UnitTests` (`45/45` passed) và kiểm tra thực tế qua Swagger + MySQL. | `feature/namnh-full` |
| 2026-11-11 | **FE Bước 1:** Dựng khung 3 khu vực `Seller` (`/seller`), `Warehouse` (`/warehouse`), `Admin` (`/admin`) dùng chung `DashboardLayout` + `Sidebar`, menu dữ liệu tại `constants/navigation.ts`, phân quyền `ProtectedRoute` + trang `ForbiddenPage` (403), route placeholder cho `S0`–`S9`, `W1`–`W9`, `A1`–`A8`, điều hướng sau đăng nhập theo thứ tự ưu tiên role, nút `Kênh người bán` ở Storefront, ánh xạ lỗi `errorCodes.ts` + `getErrorMessage` và refresh token 401 trong Axios client. | `feature/namnh-full` |
| 2026-11-11 | **Sửa gốc Swagger/OpenAPI (BE):** Ghim `Microsoft.OpenApi` `1.6.14` (gỡ gói kéo lệch bản 2.x), xóa middleware vá chuỗi `3.0.4` khỏi `Program.cs` (Swagger xuất chuẩn `openapi: "3.0.1"`), bọc `UseHttpsRedirection()` trong `!IsDevelopment()`. | `feature/namnh-full` |
| 2026-11-11 | Hoàn thiện Swagger (nút Authorize JWT, bật ở Development); chốt phạm vi 4 vai trò, kho sàn, 2 tài khoản WM; có đặc tả màn hình và bộ prompt cho agent | |
| (trước đó) | Hoàn thiện Auth (BE) và giao diện đăng nhập, đăng ký; làm trang chủ Storefront; dựng khung dự án | |