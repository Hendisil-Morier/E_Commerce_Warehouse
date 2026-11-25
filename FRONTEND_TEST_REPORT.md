# FRONTEND TEST REPORT — E_Commerce_Warehouse (KHO SÀN+)

---

## 1. Tổng quan

| Thông tin | Chi tiết |
|---|---|
| **Tên dự án** | E-Commerce Marketplace & Warehouse Management (`E_Commerce_Warehouse` / thương hiệu giao diện **KHO SÀN+**) |
| **Nhánh Git kiểm thử** | `feature/cart-management-ofhoa` |
| **Công nghệ Frontend** | React `19.3.1`, TypeScript `~7.0.2`, Vite `8.3.5`, React Router DOM `7.18.5`, TanStack Query `5.105.1`, Zustand `5.0.16`, Axios `1.21.0`, React Hook Form `7.91.0`, Zod `4.6.7`, Lucide React `1.66.0`, thuần CSS (`index.css`, `ui-components.css`, `storefront.css`, `customer-portal.css`) |
| **Môi trường kiểm thử** | Windows · Node.js · Vite Dev Server (`http://127.0.0.1:5173`) · Backend WebAPI mục tiêu `http://localhost:5126` (**OFFLINE** do máy host chưa bật dịch vụ MySQL tại `localhost:3306` và thiếu runtime `.NET 9.0` mặc định, phải dùng `DOTNET_ROLL_FORWARD=Major`) |
| **Trình duyệt sử dụng** | Built-in Chromium Webview Browser (tương tác thực tế qua Playwright/Webview) |
| **Thời gian kiểm thử** | `25/11/2026` (`16:43 – 16:59 GMT+7`) |
| **Nguyên tắc thực hiện** | **Chỉ kiểm thử & báo cáo — tuyệt đối KHÔNG chỉnh sửa mã nguồn** trong suốt đợt audit. |

### Kết quả kiểm tra Build / Type Check / Lint / Unit Test (Giai đoạn 4)

| Lệnh kiểm tra | Kết quả | Chi tiết |
|---|---|---|
| Type Check (`tsc -b`) | **PASS** | 0 lỗi TypeScript (`strict: true`) |
| Production Build (`vite build`) | **PASS (có cảnh báo)** | Build thành công `2341 modules`, `dist/assets/index-*.js` nặng **`753.35 kB`** (vượt ngưỡng khuyến nghị `500 kB` do chưa code-splitting/lazy load các khu vực Admin/Seller/Warehouse) |
| ESLint (`eslint .`) | **FAIL (lỗi cấu hình)** | Crash ngay khi khởi chạy: `Error: typescript-eslint does not support TS 7.0` (`typescript@7.0.2` không tương thích `typescript-eslint@8.72.1`) |
| Frontend Unit / E2E Tests | **KHÔNG CÓ** | `frontend/package.json` chưa cấu hình Vitest / Jest / Playwright test scripts |

---

## 2. Phạm vi kiểm thử

- **Tổng số trang / route trong `AppRouter.tsx`**: **39 routes** (16 màn hình đã hiện thực + 23 màn hình Placeholder `S1, S5–S9, W1–W9, A1, A4–A8` + 1 trang lỗi `403 Forbidden` + kiểm thử 1 route không tồn tại `404`).
- **Tổng số component quan trọng đã rà soát**: **42 components & layouts** (`MainLayout`, `Header`, `AuthLayout`, `DashboardLayout`, `Sidebar`, `CustomerPortalLayout`, `ProtectedRoute`, `ForbiddenPage`, `PlaceholderPage`, `ProductCard`, `PageHeader`, `EmptyState`, `ErrorState`, `StatusTimeline`, bộ 14 UI primitives `Button`, `Input`, `Select`, `Textarea`, `FormField`, `Modal`, `ConfirmDialog`, `Pagination`, `Table`, `Skeleton`, `StatusBadge`, `SearchInput`, `ScanInput`, `ToastProvider`, các drawer/modal/editor của Seller & Admin).
- **Tổng số chức năng đã kiểm thử**: **58 nhóm chức năng** (điều hướng, tìm kiếm toàn cục, lọc/sắp xếp/phân trang URL, form đăng nhập/đăng ký, validation, modal tạo shop, editor biến thể & ảnh sản phẩm, đổi vai trò/RBAC, thu gọn sidebar, error/empty/loading state, xử lý offline, back/forward, F5 reload).
- **Các vai trò đã kiểm thử trực tiếp trên trình duyệt**: **5 trạng thái/vai trò** — `Guest` (chưa đăng nhập), `Customer`, `Seller`, `WarehouseManager`, `Admin`.
- **Các kích thước màn hình đã kiểm thử**: **5 viewport** — `1920×1080` (Desktop), `1366×768` (Laptop), `768×1024` (Tablet), `390×844` (Mobile), `360×800` (Small Mobile).
- **Các luồng nghiệp vụ đã kiểm thử**:
  1. Guest truy cập Storefront (`/`, `/products`, `/products/:id`, `/shops/:id`, `/404`) và thử truy cập trực tiếp 8 route cần đăng nhập.
  2. Luồng Auth: Đăng nhập sai, kiểm tra nút Google OAuth, đăng nhập dự phòng (fallback), validation đầy đủ form Đăng ký (Customer & Seller), đăng xuất, kiểm tra F5 & Back/Forward.
  3. Luồng RBAC đa vai trò: Chuyển phiên lần lượt qua `Customer` → `Seller` → `WarehouseManager` → `Admin`, kiểm tra menu theo role và chặn truy cập trái phép (`403`).
  4. Luồng tương tác form nội bộ: Modal tạo Shop (`S2`), form tạo Sản phẩm/Ảnh/Biến thể (`S4`), bộ lọc URL trên `PublicProductsPage`, `AdminSellersPage`, `AdminProductsPage`.
  5. **Bị chặn (`BLOCKED`) do Backend/MySQL offline**: Lưu dữ liệu thật vào DB (Đăng ký tài khoản thật, CRUD Shop/Sản phẩm/Biến thể trên DB, Upload file ảnh thật, Thêm/Sửa/Xóa giỏ hàng thật `POST/PUT/DELETE /api/v1/cart/items`, Duyệt/Từ chối Seller & Sản phẩm bởi Admin, làm mới JWT refresh token 401 thực tế).

---

## 3. Kết quả tổng hợp

| Hạng mục | Tổng số | Pass | Fail | Blocked |
|---|---:|---:|---:|---:|
| Pages (Routes thực tế + 404) | 20 | 14 | 4 | 2 |
| UI Components (Live + Static Audit) | 34 | 23 | 11 | 0 |
| Functional Tests (Validation, Filters, Modals, Auth, RBAC) | 46 | 27 | 10 | 9 |
| Responsive Tests (26 tổ hợp trang × viewport) | 26 | 8 | 18 | 0 |
| API Integration (Auth, Catalog, Cart, Seller, Admin) | 18 | 4 | 2 | 12 |
| E2E Workflows (Guest, Customer, Seller, WM, Admin) | 10 | 3 | 2 | 5 |
| **Tổng cộng** | **154** | **79** | **47** | **28** |

> *Ghi chú thống kê: 47 test case `FAIL` bên trên ánh xạ về **21 lỗi gốc (BUG-001 → BUG-021)** được gom nhóm rõ ràng tại Mục 4 để tránh trùng lặp khi sửa lỗi.*

---

## 4. Danh sách lỗi chi tiết

---

### MỨC ĐỘ CRITICAL (Nghiêm trọng — Bảo mật / Sập luồng chính)

#### `BUG-001`: Lỗ hổng vượt xác thực (Auth Bypass) qua nút "Đăng nhập với Google" không cần OAuth
- **Module/Page**: Authentication / `LoginPage`
- **URL**: `http://127.0.0.1:5173/login`
- **Môi trường & kích thước màn hình**: Chromium · `1366×768` (tái hiện trên mọi kích thước)
- **Các bước tái hiện (Steps to Reproduce)**:
  1. Mở `/login` ở trạng thái chưa đăng nhập (kể cả khi Backend tắt).
  2. Nhấn nút **"Đăng nhập với Google"**.
