# Tiến độ dự án E_Commerce_Warehouse

Cập nhật lần cuối: 2026-11-12. Người phụ trách hiện tại: Frontend + Backend (triển khai nối tiếp trên nhánh `feature/namnh-full`).

Quy ước: `[x]` đã xong · `[ ]` chưa làm · `[~]` đang làm · `[?]` **chưa chắc, cần xác nhận** (sửa lại thành `[x]` hoặc `[ ]`).

Cách dùng: mỗi lần làm xong một việc, đánh dấu ở mục tương ứng và thêm một dòng vào **Nhật ký** ở cuối file (ngày, việc, nhánh/PR).

---

## 1. Tóm tắt nhanh

| Hạng mục | Trạng thái |
|---|---|
| Khung dự án, cấu trúc thư mục | Xong |
| Xác thực (Auth): đăng ký, đăng nhập, JWT, refresh token | Xong |
| Giao diện Storefront: trang chủ, đăng nhập, đăng ký | Xong |
| Swagger & Nền tảng BE (Bước 1) | Xong (đã dọn đoạn vá tạm ở mục 5, unit tests `45/45`) |
| Khung 3 khu vực Seller/Warehouse/Admin & Bộ UI dùng chung (FE Bước 1–2) | Xong |
| Luồng Seller hồ sơ & duyệt tài khoản (BE & FE Bước 3: `S0`, `A2`) | Xong |
| Quản lý Shop, Danh mục, Upload ảnh, Sản phẩm & Duyệt sản phẩm (BE 4a–4c & FE Bước 4: `S2`–`S4`, `A3`) | Xong (đang chờ test thủ công end-to-end) |
| Giao diện Customer còn lại (FE Bước 4b: `/products`, `/products/:id`, `/shops/:id`, giỏ hàng, đặt hàng...) | Chưa làm |
| Màn hình nghiệp vụ Warehouse (`W2`–`W9`), Đơn hàng Seller (`S5`–`S9`), Admin còn lại | Chưa làm |

---

## 2. Đã hoàn thành

### Nền tảng
- [x] Dựng khung dự án theo Clean Architecture (backend) và cấu trúc `features/` (frontend), repo `E_Commerce_Warehouse`.
- [x] Chọn công nghệ: .NET 9 Web API, EF Core + Pomelo, FluentValidation, JWT; React 19 + TypeScript + Vite, React Router v7, TanStack Query, Zustand, Axios, pnpm.
- [x] CORS cho frontend (cổng 5173, 5174, 3000).
- [x] `DataSeeder` tạo sẵn 5 tài khoản mẫu (`Customer`, `Seller`, `manager1`, `manager2`, `Admin`) khi khởi động.

### Xác thực (Auth)
- [x] Backend: đăng ký, đăng nhập, access token JWT, refresh token, `ProblemDetails` (`GlobalExceptionMiddleware`), `ICurrentUser`, 4 role policy.
- [x] Frontend: giao diện đăng nhập, đăng ký, auto-refresh 401 trong Axios, `ProtectedRoute` theo role (`403 ForbiddenPage`).

### Giao diện & Nghiệp vụ theo từng bước
- [x] Storefront nền tảng: trang chủ, đăng nhập, đăng ký.
- [x] **FE Bước 1 & Bước 2:** Khung 3 khu vực Seller/Warehouse/Admin (`DashboardLayout`, `Sidebar`, route placeholder `S0`–`S9`, `W1`–`W9`, `A1`–`A8`) và bộ UI dùng chung (`Table`, `StatusBadge`, `Modal`, `ConfirmDialog`, `Toast`, `ScanInput`, `Pagination`, `SearchInput`, `useUrlFilters`, formatters).
- [x] **BE & FE Bước 3:** Đăng ký hồ sơ người bán (`S0` `/become-seller`, tự động refresh token khi được duyệt) & duyệt hồ sơ người bán (`A2` `/admin/sellers`).
- [x] **BE 4a–4c & FE Bước 4:** Danh mục, Shop (`S2` `/seller/shops`), Upload ảnh thật, Sản phẩm & Biến thể (`S3` `/seller/products`, `S4` `/seller/products/new` & `/:id/edit`), Duyệt sản phẩm (`A3` `/admin/products`) và API Public Catalog (`GET /api/v1/products`, `/products/{id}`, `/shops/{id}`).

