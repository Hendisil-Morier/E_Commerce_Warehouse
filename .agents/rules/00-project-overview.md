# Tổng quan dự án (đọc trước mọi tác vụ)

## Dự án
Sàn thương mại điện tử **đa người bán** tích hợp **quản lý kho** (repo `Team-4`). Khách đặt một đơn có thể chứa hàng của nhiều seller; mỗi seller (hoặc kho sàn) soạn, đóng gói, xuất kho phần của mình. Nhóm 6 người: FE React, BE C# Web API.

## Công nghệ
- Backend: .NET 9 Web API, Clean Architecture, EF Core + Pomelo (MySQL 8.0.16+), FluentValidation, JWT.
- Frontend: React 19 + TypeScript + Vite, React Router v7, TanStack Query, Zustand, Axios. Trình quản lý gói: **pnpm** (không dùng npm/yarn).
- Cơ sở dữ liệu: MySQL 8, chạy bằng Docker (`docker compose up -d`).

## Cấu trúc thư mục
- `backend/src/ECommerceWarehouse.Domain` → Entities (chia theo Catalog, Customer, Identity, Order, Review, Seller, Warehouse), Enums, Constants, Exceptions.
- `backend/src/ECommerceWarehouse.Application` → Contracts, DTOs, Interfaces, Mappings, Services, Validators.
- `backend/src/ECommerceWarehouse.Infrastructure` → DbContext, Configurations (Fluent API), Repositories, UnitOfWork, Seed, DI.
- `backend/src/ECommerceWarehouse.WebAPI` → Controllers (chia theo module), Extensions, Filters, Middlewares, Program.cs.
- `database/scripts/01..06_*.sql` → schema MySQL. `database/documentation/DatabaseDesign.md` → thiết kế CSDL.
- `frontend/src` → components, constants, features, hooks, layouts, lib, pages, routes, services, stores, types, utils.

## Nguồn sự thật (quan trọng)
1. **Schema CSDL do script SQL trong `database/scripts/` quyết định.** Entity và Fluent API phải khớp script. **Không tạo EF Migrations**, không dùng `EnsureCreated`.
2. Trước khi viết hoặc sửa code liên quan bảng/cột/trạng thái, đọc mục tương ứng trong `database/documentation/DatabaseDesign.md`.
3. Quy ước REST API: xem `docs/api-conventions.md` (nếu file tồn tại) và các rule `10-backend-dotnet.md`.
4. Module **Identity/Auth** đã hoàn thiện: dùng làm mẫu tham chiếu cho cách viết Controller → Service → Repository → DTO → Validator và màn hình tương ứng. Khi thêm tính năng mới, **đọc code Auth trước và theo đúng khuôn đó**.

## Cách làm việc
- Làm đúng phạm vi được yêu cầu; không refactor, đổi tên hoặc định dạng lại code ngoài phạm vi.
- Nghiệp vụ mơ hồ hoặc mâu thuẫn với `DatabaseDesign.md` → hỏi lại, không tự đoán.
- Không sửa script SQL đã chốt nếu chưa được yêu cầu; nếu code cần schema khác, nêu rõ đề xuất thay vì tự sửa.
- Thêm test cho logic nghiệp vụ mới, đặc biệt giữ chỗ tồn kho và chuyển trạng thái.
- Chạy build và lint trước khi báo hoàn thành: `dotnet build backend/ECommerceWarehouse.sln`, `pnpm lint` và `pnpm build` trong `frontend/`. Nếu README ghi lệnh khác thì theo README.

## Ngôn ngữ
- Trao đổi với nhóm bằng **tiếng Việt**. Tên biến, tên hàm, tên class, commit message bằng **tiếng Anh**. Comment giải thích nghiệp vụ có thể bằng tiếng Việt.
- Thông báo lỗi hiển thị cho người dùng bằng tiếng Việt; mã lỗi (`code`) bằng chữ IN HOA tiếng Anh, ví dụ `INSUFFICIENT_STOCK`.

## Tuyệt đối không
- Commit file `.env`, mật khẩu, khóa JWT, chuỗi kết nối thật.
- Chạy lệnh xóa dữ liệu hoặc chạy lại `02_CreateTables.sql` (nó xóa toàn bộ dữ liệu) trừ khi được yêu cầu rõ.
- Force push, đổi lịch sử git, hoặc commit trực tiếp lên `main`/`develop`.
