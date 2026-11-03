# E-Commerce & Warehouse Management System

> **Dự án:** Hệ thống Thương mại Điện tử kết hợp Quản lý Kho Hàng Đa Kênh (Multi-Vendor Marketplace & Warehouse Management)  
> **Nhóm thực hiện:** Team-4  
> **Thời gian thực hiện:** 6 tuần  
> **Quy mô nhóm:** 6 thành viên  
> **Kiến trúc:** Clean Architecture (Backend .NET 9) + Feature-based Architecture (Frontend React 19)  
> **Cơ sở dữ liệu:** MySQL 8.0.16+ (InnoDB, UTF8MB4, Pomelo EF Core 9)  

---

## 1. Tổng quan dự án

Hệ thống là giải pháp thương mại điện tử tích hợp quản lý kho bãi toàn diện, phục vụ cả mô hình bán lẻ sàn thương mại điện tử đa người bán (Marketplace) và mô hình quản lý kho tập trung (Platform Warehouse) kết hợp kho riêng của người bán (Seller Warehouse).

Hệ thống cho phép:
- **Khách hàng (Customer):** Tìm kiếm, lọc, xem sản phẩm, quản lý giỏ hàng, đặt hàng, thanh toán, theo dõi vận đơn và gửi yêu cầu đổi trả/đánh giá sản phẩm.
- **Người bán (Seller):** Quản lý gian hàng (`Shops`), quản lý sản phẩm, xử lý đơn hàng con (`SellerOrders`), ký gửi kho sàn hoặc tự vận hành kho riêng.
- **Nhân viên & Quản lý kho (Warehouse Staff / Manager):** Quản lý vị trí ô kệ (`WarehouseLocations`), thực hiện nhập kho (`InventoryReceipts`), xuất kho (`InventoryIssues`), điều chuyển nội bộ (`StockTransfers`), kiểm kê kho (`StockCounts`) và theo dõi thẻ kho (`StockMovements`).
- **Quản trị viên (Admin):** Kiểm soát người dùng, phân quyền RBAC, phê duyệt người bán/sản phẩm, quản lý danh mục, cấu hình đối tác vận chuyển (`Carriers`), xem báo cáo doanh thu và tổng quan toàn sàn.

### Điểm trọng tâm kỹ thuật: Đồng bộ Đơn hàng & Tồn kho
- **Kiểm tra tồn khả dụng:** $\text{AvailableQuantity} = \text{QuantityOnHand} - \text{QuantityReserved}$.
- **Cơ chế Giữ chỗ tồn kho (`StockReservations`):** Khi khách đặt hàng thành công, hệ thống tạo bản ghi giữ chỗ và tăng `QuantityReserved` để đảm bảo tuyệt đối không bị bán vượt tồn (Over-selling).
- **Xuất kho thật:** Khi đơn hàng chuyển trạng thái xuất kho giao hàng (`Dispatched`/`Shipped`), hệ thống trừ cả `QuantityOnHand` và `QuantityReserved`.
- **Hủy đơn / Hoàn hàng (`ReturnRequests`):** Hoàn trả lại tồn kho chính xác, ghi nhận nhật ký biến động kho (`StockMovements`) chỉ-thêm (append-only ledger) qua trigger bảo vệ tính toàn vẹn kiểm toán.
- **Concurrency Control:** Sử dụng cột `RowVersion` (`TIMESTAMP(6) ON UPDATE`) làm concurrency token cho EF Core thông qua Pomelo (`.IsRowVersion()`).

---

## 2. Công nghệ sử dụng