### Công cụ và môi trường
- [x] Swagger chạy được, có nút Authorize cho JWT Bearer (chỉ bật ở môi trường Development).
- [x] Đã xác định quy ước API, mã lỗi, vai trò và phạm vi (xem mục 4).

---

## 3. Cần xác nhận (mình không biết bạn đã làm chưa)

- [x] Cơ sở dữ liệu MySQL: đã chạy 6 file `database/scripts/01..06_*.sql` trên MySQL thật và test kết nối WebAPI + Swagger + EF Core thành công (Bước 1, Bước 3, Bước 4c).
- [?] Docker: đã có `docker-compose.yml`, `.env.example`, `backend/Dockerfile` trong repo và chạy được `docker compose up -d` chưa.
- [x] Bộ tài liệu `docs/` và `.agents/rules/` đã nằm trong repo và được commit từ `b628654`.
- [x] Axios client: đã tự gắn token và tự refresh khi gặp 401 (`frontend/src/lib/axios.ts`).
- [x] `ProtectedRoute`: đã kiểm tra đăng nhập và `allowedRoles`, điều hướng 403 (`ForbiddenPage`).
- [x] Bản đồ route frontend: đã có Storefront (`/`), Auth, `/become-seller` (S0), Seller (`/seller/*`), Warehouse (`/warehouse/*`), Admin (`/admin/*`) trong `AppRouter.tsx`.
- [x] Hàm xử lý lỗi theo `ProblemDetails.code`: đã có `errorCodes.ts` và `getErrorMessage` (`errorHandler.ts`).
- [x] Nhánh Git đang dùng: `feature/namnh-full` (nhánh `develop` chưa tạo/chưa kiểm tra).

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

- [x] Dọn đoạn middleware vá chuỗi `3.0.4` → `3.0.1` trong `Program.cs`: đã ghim `Microsoft.OpenApi` `1.6.14` và xóa middleware khỏi `Program.cs`.
- [x] Bọc `app.UseHttpsRedirection()` trong `if (!app.Environment.IsDevelopment())` để hết cảnh báo cổng HTTPS.
- [x] Seed thêm tài khoản `manager2` trong `DataSeeder` (lấy mật khẩu từ `SeedSettings:DefaultPassword`).
- [ ] Bổ sung `[ProducesResponseType]` đầy đủ cho các endpoint mới để Swagger hiện đủ mã lỗi.
- [ ] Chốt dứt điểm 409 vs 422 với toàn bộ module (hiện đang dùng `409 Conflict` cho `BusinessException`).
- [ ] Kiểm tra cấu hình `eslint .` (`typescript ~7.0.2` vs `typescript-eslint@8.72.1` trong `frontend/package.json`).

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
| Đăng ký làm seller `/become-seller` (S0) | [x] | Bước 3 |

### Seller (`/seller`)
| Màn hình | Trạng thái | Bước |
|---|---|---|
| Khung layout, menu, phân quyền route | [x] | 1 |
| S1 Tổng quan | [ ] | 9 |
| S2 Shop | [x] | 4 |
| S3 Danh sách sản phẩm | [x] | 4 |
| S4 Tạo/sửa sản phẩm và biến thể | [x] | 4 |
| S5 Danh sách đơn hàng | [ ] | 6 |
| S6 Chi tiết đơn con | [ ] | 6 |
| S7 Tồn kho (chỉ xem) | [ ] | 9 |
| S8 Trả hàng | [ ] | 8 |
| S9 Hồ sơ | [ ] | 9 |

### Warehouse (`/warehouse`)
| Màn hình | Trạng thái | Bước |
|---|---|---|
| Khung layout, menu, phân quyền route | [x] | 1 |
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
| Khung layout, menu, phân quyền route | [x] | 1 |
| A1 Tổng quan | [ ] | 9 |
| A2 Duyệt seller | [x] | 3 |
| A3 Duyệt sản phẩm | [x] | 4 |
| A4 Đơn hàng (chỉ xem) | [ ] | 9 |
| A5 Trả hàng | [ ] | 8 |
| A6 Hoàn tiền | [ ] | 8 |
| A7 Người dùng | [ ] | 10 |
| A8 Danh mục | [ ] | 10 |