- **Kết quả thực tế (Actual Result)**: Hệ thống bỏ qua hoàn toàn xác thực OAuth và Backend, tự gán phiên đăng nhập giả `userId: 99`, `fullName: "Người dùng Google"`, `email: "google.user@gmail.com"`, `accessToken: "demo-jwt-google-token"` vào `localStorage` (`ecommerce-auth-storage`), điều hướng thẳng vào `/` với đầy đủ giao diện đã đăng nhập.
- **Kết quả mong đợi (Expected Result)**: Phải thực hiện luồng OAuth thực với Backend xác minh token, hoặc ẩn/vô hiệu hóa nút nếu tính năng Google Login chưa triển khai.
- **Mức độ nghiêm trọng**: **Critical**
- **Nguyên nhân dự kiến**: Hàm `handleGoogleLogin()` đang hard-code đối tượng `mockGoogleUser` và gọi `setAuth(mockGoogleUser)` trực tiếp ở client.
- **File/component liên quan**: [LoginPage.tsx](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/features/auth/pages/LoginPage.tsx#L136-L149)
- **Minh chứng**: Screenshot `step_24_shot_1_login-google-bypass.png` (Header hiển thị `Xin chào, Người dùng Google (Khách hàng)` và avatar `NG`).

---

#### `BUG-002`: Cửa hậu (Backdoor) đăng nhập giả cho cả 4 vai trò (kể cả Admin) ngay trên Client khi API thất bại
- **Module/Page**: Authentication / `LoginPage`
- **URL**: `http://127.0.0.1:5173/login`
- **Môi trường & kích thước màn hình**: Chromium · `1366×768`
- **Các bước tái hiện (Steps to Reproduce)**:
  1. Khi Backend offline hoặc trả lỗi `401/500`, mở `/login`.
  2. Nhập `admin` (hoặc `admin@emarket.vn`) + mật khẩu `123456` hoặc `Demo@123`.
  3. Nhấn **ĐĂNG NHẬP**.
- **Kết quả thực tế (Actual Result)**: Khối `catch` bắt lỗi API và tự động cấp quyền `Admin` / `WarehouseManager` / `Seller` / `Customer` kèm token giả (`demo-jwt-token-admin`) lưu bền vững vào `localStorage`. Ngoài ra, các email fallback (`admin@emarket.vn`, `seller@emarket.vn`, `warehouse@emarket.vn`) còn **lệch** với email seed thật trong `DataSeeder.cs` (`admin@gmail.com`, `seller@gmail.com`, `manager1@gmail.com`).
- **Kết quả mong đợi (Expected Result)**: Khi API đăng nhập thất bại phải luôn hiển thị lỗi xác thực; tuyệt đối không được chứa nhánh dự phòng cấp quyền Admin/Seller/WM ở mã nguồn client production.
- **Mức độ nghiêm trọng**: **Critical**
- **Nguyên nhân dự kiến**: Khối `catch (err)` chứa logic fallback đăng nhập hard-code cho 4 tài khoản mẫu.
- **File/component liên quan**: [LoginPage.tsx](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/features/auth/pages/LoginPage.tsx#L60-L127)
- **Minh chứng**: Đã đăng nhập thành công cả 4 vai trò (`Customer`, `Seller`, `WarehouseManager`, `Admin`) và vào được `/admin/sellers`, `/seller/shops`, `/warehouse` trong khi Backend hoàn toàn tắt (`step_45_shot_1_seller-shops-modal-1366.png`, `step_51_shot_1_admin-sellers-1366.png`).

---

### MỨC ĐỘ HIGH (Chức năng quan trọng hoạt động sai / Lỗi cấu hình nghiêm trọng)

#### `BUG-003`: Không có trang 404 (Wildcard Route `*`) — Truy cập URL lạ gây crash màn hình lỗi lập trình viên của React Router
- **Module/Page**: Routing / `AppRouter`
- **URL**: `http://127.0.0.1:5173/this-route-does-not-exist-404`
- **Môi trường & kích thước màn hình**: Chromium · `1366×768`
- **Các bước tái hiện (Steps to Reproduce)**:
  1. Nhập trực tiếp bất kỳ đường dẫn không tồn tại nào (VD: `/this-route-does-not-exist-404`) trên thanh địa chỉ trình duyệt.
- **Kết quả thực tế (Actual Result)**: Trình duyệt hiển thị màn hình trắng lỗi thô của React Router: `"Unexpected Application Error! 404 Not Found — 💿 Hey developer 👋 You can provide a way better UX than this..."` và ghi console error: `Error handled by React Router default ErrorBoundary: [object Object]`. Không có nút quay về trang chủ.
- **Kết quả mong đợi (Expected Result)**: Hiển thị trang `404 NotFoundPage` đồng bộ giao diện KHO SÀN+ kèm nút quay về Trang chủ.
- **Mức độ nghiêm trọng**: **High**
- **Nguyên nhân dự kiến**: `createBrowserRouter([...])` chưa khai báo route catch-all `{ path: "*", element: <NotFoundPage /> }` và `errorElement`.
- **File/component liên quan**: [AppRouter.tsx](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/routes/AppRouter.tsx#L25-L420)
- **Minh chứng**: Screenshot `step_14_shot_1_route-404.png` + Console log `react-router-dom.js:4130`.

---

#### `BUG-004`: Lỗi điều hướng chéo vai trò sau khi Đăng xuất → Đăng nhập bằng tài khoản vai trò khác (dẫn thẳng tới trang 403)
- **Module/Page**: Authentication & RBAC / `LoginPage`, `ProtectedRoute`, `Header`, `DashboardLayout`
- **URL**: `http://127.0.0.1:5173/login` → `/seller/products/new` hoặc `/warehouse`
- **Môi trường & kích thước màn hình**: Chromium · `1366×768`
- **Các bước tái hiện (Steps to Reproduce)**:
  1. Đăng nhập tài khoản `Seller` và mở `/seller/products/new`.
  2. Đăng xuất (hoặc truy cập URL bị chặn dẫn về `/login` kèm `location.state.from`).
  3. Đăng nhập tài khoản `WarehouseManager` (hoặc `Admin`).
- **Kết quả thực tế (Actual Result)**: Sau khi đăng nhập thành công, `LoginPage` điều hướng `WarehouseManager` vào `/seller/products/new` (trang của Seller trước đó) hoặc `Admin` vào `/warehouse` (trang của WM trước đó), khiến người dùng mới gặp ngay lỗi **403 Không đủ quyền truy cập** thay vì vào dashboard đúng vai trò.
- **Kết quả mong đợi (Expected Result)**: Chỉ quay lại `from.pathname` nếu vai trò của tài khoản vừa đăng nhập được phép truy cập route đó; ngược lại phải điều hướng về `getDefaultRouteForUser(userData)`. Khi người dùng chủ động nhấn **Đăng xuất**, không truyền `state.from` của phiên cũ sang phiên mới.
- **Mức độ nghiêm trọng**: **High**
- **Nguyên nhân dự kiến**: `redirectByRole()` trong `LoginPage.tsx` ưu tiên tuyệt đối `location.state?.from` mà không kiểm tra quyền của `userData` đối với đường dẫn đó.
- **File/component liên quan**: [LoginPage.tsx](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/features/auth/pages/LoginPage.tsx#L29-L40), [ProtectedRoute.tsx](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/components/common/ProtectedRoute.tsx#L17-L19)
- **Minh chứng**: Tái hiện liên tiếp 3 lần trong Suite D khi chuyển `Customer → Seller` (nhảy về `/account`), `Seller → WarehouseManager` (nhảy về `/seller/products/new`), `WarehouseManager → Admin` (nhảy về `/warehouse`).

---

#### `BUG-005`: Lỗi cắt chuỗi thông báo lỗi validation 400 từ Backend xuống còn đúng 1 ký tự đầu tiên (`fe.field[0]`)
- **Module/Page**: Seller Shops (`S2`) & Seller Product Form (`S4`)
- **URL**: `/seller/shops`, `/seller/products/new`, `/seller/products/:id/edit`
- **Môi trường & kích thước màn hình**: Static Code Audit (tác động mọi màn hình khi Backend trả 400 `ProblemDetails.errors`)
- **Các bước tái hiện (Steps to Reproduce)**:
  1. Gửi form tạo/sửa Shop hoặc tạo/sửa Sản phẩm khi Backend trả lỗi `400 Bad Request` kèm `errors: { "ShopName": ["Tên shop đã tồn tại"] }`.
  2. `getFieldErrors(error)` trả về `Record<string, string>` (đã lấy phần tử đầu tiên: `{ shopName: "Tên shop đã tồn tại" }`).
  3. `ShopFormModal.tsx` và `SellerProductFormPage.tsx` tiếp tục truy cập `fieldErrors.shopName[0]`.
- **Kết quả thực tế (Actual Result)**: Vì `fieldErrors.shopName` đã là `string`, `fieldErrors.shopName[0]` chỉ hiển thị **đúng 1 ký tự đầu tiên** (ví dụ `"T"` thay vì `"Tên shop đã tồn tại"`).
- **Kết quả mong đợi (Expected Result)**: Hiển thị nguyên vẹn chuỗi `fieldErrors.shopName` (`setError("shopName", { message: fieldErrors.shopName })`).
- **Mức độ nghiêm trọng**: **High**
- **Nguyên nhân dự kiến**: Nhầm lẫn kiểu trả về của `getFieldErrors()` (`Record<string, string>` bị dùng như `Record<string, string[]>`).
- **File/component liên quan**: [ShopFormModal.tsx](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/features/seller/components/ShopFormModal.tsx#L118-L129), [SellerProductFormPage.tsx](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/features/seller/pages/SellerProductFormPage.tsx#L142-L148), [errorHandler.ts](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/utils/errorHandler.ts#L23-L35)
- **Minh chứng**: Xác nhận trực tiếp qua mã nguồn tại dòng 120–128 của `ShopFormModal.tsx` và dòng 144–147 của `SellerProductFormPage.tsx`.

---

#### `BUG-006`: Vỡ layout & tràn ngang nghiêm trọng (Horizontal Overflow) trên Mobile (`390×844`, `360×800`) và Tablet (`768×1024`)
- **Module/Page**: Toàn bộ Storefront (`Header`, `HomePage`, `PublicProductsPage`), `AuthLayout` (`/login`, `/register`), và các trang Dashboard (`Seller`, `Admin`)
- **URL**: `/`, `/products`, `/login`, `/register`, `/seller/shops`, `/seller/products/new`, `/admin/sellers`
- **Môi trường & kích thước màn hình**: Chromium · `768×1024`, `390×844`, `360×800`
- **Các bước tái hiện (Steps to Reproduce)**:
  1. Thu nhỏ trình duyệt xuống `768×1024`, `390×844`, `360×800`.
  2. Mở lần lượt `/`, `/products`, `/login`, `/register`, `/seller/shops`, `/seller/products/new`, `/admin/sellers`.
- **Kết quả thực tế (Actual Result)**:
  - **Trang `/` & `/products` tại `768px`**: Nút `"Tìm kiếm"` xanh trên Header bị cắt mất bên trong `.ks-header-search` (`overflow: hidden`); chữ `"Đăng nhập"` góc phải topbar bị xén; tại **`390px` / `360px`**: Topbar & Header tràn ngang **`+375px` đến `+405px`**, thanh tìm kiếm bị đè vào ô `Giá từ (₫)` trên `/products`, checkbox `Còn hàng` bị đẩy ra ngoài màn hình, Hero giữ 2 cột khiến chữ bóp hẹp còn 1 từ/dòng.
  - **Trang `/login` & `/register` tại `390px` / `360px`**: Grid 2 cột (`1.15fr 0.95fr`) không xếp chồng dọc → toàn bộ form đăng nhập/đăng ký bị đẩy lệch sang phải khỏi màn hình (`+101px` đến `+206px`), không thể thao tác.
  - **Trang `/admin/sellers` tại `768px` / `390px`**: Bảng & sidebar tràn ngang **`+278.8px`** (768px) và **`+656.8px`** (390px).
  - **Trang `/seller/shops` & `/seller/products/new` tại `390px`**: Tràn ngang **`+134.8px`** và **`+200.8px`**.
- **Kết quả mong đợi (Expected Result)**: Không bị chồng lấn hay cắt xén nút; nếu dự án mở rộng hỗ trợ Tablet/Mobile cần thêm `@media` breakpoints (xếp chồng grid, menu mobile, cho phép wrap toolbar); riêng lỗi cắt nút tìm kiếm ở `768px` và vỡ form ở màn hẹp cần xử lý rõ ràng.
- **Mức độ nghiêm trọng**: **High** *(lưu ý: `docs/ui-guidelines.md` hiện ghi phạm vi MVP chỉ tập trung desktop `1280/1440px`, tuy nhiên theo tiêu chuẩn kiểm thử responsive đa thiết bị, toàn bộ 3 breakpoint `768px/390px/360px` hiện đều không sử dụng được)*.
- **Nguyên nhân dự kiến**: Thiếu hoàn toàn `@media` responsive rules trong `storefront.css`, `customer-portal.css`, `ui-components.css` và các inline `gridTemplateColumns` cố định trong `AuthLayout.tsx`, `Sidebar.tsx`, `DashboardLayout.tsx`.
- **File/component liên quan**: [storefront.css](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/styles/storefront.css), [customer-portal.css](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/styles/customer-portal.css), [AuthLayout.tsx](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/layouts/AuthLayout.tsx#L121-L130), [Sidebar.tsx](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/layouts/Sidebar.tsx)
- **Minh chứng**: Screenshots `step_16_shot_1_home-768.png`, `step_16_shot_2_home-390.png`, `step_16_shot_3_products-360.png`, `step_18_shot_1_login-390.png`.

---

#### `BUG-007`: Lệnh `pnpm lint` (`eslint .`) sập hoàn toàn do xung đột phiên bản `typescript@7.0.2` và `typescript-eslint@8.72.1`
- **Module/Page**: Build / Code Quality Tooling
- **URL**: N/A (CLI)
- **Môi trường & kích thước màn hình**: Local Node.js CLI (`frontend/`)
- **Các bước tái hiện (Steps to Reproduce)**:
  1. Tại thư mục `frontend/`, chạy `.\node_modules\.bin\eslint.cmd .` (hoặc `pnpm lint`).
- **Kết quả thực tế (Actual Result)**: ESLint dừng ngay lập tức với exit code 1: `Error: typescript-eslint does not support TS 7.0`. Không có bất kỳ file nào được lint.
- **Kết quả mong đợi (Expected Result)**: `pnpm lint` chạy qua toàn bộ mã nguồn và trả báo cáo cảnh báo/lỗi tĩnh.
- **Mức độ nghiêm trọng**: **High**
- **Nguyên nhân dự kiến**: `frontend/package.json` cài `typescript: "~7.0.2"` trong khi `typescript-eslint@8.72.1` chưa hỗ trợ TypeScript 7.0.
- **File/component liên quan**: [package.json](file:///g:/nhom4/E_Commerce_Warehouse/frontend/package.json#L34-L35), [eslint.config.js](file:///g:/nhom4/E_Commerce_Warehouse/frontend/eslint.config.js)
- **Minh chứng**: Log chạy `.\node_modules\.bin\eslint.cmd .` trong phiên kiểm thử.

---

### MỨC ĐỘ MEDIUM (Logic sai trong một số trường hợp / Lệch chuẩn Backend / UX)

#### `BUG-008`: Bộ lọc giá trên `/products` chấp nhận giá trị âm (`minPrice=-500`) và `minPrice > maxPrice` không có cảnh báo
- **Module/Page**: Public Catalog / `PublicProductsPage`
- **URL**: `http://127.0.0.1:5173/products?minPrice=-500` và `/products?minPrice=500000&maxPrice=100000`
- **Môi trường & kích thước màn hình**: Chromium · `1366×768`
- **Các bước tái hiện (Steps to Reproduce)**:
  1. Mở `/products`.
  2. Gõ `-500` vào ô `Giá từ (₫)` → URL lập tức đổi thành `?minPrice=-500` dù input hiển thị rỗng (do `parsePositiveNumber` bỏ qua số âm khi đọc lại nhưng `onChange` vẫn ghi chuỗi gốc lên URL).
  3. Nhập `Giá từ = 500000` và `Giá đến = 100000`.
- **Kết quả thực tế (Actual Result)**: URL vẫn đẩy `minPrice=500000&maxPrice=100000` lên Backend (khiến `PublicProductQueryValidator` trả lỗi `400 Bad Request`), không có thông báo lỗi inline ở FE; ngoài ra gõ trực tiếp vào ô tìm kiếm/giá gọi API trên từng ký tự (không debounce).
- **Kết quả mong đợi (Expected Result)**: Chặn/cảnh báo khi nhập số âm hoặc `minPrice > maxPrice`, và debounce truy vấn tìm kiếm/giá ~300ms.
- **Mức độ nghiêm trọng**: **Medium**
- **Nguyên nhân dự kiến**: `onChange` ghi thẳng `e.target.value` lên `searchParams` mà không kiểm tra `>= 0` và `minPrice <= maxPrice`.
- **File/component liên quan**: [PublicProductsPage.tsx](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/features/catalog/pages/PublicProductsPage.tsx#L150-L202)
- **Minh chứng**: Quan sát trực tiếp URL trong Suite A (`?q=chuot&page=1&minPrice=-500` và `?q=chuot&page=1&minPrice=500000&maxPrice=100000`).

---

#### `BUG-009`: Lệch luật kiểm tra biến thể sản phẩm (SKU & Trọng lượng) giữa Frontend và Backend Validator
- **Module/Page**: Seller Product Form / `ProductVariantsEditor`
- **URL**: `/seller/products/new`, `/seller/products/:id/edit`
- **Môi trường & kích thước màn hình**: Static Audit + Form Testing (`1366×768`)
- **Các bước tái hiện (Steps to Reproduce)**:
  1. Mở `/seller/products/new`, nhập SKU dài 70 ký tự hoặc chứa khoảng trắng (`"SKU 001"`), hoặc nhập Khối lượng = `0`.
  2. Gửi lưu biến thể.
- **Kết quả thực tế (Actual Result)**: `validateVariantFields()` ở FE cho phép qua vì kiểm tra `sku.length > 80`, không kiểm tra khoảng trắng, và chỉ chặn `weightGrams < 0`. Trong khi Backend `UpsertVariantRequestValidator` yêu cầu SKU tối đa **64** ký tự, **không chứa khoảng trắng**, và `WeightGrams` phải **lớn hơn 0** (`> 0`).
- **Kết quả mong đợi (Expected Result)**: Validation phía client phải khớp chặt với Backend (`SKU <= 64`, không khoảng trắng, `weightGrams > 0` nếu có nhập).
- **Mức độ nghiêm trọng**: **Medium**
- **Nguyên nhân dự kiến**: Hằng số và biểu thức validation trong `ProductVariantsEditor.tsx` viết lệch so với `UpsertVariantRequestValidator.cs`.
- **File/component liên quan**: [ProductVariantsEditor.tsx](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/features/seller/components/ProductVariantsEditor.tsx#L21-L31), [ProductValidators.cs](file:///g:/nhom4/E_Commerce_Warehouse/backend/src/ECommerceWarehouse.Application/Validators/Catalog/ProductValidators.cs#L20-L45)
- **Minh chứng**: So sánh trực tiếp 2 file validator.

---

#### `BUG-010`: `AdminProductDetailDrawer` bị đóng ngoài ý muốn khi nhấn `Escape` lúc hộp thoại xác nhận Duyệt/Từ chối đang mở chồng lên
- **Module/Page**: Admin Moderation / `AdminProductDetailDrawer`
- **URL**: `/admin/products`
- **Môi trường & kích thước màn hình**: Static Audit (so sánh với `SellerDetailDrawer`)
- **Các bước tái hiện (Steps to Reproduce)**:
  1. Mở ngăn chi tiết sản phẩm (`AdminProductDetailDrawer`).
  2. Nhấn **Từ chối** để mở `ProductModerationConfirmDialog` đè lên trên.
  3. Nhấn phím `Escape` với ý định chỉ đóng modal xác nhận.
- **Kết quả thực tế (Actual Result)**: Cả `Modal` lẫn `AdminProductDetailDrawer` đều nghe sự kiện `keydown` `Escape` đồng thời → đóng luôn cả ngăn xem chi tiết sản phẩm phía sau.
- **Kết quả mong đợi (Expected Result)**: Phải có prop `disableEscape={Boolean(moderationTarget)}` giống `SellerDetailDrawer` để `Escape` chỉ đóng lớp modal trên cùng.
- **Mức độ nghiêm trọng**: **Medium**
- **Nguyên nhân dự kiến**: Thiếu kiểm tra `disableEscape` trong `useEffect` bắt phím `Escape` của `AdminProductDetailDrawer.tsx`.
- **File/component liên quan**: [AdminProductDetailDrawer.tsx](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/features/admin/components/AdminProductDetailDrawer.tsx#L43-L50), [AdminProductsPage.tsx](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/features/admin/pages/AdminProductsPage.tsx#L219-L224)
- **Minh chứng**: Đối chiếu code `AdminProductDetailDrawer.tsx` vs `SellerDetailDrawer.tsx` (dòng 140 `AdminSellersPage.tsx`).

---

#### `BUG-011`: Hiển thị nút "Giỏ hàng" và "Đơn hàng của tôi" cho tài khoản Seller / WarehouseManager / Admin dù `/cart` trả về 403
- **Module/Page**: Storefront Header / `Header`
- **URL**: `/`, `/products` (khi đăng nhập bằng `Seller`, `WarehouseManager` hoặc `Admin`)
- **Môi trường & kích thước màn hình**: Chromium · `1366×768`
- **Các bước tái hiện (Steps to Reproduce)**:
  1. Đăng nhập bằng tài khoản `Seller` (hoặc `WarehouseManager` / `Admin` không có role `Customer`).
  2. Về trang chủ `/`.
  3. Nhấn nút **"Giỏ hàng 0"** trên Header.
- **Kết quả thực tế (Actual Result)**: Nút Giỏ hàng vẫn hiển thị nổi bật nhưng bấm vào lập tức báo lỗi **403 Không đủ quyền truy cập** (`ProtectedRoute` yêu cầu `ROLES.CUSTOMER`).
- **Kết quả mong đợi (Expected Result)**: Chỉ hiển thị nút Giỏ hàng cho Guest (chuyển tới đăng nhập) hoặc user có vai trò `Customer`; với Seller/WM/Admin nên ẩn hoặc hiển thị phím tắt về khu vực làm việc chính.
- **Mức độ nghiêm trọng**: **Medium**
- **Nguyên nhân dự kiến**: `Header.tsx` render link `ROUTES.CART` vô điều kiện cho mọi trạng thái đăng nhập.
- **File/component liên quan**: [Header.tsx](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/layouts/Header.tsx#L219-L227)
- **Minh chứng**: Tái hiện trong Suite D cho cả 3 vai trò `Seller`, `WarehouseManager`, `Admin`.

---

#### `BUG-012`: Ô tìm kiếm trên Header không đồng bộ với URL khi xóa bộ lọc hoặc chuyển từ `/products?q=...` về `/products`
- **Module/Page**: Storefront Header & Catalog / `Header`, `PublicProductsPage`
- **URL**: `/products?q=keychron` → `/products`
- **Môi trường & kích thước màn hình**: Chromium · `1366×768`
- **Các bước tái hiện (Steps to Reproduce)**:
  1. Trên `/`, gõ `"keychron"` vào ô tìm kiếm Header và bấm **Tìm kiếm** → điều hướng tới `/products?q=keychron`.
  2. Nhấn **"Đặt lại bộ lọc"** trên trang `/products`.
- **Kết quả thực tế (Actual Result)**: URL và ô tìm kiếm trong bộ lọc `/products` đã xóa sạch về rỗng, nhưng ô tìm kiếm trên `Header` vẫn giữ nguyên chữ `"keychron"`.
- **Kết quả mong đợi (Expected Result)**: `searchQuery` trên `Header` nên đồng bộ với query param `q` trên URL (hoặc tự xóa khi người dùng reset filter).
- **Mức độ nghiêm trọng**: **Medium**
- **Nguyên nhân dự kiến**: `Header.tsx` dùng `useState("")` cục bộ độc lập hoàn toàn với `useSearchParams()`.
- **File/component liên quan**: [Header.tsx](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/layouts/Header.tsx#L49)
- **Minh chứng**: Tái hiện trực tiếp trong Suite A bước 1–2.

---

#### `BUG-013`: Truyền object `defaults` tạo mới liên tục vào `useUrlFilters` trên `SellerProductsPage` & `AdminProductsPage`
- **Module/Page**: Seller Products (`S3`) & Admin Products (`A3`)
- **URL**: `/seller/products`, `/admin/products`
- **Môi trường & kích thước màn hình**: Static Code Audit (hiệu năng render & stability của hook)
- **Các bước tái hiện (Steps to Reproduce)**:
  1. Rà soát cách gọi `useUrlFilters({ defaults: { ... } })` trong `SellerProductsPage.tsx` và `AdminProductsPage.tsx`.
- **Kết quả thực tế (Actual Result)**: Object `defaults` được khai báo inline ngay trong thân component → mỗi lần re-render sinh reference mới → phá vỡ `useMemo([defaults, searchParams])` và `useCallback([defaults, updateParams])` trong `useUrlFilters.ts`.
- **Kết quả mong đợi (Expected Result)**: Tách `const DEFAULT_FILTERS = { ... }` ra ngoài component (giống cách `AdminSellersPage.tsx` đang làm).
- **Mức độ nghiêm trọng**: **Medium**
- **Nguyên nhân dự kiến**: Thiếu memoize / hằng số module-scope cho tham số `defaults`.
- **File/component liên quan**: [SellerProductsPage.tsx](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/features/seller/pages/SellerProductsPage.tsx#L55-L59), [AdminProductsPage.tsx](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/features/admin/pages/AdminProductsPage.tsx#L59-L63), [useUrlFilters.ts](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/hooks/useUrlFilters.ts#L39-L85)
- **Minh chứng**: Kiểm tra trực tiếp mã nguồn.

---

#### `BUG-014`: Trang chi tiết sản phẩm (`/products/:id`) và chi tiết gian hàng (`/shops/:id`) bị mất thanh Breadcrumb khi ở trạng thái lỗi / đang tải
- **Module/Page**: Public Catalog / `ProductDetailPage`, `ShopDetailPage`
- **URL**: `/products/1`, `/shops/1`
- **Môi trường & kích thước màn hình**: Chromium · `1366×768`
- **Các bước tái hiện (Steps to Reproduce)**:
  1. Truy cập `/products/1` hoặc `/shops/1` khi API lỗi/offline.
- **Kết quả thực tế (Actual Result)**: Thanh breadcrumb điều hướng (`Trang chủ > Sản phẩm > ...`) biến mất hoàn toàn và không có nút quay lại danh sách ở trạng thái lỗi mạng.
- **Kết quả mong đợi (Expected Result)**: Giữ thanh breadcrumb cơ bản (`Trang chủ > Sản phẩm`) hoặc nút "Quay lại danh sách sản phẩm" ở mọi trạng thái Loading/Error/Empty.
- **Mức độ nghiêm trọng**: **Medium**
- **Nguyên nhân dự kiến**: Early `return` cho nhánh `isLoading` và `isError` nằm phía trên khối render `.ks-breadcrumb-bar`.
- **File/component liên quan**: [ProductDetailPage.tsx](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/features/catalog/pages/ProductDetailPage.tsx#L102-L147), [ShopDetailPage.tsx](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/features/catalog/pages/ShopDetailPage.tsx#L66-L103)
- **Minh chứng**: Ghi nhận trực tiếp trong Suite A bước 3.

---

#### `BUG-015`: Ràng buộc Email đăng ký chỉ chấp nhận `@gmail.com` chặn người dùng/doanh nghiệp dùng email khác
- **Module/Page**: Authentication / `RegisterPage`
- **URL**: `http://127.0.0.1:5173/register`
- **Môi trường & kích thước màn hình**: Chromium · `1366×768`
- **Các bước tái hiện (Steps to Reproduce)**:
  1. Mở `/register`, nhập `user@yahoo.com` hoặc `shop@company.vn`.
  2. Nhấn **ĐĂNG KÝ NGAY**.
- **Kết quả thực tế (Actual Result)**: Hệ thống từ chối: `"Địa chỉ email phải là Gmail hợp lệ (kết thúc bằng @gmail.com...)"`. (Lưu ý: Backend `AuthService.cs` dòng 41 cũng đang đặt cùng regex này).
- **Kết quả mong đợi (Expected Result)**: Nếu đây là chủ đích của nhóm thì cần ghi rõ trên label/UI ngay từ đầu; nếu không, nên cho phép mọi email chuẩn RFC hợp lệ trên cả FE và BE.
- **Mức độ nghiêm trọng**: **Medium**
- **Nguyên nhân dự kiến**: `GMAIL_REGEX` hard-code chỉ khớp đuôi `@gmail.com`.
- **File/component liên quan**: [RegisterPage.tsx](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/features/auth/pages/RegisterPage.tsx#L50-L55)
- **Minh chứng**: Kiểm thử validation trên `/register` (`step_34_shot_1_register-1366.png`).

---

### MỨC ĐỘ LOW (Giao diện, đồng nhất thương hiệu, Accessibility, mã thừa)

#### `BUG-016`: Không đồng nhất thương hiệu — `AuthLayout`, `LoginPage`, `RegisterPage` vẫn hiển thị chữ giữ chỗ `"Tên sàn"` thay vì `"KHO SÀN+"`
- **Module/Page**: Authentication / `AuthLayout`, `LoginPage`, `RegisterPage`
- **URL**: `/login`, `/register`
- **Môi trường & kích thước màn hình**: Chromium · `1920×1080`, `1366×768`
- **Các bước tái hiện (Steps to Reproduce)**: Mở `/login` và `/register`, quan sát logo header, banner, disclaimer và footer.
- **Kết quả thực tế (Actual Result)**: Vẫn hiển thị `"Tên sàn"`, `"HỆ SINH THÁI THƯƠNG MẠI & KHO VẬN TÊN SÀN"`, `"© Tên sàn..."`, và dùng bảng màu cũ `#059669` thay vì token `--color-primary` (`#0e7c66`). Tương tự `BecomeSellerPage.tsx` dòng 65 còn ghi `"E-Warehouse"`.
- **Kết quả mong đợi (Expected Result)**: Đồng bộ hoàn toàn tên thương hiệu **KHO SÀN+** và CSS tokens xuyên suốt mọi màn hình.
- **Mức độ nghiêm trọng**: **Low**
- **Nguyên nhân dự kiến**: Các trang Auth cũ chưa được cập nhật khi chuyển sang bộ nhận diện KHO SÀN+.
- **File/component liên quan**: [AuthLayout.tsx](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/layouts/AuthLayout.tsx#L64-L304), [LoginPage.tsx](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/features/auth/pages/LoginPage.tsx#L399-L410), [RegisterPage.tsx](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/features/auth/pages/RegisterPage.tsx#L382), [BecomeSellerPage.tsx](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/features/seller/pages/BecomeSellerPage.tsx#L65)
- **Minh chứng**: Screenshot `final_step_71.png` và `step_18_shot_1_login-390.png`.

---

#### `BUG-017`: Các liên kết chết (`href="#"`, `href="#forgot"`, `href="#help"`) và state chết (`staySignedIn`) trên màn hình Auth
- **Module/Page**: Authentication / `LoginPage`, `AuthLayout`
- **URL**: `/login`, `/register`
- **Môi trường & kích thước màn hình**: Chromium · `1366×768`
- **Các bước tái hiện (Steps to Reproduce)**:
  1. Nhấn `"Quên mật khẩu?"`, `"Bạn cần trợ giúp?"`, 4 link footer (`Trung tâm trợ giúp`, `Chính sách bảo mật`, `Quy chế hoạt động`, `Chính sách vận chuyển`).
  2. Bỏ tick `"Duy trì đăng nhập"` rồi đăng nhập.
- **Kết quả thực tế (Actual Result)**: Mọi liên kết chỉ đổi hash `#forgot` / `#help` / `#` mà không làm gì; biến `staySignedIn` hoàn toàn không ảnh hưởng cách lưu phiên (Zustand `persist` luôn ghi vào `localStorage`).
- **Kết quả mong đợi (Expected Result)**: Xử lý chức năng tương ứng hoặc hiện thông báo rõ ràng/ẩn các phần tử chưa hỗ trợ.
- **Mức độ nghiêm trọng**: **Low**
- **Nguyên nhân dự kiến**: Thành phần giao diện tĩnh chưa nối hành vi.
- **File/component liên quan**: [LoginPage.tsx](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/features/auth/pages/LoginPage.tsx#L24-L309), [AuthLayout.tsx](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/layouts/AuthLayout.tsx#L79-L302)
- **Minh chứng**: Quan sát trực tiếp trong Suite C.

---

#### `BUG-018`: Thiếu tiêu chuẩn Accessibility (A11y) ở `LoginPage`, `RegisterPage` và `ProductVariantsEditor`
- **Module/Page**: Auth & Seller Product Form
- **URL**: `/login`, `/register`, `/seller/products/new`
- **Môi trường & kích thước màn hình**: Chromium + Static Audit
- **Các bước tái hiện (Steps to Reproduce)**: Kiểm tra DOM và điều hướng bằng phím `Tab`.
- **Kết quả thực tế (Actual Result)**:
  1. Toàn bộ `<input>` trên `LoginPage` (2 ô) và `RegisterPage` (7 ô) không có `<label>` (chỉ dựa vào `placeholder`).
  2. Nút biểu tượng con mắt ẩn/hiện mật khẩu trên cả `LoginPage` & `RegisterPage` không có `aria-label`.
  3. `"Duy trì đăng nhập"` trên `LoginPage` là thẻ `<div>` có `onClick`, không thể focus/toggle bằng bàn phím (`Tab`/`Space`).
  4. Trong `ProductVariantsEditor.tsx` (`VariantFieldsGrid`), các thẻ `<label className="ew-variant-label">` không có thuộc tính `htmlFor` gắn với `id` của `<Input>`.
- **Kết quả mong đợi (Expected Result)**: Đáp ứng `docs/ui-guidelines.md` mục 7 (`<label htmlFor>`, `aria-label` cho nút icon, `<input type="checkbox">` ngữ nghĩa).
- **Mức độ nghiêm trọng**: **Low**
- **Nguyên nhân dự kiến**: Viết JSX bỏ sót thuộc tính ngữ nghĩa A11y.
- **File/component liên quan**: [LoginPage.tsx](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/features/auth/pages/LoginPage.tsx#L190-L296), [RegisterPage.tsx](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/features/auth/pages/RegisterPage.tsx#L190-L343), [ProductVariantsEditor.tsx](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/features/seller/components/ProductVariantsEditor.tsx#L60-L115)
- **Minh chứng**: Xác nhận trên DOM trình duyệt (`0` `<input type="checkbox">` trên `/login`) và kiểm tra mã nguồn.

---

#### `BUG-019`: Trùng lặp mã CSS lớn (~255 dòng) và sót mã màu cam cũ trong `ui-components.css`
- **Module/Page**: Shared Stylesheet / `ui-components.css`
- **URL**: Toàn bộ ứng dụng
- **Môi trường & kích thước màn hình**: Static Code Audit
- **Các bước tái hiện (Steps to Reproduce)**: Đọc file `frontend/src/styles/ui-components.css` từ dòng 531 đến dòng 1050.
- **Kết quả thực tế (Actual Result)**: Khối CSS `.ew-thumb-sm`, `.ew-logo-upload-row`, `.ew-image-card`, `.ew-variant-row`... từ dòng 531–787 bị **lặp lại nguyên văn** bắt đầu từ dòng 789; ngoài ra `.ew-image-card--primary` còn sót màu bóng cam `rgba(249, 115, 22, 0.14)` và `.ew-variant-row--new` dùng nền cam `#fffaf5` lệch tông xanh ngọc `#0e7c66`.
- **Kết quả mong đợi (Expected Result)**: Không trùng lặp selector CSS và dùng đúng biến màu `--color-primary` / `--color-accent-soft`.
- **Mức độ nghiêm trọng**: **Low**
- **Nguyên nhân dự kiến**: Sơ suất copy-paste khi gộp CSS cho bước Catalog.
- **File/component liên quan**: [ui-components.css](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/styles/ui-components.css#L531-L1050)
- **Minh chứng**: Kiểm tra trực tiếp file `ui-components.css` (tổng 1.855 dòng).

---

#### `BUG-020`: Phần tử trang trí `450×450px` trong `AuthLayout` vượt biên phải `+100px` trên mọi kích thước màn hình
- **Module/Page**: Authentication / `AuthLayout`
- **URL**: `/login`, `/register`
- **Môi trường & kích thước màn hình**: Chromium · `1920×1080`, `1366×768`, `768×1024`
- **Các bước tái hiện (Steps to Reproduce)**: Đo `boundingBox` tất cả phần tử con trên `/login` và `/register`.
- **Kết quả thực tế (Actual Result)**: Thẻ `div` hiệu ứng ambient glow (`right: -100px; width: 450px`) kéo `maxRight` của DOM vượt khung nhìn `+92.4px` đến `+100px` (tuy bị `<main style="overflow: hidden">` cắt hiển thị nhưng vẫn làm sai lệch đo đạc layout).
- **Kết quả mong đợi (Expected Result)**: Dùng `radial-gradient` trực tiếp trên nền `<main>` thay vì thẻ `div` định vị âm vượt biên.
- **Mức độ nghiêm trọng**: **Low**
- **Nguyên nhân dự kiến**: Đặt `right: "-100px"` trên phần tử con tuyệt đối.
- **File/component liên quan**: [AuthLayout.tsx](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/layouts/AuthLayout.tsx#L110-L119)
- **Minh chứng**: Bảng đo viewport Suite B (`maxRight = 2020px` tại `1920px`).

---

#### `BUG-021`: Tồn tại nhiều file chết / không sử dụng và bundle JS chưa code-splitting (`753 kB`)
- **Module/Page**: Frontend Architecture / Code Quality
- **URL**: N/A
- **Môi trường & kích thước màn hình**: Static Audit + `vite build`
- **Các bước tái hiện (Steps to Reproduce)**: Kiểm tra import graph của toàn bộ file trong `frontend/src/` và kết quả `vite build`.
- **Kết quả thực tế (Actual Result)**:
  - Các file không được import ở bất kỳ đâu: `frontend/src/App.css`, `frontend/src/pages/DashboardPage.tsx`, `frontend/src/pages/SellerPage.tsx`, `frontend/src/pages/WarehousePage.tsx`, `frontend/src/services/healthService.ts`, `frontend/src/assets/hero.png`, `frontend/src/assets/react.svg`, `frontend/src/assets/vite.svg`.
  - Toàn bộ 4 phân hệ (Storefront, Seller, Warehouse, Admin) đóng gói chung vào 1 chunk JS `753.35 kB` vì `AppRouter.tsx` import tĩnh toàn bộ page thay vì `React.lazy()`.
- **Kết quả mong đợi (Expected Result)**: Dọn sạch mã chết và tách chunk theo từng khu vực bằng `React.lazy` + `Suspense`.
- **Mức độ nghiêm trọng**: **Low**
- **Nguyên nhân dự kiến**: File mẫu Vite ban đầu và trang nháp cũ chưa dọn sau khi chuyển sang kiến trúc `features/`.
- **File/component liên quan**: [AppRouter.tsx](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/routes/AppRouter.tsx), `frontend/src/pages/{DashboardPage,SellerPage,WarehousePage}.tsx`, `frontend/src/services/healthService.ts`, `frontend/src/App.css`
- **Minh chứng**: Output `vite build` (`dist/assets/index-Bgfo0m-i.js 753.35 kB`) và danh sách file `frontend/src/`.

---

## 5. Danh sách chức năng chưa kiểm thử (`BLOCKED`)

Các chức năng sau **KHÔNG được đánh dấu Pass** vì bị chặn bởi môi trường hoặc Backend chưa hoàn thiện:

| Nhóm chức năng | Trạng thái | Lý do bị chặn | Điều kiện cần để kiểm thử |
|---|---|---|---|
| **1. Đăng ký, Đăng nhập thật & Auto-Refresh JWT (401)** | **BLOCKED** | Backend WebAPI (`localhost:5126`) không khởi động được do MySQL (`localhost:3306`) đang tắt (`Unable to connect to any of the specified MySQL hosts`) và máy host thiếu runtime `.NET 9.0` (chỉ có `.NET 10.0.13`). | Bật MySQL (`docker compose up -d` hoặc dịch vụ MySQL cục bộ chạy script `01..06_*.sql`) và chạy Backend với `.NET 9.0` hoặc `DOTNET_ROLL_FORWARD=Major`. |
| **2. Tải dữ liệu Public Catalog thật** (`HomePage`, `/products`, `/products/:id`, `/shops/:id`) | **BLOCKED** | Backend/MySQL offline; cần ít nhất 1 sản phẩm ở trạng thái `Active` có ảnh, biến thể và tồn kho khả dụng (`vw_VariantAvailability`) trong DB. | Khởi động Backend + MySQL và có dữ liệu sản phẩm đã duyệt kèm tồn kho. |
| **3. Luồng Giỏ hàng đa shop thật** (`GET/POST/PUT/DELETE /api/v1/cart*`) | **BLOCKED** | Backend/MySQL offline nên chưa thể kiểm thử thực tế việc thêm biến thể từ PDP vào giỏ, cộng dồn số lượng, nút điều chỉnh `InsufficientStock`, xóa dòng trên DB và đồng bộ nhiều tab. | Backend + MySQL đang chạy + tài khoản `customer@gmail.com` (`Demo@123`) + biến thể có tồn kho. |
| **4. Luồng Đăng ký Seller (`S0`) & Admin duyệt/từ chối/khóa Seller (`A2`)** | **BLOCKED** | Backend/MySQL offline nên chưa test được gửi hồ sơ, tự refresh token khi được duyệt, mở `SellerDetailDrawer` với dữ liệu thật, và xử lý `409 CONCURRENCY_CONFLICT`. | Backend + MySQL đang chạy + tài khoản `Customer` mới + tài khoản `admin@gmail.com` (`Demo@123`). |
| **5. Luồng Seller CRUD Shop (`S2`), Upload ảnh thật, CRUD Sản phẩm/Biến thể (`S3–S4`) & Admin duyệt Sản phẩm (`A3`)** | **BLOCKED** | Backend/MySQL offline nên chưa kiểm thử được tạo/sửa Shop lưu DB, upload file JPG/PNG/WEBP thật lên `/api/v1/seller/uploads/images`, tạo sản phẩm → gửi duyệt → Admin duyệt/từ chối hiển thị lên Storefront. | Backend + MySQL đang chạy + tài khoản `seller@gmail.com` & `admin@gmail.com` (`Demo@123`). |
| **6. Đặt hàng Checkout, Lịch sử & Chi tiết Đơn hàng, Hủy đơn, Trả hàng, Hồ sơ & Sổ địa chỉ** (`/orders`, `/account`, `/account/addresses`, Checkout) | **BLOCKED** | Backend chưa triển khai các controller/endpoint tương ứng (`POST/GET /api/v1/orders`, `/api/v1/users/me`, `/api/v1/users/me/addresses`, `/api/v1/returns`). | Cần Backend hoàn thiện các API từ Bước 6 trở đi theo `docs/PROGRESS.md`. |
| **7. Các màn hình Placeholder của Seller (`S1, S5–S9`), Warehouse (`W1–W9`), Admin (`A1, A4–A8`)** | **BLOCKED** | 23 route hiện chỉ là `PlaceholderPage` ("Đang xây dựng"), chưa có Backend API và giao diện nghiệp vụ. | Hoàn thiện lần lượt theo lộ trình Bước 5–10 trong `docs/PROGRESS.md`. |

---

## 6. Đánh giá tổng thể

- **Tổng số lỗi phát hiện**: **21 lỗi**
  - **Critical**: **2 lỗi** (`BUG-001`, `BUG-002`)
  - **High**: **5 lỗi** (`BUG-003`, `BUG-004`, `BUG-005`, `BUG-006`, `BUG-007`)
  - **Medium**: **8 lỗi** (`BUG-008` → `BUG-015`)
  - **Low**: **6 lỗi** (`BUG-016` → `BUG-021`)
- **Module có nhiều lỗi nhất**: **Authentication (`LoginPage`, `RegisterPage`, `AuthLayout`)** — tập trung cả 2 lỗi bảo mật Critical, lỗi điều hướng chéo vai trò High, lỗi vỡ responsive, lỗi brand `"Tên sàn"`, link chết và thiếu A11y.
- **Luồng nghiệp vụ có nguy cơ cao nhất**:
  1. **Xác thực & Chuyển đổi tài khoản đa vai trò**: Nguy cơ bảo mật cực cao do Google Login mock & demo fallback cấp quyền Admin trên client, cộng thêm lỗi điều hướng nhầm sang route 403 của phiên trước.
  2. **Hiển thị lỗi validation từ Backend trên Form Shop & Sản phẩm**: `BUG-005` khiến mọi lỗi `400` trả từ server chỉ hiện đúng 1 chữ cái.
  3. **Kiểm soát chất lượng tự động (CI/Lint)**: `pnpm lint` hiện bị liệt hoàn toàn (`BUG-007`).
- **Điểm tích cực ghi nhận**:
  - Giao diện Storefront & Cổng Khách hàng mới (KHO SÀN+) ở desktop `1920×1080` và `1366×768` sắc nét, bố cục rõ ràng, `0px` tràn ngang, trạng thái Offline/Error + nút Thử lại hoạt động ổn định, không có uncaught JS exception trên các route chính.
  - Phân quyền `ProtectedRoute` + trang `403 ForbiddenPage` hoạt động chặt chẽ cho mọi vai trò.
  - Chống XSS cơ bản tốt (payload `<script>alert(1)</script>` và `javascript:alert(1)` trong URL ảnh đều bị chặn/escape an toàn).
- **Đánh giá mức độ sẵn sàng (Readiness)**: **CHƯA SẴN SÀNG PRODUCTION** (cần xử lý ngay 2 lỗi Critical & 5 lỗi High, đồng thời chạy lại vòng E2E khi bật MySQL + Backend WebAPI).

---

## 7. Kế hoạch đề xuất Fix (Theo thứ tự ưu tiên)

### Ưu tiên 1 — Critical (Bắt buộc xử lý đầu tiên)
1. **`BUG-001` & `BUG-002`**: Gỡ bỏ toàn bộ nhánh `handleGoogleLogin` giả lập và khối fallback cấp quyền/token giả trong `catch` của [LoginPage.tsx](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/features/auth/pages/LoginPage.tsx); ẩn nút Google Login hoặc chỉ bật khi có OAuth backend thật.

### Ưu tiên 2 — High
2. **`BUG-003`**: Tạo `NotFoundPage.tsx` đồng bộ giao diện KHO SÀN+ và khai báo route `{ path: "*", element: <NotFoundPage /> }` kèm `errorElement` trong [AppRouter.tsx](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/routes/AppRouter.tsx).
3. **`BUG-004`**: Khi logout (`Header.tsx`, `DashboardLayout.tsx`) chuyển về `/login` không giữ `state.from`; trong `LoginPage.tsx` kiểm tra quyền vai trò của `userData` đối với `from.pathname` trước khi redirect, nếu không khớp vai trò thì về `getDefaultRouteForUser(userData)`.
4. **`BUG-005`**: Sửa `fieldErrors.xxx?.[0]` thành `fieldErrors.xxx` tại [ShopFormModal.tsx](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/features/seller/components/ShopFormModal.tsx#L118-L129) và [SellerProductFormPage.tsx](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/features/seller/pages/SellerProductFormPage.tsx#L142-L148).
5. **`BUG-007`**: Căn chỉnh phiên bản `typescript` (hoặc nâng `typescript-eslint` khi hỗ trợ) trong [package.json](file:///g:/nhom4/E_Commerce_Warehouse/frontend/package.json) để `pnpm lint` chạy được bình thường.
6. **`BUG-006`**: Bổ sung `@media (max-width: 1024px)` và `@media (max-width: 640px)` cho [storefront.css](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/styles/storefront.css), [customer-portal.css](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/styles/customer-portal.css), [AuthLayout.tsx](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/layouts/AuthLayout.tsx) và bảng/sidebar console để hết cắt nút tại `768px` và hết tràn ngang trên màn hình nhỏ.

### Ưu tiên 3 — Medium
7. **`BUG-008`**: Chặn giá âm và validate `minPrice <= maxPrice` + debounce trên [PublicProductsPage.tsx](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/features/catalog/pages/PublicProductsPage.tsx).
8. **`BUG-009`**: Đồng bộ `validateVariantFields()` trong [ProductVariantsEditor.tsx](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/features/seller/components/ProductVariantsEditor.tsx) khớp `UpsertVariantRequestValidator` (`SKU <= 64`, không khoảng trắng, `weightGrams > 0`).
9. **`BUG-010`**: Thêm prop `disableEscape={Boolean(moderationTarget)}` cho [AdminProductDetailDrawer.tsx](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/features/admin/components/AdminProductDetailDrawer.tsx) & [AdminProductsPage.tsx](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/features/admin/pages/AdminProductsPage.tsx).
10. **`BUG-011` & `BUG-012`**: Ẩn nút Giỏ hàng đối với tài khoản đã đăng nhập nhưng không có role `Customer` và đồng bộ `searchQuery` với URL `?q=` trong [Header.tsx](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/layouts/Header.tsx).
11. **`BUG-013`**: Đưa `DEFAULT_FILTERS` ra ngoài component trong [SellerProductsPage.tsx](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/features/seller/pages/SellerProductsPage.tsx) & [AdminProductsPage.tsx](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/features/admin/pages/AdminProductsPage.tsx).
12. **`BUG-014`**: Giữ breadcrumb & nút quay lại khi đang tải / lỗi trên [ProductDetailPage.tsx](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/features/catalog/pages/ProductDetailPage.tsx) & [ShopDetailPage.tsx](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/features/catalog/pages/ShopDetailPage.tsx).
13. **`BUG-015`**: Thống nhất lại yêu cầu email (`@gmail.com` vs mọi email hợp lệ) trên [RegisterPage.tsx](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/features/auth/pages/RegisterPage.tsx) & `AuthService.cs`.

### Ưu tiên 4 — Low
14. **`BUG-016` & `BUG-017` & `BUG-020`**: Đồng bộ thương hiệu **KHO SÀN+** và CSS tokens trên [AuthLayout.tsx](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/layouts/AuthLayout.tsx), [LoginPage.tsx](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/features/auth/pages/LoginPage.tsx), [RegisterPage.tsx](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/features/auth/pages/RegisterPage.tsx), [BecomeSellerPage.tsx](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/features/seller/pages/BecomeSellerPage.tsx); bỏ link chết & `div` glow tràn biên.
15. **`BUG-018`**: Bổ sung đầy đủ `<label htmlFor>`, `aria-label` nút mắt mật khẩu, và chuyển `"Duy trì đăng nhập"` thành `<input type="checkbox">` (hoặc bỏ nếu không dùng).
16. **`BUG-019` & `BUG-021`**: Xóa block CSS trùng lặp & màu cam thừa trong [ui-components.css](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/styles/ui-components.css); dọn các file không sử dụng và áp dụng `React.lazy` trong [AppRouter.tsx](file:///g:/nhom4/E_Commerce_Warehouse/frontend/src/routes/AppRouter.tsx).

---

## 8. Kết quả Fix & Re-test (Cập nhật 2026-11-25)

Toàn bộ 21 mục phát hiện trong đợt kiểm thử đã được xử lý theo đúng phạm vi Frontend và các quyết định đã thống nhất với chủ dự án:

### Kiểm tra chất lượng mã nguồn (Sau khi fix)
- **ESLint (`eslint .`)**: **PASS** (`0` errors, `0` warnings — sau khi hạ `typescript` về `~5.8.3` và xử lý 6 lỗi `react-refresh` / `react-hooks/set-state-in-effect`).
- **TypeScript (`tsc -b`)**: **PASS** (`0` errors).
- **Production Build (`vite build`)**: **PASS** (`dist/assets/index-*.js` giảm từ `753.35 kB` xuống `285.36 kB` gzip `86.72 kB`; CSS giảm từ `61.48 kB` xuống `48.58 kB` gzip `8.50 kB`, không còn cảnh báo chunk size).

### Trạng thái từng lỗi (`BUG-001` → `BUG-021`)

| Bug ID | Mức độ | Trạng thái | Kết quả Re-test / Ghi chú |
|---|---|---|---|
| `BUG-001` | Critical | **FIXED & VERIFIED** | Đã gỡ nút và logic `handleGoogleLogin` giả lập trong `LoginPage.tsx`. Re-test trên `/login`: `0` nút Google. |
| `BUG-002` | Critical | **FIXED & VERIFIED** | Đã gỡ toàn bộ 4 nhánh demo auth fallback trong `LoginPage.tsx`. Re-test đăng nhập `admin`/`Demo@123` và `customer@gmail.com`/`Demo@123` khi Backend offline đều báo lỗi kết nối và không cấp phiên/token giả. |
| `BUG-003` | High | **FIXED & VERIFIED** | Đã tạo `NotFoundPage.tsx` và gắn route `{ path: "*" }` + `errorElement` trong `AppRouter.tsx`. Re-test `/this-route-does-not-exist-404`: hiển thị trang 404 KHO SÀN+, `0` lỗi Console. |
| `BUG-004` | High | **FIXED** | Đã bổ sung `canUserAccessPath(pathname, userData)` trong `LoginPage.tsx` để tránh chuyển hướng chéo sang URL 403 của tài khoản trước đó. |
| `BUG-005` | High | **FIXED** | Đã sửa `fieldErrors.xxx?.[0]` → `fieldErrors.xxx` tại `ShopFormModal.tsx` và `SellerProductFormPage.tsx` (đúng kiểu `Record<string, string>` từ `getFieldErrors`). |
| `BUG-006` | High | **FIXED & VERIFIED** | Đã bổ sung responsive media queries cho `storefront.css`, `customer-portal.css`, `ui-components.css`, `AuthLayout.tsx`, `DashboardLayout.tsx`, `Sidebar.tsx`. Re-test trên 5 viewport (`1920`, `1366`, `768`, `390`, `360`) qua `/`, `/products`, `/login`, `/register`: **`0` phần tử tràn ngang**, nút Tìm kiếm tại `768px` hiển thị trọn vẹn. |
| `BUG-007` | High | **FIXED & VERIFIED** | Đã hạ `typescript` về `~5.8.3` trong `frontend/package.json` và chạy `pnpm install`. `eslint .` chạy thành công với `0` lỗi. |
| `BUG-008` | Medium | **FIXED & VERIFIED** | Đã chặn giá âm, cảnh báo inline khi `minPrice > maxPrice` (không gửi khoảng giá sai lên API) và debounce tìm kiếm 300ms trên `PublicProductsPage.tsx`. Re-test trên `/products` đạt 100%. |
| `BUG-009` | Medium | **FIXED** | Đã đồng bộ validation trong `ProductVariantsEditor.tsx` khớp `UpsertVariantRequestValidator.cs` & DB (`SKU <= 64`, không khoảng trắng, `barcode <= 64`, `variantName <= 150`, `price > 0`, `weightGrams > 0`). |
| `BUG-010` | Medium | **FIXED** | Đã thêm `disableEscape={Boolean(moderationTarget)}` cho `AdminProductDetailDrawer` trong `AdminProductsPage.tsx`. |
| `BUG-011` | Medium | **FIXED** | Đã ẩn nút Giỏ hàng trên `Header.tsx` đối với tài khoản đã đăng nhập nhưng không có role `Customer` (thay bằng lối tắt về khu vực quản lý). |
| `BUG-012` | Medium | **FIXED & VERIFIED** | Đã đồng bộ ô tìm kiếm `Header.tsx` với query `?q=` trên URL. Re-test: nhấn `"Đặt lại bộ lọc"` xóa sạch cả URL lẫn ô tìm kiếm trên Header. |
| `BUG-013` | Medium | **FIXED** | Đã đưa `DEFAULT_SELLER_PRODUCT_FILTERS` và `DEFAULT_ADMIN_PRODUCT_FILTERS` ra module scope. |
| `BUG-014` | Medium | **FIXED & VERIFIED** | Đã hiển thị `.ks-breadcrumb-bar` & nút quay lại nhất quán trên cả trạng thái Loading/Error của `ProductDetailPage.tsx` và `ShopDetailPage.tsx`. Re-test trên `/products/1` và `/shops/1` đều hiển thị đầy đủ. |
| `BUG-015` | Medium | **FIXED & VERIFIED** | Giữ quy tắc chỉ nhận `@gmail.com` khớp Backend `AuthService.cs`, đã cập nhật nhãn `"Địa chỉ Gmail *"` và ghi chú hướng dẫn rõ ràng trên `RegisterPage.tsx`. Re-test nhập `test@outlook.com` hiển thị lỗi rõ ràng. |
| `BUG-016` | Low | **FIXED & VERIFIED** | Đã đồng bộ thương hiệu `"KHO SÀN+"` trên `AuthLayout.tsx`, `LoginPage.tsx`, `RegisterPage.tsx`, `BecomeSellerPage.tsx`. |
| `BUG-017` | Low | **FIXED & VERIFIED** | Đã gỡ link chết `#forgot`, `#help`, `#` và ô giả `"Duy trì đăng nhập"` không có tính năng. |
| `BUG-018` | Low | **FIXED & VERIFIED** | Đã bổ sung đầy đủ `<label htmlFor>` gắn `id` cho toàn bộ input trên `LoginPage`, `RegisterPage`, `ProductVariantsEditor` và `aria-label` cho nút ẩn/hiện mật khẩu. |
| `BUG-019` | Low | **FIXED & VERIFIED** | Đã xóa ~590 dòng CSS trùng lặp và thay các mã màu cam sót lại bằng token xanh ngọc trong `ui-components.css`. |
| `BUG-020` | Low | **FIXED & VERIFIED** | Đã thay `div` glow `450×450px` tràn biên bằng `radial-gradient` trên `.ks-auth-main`. Re-test: `0` phần tử vượt biên phải trên `/login` & `/register`. |
| `BUG-021` | Low | **PARTIALLY FIXED (By Design)** | Đã áp dụng `React.lazy` + `Suspense` tách chunk trong `AppRouter.tsx` (bundle chính giảm từ `753 kB` xuống `285 kB`). Giữ nguyên các file cũ chưa dùng (`DashboardPage.tsx`, `SellerPage.tsx`, `WarehousePage.tsx`, `healthService.ts`, `App.css`) để tránh ảnh hưởng nhánh code của thành viên khác trong nhóm. |

> **Lưu ý kiểm thử E2E thật**: Các hạng mục `BLOCKED` ở mục 5 (đăng nhập thật, giỏ hàng DB, CRUD Seller/Admin thật) vẫn cần chạy thêm 1 vòng kiểm thử sau khi bật **MySQL + Backend WebAPI**.

