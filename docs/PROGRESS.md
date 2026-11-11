# Tiến độ dự án E-Commerce Warehouse (Cập nhật 11/11/2026)

Tài liệu tổng hợp toàn bộ những hạng mục **đã hoàn thành**, **trạng thái kiểm chứng**, và **các bước tiếp theo** tính đến thời điểm hiện tại để cả nhóm nắm rõ tiến độ đồng bộ giữa Tài liệu, Database, Backend và Frontend.

---

## 1. Tài liệu & Quy ước chung (`docs/`, `.agents/rules/`)

| Hạng mục | Trạng thái | Nội dung chính |
|---|---|---|
| Tài liệu dự án ([`docs/README.md`](README.md), [`setup.md`](setup.md), [`git-workflow.md`](git-workflow.md)) | ✅ Hoàn thành | Hướng dẫn cài đặt môi trường, luồng Git/PR và định hướng đọc tài liệu cho thành viên mới. |
| Luật nghiệp vụ & Phân quyền ([`business-rules.md`](business-rules.md), [`roles-and-permissions.md`](roles-and-permissions.md)) | ✅ Hoàn thành | Chốt phạm vi MVP 4 vai trò (`Customer`, `Seller`, `WarehouseManager`, `Admin`), quy tắc kho sàn (`Platform`), tách quyền duyệt phiếu (`SELF_APPROVAL_NOT_ALLOWED`). |
| Hợp đồng API & Mã lỗi ([`api-conventions.md`](api-conventions.md), [`error-codes.md`](error-codes.md)) | ✅ Hoàn thành | Quy ước REST `/api/v1/...`, cấu trúc `ProblemDetails` kèm trường `code` cố định và bảng ánh xạ mã lỗi. |
| Đặc tả giao diện FE ([`ui-guidelines.md`](ui-guidelines.md), [`ui-screens-by-role.md`](ui-screens-by-role.md)) | ✅ Hoàn thành | Bộ quy chuẩn thiết kế desktop (1280px/1440px), 3 trạng thái bắt buộc và đặc tả chi tiết màn hình S0–S9 (Seller), W1–W9 (Warehouse), A1–A8 (Admin). |
| Bộ quy tắc phát triển (`.agents/rules/`) | ✅ Hoàn thành | Quy tắc kiến trúc Backend (.NET 9 Clean Architecture), Frontend (React 19 + TS strict), quy tắc tồn kho/đơn hàng. |

---

## 2. Cơ sở dữ liệu (`database/`)

| Hạng mục | Trạng thái | Chi tiết |
|---|---|---|
| Thiết kế CSDL (`database/documentation/DatabaseDesign.md`) | ✅ Hoàn thành | Thiết kế đầy đủ **39 bảng**, sơ đồ quan hệ và từ điển dữ liệu cho MySQL. |
| Bộ script SQL khởi tạo (`database/scripts/`) | ✅ Hoàn thành | Gồm 6 script chạy tuần tự: `01_CreateDatabase.sql`, `02_CreateTables.sql`, `03_CreateForeignKeys.sql`, `04_CreateIndexes.sql`, `05_TriggersAndViews.sql`, `06_SeedData.sql`. |

---

## 3. Backend (.NET 9 — `backend/`)

### 3.1. Kiến trúc & Dữ liệu nền
- **Clean Architecture 4 tầng:** `Domain` → `Application` → `Infrastructure` → `WebAPI`.
- **Domain Entities (`ECommerceWarehouse.Domain/Entities/`):** Đã mô hình hóa các phân hệ `Catalog`, `Customer`, `Identity`, `Order`, `Review`, `Seller`, `Warehouse`.
- **Infrastructure (`ECommerceWarehouse.Infrastructure/`):** Kết nối MySQL qua EF Core + Pomelo (`Pomelo.EntityFrameworkCore.MySql 9.0.0`), triển khai `GenericRepository` và `UnitOfWork`.
- **Health Check (`HealthController`):** Endpoint `GET /api/health` kiểm tra trạng thái API.

### 3.2. Module Identity & Authentication
- **Endpoint hiện có (`AuthController`):**
  - `POST /api/v1/Auth/register` — Đăng ký tài khoản mới (`Customer` hoặc `Seller`).
  - `POST /api/v1/Auth/login` — Đăng nhập bằng Email hoặc Username, trả về thông tin user + JWT `accessToken` và `refreshToken`.