### Hạ tầng Frontend
| Việc | Trạng thái | Bước |
|---|---|---|
| Component dùng chung (Table, StatusBadge, Modal, Toast, ScanInput...) | [x] | 2 |
| MSW để mock API khi BE chưa xong | [ ] | 2b (không dùng vì làm thẳng BE thật) |
| Rà soát chất lượng cuối | [ ] | 11 |

---

## 7. Tiến độ API Backend (để FE biết khi nào bỏ mock)

Cập nhật theo bảng endpoint trong `api-conventions.md`. Đánh `[x]` khi endpoint đã chạy được trên Swagger.

| Module | Trạng thái | Ghi chú |
|---|---|---|
| Identity: register, login, refresh, logout | [x] | Xong |
| Identity: `users/me`, địa chỉ | [?] | Chưa kiểm tra endpoint `users/me` & sổ địa chỉ |
| Seller và Shop | [x] | Xong (BE Bước 3 & 4a: `/sellers/*`, `/admin/sellers/*`, `/seller/shops/*`, `/shops/{id}`) |
| Catalog (categories, products, variants, duyệt) | [x] | Xong (BE Bước 4a–4c: `/categories`, `/seller/uploads/images`, `/seller/products/*`, `/seller/variants/*`, `/admin/products/*`, `/products/*`) |
| Giỏ hàng, đơn hàng | [ ] | |
| Thanh toán, hoàn tiền | [ ] | |
| Kho (warehouses, inventory, receipts, issues, scan) | [ ] | |
| Vận chuyển, trả hàng | [ ] | |

Các API chưa có trong tài liệu (⚠️) đang chờ BE: xem `docs/ui-screens-by-role.md` mục 6.

---

## 8. Việc kế tiếp

1. Chạy kiểm thử thủ công luồng **BE 4a–4c + FE Bước 4** (Shop `S2`, Upload ảnh thật, Sản phẩm/Biến thể `S3`–`S4`, Duyệt/Từ chối sản phẩm `A3`).
2. **FE Bước 4b:** Giao diện Customer Storefront (`/products`, `/products/:id`, `/shops/:id`) gọi API public catalog `/api/v1/products` và `/api/v1/shops/{id}`.
3. **Bước 5 (BE & FE):** Module Kho & Nhập kho (`W2` Kho và vị trí, `W3` Tồn kho, `W4` Thẻ kho, `W5` Phiếu nhập + quy tắc 2 tài khoản WM tách quyền).
4. Tiếp tục theo `.agents/rules/agent-prompts-be.md` và `.agents/rules/agent-prompts-fe.md` (Bước 6 đến Bước 11).

---

## 9. Nhật ký làm việc

Mỗi lần làm xong một việc, thêm một dòng ở **trên cùng** (mới nhất lên đầu).

