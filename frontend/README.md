# Frontend - E-Commerce & Warehouse Management System

> Dự án giao diện người dùng xây dựng trên nền tảng **React 19 + TypeScript + Vite**, áp dụng kiến trúc **Feature-driven Architecture** giúp phát triển song song nhiều phân hệ nghiệp vụ mà không bị xung đột.

---

## 1. Cấu trúc thư mục (Project Structure)

Mã nguồn frontend được tổ chức tập trung trong thư mục `src/` theo cấu trúc module hóa cao:

```text
frontend/
├── public/                     # Tài nguyên tĩnh công khai (favicon, logo, icons...)
├── src/
│   ├── assets/                 # Hình ảnh, font chữ, icons tĩnh của ứng dụng
│   │   ├── icons/              # File icon SVG/custom
│   │   └── images/             # Banner, placeholder, illustration
│   │
│   ├── components/             # Các UI Component tái sử dụng toàn hệ thống:
│   │   ├── common/             # Component cấu trúc chung: Header, Footer, Navbar, Sidebar...
│   │   ├── layout/             # Khung layout tổng thể: AdminLayout, CustomerLayout, SellerLayout
│   │   └── ui/                 # Nguyên tử giao diện cơ bản: Button, Input, Modal, Badge, Table, Dropdown...
│   │
│   ├── constants/              # Hằng số cấu hình toàn cục:
│   │   # API endpoints, status codes, local storage keys, route paths
│   │
│   ├── features/               # Các module chức năng nghiệp vụ độc lập (Feature-driven):
│   │   ├── admin/              # Trang & component quản trị viên: Dashboard, duyệt Seller/Sản phẩm
│   │   ├── auth/               # Xác thực người dùng: Đăng nhập, Đăng ký, Đổi mật khẩu
│   │   ├── cart/               # Quản lý giỏ hàng: Thêm, sửa số lượng, xóa, mini cart
│   │   ├── catalog/            # Mua sắm: Danh sách sản phẩm, bộ lọc, chi tiết sản phẩm
│   │   ├── customer/           # Quản lý khách hàng: Hồ sơ cá nhân, sổ địa chỉ nhận hàng
│   │   ├── inventory/          # Tồn kho: Tra cứu tồn kho khả dụng/giữ hàng, lịch sử thẻ kho
│   │   ├── orders/             # Đơn hàng: Checkout thanh toán, lịch sử đơn, chi tiết đơn
│   │   ├── reviews/            # Đánh giá: Đánh giá sao, nhận xét sản phẩm sau mua
│   │   ├── seller/             # Kênh người bán: Quản lý gian hàng, đăng bán sản phẩm, đơn của Shop
│   │   ├── shipping/           # Vận chuyển: Cập nhật trạng thái giao hàng, tra cứu mã vận đơn
│   │   └── warehouse/          # Nghiệp vụ kho: Phiếu nhập (Receipts), Phiếu xuất (Issues), Chuyển kho (Transfers)
│   │
│   ├── hooks/                  # Custom React Hooks dùng chung (useDebounce, useLocalStorage, useModal...)
│   ├── layouts/                # Wrapper Layout áp dụng cho các route
│   ├── lib/                    # Cấu hình các thư viện bên thứ 3 (Axios instance, TanStack QueryClient)
│   ├── pages/                  # Các Page view ứng với từng màn hình chính
│   ├── routes/                 # Cấu hình định tuyến React Router v7 & các Route Guard (Protected Routes)
│   ├── services/               # Tầng gọi API qua HTTP Client phân tách theo từng domain
│   ├── stores/                 # Quản lý State toàn cục bằng Zustand (useAuthStore, useCartStore, useUIStore)
│   ├── types/                  # Định nghĩa TypeScript interface, type cho DTO, Entity, Response
│   ├── utils/                  # Hàm tiện ích dùng chung (formatCurrency, formatDate, validateHelper...)
│   ├── App.css                 # Style chính của App component
│   ├── App.tsx                 # Root Component thiết lập Provider (QueryClientProvider, RouterProvider...)
│   ├── index.css               # Global stylesheet & Reset CSS
│   └── main.tsx                # Entry point gắn ứng dụng vào #root DOM
│
├── .gitignore                  # Bỏ qua node_modules, dist, .env
├── eslint.config.js            # Cấu hình kiểm tra chuẩn code ESLint
├── index.html                  # File HTML chính của Vite
├── package.json                # Quản lý thư viện phụ thuộc và script chạy
├── pnpm-lock.yaml              # Lockfile quản lý phiên bản chính xác của pnpm
├── tsconfig.json               # Cấu hình TypeScript compiler
└── vite.config.ts              # Cấu hình Vite (plugins, aliases, dev server port)
```

---

## 2. Danh sách các thư viện sử dụng (Tech Stack & Libraries)

Các thư viện đã được cài đặt và cấu hình sẵn trong `package.json`:

