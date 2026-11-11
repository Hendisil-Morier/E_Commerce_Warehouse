# Hướng dẫn cài đặt và chạy dự án

Làm theo thứ tự từ trên xuống. Mục nào ghi "kiểm tra lại" nghĩa là tên/cổng có thể khác trong repo của nhóm; đối chiếu rồi sửa file này cho đúng.

## 1. Cần cài trước

| Công cụ | Dùng để | Ghi chú |
|---|---|---|
| Git | Lấy mã nguồn | |
| Docker Desktop | Chạy MySQL và Adminer | Bật Docker trước khi chạy lệnh |
| .NET 9 SDK | Chạy backend | `dotnet --version` phải là 9.x |
| Node.js (LTS) + pnpm | Chạy frontend | Cài pnpm: `npm i -g pnpm`. Dự án dùng **pnpm**, không dùng npm/yarn |

## 2. Lấy mã nguồn

```bash
git clone <địa-chỉ-repo-Team-4>
cd Team-4
```

## 3. Chạy cơ sở dữ liệu (Docker)

```bash
cp .env.example .env     # Windows PowerShell: Copy-Item .env.example .env
docker compose up -d
```

- Lần chạy đầu, MySQL tự chạy 6 file trong `database/scripts/` theo thứ tự (`01` đến `06`) để tạo 39 bảng và dữ liệu mẫu. Chờ khoảng 1 phút.
- Xem trạng thái: `docker compose ps` (cột `mysql` phải là `healthy`).
- Xem dữ liệu bằng giao diện: http://localhost:8081 (Adminer). Hệ thống: MySQL, máy chủ: `mysql`, tài khoản/mật khẩu lấy trong `.env`, cơ sở dữ liệu: `ECommerceWarehouse`.
- Nếu máy đã có MySQL chiếm cổng 3306, đổi `MYSQL_PORT=3307` trong `.env`.

**Không commit `.env`.** Chỉ commit `.env.example`.

### Kiểm tra DB đã nạp đúng

Đăng nhập Adminer (hoặc client MySQL bất kỳ) và chạy:

```sql
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'ECommerceWarehouse' AND table_type = 'BASE TABLE';   -- 39
SELECT COUNT(*) FROM Roles;                                               -- 6
```

### Nạp lại DB từ đầu (mất toàn bộ dữ liệu)

```bash
docker compose down -v
docker compose up -d
```

Chỉ làm khi cần, vì lệnh này xóa hết dữ liệu local của bạn. Chỉ nạp lại khi file SQL được sửa.

## 4. Chạy backend

Kiểm tra lại tên project và đường dẫn theo repo.

```bash
cd backend
dotnet restore
dotnet run --project src/ECommerceWarehouse.WebAPI
```

- Chuỗi kết nối và khóa JWT cấu hình qua `appsettings.Development.json` hoặc user-secrets, **không commit giá trị thật**. Chuỗi kết nối cho máy local:
  `Server=localhost;Port=3306;Database=ECommerceWarehouse;User=<MYSQL_APP_USER>;Password=<MYSQL_APP_PASSWORD>;`
  (đổi `Port` nếu bạn đổi `MYSQL_PORT`).
- Mở Swagger để xem và thử API (đường dẫn dạng `http://localhost:<cổng>/swagger`; cổng xem trong log khi chạy).
- Tùy chọn: chạy API trong Docker bằng `docker compose --profile full up -d --build`, API ở http://localhost:5000/swagger.

## 5. Chạy frontend

Kiểm tra lại tên biến môi trường theo repo.

```bash
cd frontend
pnpm install
pnpm dev
```

- Cấu hình địa chỉ API (biến dạng `VITE_API_BASE_URL`) trong `frontend/.env.local`, trỏ tới backend ở mục 4. File `.env.local` không commit.
- Trước khi tạo Pull Request: `pnpm lint` và `pnpm build` phải chạy sạch.

## 6. Các cổng thường dùng

| Thành phần | Địa chỉ |
|---|---|
| MySQL | `localhost:3306` (hoặc `MYSQL_PORT`) |
| Adminer | http://localhost:8081 |
| API trong Docker (tùy chọn) | http://localhost:5000/swagger |
| API chạy bằng `dotnet run` | xem log khi chạy |
| Frontend (Vite) | thường http://localhost:5173 |

## 7. Lỗi thường gặp

| Triệu chứng | Cách xử lý |
|---|---|
| `docker compose up` báo cổng 3306 đã dùng | Tắt MySQL trên máy hoặc đặt `MYSQL_PORT=3307` |
| DB trống, không có bảng | Volume đã tồn tại từ trước nên script không chạy lại; dùng `docker compose down -v` rồi `up -d` |
| Backend báo không kết nối được MySQL | Kiểm tra container `healthy`, đúng cổng, đúng user/mật khẩu trong `.env` |
| Frontend gọi API bị lỗi CORS | BE cần cho phép nguồn `http://localhost:5173` trong cấu hình CORS |
| Lỗi tên bảng không tìm thấy khi chạy trên Linux/Docker | Tên bảng phân biệt hoa/thường; entity phải khớp đúng như script SQL |

## 8. Quy ước làm việc

- Không commit trực tiếp lên `main`/`develop`; làm trên nhánh riêng rồi tạo Pull Request.
- Không commit `.env`, mật khẩu, khóa JWT.
- Tài liệu liên quan: `docs/api-conventions.md`, `docs/error-codes.md`, `docs/roles-and-permissions.md`, `database/documentation/DatabaseDesign.md`.