- **Seed dữ liệu mẫu tự động (`DataSeeder.cs`):** Tự động nạp 6 vai trò và 4 tài khoản mẫu khi khởi chạy (mật khẩu chung `Demo@123`):
  - **Admin:** `admin@emarket.vn` / username `admin`
  - **WarehouseManager:** `warehouse@emarket.vn` / username `warehouse`
  - **Seller:** `seller@emarket.vn` / username `seller` (tự động tạo kèm bản ghi Seller `Approved` và Shop mẫu)
  - **Customer:** `customer@gmail.com` / username `customer`

### 3.3. Swagger / OpenAPI (Mới hoàn thiện)
- Cấu hình **Swashbuckle.AspNetCore 6.9.0** và ghim trực tiếp **Microsoft.OpenApi 1.6.14** trong `ECommerceWarehouse.WebAPI.csproj` (khắc phục triệt để lỗi OpenAPI version `3.0.4` không tương thích Swagger UI mà không cần `<NoWarn>` hay middleware vá chuỗi).
- Xuất chuẩn `"openapi": "3.0.1"`, tích hợp nút **Authorize (JWT Bearer)**.
- Chỉ bật Swagger/SwaggerUI ở môi trường `Development` (đặt trước `UseAuthentication`), trang gốc `/` tự chuyển hướng về `/swagger`, bọc `UseHttpsRedirection()` trong `!IsDevelopment()`.
- Gắn `[ProducesResponseType]` (kèm `ProblemDetails` cho 400, 401, 403, 404, 409) vào `AuthController` làm mẫu cho các controller sau.
- **Kết quả kiểm tra:** `dotnet build` đạt `0` lỗi, `0` cảnh báo; `GET /swagger/v1/swagger.json` trả `"openapi": "3.0.1"`, UI `/swagger` và nút Authorize hoạt động bình thường.

---

## 4. Frontend (React 19 + TypeScript + Vite — `frontend/`)

### 4.1. Giao diện Storefront & Authentication
- **Hệ thống màu sắc & Design Token (`src/index.css`):** Đồng bộ bảng màu Forest Green (`#072b22`, `#0a3d31`), Emerald (`#059669`), Warm Peach (`#fdf6ec`), Dark Footer (`#0a1420`).
- **Storefront Layout (`MainLayout.tsx`, `Header.tsx`, `HomePage.tsx`):**
  - Trang chủ `HomePage.tsx` hoàn chỉnh bố cục theo thiết kế: Hero section, thẻ mô phỏng đơn tổng tách theo shop, 2 thẻ CTA, thanh cam kết 4 tiêu chí, 6 danh mục nổi bật, lưới 10 sản phẩm gợi ý, 4 shop nổi bật, banner mời người bán và quy trình 4 bước.
  - `ProductsPage.tsx` và `OrdersPage.tsx` hiện đang là trang khung sơ bộ chờ tích hợp dữ liệu thật.
- **Đăng nhập & Đăng ký (`AuthLayout.tsx`, `LoginPage.tsx`, `RegisterPage.tsx`):**
  - Bỏ nút đăng nhập nhanh theo role và QR code; giữ form tài khoản/mật khẩu (nút "Quên?" đặt ngay dòng dưới ô mật khẩu) + đăng nhập Google.
  - Bổ sung trường **Tên đăng nhập (`username`)** khi đăng ký.
  - Validate đầu vào chặt chẽ khi đăng ký: bắt buộc Gmail hợp lệ (`@gmail.com`) và số điện thoại 10 chữ số đúng các đầu số nhà mạng Việt Nam quy định.
  - Có tài khoản demo dự phòng trong `LoginPage` đồng bộ với `DataSeeder`.

### 4.2. Khung 3 khu vực quản lý, Phân quyền & Xử lý lỗi (Mới hoàn thành)
- **Xử lý lỗi chuẩn hóa & Axios Interceptor:**
  - `src/types/api.ts`: Khai báo type `ProblemDetails`.
  - `src/constants/errorCodes.ts` & `src/utils/errorHandler.ts`: Bảng ánh xạ toàn bộ mã lỗi sang tiếng Việt và hàm `getErrorMessage(error)` (ưu tiên `code` → `detail` → `message` → fallback).
  - `src/lib/axios.ts` & `src/services/authService.ts`: Bổ sung response interceptor bắt `401` để tự gọi `/api/v1/Auth/refresh` 1 lần (có hàng đợi tránh gọi trùng), thất bại thì đăng xuất về `/login`; bắt `403` chuyển sang `/forbidden`.
