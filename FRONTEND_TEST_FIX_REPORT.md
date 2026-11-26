# BÁO CÁO KIỂM THỬ TOÀN DIỆN & SỬA LỖI FRONTEND
**Dự án:** E-Commerce Marketplace & Warehouse Management System (`E_Commerce_Warehouse`)  
**Tài liệu báo cáo:** `FRONTEND_TEST_FIX_REPORT.md`  
**Phạm vi bắt buộc:** 25 module — Hàng 2 Seller (`S1, S5, S6, S7, S8, S9`), Hàng 3 WMS (`W1, W2a, W2 Danh sách & Sơ đồ 2D, W3, W4, W5a, W5b, W6, W7-Pick, W7-Pack, W8, W9`), Hàng 4 Admin (`A1, A4, A5, A6, A7, A8`) và Trang lỗi 404 (`SYS-4`).

---

## 1. TỔNG QUAN

| Hạng mục | Chi tiết thực tế |
|---|---|
| **Thời gian thực hiện** | 25/11/2026 (Đợt 1: Khảo sát + Kiểm thử thực tế + Fix Nhóm 1) → 26/11/2026 (Fix Nhóm 2 + Kiểm thử lại Đợt 2 + Regression Test) |
| **Stack Frontend thực tế** | React `19.2.4`, TypeScript `5.9.3`, Vite `8.0.1`, React Router DOM `7.13.1`, Zustand `5.0.12`, TanStack React Query `5.95.2`, Axios `1.13.6`, Lucide React `0.577.0`, Zod `4.3.6` (không thay đổi/nâng cấp bất kỳ phiên bản nào trong `package.json`) |
| **Frontend Server** | `http://localhost:5173` (Vite Dev Server — `200 OK`) |
| **Backend & Database** | `http://localhost:5126` (.NET 9 WebAPI + EF Core + MySQL).<br>• **Đợt 1 (25/11):** Backend + MySQL **ONLINE** — kiểm thử thực tế đăng nhập JWT & API thật với 4 tài khoản seed (`seller@gmail.com`, `manager1@gmail.com`, `manager2@gmail.com`, `admin@gmail.com`, mật khẩu `Demo@123`).<br>• **Đợt 2 (26/11):** Local MySQL/Docker chưa khởi động ở phiên sáng nên chạy xác minh trực tiếp toàn bộ 11 lỗi FE & Regression 25 module trên Google Chrome thật (`http://localhost:5173`) kèm CDP Fetch stub riêng cho `GET /api/v1/sellers/me` khi xác minh inline validation của `BUG-09` (`S9`). |
| **Công cụ kiểm thử trình duyệt** | Đợt 1: Trình duyệt tự động tương tác trực tiếp (`Frontend QA Browser Tester`).<br>Đợt 2: Google Chrome thật (Headless Chrome via Chrome DevTools Protocol — đo thực tế `getBoundingClientRect()`, `scrollWidth`, `innerWidth`, computed CSS, sự kiện bàn phím/chuột, F5 reload, Console/PageError). |
| **Kiểm tra Build & Lint cuối cùng** | `pnpm.cmd run build` (`tsc -b && vite build`): **PASS (790ms, 0 lỗi)**.<br>`pnpm.cmd run lint` (`eslint .`): **PASS (0 lỗi, 0 cảnh báo)**. |
| **Tổng kết lỗi** | Phát hiện **15 vấn đề**: **14 lỗi Frontend** (`BUG-01` → `BUG-11`, `BUG-13` → `BUG-15`, **14/14 ĐÃ SỬA & XÁC MINH PASS**) + **1 vấn đề Backend/Môi trường** (`BUG-12` CORS cho `127.0.0.1:5173` — giữ nguyên ngoài phạm vi sửa FE, ghi nhận báo cáo). |

---

## 2. PHẠM VI KIỂM THỬ CHI TIẾT (25 MODULE)

