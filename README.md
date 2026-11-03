# E-Commerce & Warehouse Management System

> **Dự án:** Hệ thống Thương mại Điện tử kết hợp Quản lý Kho Hàng Đa Kênh  
> **Nhóm thực hiện:** Team-4  
> **Thời gian thực hiện:** 6 tuần  
> **Quy mô nhóm:** 6 thành viên  
> **Kiến trúc:** Clean Architecture (Backend) + Feature-based Architecture (Frontend)  

---

## 1. Tổng quan dự án

Hệ thống là giải pháp thương mại điện tử tích hợp quản lý kho bãi toàn diện, phục vụ cả mô hình bán lẻ sàn thương mại điện tử (Marketplace) và mô hình quản lý kho tập trung (Platform Warehouse) kết hợp kho riêng của người bán (Seller Warehouse).

Hệ thống cho phép:
- **Khách hàng (Customer):** Tìm kiếm, lọc, xem sản phẩm, quản lý giỏ hàng, đặt hàng, thanh toán và theo dõi vận đơn.
- **Người bán (Seller):** Quản lý gian hàng (`Shops`), quản lý sản phẩm, xử lý đơn hàng con (`SellerOrders`), ký gửi kho sàn hoặc tự vận hành kho riêng.
- **Nhân viên kho (Warehouse Staff):** Quản lý vị trí ô kệ (`WarehouseLocations`), thực hiện nhập kho (`InventoryReceipts`), xuất kho (`InventoryIssues`), điều chuyển nội bộ (`StockTransfers`) và theo dõi thẻ kho (`StockMovements`).
- **Quản trị viên (Admin):** Kiểm soát người dùng, phê duyệt người bán/sản phẩm, quản lý hệ thống danh mục, xem báo cáo doanh thu và tổng quan toàn sàn.

### Điểm trọng tâm kỹ thuật: Đồng bộ Đơn hàng & Tồn kho
- **Kiểm tra tồn khả dụng:** $\text{AvailableQuantity} = \text{QuantityOnHand} - \text{QuantityReserved}$.
- **Cơ chế Giữ hàng (Reservation):** Khi khách đặt hàng thành công, hệ thống tăng `QuantityReserved` để đảm bảo không bị bán vượt tồn (Over-selling).
- **Xuất kho thật:** Khi đơn hàng chuyển trạng thái xuất kho giao hàng (`Dispatched`/`Shipped`), hệ thống trừ cả `QuantityOnHand` và `QuantityReserved`.
- **Hủy đơn / Hoàn hàng:** Hoàn trả lại tồn kho chính xác, ghi nhận nhật ký biến động kho (`StockMovements`) rõ ràng, đảm bảo Idempotency (không cộng/trừ 2 lần).

---

## 2. Công nghệ sử dụng

### 2.1. Frontend
- **Core:** React 19, TypeScript, Vite
- **Routing:** React Router DOM (v7)
- **State Management:** Zustand (v5) cho Client State toàn cục (Auth, UI, Mini Cart...)
- **Server State & Caching:** TanStack React Query (v5)
- **Form & Validation:** React Hook Form + Zod + `@hookform/resolvers`
- **HTTP Client:** Axios (cấu hình Interceptors tự động đính kèm JWT Token và refresh token)
- **Icons & UI:** Lucide React, Tailwind CSS / Modular Styles
- **Linting & Code Quality:** ESLint, TypeScript-ESLint