- **Phân quyền Route & Điều hướng đa vai trò:**
  - `src/utils/roleUtils.ts`: Dùng đúng chuỗi role DB (`Customer`, `Seller`, `WarehouseManager`, `Admin`); ưu tiên điều hướng sau đăng nhập theo thứ tự `Admin` (`/admin`) → `WarehouseManager` (`/warehouse`) → `Seller` (`/seller`) → `Customer` (`/`).
  - `ProtectedRoute.tsx` & `ForbiddenPage.tsx`: Chưa đăng nhập → `/login` (lưu `from` để quay về sau khi đăng nhập); sai role → trang **403 Không đủ quyền**.
  - `Header.tsx`: Chỉ hiển thị nút **"Kênh người bán"** khi tài khoản có role `Seller`; hiện "Trở thành người bán" (`/become-seller`) với `Customer`; hỗ trợ liên kết chuyển khu vực khi user có nhiều role.
- **3 Layout & Menu cấu hình bằng dữ liệu:**
  - Dùng chung khung nền `DashboardLayout.tsx` + `Sidebar.tsx` cho `SellerLayout.tsx` (`/seller`), `WarehouseLayout.tsx` (`/warehouse`), `AdminLayout.tsx` (`/admin`).
  - Cấu hình menu tập trung trong `src/constants/navigation.ts` (không viết `if` rải rác):
    - **Seller (7 mục):** Tổng quan, Shop, Sản phẩm, Đơn hàng, Tồn kho, Trả hàng, Hồ sơ.
    - **Warehouse (8 mục):** Tổng quan, Kho và vị trí, Tồn kho, Thẻ kho, Phiếu nhập, Phiếu xuất, Vận đơn, Hàng trả về.
    - **Admin (8 mục):** Tổng quan, Seller, Sản phẩm, Đơn hàng, Trả hàng, Hoàn tiền, Người dùng, Danh mục.
- **Khung Route đầy đủ (`routes.ts`, `AppRouter.tsx`, `PlaceholderPage.tsx`):**
  - Đã đăng ký toàn bộ route màn hình trong `ui-screens-by-role.md`: `/become-seller` (S0), Seller (`S1–S9`), Warehouse (`W1–W9`), Admin (`A1–A8`), trỏ về `PlaceholderPage` ("Đang xây dựng").
- **Kết quả kiểm tra FE:**
  - `pnpm build` (`tsc -b && vite build`): Thành công, `0` lỗi TypeScript; quét mã nguồn xác nhận `0` `any`, `0` `console.log`.
  - Lưu ý môi trường lint: `pnpm lint` hiện lỗi do xung đột dependency có sẵn trong `frontend/package.json` (`typescript@7.0.2` chưa được `typescript-eslint@8.72.1` hỗ trợ).

---

## 5. Việc cần làm tiếp theo (Cho các bước sau)

### Backend (.NET 9)
1. Bổ sung global exception middleware chuyển exception thành chuẩn `ProblemDetails` + `code` (theo `docs/error-codes.md` và `docs/api-conventions.md`).
2. Bổ sung endpoint `POST /api/v1/Auth/refresh` và `POST /api/v1/Auth/logout`.
3. Triển khai API theo thứ tự ưu tiên luồng dữ liệu:
   - Đăng ký/Duyệt Seller (`/sellers`, `/admin/sellers`).
   - Catalog (Shop, Danh mục, Sản phẩm, Biến thể, Duyệt sản phẩm).
   - Warehouse (Kho, Vị trí kệ, Phiếu nhập, Tồn kho, Thẻ kho).
   - Đơn hàng, Thanh toán, Phiếu xuất, Vận đơn, Trả hàng & Hoàn tiền.

### Frontend (React + TypeScript)
1. **Bộ UI Component dùng chung (`components/ui/`, `components/common/`):** `Button`, `Input`, `Select`, `Modal`, `ConfirmDialog`, `Table` (có phân trang), `StatusBadge`, `Toast`, `Skeleton`, `EmptyState`, `ErrorState`, `Pagination`, hàm `formatCurrency` & `formatDate`.
2. **Triển khai màn hình theo lộ trình `ui-screens-by-role.md` mục 5:**
   - **Bước 2:** S0 (`/become-seller`) + A2 (`/admin/sellers`).
   - **Bước 3:** S2 (`/seller/shops`), S3–S4 (`/seller/products`) + A3 (`/admin/products`).
   - **Bước 4:** W2–W5 (Kho/vị trí, Phiếu nhập, Tồn kho, Thẻ kho).
   - **Bước 5:** S5–S6 (Đơn hàng shop) + W6–W8 (Phiếu xuất, Soạn hàng quét mã, Vận đơn).
   - **Bước 6:** S8, W9, A5–A6 (Trả hàng & Hoàn tiền).
   - **Bước 7–8:** S1/W1/A1 Tổng quan, A4, S7, S9, A7, A8 và hoàn thiện các trang Storefront thật (`/products`, `/cart`, `/orders`).