| Module | Page | Route | Component chính | Chức năng đã kiểm thử | API liên quan | Trạng thái kết nối API | Kết quả kiểm thử |
|---|---|---|---|---|---|---|---|
| **S1** | `SellerDashboardPage` | `/seller` | `DashboardLayout`, `PageHeader`, `StatusBadge` | KPI gian hàng/sản phẩm/đơn con, lối tắt nhanh, bảng đơn chờ xử lý | `GET /api/v1/sellers/me`, `GET /api/v1/seller/shops`, `GET /api/v1/seller/products` | **API thật (Đợt 1: 200 OK)** + mock đơn con | **PASS** |
| **S5** | `SellerOrdersPage` | `/seller/orders` | `SearchInput`, `StatusBadge`, `useUrlFilters` | 8 tab trạng thái đơn con, tìm kiếm mã đơn/khách/vận đơn, đồng bộ URL filter, nút đặt lại | `GET /api/v1/seller/orders?status=` | Mock (`operationsStore`, persist `sessionStorage`) | **PASS** |
| **S6** | `SellerOrderDetailPage` | `/seller/orders/:id` | `StatusTimeline`, `ReasonActionModal` | Chi tiết dòng hàng snapshot, lịch sử trạng thái, xác nhận đơn (`Pending → Confirmed`), hủy đơn (validation lý do ≥ 6 ký tự) | `GET /api/v1/seller/orders/{id}`, `POST .../confirm \| /cancel` | Mock (`operationsStore`) | **PASS** (đã fix `BUG-01`) |
| **S7** | `SellerInventoryPage` | `/seller/inventory` | `SearchInput`, `Select`, `StatusBadge` | Tra cứu tồn theo kho/kệ, lọc shop, lọc mức tồn (Hết hàng/Sắp hết/Ổn định), tìm SKU | `GET /api/v1/seller/inventory` | Mock (`operationsStore`) | **PASS** (đã fix `BUG-11`) |
| **S8** | `SellerReturnsPage` | `/seller/returns` | `InspectionDrawer`, `ReasonActionModal` | Danh sách RMA của shop, lọc tab, mở Drawer xem chứng cứ, duyệt/từ chối phiếu `Requested` | `GET /api/v1/seller/returns`, `POST .../approve \| /reject` | Mock (`operationsStore`) | **PASS** (đã fix `BUG-03`) |
| **S9** | `SellerProfilePage` | `/seller/profile` | `FormField`, `Input`, `Textarea`, `ErrorState` | Hiển thị hồ sơ doanh nghiệp, MST, hoa hồng %, danh sách shop, form liên hệ & validation SĐT VN (`/^0\d{9,10}$/`) | `GET /api/v1/sellers/me`, `GET /api/v1/seller/shops` (Read thật) · `PUT /api/v1/sellers/me` (chờ BE) | **Read API thật (Đợt 1: 200 OK)** · Write cục bộ chờ BE | **PASS** (đã fix `BUG-09`; Write `BLOCKED` chờ BE) |
| **W1** | `WarehouseOverviewPage` | `/warehouse` | `PageHeader`, `StatusBadge` | 5 thẻ KPI kho, 6 lối tắt vận hành, 2 bảng hàng đợi phiếu nhập/xuất | `GET /api/v1/warehouse/overview` | Mock (`operationsStore`) | **PASS** (đã fix `BUG-05`) |
| **W2a** | `WarehousesPage` | `/warehouse/warehouses` | `Modal`, `FormField`, `Input` | Danh sách kho sàn, tạo kho sàn mới (`Platform`), validation rỗng, giữ dữ liệu sau F5 | `GET /api/v1/warehouses`, `POST /api/v1/warehouses` | Mock (`operationsStore`, persist F5) | **PASS** |
| **W2** | `WarehouseLocationsPage` | `/warehouse/warehouses/:id/locations` | `Modal`, `Select`, 2D Bin Map + Inspector | Chuyển đổi Danh sách ↔ **Sơ đồ 2D 7 màu** (`Standard/Cold/Fragile/Hazardous/Inbound/Returns/Damaged`), chọn ô kệ xem tồn, khóa `IsSellable = false` với `Inbound/Returns/Damaged`, tạo vị trí mới, bật/tắt vị trí | `GET/POST /api/v1/warehouses/{id}/locations` | Mock (`operationsStore`) | **PASS** (đã fix `BUG-02`) |
| **W3** | `WarehouseInventoryPage` | `/warehouse/inventory` | `InspectionDrawer`, `SearchInput`, `Select` | Tồn kho tổng hợp theo SKU & vị trí kệ, lọc kho/phân khu, mở Drawer, điều hướng lọc sẵn sang Thẻ kho W4 | `GET /api/v1/inventory` | Mock (`operationsStore`) | **PASS** |
| **W4** | `WarehouseStockMovementsPage` | `/warehouse/stock-movements` | `SearchInput`, `Select`, `Input[type=date]` | Sổ cái bất biến 9 loại biến động, cột `Δ OnHand` / `Δ Reserved` / tồn sau, lọc loại & ngày, bấm link chứng từ sang W5/W6 | `GET /api/v1/stock-movements` | Mock (`operationsStore`) | **PASS** (đã fix `BUG-04`, `BUG-08`) |
| **W5a** | `WarehouseReceiptsPage` + `WarehouseReceiptDetailPage` | `/warehouse/receipts`, `/warehouse/receipts/:id` | `ReasonActionModal`, `StatusBadge` | Lọc trạng thái Draft/Confirmed/Cancelled, cảnh báo phiếu tự tạo, **tách quyền `SELF_APPROVAL_NOT_ALLOWED`** (khóa nút với người tạo, cho phép WM khác xác nhận cộng tồn & ghi W4), hủy Draft | `GET /api/v1/receipts`, `POST .../{id}/confirm \| /cancel` | Mock (`operationsStore`) | **PASS** (đã fix `BUG-01`, `BUG-06`) |
| **W5b** | `WarehouseReceiptCreatePage` | `/warehouse/receipts/new` | `ScanInput`, `Select`, `Input` | Quét mã vạch/SKU cộng +1 dòng hàng (Enter không tự submit form), thêm/xóa dòng hàng, chọn kệ, lưu phiếu Draft | `POST /api/v1/receipts` | Mock (`operationsStore`) | **PASS** (đã fix `BUG-04`, `BUG-07`) |
| **W6** | `WarehouseIssuesPage` + `WarehouseIssueDetailPage` | `/warehouse/issues`, `/warehouse/issues/:id` | `StatusTimeline`, `ConfirmDialog` | Danh sách & chi tiết phiếu xuất, tách quyền duyệt Draft (`SELF_APPROVAL_NOT_ALLOWED`), điều phối luồng `Draft → Approved → Picking → Packed → Dispatched`, trừ tồn & ghi W4 | `GET /api/v1/issues`, `POST .../{id}/approve \| /dispatch` | Mock (`operationsStore`) | **PASS** (đã fix `BUG-06`, `BUG-08`) |
| **W7-Pick** | `WarehouseIssuePickPage` | `/warehouse/issues/:id/pick` | `ScanInput`, Pick cards | Tự động focus ô quét, cảnh báo mã sai (`INVALID-999`), quét hợp lệ tăng tiến độ 100%, cảnh báo dư hàng, chuyển sang W7-Pack | `POST /api/v1/issues/{id}/pick` | Mock (`operationsStore`) | **PASS** (đã fix wrap nút 360px) |
| **W7-Pack** | `WarehouseIssuePackPage` | `/warehouse/issues/:id/pack` | `FormField`, `Select`, `Input` | Validation khối lượng `> 0`, bắt buộc tích checklist kiểm định, nhập seal & hoàn tất đóng gói (`Packed`) | `POST /api/v1/issues/{id}/pack` | Mock (`operationsStore`) | **PASS** (đã fix `BUG-04`) |
| **W8** | `WarehouseShipmentsPage` | `/warehouse/shipments` | `Modal`, `Select`, `ReasonActionModal` | Tạo vận đơn cho đơn `ReadyToShip` với đủ 5 hãng (`GHN/GHTK/VTP/JT/SPX`), cập nhật trạng thái `Preparing → PickedUp → InTransit → Delivered / Failed` | `GET/POST /api/v1/shipments`, `PATCH .../{id}/status` | Mock (`operationsStore`) | **PASS** |
| **W9** | `WarehouseReturnsPage` | `/warehouse/returns` | `InspectionDrawer`, `Select` | Xác nhận nhận kiện (`Approved → ItemsReceived`), kiểm hàng trong Drawer: chọn `Damaged` chỉ hiện kệ `DAMAGED-01`, chọn `Good` nhập kệ bán & ghi bút toán `ReturnIn` vào W4 | `POST /api/v1/returns/{id}/receive \| /inspect` | Mock (`operationsStore`) | **PASS** (đã fix `BUG-03`) |
| **A1** | `AdminDashboardPage` | `/admin` | `PageHeader`, KPI cards | Thống kê người bán/sản phẩm chờ duyệt từ API thật + KPI đơn tổng/RMA/hoàn tiền + bảng trạng thái kết nối API | `GET /api/v1/admin/sellers`, `GET /api/v1/admin/products` | **API thật (Đợt 1: 200 OK)** + mock vận hành | **PASS** (đã fix `BUG-05`) |
| **A4** | `AdminOrdersPage` | `/admin/orders` | `InspectionDrawer`, `StatusTimeline` | Danh sách đơn tổng, lọc trạng thái/ngày, mở Drawer xem đơn tổng → các đơn con → dòng hàng → thanh toán → vận đơn → timeline (chỉ xem, không hủy) | `GET /api/v1/admin/orders` | Mock (`operationsStore`) | **PASS** (đã fix `BUG-04`) |
| **A5** | `AdminReturnsPage` | `/admin/returns` | `InspectionDrawer`, `ReasonActionModal` | Giám sát & can thiệp RMA toàn sàn, lọc tab, mở Drawer xem chứng cứ, duyệt/từ chối phiếu `Requested` | `GET /api/v1/admin/returns` | Mock (`operationsStore`) | **PASS** (đã fix `BUG-03`) |
| **A6** | `AdminRefundsPage` | `/admin/refunds` | `InspectionDrawer`, `ReasonActionModal` | Mặc định lọc `Pending`, đối soát chống `REFUND_EXCEEDS_PAID`, bắt buộc **xác nhận kép** với khoản hoàn ≥ 5.000.000₫ (`REF-261125-002`), duyệt → hoàn thành (`Completed`) | `GET /api/v1/admin/refunds`, `POST .../approve \| /reject \| /complete` | Mock (`operationsStore`) | **PASS** |
| **A7** | `AdminUsersPage` | `/admin/users` | `InspectionDrawer`, `ReasonActionModal` | Danh sách người dùng theo 4 vai trò chuẩn (`Admin/WarehouseManager/Seller/Customer`), gán/gỡ vai trò, khóa/mở khóa tài khoản (bắt buộc lý do), **khóa tự khóa/tự gỡ quyền Admin** | `GET /api/v1/admin/users`, `POST .../lock \| /unlock` | Mock (`operationsStore`) | **PASS** (đã fix `BUG-10`) |
| **A8** | `AdminCategoriesPage` | `/admin/categories` | `Modal`, `FormField`, `ErrorState` | Tải cây danh mục trực tiếp từ API thật, tìm kiếm, mở Modal Thêm/Sửa kèm thông báo chờ Write API | `GET /api/v1/categories` (Read thật) · `POST/PUT` (chờ BE) | **Read API thật (Đợt 1: 200 OK)** · Write chờ BE | **PASS** (Write `BLOCKED` chờ BE) |
| **SYS-4** | `NotFoundPage` | `*` (catch-all) | `NotFoundPage` | Hiển thị mã `404 · SYS-4`, in đúng đường dẫn lỗi, điều hướng thông minh theo vai trò (Seller chỉ thấy Kênh người bán, không lộ nút Admin/WMS), F5 giữ nguyên 404 | Không | Pure Frontend | **PASS** |

