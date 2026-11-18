# Quy trình làm việc với Git

## 1. Nhánh

| Nhánh | Mục đích | Ai được đẩy trực tiếp |
|---|---|---|
| `main` | Bản ổn định, dùng để nộp/demo | Không ai, chỉ merge qua Pull Request |
| `develop` | Nhánh tích hợp hằng ngày | Không ai, chỉ merge qua Pull Request |
| `feature/<module>-<mô-tả>` | Làm một tính năng | Người làm tính năng |
| `fix/<mô-tả>` | Sửa lỗi | Người sửa |
| `docs/<mô-tả>` | Chỉ sửa tài liệu | Người viết |

Ví dụ: `feature/catalog-product-list`, `feature/auth-refresh-token`, `fix/cart-quantity-validation`, `docs/error-codes`.

> Nếu nhóm chưa có nhánh `develop`, tạo từ `main` trước khi bắt đầu.

## 2. Làm một việc

```bash
git checkout develop
git pull
git checkout -b feature/catalog-product-list
# ... làm việc, commit nhỏ, thường xuyên ...
git push -u origin feature/catalog-product-list
# tạo Pull Request vào develop trên GitHub
```

- Mỗi nhánh làm **một việc**, đủ nhỏ để review trong một buổi.
- Trước khi tạo PR: `git pull origin develop` vào nhánh của bạn và xử lý xung đột ở máy bạn.
- **Không** force push, không đổi lịch sử nhánh đã chia sẻ, không commit thẳng vào `main`/`develop`.

## 3. Commit message

Viết bằng **tiếng Anh**, theo dạng `<loại>(<module>): <mô tả ngắn, thể mệnh lệnh>`.

| Loại | Dùng khi |
|---|---|
| `feat` | Thêm tính năng |
| `fix` | Sửa lỗi |
| `docs` | Chỉ sửa tài liệu |
| `refactor` | Đổi cấu trúc code, không đổi hành vi |
| `test` | Thêm hoặc sửa test |
| `chore` | Cấu hình, thư viện, việc lặt vặt |

Ví dụ: `feat(catalog): add product list page with filters`, `fix(auth): refresh token on 401`, `docs: add error codes table`.

## 4. Pull Request

- Tiêu đề theo cùng dạng commit. Mô tả: làm gì, vì sao, cách kiểm tra, ảnh chụp màn hình nếu là giao diện.
- Cần **ít nhất 1 người review** (không tự duyệt PR của mình), tương tự nguyên tắc tách quyền trong kho.
- Điều kiện merge: build và lint sạch (`dotnet build` cho BE; `pnpm lint` và `pnpm build` cho FE), đã giải quyết hết bình luận.
- Đổi hợp đồng API (URL, trường JSON, mã lỗi): sửa `docs/api-conventions.md` hoặc `docs/error-codes.md` **trong cùng PR hoặc trước đó**, và báo cả nhóm.
- Đổi cấu trúc DB: sửa script SQL và `DatabaseDesign.md` cùng lúc, báo cả nhóm để mọi người nạp lại DB (`docker compose down -v` rồi `up -d`).

## 5. Tuyệt đối không commit

- File `.env`, mật khẩu, khóa JWT, chuỗi kết nối thật.
- Thư mục `node_modules/`, `bin/`, `obj/`, `dist/`.
- Dữ liệu cá nhân hoặc dữ liệu thật của khách.

Kiểm tra `.gitignore` đã có các mục trên. Lỡ commit bí mật thì **đổi mật khẩu/khóa ngay**, vì xóa file khỏi commit sau không xóa được khỏi lịch sử.

## 6. Phân việc gợi ý

| Vai trò trong nhóm | Phạm vi |
|---|---|
| FE | `frontend/` |
| BE | `backend/` |
| Dùng chung | `database/`, `docs/`, `docker-compose.yml`: báo nhóm trước khi sửa |
