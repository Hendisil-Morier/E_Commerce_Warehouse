# Quy tắc Frontend (React 19 + TypeScript + Vite)

## Công cụ
- Dùng **pnpm** cho mọi thao tác cài đặt/chạy: `pnpm install`, `pnpm dev`, `pnpm lint`, `pnpm build`. Không tạo `package-lock.json` hay `yarn.lock`.
- TypeScript `strict`. **Không dùng `any`**; dùng `unknown` rồi thu hẹp kiểu. Kiểu dữ liệu dùng chung đặt trong `src/types/`.

## Cấu trúc (theo `frontend/src`)
- `features/<module>/` chứa phần riêng của từng module: `admin`, `auth`, `cart`, `catalog`, `customer`, `inventory`, `orders`, `reviews`, `seller`, `shipping`, `warehouse`.
- `services/` gọi API qua Axios, mỗi module một file. `lib/` giữ **một** Axios client và `QueryClient` dùng chung.
- `stores/` Zustand (ví dụ `useAuthStore`, `useCartStore`). `hooks/` hook dùng chung. `constants/` endpoint, đường dẫn route, nhãn trạng thái. `utils/` hàm tiện ích (`formatCurrency`, `formatDate`).
- `components/` gồm `common`, `layout`, `ui`. `pages/` ghép các feature thành trang; `routes/` cấu hình React Router v7 và Protected Route theo role.
- Module **Auth** đã làm xong: theo cách tổ chức đó khi thêm module mới.

## Quản lý state
- **Dữ liệu từ server → TanStack Query** (cache, loading, error, invalidate sau mutation). Không sao chép dữ liệu server vào Zustand.
- **Trạng thái phía client** (phiên đăng nhập, UI tạm) → Zustand.
- Sau mutation (đặt hàng, xác nhận phiếu...) phải `invalidateQueries` đúng key liên quan.

## Gọi API
- Dùng chung Axios client có interceptor gắn `Authorization: Bearer <accessToken>` và tự refresh token khi 401. Không tạo instance Axios riêng lẻ trong component.
- Endpoint viết trong `constants/`, bắt đầu bằng `/api/v1/...`; không hard-code URL trong component.
- Kiểu request/response khớp DTO của backend. Thời gian từ API là UTC, chuyển sang giờ địa phương khi hiển thị.
- Xử lý lỗi theo `ProblemDetails.code` (ví dụ `INSUFFICIENT_STOCK`, `CONCURRENCY_CONFLICT`), hiển thị thông điệp tiếng Việt dễ hiểu. Gặp 401 → về đăng nhập; 403 → trang không đủ quyền.

## Nguyên tắc nghiệp vụ trên giao diện
- **Giao diện chỉ hiển thị, máy chủ là nguồn quyết định.** Không tự tính tồn khả dụng, tổng tiền cuối cùng hay quyết định chuyển trạng thái ở FE; chỉ hiển thị kết quả server trả về.
- Tiền VND định dạng bằng `formatCurrency` (ví dụ `349.000₫`); không dùng số thực để cộng tiền.
- Nút hành động chuyển trạng thái (hủy đơn, xác nhận phiếu...) gọi đúng endpoint hành động con và khóa nút khi đang gửi để tránh gửi hai lần.
- Hiển thị tình trạng hàng từ API: `Hết hàng`, `Sắp hết hàng`, `Kho sàn` / `Kho người bán`.

## Chất lượng giao diện
- Luôn có ba trạng thái: **đang tải**, **rỗng**, **lỗi** (kèm nút thử lại).
- Dùng phần tử ngữ nghĩa: `<button>` cho hành động, `<a>`/`<Link>` cho điều hướng, `<label>` gắn với `<input>`. Nút chỉ có icon phải có `aria-label`. Vùng chạm tối thiểu 44px.
- Dự án **chỉ chạy trên web (máy tính), không làm mobile**. Thiết kế và kiểm tra ở 1280px và 1440px; không tràn ngang trang. Máy quét mã vạch USB hoạt động như bàn phím: ô quét ở trang kho phải tự focus và nhận Enter.
- Form: kiểm tra dữ liệu phía client chỉ để phản hồi nhanh, vẫn dựa vào lỗi 400 từ server.
- Tách component nhỏ, có kiểu props rõ ràng; không viết component quá ~200 dòng; không logic gọi API trực tiếp trong JSX.
- Tên component `PascalCase`, hook bắt đầu bằng `use`, file component trùng tên component.
- Không để `console.log`, mã chết, hay thư viện mới khi chưa thật cần (hỏi trước khi thêm dependency).