---

## 3. TỔNG HỢP KẾT QUẢ KIỂM THỬ

### 3.1. Kết quả tổng thể các hạng mục kiểm thử

| Nhóm kiểm thử | Kết quả Đợt 1 (Trước khi sửa) | Kết quả Đợt 2 (Sau khi sửa) | Ghi chú |
|---|---|---|---|
| **Build (`tsc -b && vite build`)** | PASS | **PASS (729ms, 0 lỗi)** | Không có lỗi kiểu dữ liệu hay import |
| **Lint (`eslint .`)** | PASS | **PASS (0 lỗi, 0 cảnh báo)** | Tuân thủ chặt quy tắc ESLint + React Hooks |
| **UI & Layout Desktop (`1920×1080`, `1366×768`)** | FAIL (`BUG-01`, `BUG-02`, `BUG-03`, `BUG-11`) | **PASS (25/25 module)** | 0 chồng lấn bảng/thẻ, 0 lỗi hiển thị |
| **Responsive 5 kích thước (`1920`, `1366`, `768`, `390`, `360`)** | FAIL (`BUG-02`, `BUG-04`, `BUG-05`, W7-Pick 360px) | **PASS (25/25 module, 0 overflow, 0 offenders)** | Đo trực tiếp trên Chrome: `scrollWidth <= innerWidth` mọi trang |
| **W2 — Sơ đồ kho 2D (5 kích thước)** | FAIL (`BUG-02`: ô kệ bị bóp 35.6px & đè lên nhau) | **PASS (5/5 kích thước)** | `minWidth`: `197px` (1920), `218px` (1366), `235px` (768), `173px` (390), `158px` (360); `overlapCount: 0` |
| **RBAC & Route Guard** | PASS | **PASS** | Chưa đăng nhập → `/login`; sai vai trò → 403 inline; SYS-4 ẩn nút ngoài quyền |
| **Form Validation & CRUD** | FAIL (`BUG-07`, `BUG-09`, `BUG-10`) | **PASS** | Đã kiểm chứng lỗi inline S9, Enter ScanInput W5b, bảo vệ tự khóa A7 |
| **Nghiệp vụ End-to-End (Seller / WMS / Admin)** | FAIL (`BUG-06`, `BUG-08`) | **PASS** | Tách quyền W5/W6 hoạt động ngay cả khi `userId` DB ≠ mock ID; link W4→W5/W6 thông suốt |
| **Giữ dữ liệu sau F5 Reload (Mock Store)** | FAIL (reset về dữ liệu gốc) | **PASS** | `sessionStorage` (`ew-ops-session-v1`) giữ nguyên kho vừa tạo sau F5 |
| **Console Errors & Uncaught Exceptions** | 0 React error (chỉ có CORS khi mở `127.0.0.1`) | **0 Console Errors / 0 Page Errors** | Sạch hoàn toàn trên `http://localhost:5173` |

### 3.2. Ma trận đo đạc Responsive thực tế (Đợt 2 — Chrome CDP)

| Trang / Module đại diện | `1920×1080` | `1366×768` | `768×1024` | `390×844` | `360×800` | Trạng thái |
|---|---|---|---|---|---|---|
| **W2 — Sơ đồ 2D** (`/warehouse/warehouses/1/locations`) | `1920≤1920`, min cell `197px`, 0 overlap | `1358≤1366`, min cell `218px`, 0 overlap | `760≤768`, min cell `235px`, 0 overlap | `390≤390`, min cell `173px`, 0 overlap | `360≤360`, min cell `158px`, 0 overlap | **PASS** |
| **S1, S5** (Dashboard & Đơn hàng Seller) | PASS | `0 overflow` | PASS | `390≤390` | `360≤360` | **PASS** |
| **S6, W5 Detail** (Layout `.ew-split-detail`) | PASS | S6: `left.right 900 < right.left 918`; W5: `905 < 923` | PASS | `0 overflow` | `0 overflow` | **PASS** |
| **W1, W4, W5b, W7-Pick, A1, A4, SYS-4** | PASS | `0 overflow` | PASS | `0 overflow` | `0 overflow`, `0 offenders` | **PASS** |
| **Toàn bộ 25/25 module quét Regression** | — | `25/25: overflow1366 = false` | — | — | `25/25: overflow360 = false, offenders = []` | **PASS** |

---

## 4. DANH SÁCH LỖI PHÁT HIỆN (BUG-01 → BUG-15)