### 2.2. Backend
- **Nền tảng:** .NET 9 (C#) - ASP.NET Core Web API
- **Kiến trúc:** Clean Architecture (Domain, Application, Infrastructure, WebAPI)
- **ORM & Data Access:** Entity Framework Core (EF Core 9)
- **API Documentation:** Swagger / OpenAPI
- **Authentication & Security:** JWT (JSON Web Token), Password Hashing

### 2.3. Database
- **Hệ quản trị CSDL:** Microsoft SQL Server
- **Quản lý Schema & Di chuyển dữ liệu:** Script Migration có đánh số thứ tự (`01_` đến `06_`), có phân tách riêng bảng, khóa ngoại (FK) và chỉ mục (Index) tối ưu.

---

## 3. Cấu trúc thư mục dự án thực tế

```text
Team-4/
├── backend/                                    # Mã nguồn Backend (.NET 9 Web API)
│   ├── ECommerceWarehouse.sln                 # Solution file
│   └── src/
│       ├── ECommerceWarehouse.Domain/          # Lớp cốt lõi: Entities, Enums, Constants, Exceptions
│       │   └── Entities/                       # Chia theo Bounded Context:
│       │       ├── Catalog/                    # Category, Product, ProductVariant, ProductImage
│       │       ├── Customer/                   # UserAddress, Cart, CartItem, Wishlist, WishlistItem
│       │       ├── Identity/                   # User, Role, UserRole
│       │       ├── Order/                      # Order, SellerOrder, OrderItem, Payment, Refund
│       │       ├── Review/                     # Review, Shipment
│       │       ├── Seller/                     # Seller, Shop
│       │       └── Warehouse/                  # Warehouse, WarehouseLocation, Inventory, 
│       │                                       # InventoryReceipt, InventoryIssue, StockTransfer...
│       │
│       ├── ECommerceWarehouse.Application/     # Lớp nghiệp vụ: Use Cases, DTOs, Interfaces, Validators
│       │   ├── Contracts/                      # Persistence & Service Contracts
│       │   ├── DTOs/                           # DTOs phân theo từng module nghiệp vụ
│       │   ├── Interfaces/                     # Interface dịch vụ
│       │   ├── Mappings/                       # Mapping cấu hình DTO <-> Entity
│       │   ├── Services/                       # Application Services điều phối logic
│       │   └── Validators/                     # FluentValidation
│       │
│       ├── ECommerceWarehouse.Infrastructure/  # Lớp hạ tầng: EF Core, CSDL, Repositories
│       │   ├── Data/
│       │   │   ├── ApplicationDbContext.cs     # DbContext chính của ứng dụng
│       │   │   ├── Configurations/             # Fluent API entity configurations
│       │   │   └── Seed/                       # Dữ liệu khởi tạo hệ thống
│       │   ├── Repositories/                   # Repository Pattern implementations
│       │   ├── UnitOfWork/                     # Quản lý giao dịch (Transactions)
│       │   └── DependencyInjection.cs          # Đăng ký dịch vụ Infrastructure vào DI container
│       │
│       └── ECommerceWarehouse.WebAPI/          # Lớp giao tiếp: Controllers, Middleware, Program.cs
│           ├── Controllers/                    # REST API Controllers chia theo module:
│           │   ├── Catalog/                    # API Sản phẩm, danh mục, biến thể
│           │   ├── Customer/                   # API Giỏ hàng, địa chỉ, yêu thích
│           │   ├── Identity/                   # API Xác thực, đăng ký, đăng nhập
│           │   ├── Order/                      # API Đơn hàng, thanh toán
│           │   ├── Review/                     # API Đánh giá sản phẩm
│           │   ├── Seller/                     # API Gian hàng, quản lý người bán
│           │   ├── Shipping/                   # API Vận chuyển, tra cứu vận đơn
│           │   └── Warehouse/                  # API Kho bãi, nhập/xuất kho, tồn kho
│           ├── Extensions/                     # Extension methods đăng ký Service/Swagger/CORS
│           ├── Filters/                        # Exception filters, Action filters
│           ├── Middlewares/                    # Global Exception Handler, Logging Middleware
│           ├── appsettings.json                # Cấu hình ConnectionString, JWT Secret
│           └── Program.cs                      # Entry point ứng dụng
│
├── database/                                   # Thiết kế & Script CSDL (SQL Server)
│   ├── documentation/
│   │   └── DatabaseDesign.md                   # Tài liệu chi tiết thiết kế CSDL, Data Dictionary
│   └── scripts/
│       ├── 01_CreateDatabase.sql               # Khởi tạo CSDL ECommerceWarehouse
│       ├── 02_CreateTables.sql                 # DDL tạo 22 bảng, PK, Default & Check Constraints
│       ├── 03_CreateForeignKeys.sql            # Định nghĩa toàn bộ Khóa ngoại (FK) chia theo nhóm
│       ├── 04_CreateIndexes.sql                # Tạo các chỉ mục Non-Clustered & Filtered Index
│       ├── 05_InsertSeedData.sql               # Nạp dữ liệu mẫu ban đầu cho hệ thống
│       └── 06_TestQueries.sql                  # Bộ câu lệnh kiểm thử toàn vẹn và nghiệp vụ
│
├── frontend/                                   # Mã nguồn Frontend (React 19 + TypeScript + Vite)
│   ├── public/                                 # Static assets (favicon, logos)
│   ├── src/
│   │   ├── assets/                             # Icons, hình ảnh minh họa
│   │   ├── components/                         # UI components dùng chung:
│   │   │   ├── common/                         # Header, Footer, Navbar, Sidebar...
│   │   │   ├── layout/                         # Khung bố cục (AdminLayout, CustomerLayout...)
│   │   │   └── ui/                             # Button, Input, Modal, Table, Badge, Dropdown...
│   │   ├── constants/                          # Hằng số (API Endpoints, Route Paths, Order Statuses...)
│   │   ├── features/                           # Cấu trúc chia theo Feature (Feature-driven):
│   │   │   ├── admin/                          # Quản trị hệ thống, duyệt sản phẩm/người bán
│   │   │   ├── auth/                           # Đăng nhập, đăng ký, quên mật khẩu
│   │   │   ├── cart/                           # Giỏ hàng, cập nhật số lượng
│   │   │   ├── catalog/                        # Danh sách sản phẩm, bộ lọc, chi tiết sản phẩm
│   │   │   ├── customer/                       # Hồ sơ khách hàng, sổ địa chỉ
│   │   │   ├── inventory/                      # Quản lý tồn kho, xem thẻ kho
│   │   │   ├── orders/                         # Checkout, đặt hàng, lịch sử đơn hàng
│   │   │   ├── reviews/                        # Đánh giá, xếp hạng sao sản phẩm
│   │   │   ├── seller/                         # Kênh người bán: Quản lý sản phẩm, đơn hàng bán
│   │   │   ├── shipping/                       # Quản lý giao nhận, tra cứu mã vận đơn
│   │   │   └── warehouse/                      # Phiếu nhập kho, xuất kho, điều chuyển kho
│   │   ├── hooks/                              # Custom React Hooks (useDebounce, useAuth...)
│   │   ├── layouts/                            # Layout wrapper components
│   │   ├── lib/                                # Cấu hình thư viện ngoài (Axios client, QueryClient)
│   │   ├── pages/                              # Các trang Page chính điều hướng router
│   │   ├── routes/                             # Cấu hình định tuyến React Router v7 & Protected Route
│   │   ├── services/                           # Gọi API qua Axios tương ứng từng module
│   │   ├── stores/                             # Zustand Stores (useAuthStore, useCartStore...)
│   │   ├── types/                              # TypeScript interfaces/types định nghĩa model & DTO
│   │   └── utils/                              # Hàm tiện ích (format tiền tệ, format ngày tháng...)
│   ├── eslint.config.js                        # Cấu hình ESLint
│   ├── index.html                              # Entry HTML file
│   ├── package.json                            # Danh sách dependencies & scripts
│   ├── pnpm-lock.yaml                          # Lockfile gói thư viện pnpm
│   ├── tsconfig.json                           # Cấu hình TypeScript
│   └── vite.config.ts                          # Cấu hình Vite build tool
│
├── .gitignore                                  # Bỏ qua node_modules, bin, obj, file tạm
└── README.md                                   # Tài liệu hướng dẫn dự án tổng thể
```

---

## 4. Thiết kế Cơ sở dữ liệu (Database Schema)

Cơ sở dữ liệu gồm 22 bảng được chuẩn hóa, chia thành 6 phân hệ cốt lõi:

| Phân hệ | Danh sách bảng | Mô tả nghiệp vụ |
| :--- | :--- | :--- |
| **1. Identity & Sellers** | `Users`, `Roles`, `UserRoles`, `Sellers`, `Shops` | Tài khoản, vai trò phân quyền, hồ sơ người bán và gian hàng kinh doanh. |
| **2. Product Catalog** | `Categories`, `Products`, `ProductVariants`, `ProductImages` | Danh mục đa cấp (Self-referencing), sản phẩm, biến thể hàng hóa (SKU, giá, trọng lượng) và album ảnh. |
| **3. Customer Interactions** | `UserAddresses`, `Carts`, `CartItems`, `Wishlists`, `WishlistItems` | Sổ địa chỉ giao hàng, giỏ hàng trực tuyến và danh sách sản phẩm yêu thích. |
| **4. Orders & Payments** | `Orders`, `SellerOrders`, `OrderItems`, `Payments`, `Refunds` | Đơn hàng tổng của khách, tách đơn theo từng Seller (`SellerOrders`), chi tiết dòng hàng, giao dịch thanh toán và yêu cầu hoàn tiền. |
| **5. Warehouse & Inventory** | `Warehouses`, `WarehouseLocations`, `Inventory`, `InventoryReceipts`, `ReceiptDetails`, `InventoryIssues`, `IssueDetails`, `StockTransfers`, `StockTransferDetails`, `StockMovements` | Quản lý kho Platform/Seller, vị trí kệ ngăn lưu trữ, tồn kho khả dụng/giữ hàng, quy trình Nhập kho, Xuất kho, Điều chuyển kho và Nhật ký biến động kho (Audit Log). |
| **6. Shipping & Reviews** | `Shipments`, `Reviews` | Quản lý kiện hàng, mã vận đơn đối tác vận chuyển và đánh giá sao kèm nhận xét đơn hàng đã mua. |

---

## 5. Phân công công việc (Team-4: 6 Thành viên)

Dự án phân chia trách nhiệm theo từng Module chuyên trách, mỗi thành viên phụ trách trọn vẹn cả tầng Backend lẫn giao diện Frontend tương ứng:

| Thành viên | Phụ trách chính | Phạm vi công việc cụ thể |
| :--- | :--- | :--- |
| **Member 1** | **Identity & Project Architecture** | - Đăng ký, đăng nhập, JWT, xác thực & phân quyền RBAC.<br>- Setup khung kiến trúc Backend, Frontend, Routing, Axios Client.<br>- Quản trị tích hợp nhánh Git, giải quyết conflict, review PR. |
| **Member 2** | **Catalog & Products** | - Quản lý Danh mục đa tầng (`Categories`), CRUD Sản phẩm (`Products`).<br>- Quản lý biến thể (`ProductVariants`), SKU, giá bán, thư viện ảnh.<br>- Trang Storefront: Tìm kiếm, lọc theo giá/ngành hàng, phân trang. |
| **Member 3** | **Warehouse & Inventory** | - Quản lý cấu trúc Kho (`Warehouses`) và vị trí kệ (`WarehouseLocations`).<br>- Quản lý tồn kho (`Inventory`), theo dõi số lượng thực tế vs số lượng giữ.<br>- Nghiệp vụ Nhập kho (`Receipts`), Xuất kho (`Issues`), Điều chuyển (`Transfers`) và Thẻ kho (`Movements`). |
| **Member 4** | **Cart & Orders** | - Quản lý Giỏ hàng (`Carts`, `CartItems`), đồng bộ giỏ hàng với kho.<br>- Quy trình Checkout: Tính toán tiền, giữ tồn khả dụng (Reservation).<br>- Quản lý Vòng đời đơn hàng (`Orders`, `SellerOrders`, `OrderItems`). |
| **Member 5** | **Payments, Shipping & Refunds** | - Tích hợp mô phỏng thanh toán (`Payments`: COD, Chuyển khoản, Ví điện tử).<br>- Vận chuyển (`Shipments`): Cập nhật trạng thái giao hàng, mã vận đơn.<br>- Xử lý Hoàn tiền (`Refunds`) và Hoàn trả tồn kho khi đơn hủy. |
| **Member 6** | **Seller Portal, Admin Dashboard & QA** | - Kênh người bán (`Seller Portal`): Đăng ký Seller, tạo Shop, quản lý đơn của Shop.<br>- Dashboard quản trị: Báo cáo số liệu, doanh thu, cảnh báo tồn thấp.<br>- Đánh giá (`Reviews`), viết kịch bản kiểm thử (Test Cases), viết tài liệu nghiệm thu. |

---

## 6. Hướng dẫn cài đặt và chạy dự án (Getting Started)

### Yêu cầu môi trường (Prerequisites)
- [Node.js](https://nodejs.org/) (Khuyến nghị bản LTS v20+ hoặc v22+)
- [pnpm](https://pnpm.io/) (hoặc `npm`)
- [.NET SDK 9.0](https://dotnet.microsoft.com/download/dotnet/9.0)
- [Microsoft SQL Server](https://www.microsoft.com/en-us/sql-server/sql-server-downloads) & [SQL Server Management Studio (SSMS)](https://learn.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms)
- [Git](https://git-scm.com/)

---

### Bước 1: Thiết lập Cơ sở dữ liệu (Database Setup)
Khởi chạy SQL Server Management Studio (SSMS) và mở lần lượt các file script trong thư mục `database/scripts/` theo đúng thứ tự:

1. **`01_CreateDatabase.sql`**: Tạo database `ECommerceWarehouse`.
2. **`02_CreateTables.sql`**: Tạo đầy đủ 22 bảng thực thể và ràng buộc Check.
3. **`03_CreateForeignKeys.sql`**: Thiết lập toàn bộ các quan hệ khóa ngoại (Foreign Keys).
4. **`04_CreateIndexes.sql`**: Tạo các chỉ mục tối ưu hóa tốc độ truy vấn.
5. **`05_InsertSeedData.sql`**: Nạp dữ liệu mẫu ban đầu để test hệ thống.
6. *(Tùy chọn)* **`06_TestQueries.sql`**: Chạy các truy vấn kiểm thử để xác nhận CSDL đã sẵn sàng.

---

### Bước 2: Cài đặt và Chạy Backend (.NET 9 Web API)

1. Mở terminal và chuyển vào thư mục `backend`:
   ```bash
   cd backend
   ```

2. Kiểm tra chuỗi kết nối CSDL trong file `src/ECommerceWarehouse.WebAPI/appsettings.json`:
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Server=localhost;Database=ECommerceWarehouse;Trusted_Connection=True;TrustServerCertificate=True;"
   }
   ```
   *(Thay đổi tên Server cho phù hợp với máy của bạn nếu cần).*

3. Khôi phục các package và build project:
   ```bash
   dotnet restore
   dotnet build
   ```

4. Khởi chạy Web API:
   ```bash
   dotnet run --project src/ECommerceWarehouse.WebAPI
   ```

5. Sau khi khởi chạy thành công, truy cập giao diện Swagger UI để kiểm tra API:
   - **Swagger UI:** `https://localhost:7xxx/swagger` hoặc `http://localhost:5xxx/swagger`

---

### Bước 3: Cài đặt và Chạy Frontend (React + Vite)

1. Mở một terminal mới và chuyển vào thư mục `frontend`:
   ```bash
   cd frontend
   ```

2. Cài đặt các gói phụ thuộc (Dependencies):
   ```bash
   pnpm install
   # hoặc dùng npm nếu máy chưa cài pnpm:
   # npm install
   ```

3. Khởi chạy môi trường phát triển (Development Server):
   ```bash
   pnpm run dev
   # hoặc:
   # npm run dev
   ```

4. Mở trình duyệt và truy cập ứng dụng:
   - **Local URL:** `http://localhost:5173`

---

## 7. Quy ước Git & Làm việc nhóm (Team Collaboration)

### 7.1. Chiến lược phân nhánh (Branching Strategy)
- `main`: Phiên bản ổn định cao nhất, dùng để báo cáo tiến độ và nghiệm thu cuối kỳ.
- `develop`: Nhánh tích hợp chính của cả nhóm.
- `feature/<tên-tính-năng>`: Mỗi thành viên tạo nhánh riêng từ `develop` để code tính năng được giao.
  - Ví dụ: `feature/catalog-crud`, `feature/cart-checkout`, `feature/inventory-receipt`...

### 7.2. Quy tắc làm việc
1. **Không commit trực tiếp vào `main` hoặc `develop`.**
2. Trước khi bắt đầu làm việc mỗi ngày, luôn pull mã nguồn mới nhất:
   ```bash
   git checkout develop
   git pull origin develop
   ```
3. Tạo Pull Request (PR) vào `develop` sau khi hoàn thành tính năng:
   - Cần ít nhất 01 thành viên khác trong nhóm review và approve trước khi merge.
4. **Tuyệt đối không commit các file sau lên Git:**
   - Thư mục thư viện: `node_modules/`, `bin/`, `obj/`
   - File cấu hình chứa mật khẩu cá nhân: `appsettings.Development.json`, `.env.local`
5. **Quy chuẩn Commit Message:**
   - `feat: <nội dung>` (Thêm tính năng mới)
   - `fix: <nội dung>` (Sửa lỗi)
   - `docs: <nội dung>` (Cập nhật tài liệu)
   - `style: <nội dung>` (Định dạng code, căn chỉnh giao diện không đổi logic)
   - `refactor: <nội dung>` (Tái cấu trúc code)