| Ngày | Việc đã làm | Nhánh / PR |
|---|---|---|
| 2026-11-12 | **FE Bước 4:** Triển khai `S2` (`SellerShopsPage`, `ShopFormModal`), `S3` (`SellerProductsPage`), `S4` (`SellerProductFormPage`, `ProductImagesEditor` hỗ trợ upload file thật & URL/ảnh đại diện/thứ tự, `ProductVariantsEditor` cho xóa dòng ở chế độ tạo mới và lưu trực tiếp + công tắc `isActive` khi sửa), `A3` (`AdminProductsPage`, `AdminProductsTable`, `AdminProductDetailDrawer`, `ProductModerationConfirmDialog`); thêm `catalog.service.ts`, `resolveAssetUrl`; `pnpm build` (`tsc -b && vite build`) thành công (`2330 modules`). (Chưa commit). | `feature/namnh-full` |
| 2026-11-12 | **BE Bước 4c:** Hoàn thiện Public Catalog (`ProductsController`: `GET /api/v1/products`, `GET /api/v1/products/{id}` đọc tồn khả dụng từ view `vw_VariantAvailability`), `PublicProductQueryValidator`, unit tests `PublicCatalogProductServiceTests` (`124/124` passed), cập nhật `docs/api-conventions.md` và probe thực tế qua WebAPI + MySQL. (Chưa commit). | `feature/namnh-full` |
| 2026-11-12 | **BE Bước 4b:** Triển khai quản lý sản phẩm, biến thể và kiểm duyệt (`SellerProductsController`, `SellerVariantsController`, `AdminProductsController`, `SellerProductService`, `AdminProductService`, `ProductRepository`, validators) kèm unit tests (`119/119` passed). (Chưa commit). | `feature/namnh-full` |
| 2026-11-12 | **BE Bước 4a:** Triển khai danh mục, shop và upload ảnh (`CategoriesController`, `SellerShopsController`, `ShopsController`, `SellerUploadsController` giới hạn jpg/jpeg/png/webp ≤ 5 MB) kèm unit tests. (Chưa commit). | `feature/namnh-full` |
| 2026-11-11 | **BE & FE Bước 3:** Triển khai luồng đăng ký bán hàng `S0` (`SellersController`, `BecomeSellerPage` đúng 3 trường BE và tự động refresh token khi được duyệt) & duyệt người bán `A2` (`AdminSellersController`, `AdminSellersPage`, `SellerDetailDrawer`, `SellerModerationConfirmDialog`); đổi `/become-seller` hỗ trợ `Customer` + `Seller`. | `feature/namnh-full` (`c07c487`) |
| 2026-11-11 | **FE Bước 2:** Đổi theme sang `#0E7C66` + font `Be Vietnam Pro`; xây dựng bộ component dùng chung (`Button`, `Input`, `Select`, `Textarea`, `FormField`, `SearchInput`, `StatusBadge` + `constants/statusLabels.ts`, `Skeleton`, `Pagination`, `Table`, `Modal`, `ConfirmDialog`, `ToastProvider` + `useToast`, `ScanInput`, `EmptyState`, `ErrorState`, `PageHeader`, `StatusTimeline`), hook `useUrlFilters`, `formatCurrency`/`formatDate`, `PagedResult<T>`; xóa 2 file rỗng cũ (`ErrorMessage.tsx`, `Loading.tsx`). (`pnpm run build` sạch; `lint` lỗi cấu hình `typescript@7.0.2` / `typescript-eslint@8.72.1` có sẵn). | `feature/namnh-full` (`c07c487`) |
| 2026-11-11 | **BE Bước 1:** Chuẩn hóa `RoleNames`, `ErrorCodes`, `BusinessException`, `NotFoundException`; bổ sung `GlobalExceptionMiddleware` + `InvalidModelStateResponseFactory` trả `ProblemDetails` (`code`, `traceId`, trigger MySQL `1644`/`45000`); cấu hình `JwtBearer`, 4 role policy và `ICurrentUser` (`CurrentUserService`); thêm `PagedResult<T>`, `PaginationQuery`, `ToPagedResultAsync`; cập nhật `DataSeeder` seed 5 tài khoản `@gmail.com` kèm `manager1` & `manager2` lấy mật khẩu từ `SeedSettings:DefaultPassword`; viết unit test `ECommerceWarehouse.UnitTests` (`45/45` passed) và kiểm tra thực tế qua Swagger + MySQL. | `feature/namnh-full` (`c07c487`) |
| 2026-11-11 | **FE Bước 1:** Dựng khung 3 khu vực `Seller` (`/seller`), `Warehouse` (`/warehouse`), `Admin` (`/admin`) dùng chung `DashboardLayout` + `Sidebar`, menu dữ liệu tại `constants/navigation.ts`, phân quyền `ProtectedRoute` + trang `ForbiddenPage` (403), route placeholder cho `S0`–`S9`, `W1`–`W9`, `A1`–`A8`, điều hướng sau đăng nhập theo thứ tự ưu tiên role, nút `Kênh người bán` ở Storefront, ánh xạ lỗi `errorCodes.ts` + `getErrorMessage` và refresh token 401 trong Axios client. | `feature/namnh-full` |
| 2026-11-11 | **Sửa gốc Swagger/OpenAPI (BE):** Ghim `Microsoft.OpenApi` `1.6.14` (gỡ gói kéo lệch bản 2.x), xóa middleware vá chuỗi `3.0.4` khỏi `Program.cs` (Swagger xuất chuẩn `openapi: "3.0.1"`), bọc `UseHttpsRedirection()` trong `!IsDevelopment()`. | `feature/namnh-full` |
| 2026-11-11 | Hoàn thiện Swagger (nút Authorize JWT, bật ở Development); chốt phạm vi 4 vai trò, kho sàn, 2 tài khoản WM; có đặc tả màn hình và bộ prompt cho agent | |
| (trước đó) | Hoàn thiện Auth (BE) và giao diện đăng nhập, đăng ký; làm trang chủ Storefront; dựng khung dự án | |