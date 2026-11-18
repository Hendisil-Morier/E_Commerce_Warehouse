# Tài liệu dự án Team-4

Sàn thương mại điện tử đa người bán tích hợp quản lý kho. Đọc theo thứ tự dưới đây nếu bạn mới vào nhóm.

| Thứ tự | File | Nội dung | Ai cần đọc |
|---|---|---|---|
| 1 | [setup.md](setup.md) | Cài đặt và chạy dự án | Tất cả |
| 2 | [git-workflow.md](git-workflow.md) | Nhánh, commit, Pull Request | Tất cả |
| 3 | [business-rules.md](business-rules.md) | Luật nghiệp vụ bằng lời thường | Tất cả |
| 4 | [roles-and-permissions.md](roles-and-permissions.md) | 6 vai trò và ma trận quyền | Tất cả |
| 5 | [api-conventions.md](api-conventions.md) | Quy ước REST và danh sách endpoint | BE, FE |
| 6 | [error-codes.md](error-codes.md) | Bảng mã lỗi `ProblemDetails.code` | BE, FE |
| 7 | [ui-guidelines.md](ui-guidelines.md) | Quy ước giao diện | FE |
| 8 | [../database/documentation/DatabaseDesign.md](../database/documentation/DatabaseDesign.md) | Thiết kế CSDL: 39 bảng, sơ đồ, từ điển dữ liệu | BE, ai làm kho/đơn hàng |

## Nguyên tắc giữ tài liệu sống

- Đổi hợp đồng API hoặc mã lỗi: **sửa file trước**, báo nhóm, rồi mới code.
- Đổi cấu trúc DB: sửa script SQL và `DatabaseDesign.md` cùng lúc.
- Phát hiện tài liệu sai so với code: sửa luôn trong Pull Request đang làm.

## Các điểm nhóm còn cần chốt

- Lỗi nghiệp vụ dùng **409 hay 422** (hiện ghi 409).
- Danh sách `code` lỗi cuối cùng (các mã 🆕 trong `error-codes.md` là đề xuất).
- Phạm vi quyền của vai trò `CustomerSupport`.