| Thư viện | Phiên bản | Nhóm / Mục đích | Lý do lựa chọn |
| :--- | :--- | :--- | :--- |
| **react** & **react-dom** | `^19.3.1` | Core UI Framework | Bản React mới nhất với hiệu năng vượt trội, hỗ trợ các cơ chế tối ưu render hiện đại. |
| **vite** | `^8.3.5` | Build Tool & Bundler | Khởi động server cực nhanh, Hot Module Replacement (HMR) tức thì giúp tăng tốc độ phát triển. |
| **typescript** | `~7.0.2` | Ngôn ngữ | Bắt lỗi kiểu tĩnh tại thời điểm viết code, tăng cường autocomplete và tự sinh tài liệu code. |
| **react-router-dom** | `^7.18.5` | SPA Routing | Định tuyến trang cho Single Page Application, hỗ trợ nested routes, loaders và protected routes. |
| **zustand** | `^5.0.16` | Client State Management | Quản lý state toàn cục (Auth token, giỏ hàng tạm, trạng thái modal) cực kỳ nhẹ, không boilerplate rườm rà như Redux. |
| **@tanstack/react-query** | `^5.105.1` | Server State Management | Quản lý việc gọi API, tự động caching, stale-while-revalidate, retry khi mất mạng và đồng bộ trạng thái server. |
| **axios** | `^1.21.0` | HTTP Client | Gọi REST API backend, hỗ trợ Interceptor để tự động gán Bearer Token vào headers và bắt lỗi tập trung (401, 403, 500). |
| **react-hook-form** | `^7.91.0` | Form Management | Xử lý các form phức tạp (đăng ký, tạo sản phẩm, checkout) mà không gây re-render liên tục toàn trang. |
| **zod** | `^4.6.7` | Schema Validation | Định nghĩa schema dữ liệu và validate form chặt chẽ (định dạng email, độ dài mật khẩu, giá tiền >= 0). |
| **@hookform/resolvers** | `^7.0.1` | Form Adapter | Cầu nối tích hợp Zod Schema vào trong React Hook Form một cách mượt mà. |
| **lucide-react** | `^1.66.0` | Icon Package | Bộ icon đồ họa vector hiện đại, kích thước nhỏ gọn và dễ tùy biến màu sắc, kích thước. |
| **eslint** & **typescript-eslint** | `^10.13.0` | Code Quality / Linting | Đảm bảo phong cách code nhất quán cho cả 6 thành viên trong nhóm, phát hiện sớm các lỗi cú pháp. |

---

## 3. Các câu lệnh để cài đặt và chạy dự án (Commands)

Tất cả các thành viên trong nhóm mở terminal tại thư mục `d:\Team-4\frontend` và sử dụng các câu lệnh sau:

### 3.1. Cài đặt các gói phụ thuộc (Dependencies)

> **Khuyến nghị:** Dự án sử dụng `pnpm` (nhanh hơn và tiết kiệm dung lượng ổ cứng). Nếu máy bạn chưa có pnpm, có thể dùng `npm`.

```bash
# Sử dụng pnpm (Khuyến nghị):
pnpm install

# Hoặc sử dụng npm thông thường:
npm install
```

### 3.2. Khởi chạy môi trường phát triển (Dev Server)

```bash
# Chạy local dev server với Vite:
pnpm run dev
# hoặc:
npm run dev
```

Sau khi chạy lệnh trên, terminal sẽ hiển thị đường dẫn:
```text
  VITE v8.x.x  ready in 300 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```
Truy cập vào trình duyệt tại địa chỉ: **`http://localhost:5173`**.

### 3.3. Kiểm tra lỗi chuẩn code (Linting)

Trước khi commit mã nguồn hoặc tạo Pull Request, các thành viên nên chạy lệnh lint để kiểm tra quy chuẩn:

```bash
pnpm run lint
# hoặc:
npm run lint
```

### 3.4. Đóng gói mã nguồn (Build Production)

Lệnh này sẽ kiểm tra kiểu dữ liệu TypeScript (`tsc -b`) và biên dịch bundle tối ưu vào thư mục `dist/`:

```bash
pnpm run build
# hoặc:
npm run build
```

### 3.5. Xem trước bản đóng gói (Preview Production Build)

Xem trước bản build production chạy thử trên máy local:

```bash
pnpm run preview
# hoặc:
npm run preview
```

---

## 4. Hướng dẫn thiết lập Biến môi trường (.env)

Tạo file `.env` (hoặc `.env.local`) tại thư mục gốc `frontend/` để cấu hình đường dẫn API Backend:

```env
# URL trỏ tới ASP.NET Core Web API của Backend (chạy ở cổng 5000 / 7000)
VITE_API_BASE_URL=https://localhost:7001/api/v1
```

Trong mã nguồn React, bạn có thể gọi biến này thông qua:
```typescript
const API_URL = import.meta.env.VITE_API_BASE_URL;
```

---

## 5. Quy chuẩn viết Code cho các thành viên Frontend

1. **Phân chia theo Feature:**
   - Mỗi thành viên phụ trách feature nào (ví dụ: `catalog`, `orders`, `warehouse`) thì viết toàn bộ Component, Hook, Service và Type liên quan trực tiếp trong thư mục `src/features/<feature-name>/`.
2. **Quản lý State:**
   - Dữ liệu fetch từ server (danh sách sản phẩm, đơn hàng, tồn kho) $\rightarrow$ Dùng **TanStack React Query**.
   - Dữ liệu trạng thái người dùng (User token, Giỏ hàng hiện tại, Đóng/mở sidebar) $\rightarrow$ Dùng **Zustand store** tại `src/stores/`.
3. **Gọi API:**
   - Không gọi trực tiếp `axios.get(...)` rải rác trong file giao diện `.tsx`. Hãy định nghĩa hàm gọi API trong `src/services/` hoặc `features/<name>/services/`.
4. **Xử lý Form:**
   - Luôn sử dụng `react-hook-form` kết hợp `zod` để validate dữ liệu đầu vào trước khi submit lên backend.