### 2.1. Backend
- **Nền tảng:** .NET 9 (C#) - ASP.NET Core Web API
- **Kiến trúc:** Clean Architecture (Domain, Application, Infrastructure, WebAPI)
- **ORM & Data Access:** Entity Framework Core 9 (EF Core 9)
- **MySQL Provider:** `Pomelo.EntityFrameworkCore.MySql` (v9.0.0)
- **API Documentation:** OpenAPI / Swagger
- **Authentication & Security:** JWT (JSON Web Token) kết hợp cơ chế cấp lại mã `RefreshTokens`, Password Hashing

### 2.2. Database
- **Hệ quản trị CSDL:** **MySQL 8.0.16+** (bắt buộc $\ge$ 8.0.16 để cơ chế `CHECK constraint` có hiệu lực thực thi).
- **Engine & Bảng mã:** InnoDB, Charset `utf8mb4`, Collation `utf8mb4_unicode_ci` (hỗ trợ đầy đủ tiếng Việt có dấu và emoji).
- **Quy chuẩn thời gian:** Toàn bộ thời gian lưu theo chuẩn UTC (`DATETIME(3)` mặc định `UTC_TIMESTAMP(3)`).
- **Quản lý Migration:** 6 file script đánh số thứ tự chuẩn mực từ `01_` đến `06_`, kèm Triggers bảo vệ nghiệp vụ và Views đối soát tồn khả dụng.

### 2.3. Frontend
- **Core:** React 19, TypeScript, Vite
- **Routing:** React Router DOM (v7)
- **State Management:** Zustand (v5) cho Client State toàn cục (Auth, UI, Mini Cart...)
- **Server State & Caching:** TanStack React Query (v5)
- **Form & Validation:** React Hook Form + Zod + `@hookform/resolvers`
- **HTTP Client:** Axios (cấu hình Interceptors tự động đính kèm JWT Bearer Token)
- **Icons & UI:** Lucide React, CSS Modules / Stylesheet
- **Linting & Code Quality:** ESLint, TypeScript-ESLint

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
│       │       ├── Identity/                   # User, Role, UserRole, RefreshToken
│       │       ├── Order/                      # Order, SellerOrder, OrderItem, OrderStatusHistory, Payment, Refund
│       │       ├── Review/                     # Review, Carrier, Shipment, ReturnRequest, ReturnRequestItem
│       │       ├── Seller/                     # Seller, Shop
│       │       └── Warehouse/                  # Warehouse, WarehouseLocation, Inventory, StockReservation,
│       │                                       # InventoryReceipt, InventoryIssue, StockTransfer, StockCount, StockMovement...
│       │
│       ├── ECommerceWarehouse.Application/     # Lớp nghiệp vụ: Use Cases, DTOs, Interfaces, Validators
│       │   ├── Contracts/                      # Persistence & Service Contracts
│       │   ├── DTOs/                           # DTOs phân theo từng module nghiệp vụ
│       │   ├── Interfaces/                     # Interface dịch vụ
│       │   ├── Mappings/                       # Mapping cấu hình DTO <-> Entity
│       │   ├── Services/                       # Application Services điều phối logic
│       │   └── Validators/                     # FluentValidation
│       │
│       ├── ECommerceWarehouse.Infrastructure/  # Lớp hạ tầng: Pomelo EF Core MySQL, Repositories
│       │   ├── Data/
│       │   │   ├── ApplicationDbContext.cs     # DbContext chính cấu hình cho MySQL
│       │   │   ├── Configurations/             # Fluent API entity configurations
│       │   │   └── Seed/                       # Dữ liệu khởi tạo hệ thống
│       │   ├── Repositories/                   # Repository Pattern implementations
│       │   ├── UnitOfWork/                     # Quản lý giao dịch (Transactions)
│       │   └── DependencyInjection.cs          # Đăng ký Pomelo MySQL DbContext vào DI Container
│       │
│       └── ECommerceWarehouse.WebAPI/          # Lớp giao tiếp: Controllers, Middleware, Program.cs
│           ├── Controllers/                    # REST API Controllers chia theo module:
│           │   ├── Catalog/                    # API Sản phẩm, danh mục, biến thể
│           │   ├── Customer/                   # API Giỏ hàng, địa chỉ, yêu thích
│           │   ├── Identity/                   # API Xác thực, đăng ký, đăng nhập, refresh token
│           │   ├── Order/                      # API Đơn hàng, thanh toán, trạng thái
│           │   ├── Review/                     # API Đánh giá sản phẩm, trả hàng
│           │   ├── Seller/                     # API Gian hàng, quản lý người bán
│           │   ├── Shipping/                   # API Đối tác vận chuyển, tra cứu vận đơn
│           │   └── Warehouse/                  # API Kho bãi, nhập/xuất kho, kiểm kê, tồn kho
│           ├── Extensions/                     # Extension methods đăng ký Service/Swagger/CORS
│           ├── Filters/                        # Exception filters, Action filters
│           ├── Middlewares/                    # Global Exception Handler, Logging Middleware
│           ├── appsettings.json                # Cấu hình ConnectionStrings MySQL
│           └── Program.cs                      # Entry point ứng dụng
│
├── database/                                   # Thiết kế & Script CSDL (MySQL 8.0.16+)
│   ├── documentation/
│   │   └── DatabaseDesign.md                   # Tài liệu chi tiết thiết kế CSDL, Data Dictionary
│   └── scripts/
│       ├── 01_CreateDatabase.sql               # Khởi tạo CSDL MySQL ECommerceWarehouse (utf8mb4)
│       ├── 02_CreateTables.sql                 # DDL tạo bảng kèm PK, UNIQUE, CHECK, RowVersion token
│       ├── 03_CreateForeignKeys.sql            # Thiết lập toàn bộ các khóa ngoại (Foreign Keys)
│       ├── 04_CreateIndexes.sql                # Tạo các chỉ mục B-Tree tối ưu hóa truy vấn
│       ├── 05_TriggersAndViews.sql             # Triggers kiểm soát nghiệp vụ kho + Views đối soát tồn kho
│       └── 06_SeedData.sql                     # Nạp dữ liệu danh mục gốc, vai trò, hãng vận chuyển, kho sàn
│
├── frontend/                                   # Mã nguồn Frontend (React 19 + TypeScript + Vite)
│   ├── public/                                 # Static assets (favicon, logos)
│   ├── src/
│   │   ├── assets/                             # Icons, hình ảnh minh họa
│   │   ├── components/                         # UI components dùng chung (common, layout, ui)
│   │   ├── constants/                          # Hằng số (API Endpoints, Route Paths, Order Statuses...)
│   │   ├── features/                           # Cấu trúc chia theo Feature (Feature-driven):
│   │   │   ├── admin/                          # Quản trị hệ thống, duyệt sản phẩm/người bán
│   │   │   ├── auth/                           # Đăng nhập, đăng ký, JWT token
│   │   │   ├── cart/                           # Giỏ hàng, cập nhật số lượng
│   │   │   ├── catalog/                        # Danh sách sản phẩm, bộ lọc, chi tiết sản phẩm
│   │   │   ├── customer/                       # Hồ sơ khách hàng, sổ địa chỉ
│   │   │   ├── inventory/                      # Quản lý tồn kho, xem thẻ kho
│   │   │   ├── orders/                         # Checkout, đặt hàng, lịch sử đơn hàng
│   │   │   ├── reviews/                        # Đánh giá, xếp hạng sao sản phẩm
│   │   │   ├── seller/                         # Kênh người bán: Quản lý sản phẩm, đơn của Shop
│   │   │   ├── shipping/                       # Quản lý giao nhận, tra cứu mã vận đơn
│   │   │   └── warehouse/                      # Phiếu nhập kho, xuất kho, điều chuyển kho
│   │   ├── hooks/                              # Custom React Hooks (useDebounce, useAuth...)
│   │   ├── layouts/                            # Layout wrapper components
│   │   ├── lib/                                # Cấu hình Axios client, QueryClient
│   │   ├── pages/                              # Các Page view chính
│   │   ├── routes/                             # Cấu hình định tuyến React Router v7 & Protected Route
│   │   ├── services/                           # Gọi API qua Axios tương ứng từng module
│   │   ├── stores/                             # Zustand Stores (useAuthStore, useCartStore...)
│   │   ├── types/                              # TypeScript interfaces/types định nghĩa model & DTO
│   │   └── utils/                              # Hàm tiện ích (formatCurrency, formatDate...)
│   ├── eslint.config.js                        # Cấu hình ESLint
│   ├── index.html                              # Entry HTML file
│   ├── package.json                            # Quản lý thư viện phụ thuộc và scripts
│   ├── pnpm-lock.yaml                          # Lockfile gói thư viện pnpm
│   ├── tsconfig.app.json                       # Cấu hình TypeScript compiler cho app
│   ├── tsconfig.json                           # Root tsconfig
│   └── vite.config.ts                          # Cấu hình Vite build tool
│
├── .gitignore                                  # Bỏ qua node_modules, bin, obj, file tạm
└── README.md                                   # Tài liệu hướng dẫn dự án tổng thể
```

---

## 4. Thiết kế Cơ sở dữ liệu (Database Schema)

Cơ sở dữ liệu trên MySQL gồm các bảng được chuẩn hóa cao, chia theo 6 phân hệ cốt lõi:

| Phân hệ | Danh sách bảng | Mô tả nghiệp vụ |
| :--- | :--- | :--- |
| **1. Identity & Sellers** | `Users`, `Roles`, `UserRoles`, `RefreshTokens`, `Sellers`, `Shops` | Tài khoản, vai trò phân quyền, cấp mới token, hồ sơ người bán và gian hàng kinh doanh. |
| **2. Product Catalog** | `Categories`, `Products`, `ProductVariants`, `ProductImages` | Danh mục phân cấp đa tầng, sản phẩm, biến thể hàng hóa (SKU, giá, trọng lượng) và album ảnh. |
| **3. Customer Interactions** | `UserAddresses`, `Carts`, `CartItems`, `Wishlists`, `WishlistItems` | Sổ địa chỉ giao hàng, giỏ hàng trực tuyến và danh sách sản phẩm yêu thích. |
| **4. Orders & Payments** | `Orders`, `SellerOrders`, `OrderItems`, `OrderStatusHistory`, `Payments`, `Refunds` | Đơn hàng tổng của khách, đơn hàng con theo nhà bán (`SellerOrders`), chi tiết dòng hàng, lịch sử chuyển trạng thái, giao dịch thanh toán và yêu cầu hoàn tiền. |
| **5. Warehouse & Inventory** | `Warehouses`, `WarehouseLocations`, `Inventory`, `StockReservations`, `InventoryReceipts`, `ReceiptDetails`, `InventoryIssues`, `IssueDetails`, `StockTransfers`, `StockTransferDetails`, `StockCounts`, `StockCountDetails`, `StockMovements` | Quản lý kho Platform/Seller, vị trí kệ ngăn lưu trữ, tồn kho khả dụng, **giữ chỗ tồn kho khi checkout**, quy trình Nhập kho, Xuất kho, Điều chuyển kho, **Kiểm kê kho**, và Sổ cái biến động kho chỉ-thêm (`StockMovements` append-only). |
| **6. Shipping & Reviews** | `Carriers`, `Shipments`, `ReturnRequests`, `ReturnRequestItems`, `Reviews` | Đối tác vận chuyển (GHN, GHTK, Viettel Post, SPX...), kiện hàng và mã vận đơn, quy trình yêu cầu trả hàng/hoàn tiền và đánh giá sao sản phẩm. |

---

## 5. Phân công công việc (Team-4: 6 Thành viên)

Dự án phân chia trách nhiệm theo từng Module chuyên trách, mỗi thành viên phụ trách trọn vẹn cả tầng Backend lẫn giao diện Frontend tương ứng:

| Thành viên | Phụ trách chính | Phạm vi công việc cụ thể |
| :--- | :--- | :--- |
| **Member 1** | **Identity & Project Architecture** | - Đăng ký, đăng nhập, JWT + Refresh Token, xác thực & phân quyền RBAC.<br>- Setup khung kiến trúc Backend (.NET 9 + MySQL Pomelo), Frontend (React 19 + Vite), Routing, Axios Client.<br>- Quản trị tích hợp nhánh Git, giải quyết conflict, review PR. |
| **Member 2** | **Catalog & Products** | - Quản lý Danh mục đa tầng (`Categories`), CRUD Sản phẩm (`Products`).<br>- Quản lý biến thể (`ProductVariants`), SKU, giá bán, thư viện ảnh.<br>- Trang Storefront: Tìm kiếm, lọc theo giá/ngành hàng, phân trang. |
| **Member 3** | **Warehouse & Inventory** | - Quản lý cấu trúc Kho (`Warehouses`) và vị trí kệ (`WarehouseLocations`).<br>- Quản lý tồn kho (`Inventory`), cơ chế giữ chỗ (`StockReservations`).<br>- Nghiệp vụ Nhập kho (`Receipts`), Xuất kho (`Issues`), Điều chuyển (`Transfers`), Kiểm kê (`StockCounts`) và Thẻ kho (`Movements`). |
| **Member 4** | **Cart & Orders** | - Quản lý Giỏ hàng (`Carts`, `CartItems`), đồng bộ giỏ hàng với kho.<br>- Quy trình Checkout: Tính toán tiền, khóa dòng giao dịch, gọi giữ tồn kho.<br>- Quản lý Vòng đời đơn hàng (`Orders`, `SellerOrders`, `OrderItems`, `OrderStatusHistory`). |
| **Member 5** | **Payments, Shipping & Returns** | - Tích hợp mô phỏng thanh toán (`Payments`: COD, Chuyển khoản, Ví điện tử).<br>- Vận chuyển (`Carriers`, `Shipments`): Cập nhật trạng thái giao hàng, mã vận đơn.<br>- Xử lý Yêu cầu đổi trả (`ReturnRequests`), Hoàn tiền (`Refunds`) và Hoàn trả tồn kho. |
| **Member 6** | **Seller Portal, Admin Dashboard & QA** | - Kênh người bán (`Seller Portal`): Đăng ký Seller, tạo Shop, quản lý đơn của Shop.<br>- Dashboard quản trị: Báo cáo số liệu, doanh thu, cảnh báo tồn thấp, views đối soát.<br>- Đánh giá (`Reviews`), viết kịch bản kiểm thử (Test Cases), viết tài liệu nghiệm thu. |

---

## 6. Hướng dẫn cài đặt và chạy dự án (Getting Started)

### Yêu cầu môi trường (Prerequisites)
- [Node.js](https://nodejs.org/) (Khuyến nghị bản LTS v20+ hoặc v22+)
- [pnpm](https://pnpm.io/) (hoặc `npm`)
- [.NET SDK 9.0](https://dotnet.microsoft.com/download/dotnet/9.0)
- **MySQL Server 8.0.16+** (Cài trực tiếp hoặc chạy qua Docker) & **MySQL Workbench** / **DBeaver**
- [Git](https://git-scm.com/)

---

### Bước 1: Thiết lập Cơ sở dữ liệu (MySQL Setup)

#### Cách 1.1: Chạy MySQL bằng Docker (Nhanh nhất & không cần cài đặt phức tạp)
```bash
docker run --name mysql-ecommerce -e MYSQL_ROOT_PASSWORD=root -p 3306:3306 -d mysql:8.0 --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
```

#### Cách 1.2: Chạy các file script vào MySQL
Mở terminal hoặc MySQL Workbench, thực thi lần lượt 6 file trong thư mục `database/scripts/` theo đúng thứ tự:

```bash
# Di chuyển vào thư mục script database
cd database/scripts

# 1. Tạo Database
mysql -u root -p < 01_CreateDatabase.sql

# 2. Tạo bảng (PK, UNIQUE, CHECK)
mysql -u root -p ECommerceWarehouse < 02_CreateTables.sql

# 3. Tạo khóa ngoại
mysql -u root -p ECommerceWarehouse < 03_CreateForeignKeys.sql

# 4. Tạo chỉ mục tối ưu
mysql -u root -p ECommerceWarehouse < 04_CreateIndexes.sql

# 5. Tạo Triggers và Views nghiệp vụ (bắt buộc dùng mysql client hoặc Workbench vì có DELIMITER)
mysql -u root -p ECommerceWarehouse < 05_TriggersAndViews.sql

# 6. Nạp dữ liệu mẫu ban đầu
mysql -u root -p ECommerceWarehouse < 06_SeedData.sql
```

---

### Bước 2: Cài đặt và Chạy Backend (.NET 9 Web API)

1. Mở terminal và chuyển vào thư mục `backend`:
   ```bash
   cd backend
   ```

2. Kiểm tra chuỗi kết nối MySQL trong file `src/ECommerceWarehouse.WebAPI/appsettings.json`:
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Server=localhost;Port=3306;Database=ECommerceWarehouse;User=root;Password=your_password;CharSet=utf8mb4;"
   }
   ```
   *(Thay đổi `User` và `Password` tương ứng với tài khoản MySQL trên máy bạn).*

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