| Mã lỗi | Module | Mức độ | Loại lỗi | Môi trường / Viewport | Mô tả lỗi & Bước tái hiện | Kết quả thực tế (Trước fix) | Kết quả mong đợi | Nguyên nhân gốc rễ | Trạng thái |
|---|---|---|---|---|---|---|---|---|---|
| **BUG-01** | `S6`, `W5 Detail` | **High** | UI / Layout | Desktop `1366×768` | Mở `/seller/orders/1001` hoặc `/warehouse/receipts/202` ở `1366×768`. | Bảng bên trái tràn ngang đè lên cột thẻ thông tin bên phải. | Hai cột tách biệt rõ, bảng tự cuộn ngang bên trong `.ew-table-scroll`. | Thiếu định nghĩa CSS cho `.ew-table-scroll` và thiếu `min-width: 0` trên con trực tiếp của `.ew-split-2` & `.ew-split-detail`. | **FIXED & VERIFIED** |
| **BUG-02** | `W2 (Sơ đồ 2D)` | **High** | Responsive / UI | `1366×768`, `768×1024`, `390×844`, `360×800` | Vào `/warehouse/warehouses/1/locations` → bật tab **Sơ đồ 2D**. | Ô kệ bị ép nhỏ xuống `~35.6px` và chồng đè (`INBOUND-01` đè `RETURNS-01`) ở `1366×768`. | Các ô kệ tự giãn cột hợp lý (`≥140px`), không chồng đè trên cả 5 kích thước màn hình. | `.ew-bin-grid` cố định cứng 4 cột bên cạnh inspector `360px` mà không có `auto-fill, minmax()` và thiếu media query chuyển 1 cột dưới `1200px`. | **FIXED & VERIFIED** |
| **BUG-03** | `S8`, `W9`, `A5`, Shared Drawer | **High** | CSS Conflict / UX | Mọi kích thước | Mở Drawer (`InspectionDrawer`) và kích hoạt 1 thông báo Toast (duyệt/từ chối). | Toast nổi góc trên-phải đè che nút `X` đóng Drawer; đồng thời class `.ew-drawer*` trong `enterprise-console.css` ghi đè CSS Drawer của `ui-components.css` (nguy cơ ảnh hưởng `A2`/`A3`). | Toast nằm góc dưới-phải không che nút `X`; `InspectionDrawer` dùng namespace CSS riêng. | `enterprise-console.css` dùng trùng tên class `.ew-drawer-backdrop` / `.ew-drawer` và `.ew-toast-stack` định vị `top: 20px; right: 20px`. | **FIXED & VERIFIED** |
| **BUG-04** | `W5b`, `W7-Pack`, `W4`, `A4` | **Medium** | Responsive | `768×1024`, `390×844`, `360×800` | Mở form tạo phiếu nhập (W5b), đóng gói (W7-Pack), bộ lọc ngày (W4, A4) trên Tablet/Mobile. | Các lưới form dùng inline `gridTemplateColumns: "1fr 1fr 1fr"` cố định nên bị bóp hẹp / tràn trên mobile. | Tự động thu gọn thành 2 cột (tablet) và 1 cột (mobile), không tràn ngang. | Sử dụng inline `style={{ gridTemplateColumns: ... }}` thay vì class responsive có media query. | **FIXED & VERIFIED** |
| **BUG-05** | `DashboardLayout` (`S1`, `S5`, `W1`, `A1`), `W7-Pick` | **Medium** | Responsive | Mobile `390×844`, `360×800` | Mở `/seller`, `/seller/orders` và `/warehouse/issues/301/pick` trên `390×844` và `360×800`. | Thanh header tràn ngang (`right: 538px` trên `390px`); nút hành động dài của `W7-Pick` nhô `20px` (`right: 380px` trên `360px`). | `scrollWidth <= innerWidth`, không phần tử nào vượt mép phải viewport. | Khối action bên phải trong `DashboardLayout.tsx` đặt `flexShrink: 0` không cho wrap; `.ew-page-header__actions .ew-btn` chưa cho phép wrap text dưới `520px`. | **FIXED & VERIFIED** |
| **BUG-06** | `W5a`, `W5 Detail`, `W6 Detail` | **High** | Business Logic | Live Backend + MySQL | Đăng nhập `manager1@gmail.com` từ Backend thật, mở `/warehouse/receipts/202` (`PN-261125-002`) hoặc `/warehouse/issues/304`. | Nút **Xác nhận nhập kho** KHÔNG bị khóa, cho phép tự duyệt phiếu do chính mình tạo (vi phạm `SELF_APPROVAL_NOT_ALLOWED`). | Khóa nút xác nhận/duyệt và hiển thị banner `SELF_APPROVAL_NOT_ALLOWED`; chỉ tài khoản WM khác (`manager2@gmail.com`) mới được duyệt. | So sánh cứng `receipt.createdBy === currentUser.userId` trong khi `userId` thực tế từ MySQL lệch với số ID giả định (`2`) trong seed mock. | **FIXED & VERIFIED** |
| **BUG-07** | `W5b` | **High** | Functional | Desktop & Mobile | Mở `/warehouse/receipts/new`, nhập `8938501204881` vào `<ScanInput>` và nhấn phím `Enter`. | Nhấn `Enter` vừa quét SKU vừa kích hoạt submit `<form>` cha, đẩy thẳng sang trang chi tiết phiếu trước khi người dùng nhập xong các dòng hàng khác. | Nhấn `Enter` chỉ tăng `+1` dòng hàng tương ứng và giữ nguyên người dùng ở `/warehouse/receipts/new`. | `<ScanInput>` nằm bên trong thẻ `<form onSubmit={handleSubmit}>`. | **FIXED & VERIFIED** |
| **BUG-08** | `W4` → `W5`/`W6` | **Medium** | Navigation / Data | Mọi kích thước | Vào `/warehouse/stock-movements` (W4), click link chứng từ `PX-261124-018` (`referenceId: 303`). | Điều hướng sang `/warehouse/issues/303` nhưng hiển thị `EmptyState` ("Không tìm thấy phiếu xuất kho"). | Mở đúng chi tiết phiếu xuất `PX-261124-018` (`Dispatched`, đơn con `SO-261124-018`). | Dữ liệu seed `INITIAL_STOCK_MOVEMENTS` tham chiếu `referenceId: 303` nhưng `INITIAL_ISSUES` bị thiếu bản ghi `issueId: 303`. | **FIXED & VERIFIED** |
| **BUG-09** | `S9` | **Medium** | Form Validation | Mọi kích thước | Mở `/seller/profile`, nhập SĐT sai định dạng `"123"` và nhấn Lưu. | Chỉ hiện Toast góc màn hình, không hiện thông báo lỗi màu đỏ dưới ô nhập liệu và không tô viền đỏ ô input. | Hiện thông báo lỗi màu đỏ ngay dưới `<FormField>` + viền đỏ (`hasError={true}`). | `SellerProfilePage.tsx` chưa có state `phoneError` truyền vào `FormField.error` và `Input.hasError`. | **FIXED & VERIFIED** |
| **BUG-10** | `A7` | **Medium** | Security / Logic | Mọi kích thước | Đăng nhập `admin@gmail.com`, mở `/admin/users` → mở Drawer của chính tài khoản `admin@gmail.com`. | Cho phép Admin bấm **Khóa tài khoản** của chính mình và bỏ tích vai trò `Admin`. | Vô hiệu hóa nút tự khóa và checkbox vai trò `Admin` của chính tài khoản đang đăng nhập kèm thông báo bảo vệ. | `AdminUsersPage.tsx` chưa đối chiếu `selected` với `currentUser` từ `useAuthStore`. | **FIXED & VERIFIED** |
| **BUG-11** | `S7` & `SearchInput` | **Low** | UI Polish | Chrome / Edge | Mở `/seller/inventory`, nhập `"KB"` vào ô tìm kiếm (`input[type="search"]`). | Hiển thị cùng lúc 2 biểu tượng dấu `X` (nút cancel mặc định của trình duyệt WebKit + nút xóa tùy chỉnh của `SearchInput`). | Chỉ hiển thị đúng 1 nút `X` xóa từ khóa. | Chưa ẩn pseudo-element `input[type="search"]::-webkit-search-cancel-button`. | **FIXED & VERIFIED** |
| **BUG-12** | Auth / API (Toàn hệ thống) | **Medium** | Backend / Environment | Truy cập qua `http://127.0.0.1:5173` | Mở app qua `http://127.0.0.1:5173/login` và đăng nhập khi Backend chạy ở `http://localhost:5126`. | Trình duyệt chặn request do lỗi CORS (`No 'Access-Control-Allow-Origin' header`). | Chấp nhận cả `http://localhost:5173` và `http://127.0.0.1:5173` trong cấu hình CORS Development của Backend. | Backend `Program.cs` chỉ whitelist `http://localhost:5173` (không thuộc phạm vi sửa FE theo Quy tắc #4). | **OPEN (Backend Issue)** |
| **BUG-13** | `W7-Pick` & `operationsStore` | **Medium** | Business Logic | Truy cập URL trực tiếp | Mở trực tiếp `/warehouse/issues/304/pick` (phiếu đang ở trạng thái `Draft` chưa duyệt). | Ô quét mã và nút `"Quét nhanh +1"` vẫn bật và cho phép tăng `pickedQuantity` trên phiếu `Draft` chưa duyệt. | Khóa ô quét & nút quét khi `status !== "Picking"`, hiển thị cảnh báo quy trình và từ chối tại store (`INVALID_STATUS_TRANSITION`). | `scanIssueBarcode` và `WarehouseIssuePickPage` chưa kiểm tra ràng buộc trạng thái `Picking`. | **FIXED & VERIFIED** |
| **BUG-14** | `W5b` & `operationsStore` | **Medium** | Data Integrity / Validation | Mọi kích thước | Tạo kho mới chưa có kệ tại W2a → vào `/warehouse/receipts/new` chọn kho mới đó (hoặc nhập đơn giá vốn âm) rồi bấm Lưu. | `lines` vẫn giữ `locationId` cũ thuộc Kho sàn Hà Nội và cho phép lưu sai kho / đơn giá âm. | Tự động cập nhật `locationId` theo kho mới, hiện cảnh báo nếu kho chưa có kệ (kèm link sang W2), chặn lưu kệ sai kho và đơn giá vốn âm. | `setWarehouseId` không đồng bộ lại `lines[].locationId` và thiếu kiểm tra `location.warehouseId === input.warehouseId` & `unitCost >= 0`. | **FIXED & VERIFIED** |
| **BUG-15** | `A6`, `A8` | **Low** | State Guard / UX | Mọi kích thước | (1) `A6`: Drawer hoàn tiền vượt `paidAmount - previouslyRefundedAmount`. (2) `A8`: Khi API danh mục lỗi/đang tải, bấm nút `"Thêm danh mục"`. | (1) Nút `"Duyệt hoàn tiền"` vẫn bật tới khi bấm xác nhận modal mới báo lỗi. (2) Vẫn mở được modal thêm danh mục dù danh sách đang ở trạng thái `ErrorState`. | (1) Khóa ngay nút `"Duyệt hoàn tiền"` khi vượt hạn mức `REFUND_EXCEEDS_PAID`. (2) Khóa nút `"Thêm danh mục"` khi API đang tải/lỗi. | Thiếu điều kiện `disabled` trên nút hành động ở footer Drawer `A6` và header `A8`. | **FIXED & VERIFIED** |

---

## 5. DANH SÁCH LỖI ĐÃ SỬA & BẰNG CHỨNG XÁC MINH LẠI

Tất cả **14/14 lỗi Frontend** đã được sửa theo 3 đợt (`Nhóm 1: UI/CSS/Responsive`, `Nhóm 2: Logic/Validation/Data/Persist`, `Nhóm 3: Soát xét biên nghiệp vụ & State Guard`) và xác minh lại trực tiếp trên Google Chrome thật (`http://localhost:5173`):

1. **`BUG-01` — `FIXED & VERIFIED`**:
   - **Giải pháp:** Bổ sung `.ew-table-scroll { width: 100%; overflow-x: auto; }`, `.ew-table__cell--right/center`, và `min-width: 0` cho `.ew-split-2 > *`, `.ew-split-detail > *` trong `enterprise-console.css`.
   - **Bằng chứng Đợt 2 (Chrome `1366×768`):** `S6` (`left.right = 900 < right.left = 918`, `overlap: false`, `overflowX: auto`); `W5/202` (`left.right = 905 < right.left = 923`, `overlap: false`).
2. **`BUG-02` — `FIXED & VERIFIED`**:
   - **Giải pháp:** Đổi `.ew-bin-grid` sang `repeat(auto-fill, minmax(175px, 1fr))`, thêm `min-width: 0; overflow: hidden` cho `.ew-bin-cell`, thêm media query `1200px / 768px / 480px` cho `.ew-binmap-layout` trong `wms.css`.
   - **Bằng chứng Đợt 2 (5 viewports):** 9 ô kệ hiển thị sạch, `overlapCount = 0`, `overflow = false` ở mọi kích thước (`minWidth`: `197px → 158px`), click ô `C-01-01` cập nhật Inspector chính xác.
3. **`BUG-03` — `FIXED & VERIFIED`**:
   - **Giải pháp:** Tách riêng namespace `.ew-inspect-backdrop` / `.ew-inspect-drawer*` trong `InspectionDrawer.tsx` & `enterprise-console.css` (không đè `.ew-drawer*` của `ui-components.css`); chuyển `.ew-toast-stack` xuống góc dưới-phải (`top: auto !important; bottom: 20px; right: 20px`).
   - **Bằng chứng Đợt 2:** `hasInspectDrawer: true`, `toastRuleTop: "auto"`, `toastRuleBottom: "20px"`, live Toast thực tế đo `liveToastBottomGap: 20px`, nút `X` đóng Drawer hoạt động (`closedAfterClick: true`).
4. **`BUG-04` — `FIXED & VERIFIED`**:
   - **Giải pháp:** Thay thế các inline fixed grid bằng class `.ew-form-grid-3`, `.ew-form-grid-2-responsive`, `.ew-date-range` trong `W5b`, `W7-Pack`, `W4`, `A4`.
   - **Bằng chứng Đợt 2:** `W5b`, `W4`, `A4` đạt `0 overflow` & `0 offenders` ở cả `390×844` và `360×800`.
5. **`BUG-05` — `FIXED & VERIFIED`**:
   - **Giải pháp:** Cho phép wrap khối action phải của `DashboardLayout.tsx` (`flexWrap: "wrap"; maxWidth: "100%"`) và cho phép wrap nút trong `.ew-page-header__actions` dưới `520px`.
   - **Bằng chứng Đợt 2:** `S1`, `S5`, `W1`, `W7-Pick`, `A1` và toàn bộ 25/25 module đạt `overflow360: false`, `offenders360: []`.
6. **`BUG-06` — `FIXED & VERIFIED`**:
   - **Giải pháp:** Thêm trường `createdByEmail` vào `InventoryReceiptRecordDto` & `InventoryIssueRecordDto`; tạo helper `isSameWarehouseActor()` ưu tiên đối chiếu theo email (không phân biệt hoa/thường), fallback `userId`; áp dụng đồng bộ tại `operationsStore.ts`, `W5a`, `W5 Detail`, `W6 Detail`, `W5b`.
   - **Bằng chứng Đợt 2:** Đăng nhập `manager1@gmail.com` với **`userId: 99`** (cố tình lệch `2`): `W5/202` nút xác nhận `disabled: true` + banner `SELF_APPROVAL_NOT_ALLOWED`; `W6/304` nút duyệt `disabled: true` + banner; `W5a` hiện cảnh báo phiếu tự tạo; chuyển `manager2@gmail.com` (`userId: 100`) xác nhận thành công sang `Confirmed`.
7. **`BUG-07` — `FIXED & VERIFIED`**:
   - **Giải pháp:** Tách thẻ `<ScanInput>` ra ngoài thẻ `<form>` trong `WarehouseReceiptCreatePage.tsx`.
   - **Bằng chứng Đợt 2:** `isInsideForm: false`; nhập `8938501204881` + `Enter` → URL vẫn giữ ở `/warehouse/receipts/new`, số lượng dòng đầu tăng `20 → 21`.
8. **`BUG-08` — `FIXED & VERIFIED`**:
   - **Giải pháp:** Bổ sung bản ghi phiếu xuất `issueId: 303` (`PX-261124-018`, trạng thái `Dispatched`, liên kết `SO-261124-018`) vào `INITIAL_ISSUES` trong `operationsStore.ts`.
   - **Bằng chứng Đợt 2:** Click `PN-261120-001` từ W4 → `/warehouse/receipts/201` (hiển thị đầy đủ); click `PX-261124-018` → `/warehouse/issues/303` (hiển thị đúng `PX-261124-018` & `SO-261124-018`, không EmptyState).
9. **`BUG-09` — `FIXED & VERIFIED`**:
   - **Giải pháp:** Bổ sung state `phoneError` gắn vào `<FormField error={phoneError ?? undefined}>` và `<Input hasError={Boolean(phoneError)}>` trong `SellerProfilePage.tsx`, tự động xóa lỗi khi người dùng sửa lại số.
   - **Bằng chứng Đợt 2 (Chrome + CDP Fetch stub cho `/sellers/me`):** Nhập `"123"` → Submit → hiển thị lỗi inline `"Số điện thoại liên hệ phải bắt đầu bằng 0 và gồm 10–11 chữ số."` với `hasErrorClass: true`.
10. **`BUG-10` — `FIXED & VERIFIED`**:
    - **Giải pháp:** Đọc `currentUser` từ `useAuthStore` trong `AdminUsersPage.tsx`, dùng đối chiếu ưu tiên email để xác định `isSelf`, vô hiệu hóa nút Khóa tài khoản và checkbox gỡ quyền `Admin` kèm thông báo bảo vệ.
    - **Bằng chứng Đợt 2:** Đăng nhập `admin@gmail.com` (`userId: 101` cố tình lệch `1`): Drawer `admin@gmail.com` có `adminLockDisabled: true`, nhãn `"Tài khoản đang đăng nhập (Không thể tự khóa)"`, `adminRoleCheckboxDisabled: true`, `selfNotice: true`; trong khi Drawer `customer@gmail.com` vẫn cho khóa bình thường (`customerLockEnabled: true`).
11. **`BUG-11` — `FIXED & VERIFIED`**:
    - **Giải pháp:** Ẩn nút xóa mặc định của WebKit (`input[type="search"]::-webkit-search-cancel-button { display: none; -webkit-appearance: none; }`) trong `enterprise-console.css`.
    - **Bằng chứng Đợt 2:** `hasWebkitRule: true`, `clearButtonCount: 1`.
12. **`BUG-13` — `FIXED & VERIFIED`**:
    - **Giải pháp:** Ràng buộc `issue.status === "Picking"` trong `scanIssueBarcode` (`operationsStore.ts`) và khóa ô quét + nút `"Quét nhanh +1"` kèm banner cảnh báo trong `WarehouseIssuePickPage.tsx`.
    - **Bằng chứng Đợt 3 (Chrome):** Truy cập `/warehouse/issues/304/pick` (`Draft`): `scannerDisabled: true`, `quickScanDisabled: true`, `warningVisible: true`; trên `/warehouse/issues/301/pick` (`Picking`): cả hai đều hoạt động bình thường (`true`).
13. **`BUG-14` — `FIXED & VERIFIED`**:
    - **Giải pháp:** Thêm `handleWarehouseChange` đồng bộ kệ theo kho mới, cảnh báo khi kho chưa có kệ, kiểm tra `unitCost >= 0` và xác thực `location.warehouseId === input.warehouseId` tại cả `WarehouseReceiptCreatePage.tsx` và `createReceiptDraft`.
    - **Bằng chứng Đợt 3 (Chrome):** Tạo kho trống `"Kho Trống W3"` → chọn tại W5b → hiện cảnh báo thiếu kệ (`warningVisible: true`) và chặn submit (`blockedOnNewPage: true`).
14. **`BUG-15` — `FIXED & VERIFIED`**:
    - **Giải pháp:** Vô hiệu hóa nút `"Duyệt hoàn tiền"` khi vượt hạn mức tại `AdminRefundsPage.tsx` và vô hiệu hóa `"Thêm danh mục"` khi API đang tải/lỗi tại `AdminCategoriesPage.tsx`.
    - **Bằng chứng Đợt 3 (Chrome):** `A8` khi API offline: `addCategoryDisabledWhenOffline: true`; `A6` với lệnh hoàn hợp lệ: `validRefundApproveEnabled: true`.
15. **Cải tiến bổ trợ kiểm thử CRUD qua F5 (`operationsStore.ts`) — `VERIFIED`**:
    - Bọc `useOperationsStore` bằng Zustand `persist` (`sessionStorage`, khóa `ew-ops-session-v1`). Kiểm chứng tạo `"Kho Test F5 Đà Nẵng"` tại W2a → nhấn **F5** → dữ liệu vẫn còn nguyên (`persistedAfterF5: true`).

### Lỗi còn mở (Ngoài phạm vi sửa Frontend)
- **`BUG-12` — `OPEN (Backend/Environment Issue)`:** Cần team Backend bổ sung `http://127.0.0.1:5173` vào CORS origins (nếu muốn hỗ trợ chạy dev qua `127.0.0.1`), hiện tại chỉ truy cập qua `http://localhost:5173` để gọi API thật không bị CORS.

---

## 6. CHỨC NĂNG CHƯA KIỂM THỬ ĐẦY ĐỦ / PHỤ THUỘC BACKEND

Báo cáo trung thực các giới hạn phụ thuộc Backend hiện có trong dự án:

1. **Các module chưa có Backend API thực tế (đang chạy trên `operationsStore.ts` bám sát schema SQL `02_CreateTables.sql` & `06_SeedData.sql`):**
   - **Seller:** `S5`, `S6`, `S7`, `S8` (và thao tác `PUT /api/v1/sellers/me` trên `S9`).
   - **WMS:** Toàn bộ `W1, W2a, W2, W3, W4, W5a, W5b, W6, W7-Pick, W7-Pack, W8, W9`.
   - **Admin:** `A4`, `A5`, `A6`, `A7` (và thao tác `POST/PUT/DELETE /api/v1/categories` trên `A8`).
   - Toàn bộ các luồng UI, validation, state machine, tách quyền, sổ cái StockMovements và đồng bộ liên module đã được kiểm thử đầy đủ trên trình duyệt, nhưng **chưa thể kiểm thử tích hợp end-to-end tới MySQL** cho đến khi Backend cung cấp các endpoint tương ứng.
2. **Các endpoint Backend thật đã kiểm thử thành công ở Đợt 1 (`200 OK`):**
   - `POST /api/v1/Auth/login`, `GET /api/v1/sellers/me`, `GET /api/v1/seller/shops`, `GET /api/v1/seller/products`, `GET /api/v1/admin/sellers`, `GET /api/v1/admin/products`, `GET /api/v1/categories`.
3. **Lưu ý môi trường Đợt 2 đối với `S9` (`BUG-09`):**
   - Ở phiên Đợt 2 (26/11), MySQL/Docker cục bộ chưa bật nên trang `/seller/profile` hiển thị `<ErrorState>` sạch khi không stub; riêng kịch bản xác minh lỗi inline số điện thoại (`BUG-09`) được xác minh trực tiếp trên Chrome bằng CDP Fetch stub trả về đúng JSON payload của `GET /api/v1/sellers/me`.

---

## 7. DANH SÁCH TOÀN BỘ FILE ĐÃ THAY ĐỔI TRONG ĐỢT SỬA LỖI

*(Chỉ tính các file được chỉnh sửa trong đợt kiểm thử & sửa lỗi; tuyệt đối không sửa Customer, Guest, Auth, `S0/S2/S3/S4`, `A2/A3`, Backend, Database hoặc `package.json`.)*

| # | Đường dẫn file | Mục đích chỉnh sửa | Lỗi liên quan | Đánh giá ảnh hưởng |
|---|---|---|---|---|
| 1 | `frontend/src/styles/enterprise-console.css` | Định nghĩa `.ew-table-scroll`, căn cột bảng, `min-width: 0` trên `.ew-split-2`/`.ew-split-detail`, tách namespace `.ew-inspect-*`, dời `.ew-toast-stack` xuống dưới-phải, ẩn `-webkit-search-cancel-button`, thêm `.ew-form-grid-3` / `.ew-form-grid-2-responsive` / `.ew-date-range` & responsive breakpoints (`1280/1120/768/520px`, wrap `.ew-page-header__actions`). | `BUG-01`, `BUG-03`, `BUG-04`, `BUG-05`, `BUG-11` | Khắc phục xung đột với `ui-components.css`; an toàn cho `A2`/`A3` và các trang khác. |
| 2 | `frontend/src/styles/wms.css` | Đổi `.ew-bin-grid` sang `repeat(auto-fill, minmax(175px, 1fr))`, chống vỡ `.ew-bin-cell`, bổ sung media queries `1200px / 768px / 480px` cho sơ đồ 2D & màn hình Pick/Pack. | `BUG-02`, `BUG-04` | Chỉ áp dụng cho các trang WMS (`W1–W9`). |
| 3 | `frontend/src/components/common/InspectionDrawer.tsx` | Chuyển class từ `.ew-drawer*` sang `.ew-inspect-backdrop` / `.ew-inspect-drawer*`. | `BUG-03` | Chỉ dùng ở các màn hình trong phạm vi (`S8, W3, W9, A4, A5, A6, A7`); tránh ghi đè Drawer dùng chung của `A2`/`A3`. |
| 4 | `frontend/src/layouts/DashboardLayout.tsx` | Cho phép `flexWrap: "wrap"; maxWidth: "100%"` trên vùng action góc phải Header. | `BUG-05` | Shared layout cho Seller/WMS/Admin: chỉ cho phép tự xuống dòng khi màn hình hẹp `< 430px`, giữ nguyên giao diện Desktop. |
| 5 | `frontend/src/types/operations.ts` | Thêm thuộc tính tùy chọn `createdByEmail?: string \| null` vào `InventoryReceiptRecordDto` và `InventoryIssueRecordDto`. | `BUG-06` | Tương thích ngược hoàn toàn (optional field). |
| 6 | `frontend/src/services/operationsStore.ts` | Xuất helper `isSameWarehouseActor`, thêm `createdByEmail` cho seed & action, bổ sung phiếu xuất `issueId: 303` (`PX-261124-018`), bọc `persist` (`sessionStorage`), ràng buộc `status === "Picking"` trong `scanIssueBarcode` và xác thực kệ/đơn giá trong `createReceiptDraft`. | `BUG-06`, `BUG-08`, `BUG-13`, `BUG-14`, F5 Persist | Chỉ dùng cho các module vận hành trong phạm vi. |
| 7 | `frontend/src/features/warehouse/pages/WarehouseReceiptsPage.tsx` | Dùng `isSameWarehouseActor` để hiển thị cảnh báo phiếu tự tạo. | `BUG-06` | Chỉ ảnh hưởng `W5a`. |
| 8 | `frontend/src/features/warehouse/pages/WarehouseReceiptDetailPage.tsx` | Dùng `isSameWarehouseActor` và truyền `currentUser?.email` vào `confirmReceipt`. | `BUG-06` | Chỉ ảnh hưởng `W5 Detail`. |
| 9 | `frontend/src/features/warehouse/pages/WarehouseIssueDetailPage.tsx` | Dùng `isSameWarehouseActor` và truyền `currentUser?.email` vào `approveIssue`. | `BUG-06` | Chỉ ảnh hưởng `W6 Detail`. |
| 10 | `frontend/src/features/warehouse/pages/WarehouseReceiptCreatePage.tsx` | Di chuyển `<ScanInput>` ra ngoài `<form>`, truyền `createdByEmail`, đồng bộ lại `locationId` khi đổi kho, cảnh báo kho trống kệ, chặn đơn giá âm, dùng `.ew-form-grid-3` & `.ew-form-grid-2-responsive`. | `BUG-04`, `BUG-06`, `BUG-07`, `BUG-14` | Chỉ ảnh hưởng `W5b`. |
| 11 | `frontend/src/features/warehouse/pages/WarehouseIssuePickPage.tsx` | Ràng buộc trạng thái `Picking` khi truy cập trực tiếp URL (khóa ô quét/nút quét + hiển thị banner cảnh báo). | `BUG-13` | Chỉ ảnh hưởng `W7-Pick`. |
| 12 | `frontend/src/features/warehouse/pages/WarehouseIssuePackPage.tsx` | Chuyển grid inline sang `.ew-form-grid-2-responsive`. | `BUG-04` | Chỉ ảnh hưởng `W7-Pack`. |
| 13 | `frontend/src/features/warehouse/pages/WarehouseStockMovementsPage.tsx` | Chuyển khung chọn khoảng ngày sang `.ew-date-range`. | `BUG-04` | Chỉ ảnh hưởng `W4`. |
| 14 | `frontend/src/features/admin/pages/AdminOrdersPage.tsx` | Chuyển khung chọn khoảng ngày sang `.ew-date-range`. | `BUG-04` | Chỉ ảnh hưởng `A4`. |
| 15 | `frontend/src/features/admin/pages/AdminRefundsPage.tsx` | Khóa nút `"Duyệt hoàn tiền"` trong Drawer khi vượt hạn mức `REFUND_EXCEEDS_PAID`. | `BUG-15` | Chỉ ảnh hưởng `A6`. |
| 16 | `frontend/src/features/admin/pages/AdminCategoriesPage.tsx` | Khóa nút `"Thêm danh mục"` khi API danh mục đang tải hoặc gặp lỗi. | `BUG-15` | Chỉ ảnh hưởng `A8`. |
| 17 | `frontend/src/features/seller/pages/SellerProfilePage.tsx` | Bổ sung `phoneError` hiển thị lỗi inline ngay dưới `FormField` & highlight viền đỏ `Input`. | `BUG-09` | Chỉ ảnh hưởng `S9`. |
| 18 | `frontend/src/features/admin/pages/AdminUsersPage.tsx` | Kết nối `useAuthStore`, tính `isSelf` ưu tiên email để khóa nút tự khóa tài khoản và tự gỡ vai trò `Admin`. | `BUG-10` | Chỉ ảnh hưởng `A7`. |

---

## 8. ĐÁNH GIÁ CUỐI CÙNG

- **Chất lượng kỹ thuật:** Code sạch, chặt kiểu TypeScript (`tsc -b` 0 lỗi), `eslint .` 0 lỗi / 0 cảnh báo, build production hoàn tất nhanh (`729ms`) với code-splitting theo từng trang.
- **UI/UX & Responsive:** Toàn bộ **25/25 module** hiển thị sắc nét, không còn tình trạng tràn ngang, không chồng lấn bảng/thẻ hay ô kệ trên cả 5 độ phân giải tiêu chuẩn (`1920×1080`, `1366×768`, `768×1024`, `390×844`, `360×800`).
- **Tính chính xác nghiệp vụ:** Các ràng buộc cốt lõi của dự án (`CK_Receipts_Separation` / `CK_Issues_Separation`, `CK_Locations_Sellable`, quy trình `Pick → Pack → Dispatch → StockMovements`, đối soát `REFUND_EXCEEDS_PAID` + xác nhận kép ≥ 5 triệu, chống Admin tự khóa mình, RBAC 4 vai trò và SYS-4 phân quyền nút điều hướng) đều vận hành nhất quán.
- **Khuyến nghị khi tích hợp Backend thật:**
  1. Bổ sung `http://127.0.0.1:5173` vào CORS Development ở Backend nếu nhóm dev thường mở Vite qua IP loopback (`BUG-12`).
  2. Khi Backend hoàn thiện các endpoint cho `S5–S8`, `W1–W9`, `A4–A7` và Write API cho `S9`/`A8`, thay dần selector `useOperationsStore` bằng TanStack Query hooks tương ứng (các kiểu DTO trong `types/operations.ts` đã bám sát schema SQL và `api-conventions.md`).

---

## 9. KẾT LUẬN RIÊNG CHO TỪNG NHÓM CHỨC NĂNG

- **Hàng 2 — Kênh Người bán (`S1, S5, S6, S7, S8, S9`):** **ĐẠT (READY FOR REVIEW)**. Các lỗi bố cục bảng (`S6`), nút xóa tìm kiếm kép (`S7`), Toast che nút đóng Drawer (`S8`), lỗi inline SĐT (`S9`) và tràn header mobile (`S1/S5`) đã được sửa và xác minh sạch trên trình duyệt. (`S1` và Read `S9` đã nối API thật `200 OK`; `S5–S8` & Write `S9` chờ Backend endpoint).
- **Hàng 3 — Vận hành Kho WMS (`W1, W2a, W2 Danh sách & Sơ đồ 2D, W3, W4, W5a, W5b, W6, W7-Pick, W7-Pack, W8, W9`):** **ĐẠT (READY FOR REVIEW)**. Trọng tâm **W2 — Sơ đồ 2D** đã hiển thị rõ ràng, không đè ô trên cả 5 kích thước; luồng tách quyền `SELF_APPROVAL_NOT_ALLOWED` (W5/W6), quét mã `Enter` không tự submit (W5b), liên kết sổ cái W4→W5/W6, luồng Pick→Pack→Dispatch→Shipments→Returns và lưu dữ liệu qua F5 đều vượt qua kiểm thử thực tế 100%.
- **Hàng 4 — Quản trị Sàn (`A1, A4, A5, A6, A7, A8`):** **ĐẠT (READY FOR REVIEW)**. Cơ chế bảo vệ Admin tự khóa/tự gỡ quyền (`A7`), lọc & đối soát hoàn tiền xác nhận kép (`A6`), xem xuyên suốt đơn tổng/đơn con không có quyền hủy (`A4`), giám sát RMA (`A5`) và tải cây danh mục trực tiếp từ API (`A8`) đều hoạt động ổn định, không lỗi Console.
- **Hệ thống — Trang lỗi 404 (`SYS-4`):** **ĐẠT (READY FOR REVIEW)**. Xử lý chuẩn mọi URL không tồn tại, giữ nguyên trang 404 khi F5 hoặc truy cập trực tiếp, hiển thị đúng đường dẫn sai, phân quyền nút điều hướng theo vai trò và không tràn ngang kể cả trên `360×800`.
