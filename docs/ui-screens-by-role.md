# Đặc tả màn hình theo vai trò: Seller, Warehouse, Admin

Tài liệu cho FE (và agent) biết **phải làm những màn hình nào, chức năng gì, gọi API nào**. Khu vực **Customer (Storefront)** đã có nên không nằm ở đây.

Phạm vi dự án: **4 vai trò** `Customer`, `Seller`, `WarehouseManager` (WM), `Admin`. Chỉ web desktop (1280/1440px).

Đọc kèm: `api-conventions.md` (endpoint), `error-codes.md`, `roles-and-permissions.md`, `business-rules.md`, `ui-guidelines.md`.

Ký hiệu API: ✅ đã có trong `api-conventions.md` · ⚠️ **chưa có**, cần BE bổ sung (FE làm trước bằng mock).

## 0. Quyết định đơn giản hóa (để kịp hoàn thiện)

1. **Chỉ dùng kho sàn (`Platform`).** Không làm kho riêng của seller, vì không còn vai trò nhân viên kho cho seller. Seller chỉ **xem** tồn hàng của mình trong kho sàn.
2. **WM làm cả việc của nhân viên kho** (nhập, soạn, quét, đóng gói, xuất, kiểm hàng trả).
3. **Cần ít nhất 2 tài khoản WM** (seed `manager1`, `manager2`), vì người tạo phiếu không được tự duyệt phiếu (`SELF_APPROVAL_NOT_ALLOWED`).
4. **Làm sau (không bắt buộc cho bản hoàn thiện):** điều chuyển kho, kiểm kê, báo cáo/dashboard doanh thu, đánh giá, wishlist.

## 1. Quy tắc chung cho cả 3 khu vực

- **Layout:** thanh bên (menu theo role) + header (tên người dùng, đăng xuất) + vùng nội dung có tiêu đề trang. Route bọc `ProtectedRoute` theo role; sai role → trang không đủ quyền.
- **Bảng danh sách:** phân trang theo `{ items, page, pageSize, totalItems, totalPages }`, lọc theo trạng thái, tìm kiếm, bộ lọc lưu trên URL (`useSearchParams`).
- **Trang chi tiết:** thông tin, dòng thời gian trạng thái, các nút hành động hiện theo trạng thái hiện tại.
- **Mọi màn hình** có đủ 3 trạng thái: đang tải, rỗng, lỗi (nút Thử lại).
- **Nút chuyển trạng thái** gọi đúng endpoint hành động con, khóa nút khi đang gửi, hộp thoại xác nhận cho việc nguy hiểm, nhập lý do khi từ chối/hủy. Sau thành công `invalidateQueries`.
- **Lỗi** hiển thị theo `ProblemDetails.code` qua `getErrorMessage`. `409 INVALID_STATUS_TRANSITION` hoặc `CONCURRENCY_CONFLICT` thì tải lại dữ liệu.
- **FE không tự tính** tồn khả dụng, tổng tiền, hay quyết định chuyển trạng thái; chỉ hiển thị dữ liệu từ server.

---

## 2. Khu vực SELLER (`/seller`, role `Seller`)

Menu: Tổng quan · Shop · Sản phẩm · Đơn hàng · Tồn kho · Trả hàng · Hồ sơ.

### S0. Đăng ký làm seller (`/become-seller`, role Customer)
Điểm vào của khu vực này, nằm ở tài khoản Customer.
- Form: tên doanh nghiệp/cá nhân, mã số thuế, địa chỉ, mô tả. Gửi → trạng thái `Pending`.
- Trang trạng thái: Đang chờ duyệt / Đã duyệt (nút vào Kênh người bán) / Bị từ chối (hiện lý do, cho gửi lại) / Bị khóa.
- Header của Customer hiện nút "Kênh người bán" khi đã là Seller.
- API: `POST /sellers` ✅, `GET /sellers/me` ✅.

### S1. Tổng quan (`/seller`)
- Thẻ số liệu: đơn chờ xác nhận, đơn đang chuẩn bị, sản phẩm chờ duyệt, sản phẩm bị từ chối, biến thể sắp hết hàng.
- Danh sách "việc cần làm" bấm để chuyển tới màn hình tương ứng.
- API: lấy `totalItems` từ các danh sách có lọc trạng thái (`pageSize=1`), chưa cần API riêng.

### S2. Quản lý shop (`/seller/shops`)
- Danh sách shop của tôi; tạo shop (tên, mô tả, logo, địa chỉ); sửa shop.
- Chỉ tạo/sửa được khi seller đã `Approved` (`SELLER_NOT_APPROVED`).
- API: `GET /seller/shops` ✅, `POST /seller/shops` ✅, `PUT /seller/shops/{id}` ✅.

### S3. Danh sách sản phẩm (`/seller/products`)
- Bảng: ảnh nhỏ, tên, shop, danh mục, số biến thể, khoảng giá, trạng thái (`Draft`, `PendingReview`, đã duyệt, bị từ chối; giá trị chính xác xem `DatabaseDesign.md`).
- Lọc theo trạng thái, shop; tìm theo tên/SKU. Nút "Thêm sản phẩm".
- Sản phẩm bị từ chối hiện **lý do từ chối** của Admin.
- API: `GET /seller/products` ✅.

### S4. Tạo/sửa sản phẩm (`/seller/products/new`, `/seller/products/:id/edit`)
- **Thông tin chung:** shop, tên, danh mục (cây từ `GET /categories`), mô tả.
- **Ảnh:** nhiều ảnh, chọn ảnh đại diện, sắp xếp thứ tự. API tải ảnh ⚠️ (tạm nhập URL ảnh hoặc mock).
- **Biến thể:** bảng thêm/sửa/xóa dòng: SKU (không trùng, `DUPLICATE_SKU`), thuộc tính (màu, size...), giá. Tồn **không** nhập ở đây (tồn do kho nhập).
- **Nút:** Lưu nháp; Gửi duyệt (`POST .../submit`, chỉ khi hợp lệ: có ít nhất 1 biến thể, có ảnh).
- Khi đang `PendingReview` thì khóa sửa; khi bị từ chối thì sửa rồi gửi lại.
- API: `POST /seller/products` ✅, `PUT /seller/products/{id}` ✅, `POST /seller/products/{id}/submit` ✅, `POST /seller/products/{id}/variants` ✅, `PUT /seller/variants/{id}` ✅.

### S5. Danh sách đơn hàng của shop (`/seller/orders`)
- Bảng đơn con: mã, ngày đặt, khách (tên), số dòng hàng, tổng tiền, trạng thái, hãng vận chuyển.
- Lọc nhanh theo tab trạng thái: Chờ xác nhận · Đã xác nhận · Đang chuẩn bị · Sẵn sàng giao · Đã giao · Hủy/Trả.
- API: `GET /seller/orders?status=` ✅.

### S6. Chi tiết đơn con (`/seller/orders/:id`)
- Thông tin: mã đơn, khách, địa chỉ giao (bản chụp lúc đặt), phương thức thanh toán, trạng thái thanh toán.
- Dòng hàng: tên/SKU/đơn giá **bản chụp**, số lượng, thành tiền.
- Dòng thời gian trạng thái (ai, lúc nào, lý do).
- Hành động: **Xác nhận** (khi `Pending`), **Hủy** (nhập lý do; không hủy được sau `Shipped`). Các bước soạn, đóng gói, xuất kho do kho làm; seller chỉ **theo dõi** trạng thái chuyển từ kho.
- Hiển thị vận đơn (hãng, mã vận đơn, trạng thái) khi có.
- API: `POST /seller/orders/{id}/confirm` ✅, `POST /seller/orders/{id}/cancel` ✅. Chi tiết một đơn con ⚠️ (xác nhận BE có `GET /seller/orders/{id}`).

### S7. Tồn kho của tôi (`/seller/inventory`) (chỉ xem)
- Bảng theo biến thể: SKU, tên, tồn thực, đang giữ chỗ, **khả dụng**, vị trí kệ.
- Lọc theo shop/sản phẩm; làm nổi bật biến thể sắp hết.
- API: `GET /inventory?variantId=` ✅ (backend chỉ trả hàng của seller đang đăng nhập).
- Làm sau: seller tạo "yêu cầu gửi hàng vào kho" ⚠️.

### S8. Trả hàng (`/seller/returns`)
- Bảng yêu cầu trả hàng thuộc đơn của shop: mã, đơn gốc, lý do, trạng thái.
- Chi tiết: lý do, ảnh (nếu có), dòng hàng trả. Hành động **Duyệt** / **Từ chối** (nhập lý do) khi `Requested`.
- API: `POST /returns/{id}/approve` ✅, `POST /returns/{id}/reject` ✅; danh sách `GET /returns` ⚠️.

### S9. Hồ sơ seller (`/seller/profile`)
- Xem/sửa thông tin doanh nghiệp, trạng thái tài khoản seller. API: `GET /sellers/me` ✅ (sửa hồ sơ ⚠️).

---

## 3. Khu vực WAREHOUSE (`/warehouse`, role `WarehouseManager`)

Menu: Tổng quan · Kho & vị trí · Tồn kho · Thẻ kho · Phiếu nhập · Phiếu xuất · Vận đơn · Hàng trả về. (Điều chuyển, Kiểm kê: làm sau.)

Giao diện kho thiên về **thao tác nhanh**: bảng chữ rõ, nút lớn, ô quét mã tự focus.

### W1. Tổng quan (`/warehouse`)
- Thẻ: phiếu xuất cần duyệt, cần soạn, đang đóng gói, chờ xuất; phiếu nhập Draft chờ xác nhận; biến thể sắp hết hàng; hàng trả chờ kiểm.
- Danh sách "việc cần làm" bấm để vào màn hình tương ứng.

### W2. Kho và vị trí (`/warehouse/warehouses`, `/warehouse/warehouses/:id/locations`)
- Danh sách kho (kho sàn Hà Nội); danh sách vị trí kệ trong kho: mã, loại khu, có bán được không, đang hoạt động không.
- Tạo kho, tạo vị trí. Khu `INBOUND`, `RETURNS`, `DAMAGED` hiển thị nhãn **Không bán được** và khóa chỉnh cờ này.
- API: `GET /warehouses` ✅, `POST /warehouses` ✅, `GET/POST /warehouses/{id}/locations` ✅. Sửa/ngừng dùng vị trí ⚠️.

### W3. Tồn kho (`/warehouse/inventory`)
- Bảng theo (vị trí × biến thể): SKU, tên, seller/shop, vị trí, **OnHand**, **Reserved**, **Available** (từ server).
- Lọc theo kho, vị trí, SKU, seller; tô nổi bật hàng sắp hết. Bấm một dòng → xem thẻ kho của biến thể đó.
- API: `GET /inventory?warehouseId&variantId` ✅.

### W4. Thẻ kho (`/warehouse/stock-movements`) (chỉ xem)
- Sổ cái: thời gian, loại biến động, thay đổi tồn thực, thay đổi giữ chỗ, tồn sau, chứng từ gốc (link tới phiếu), người thực hiện.
- Lọc theo biến thể, khoảng ngày, loại biến động. Không có nút sửa/xóa (sổ cái chỉ thêm).
- API: `GET /stock-movements?variantId&from&to` ✅.

### W5. Phiếu nhập (`/warehouse/receipts`, `/warehouse/receipts/new`, `/warehouse/receipts/:id`)
- Danh sách phiếu: mã, kho, trạng thái (`Draft`, `Confirmed`, `Cancelled`), người tạo, ngày.
- **Tạo phiếu:** chọn kho, nguồn (seller), thêm dòng: tìm biến thể theo SKU/**quét mã**, số lượng, vị trí kệ nhận. Lưu `Draft`.
- **Chi tiết:** Xác nhận (tồn tăng, ghi sổ cái) hoặc Hủy. **Nút Xác nhận bị khóa khi người tạo là chính mình** và hiển thị lý do; nếu vẫn gọi, xử lý `SELF_APPROVAL_NOT_ALLOWED`.
- Phiếu `Confirmed` không hủy được (chỉ làm phiếu đảo).
- API: `POST /receipts` ✅, `POST /receipts/{id}/confirm` ✅, `POST /receipts/{id}/cancel` ✅; danh sách và chi tiết `GET /receipts` ⚠️.

### W6. Phiếu xuất (`/warehouse/issues`, `/warehouse/issues/:id`)
- Danh sách: mã, đơn con gốc, loại (đơn hàng, điều chỉnh, trả seller, tiêu hủy), trạng thái (`Draft`, `Approved`, `Picking`, `Packed`, `Dispatched`, `Cancelled`).
- Chi tiết: dòng hàng (SKU, vị trí lấy, cần lấy, đã lấy). Nút hiện theo trạng thái:
  - `Draft` → **Duyệt** (`approve`; loại đặc biệt cần người khác tạo)
  - `Approved` → **Bắt đầu soạn** (`start-picking`)
  - `Picking` → **Đóng gói** (`pack`, chỉ khi đã lấy đủ)
  - `Packed` → **Xuất kho** (`dispatch`; lúc này mới trừ tồn)
- API: `GET /issues?status=` ✅, `POST /issues/{id}/approve|start-picking|pack|dispatch` ✅. Chi tiết một phiếu `GET /issues/{id}` ⚠️.

### W7. Soạn hàng, quét mã (`/warehouse/issues/:id/pick`)
Màn hình tối giản cho thao tác tại kệ:
- Ô nhập mã vạch **tự focus**, nhận Enter (máy quét USB hoạt động như bàn phím); luôn lấy lại focus sau mỗi lần quét.
- Danh sách dòng cần lấy: vị trí, SKU, tên, **cần / đã lấy**; dòng đủ thì đổi màu và có dấu đánh dấu; thanh tiến độ tổng.
- Quét mã → gửi `scan`; mã sai hoặc dư hiện cảnh báo rõ ràng và có âm báo (nếu làm được).
- Khi tất cả dòng đủ → nút **Hoàn tất soạn / Đóng gói**.
- API: `POST /issues/{id}/lines/{lineId}/scan` ✅ (cách tìm `lineId` từ mã vạch: hỏi BE, có thể gửi mã và BE tự khớp).

### W8. Vận đơn (`/warehouse/shipments`)
- Danh sách đơn con đã đóng gói chờ giao và vận đơn đã tạo.
- **Tạo vận đơn:** chọn hãng (GHN, GHTK, VTP, JT, SPX từ `GET /carriers`), nhập mã vận đơn.
- **Cập nhật trạng thái:** Đã lấy hàng · Đang giao · Đã giao · Giao thất bại.
- API: `GET /carriers` ✅, `POST /seller-orders/{id}/shipments` ✅, `PATCH /shipments/{id}/status` ✅; danh sách `GET /shipments` ⚠️.

### W9. Hàng trả về (`/warehouse/returns`)
- Danh sách yêu cầu đã `Approved` chờ nhận / chờ kiểm.
- Thao tác: **Đã nhận hàng** (`receive`) → **Kiểm tra từng dòng**: chọn tình trạng `Tốt` / `Lỗi nhẹ` / `Hỏng`, rồi chọn vị trí đích (kệ bán cho `Tốt`, khu `DAMAGED` cho `Hỏng`).
- Hàng trả **không tự cộng vào tồn bán được** cho tới khi kiểm xong.
- API: `POST /returns/{id}/receive` ✅, `POST /returns/{id}/items/{itemId}/inspect` ✅; danh sách `GET /returns` ⚠️.

### Làm sau (nếu còn thời gian)
- **Điều chuyển kho** (`/warehouse/transfers`): tạo → duyệt → gửi → nhận. Chỉ có ý nghĩa khi có từ 2 kho. API ✅ (`/transfers`...).
- **Kiểm kê** (`/warehouse/stock-counts`): tạo đợt, nhập số đếm, gửi, duyệt (người khác) → bút toán điều chỉnh. API ✅ (`/stock-counts`...).

---

## 4. Khu vực ADMIN (`/admin`, role `Admin`)

Menu: Tổng quan · Seller · Sản phẩm · Đơn hàng · Trả hàng · Hoàn tiền · Người dùng · Danh mục.

### A1. Tổng quan (`/admin`)
- Thẻ: seller chờ duyệt, sản phẩm chờ duyệt, yêu cầu hoàn tiền chờ xử lý, yêu cầu trả hàng đang mở, đơn trong ngày.
- Danh sách "việc cần làm" bấm để vào màn hình tương ứng (số liệu lấy từ `totalItems` của các danh sách có lọc).

### A2. Duyệt seller (`/admin/sellers`)
- Bảng mặc định lọc `Pending`: tên, mã số thuế, ngày đăng ký, trạng thái; lọc thêm Đã duyệt / Từ chối / Bị khóa.
- Chi tiết (ngăn bên): đầy đủ thông tin đăng ký. Hành động: **Duyệt**, **Từ chối** (bắt buộc lý do), **Khóa** (với seller đang hoạt động).
- API: `GET /admin/sellers?status=` ✅, `POST /admin/sellers/{id}/approve|reject|suspend` ✅.

### A3. Duyệt sản phẩm (`/admin/products`)
- Hàng đợi mặc định lọc `PendingReview`: ảnh, tên, shop, danh mục, ngày gửi.
- Chi tiết: xem như khách sẽ thấy (ảnh, mô tả, biến thể, giá, SKU). **Duyệt** (sản phẩm hiện công khai) hoặc **Từ chối** (bắt buộc lý do, seller sẽ thấy).
- API: `GET /admin/products?status=PendingReview` ✅, `POST /admin/products/{id}/approve|reject` ✅.

### A4. Đơn hàng (`/admin/orders`) (chỉ xem)
- Bảng toàn bộ đơn tổng: mã, khách, ngày, tổng tiền, trạng thái, thanh toán; lọc theo trạng thái, khoảng ngày, tìm theo mã/khách.
- Chi tiết: đơn tổng → các đơn con (mỗi seller) → dòng hàng; thanh toán; vận đơn; lịch sử trạng thái. Dùng để theo dõi và giải quyết khiếu nại.
- API: `GET /admin/orders` ✅; chi tiết `GET /admin/orders/{id}` ⚠️.

### A5. Trả hàng (`/admin/returns`)
- Xem mọi yêu cầu trả hàng, kể cả đơn của seller đã bị khóa hoặc có tranh chấp. **Duyệt/Từ chối** thay seller khi cần.
- API: `POST /returns/{id}/approve|reject` ✅; danh sách `GET /returns` ⚠️.

### A6. Hoàn tiền (`/admin/refunds`)
- Hàng đợi mặc định lọc `Pending`: mã, đơn gốc, số tiền, lý do, ngày yêu cầu.
- Chi tiết hiển thị: số đã thanh toán, số đã hoàn, số còn được hoàn (không vượt, `REFUND_EXCEEDS_PAID`).
- Hành động: **Duyệt**, **Từ chối** (lý do), **Hoàn thành** (đã chuyển tiền).
- API: `GET /admin/refunds?status=Pending` ✅, `POST /admin/refunds/{id}/approve|reject|complete` ✅.

### A7. Người dùng (`/admin/users`)
- Bảng: tên, email, vai trò, trạng thái; tìm kiếm, lọc theo vai trò.
- Hành động: **Khóa / Mở khóa**; xem vai trò. (Tạo tài khoản kho: có thể dùng seed nếu chưa kịp.)
- API: ⚠️ chưa có (`GET /admin/users`, `POST /admin/users/{id}/lock|unlock`, gán vai trò). Làm sau cùng trong 3 khu vực nếu kịp.

### A8. Danh mục (`/admin/categories`)
- Cây danh mục; thêm/sửa/ẩn danh mục. Dữ liệu seed đã có 6 danh mục gốc nên **có thể làm sau**.
- API: `GET /categories` ✅; thêm/sửa/ẩn ⚠️.

### Làm sau
Báo cáo và dashboard doanh thu, quản lý hãng vận chuyển, cấu hình hệ thống.

---

## 5. Thứ tự làm đề xuất

Thứ tự theo luồng dữ liệu, để mỗi bước mở khóa bước sau:

| Bước | Việc | Vì sao |
|---|---|---|
| 1 | Layout 3 khu vực, menu theo role, `ProtectedRoute`, component dùng chung (Table, StatusBadge, Modal, ConfirmDialog, Toast, form) | Nền cho mọi màn hình sau |
| 2 | **Seller:** S0 đăng ký, **Admin:** A2 duyệt seller | Có seller hoạt động |
| 3 | **Seller:** S2 shop, S3-S4 sản phẩm và biến thể; **Admin:** A3 duyệt sản phẩm | Có sản phẩm hiện lên Storefront |
| 4 | **Warehouse:** W2 kho/vị trí, W5 phiếu nhập, W3 tồn kho, W4 thẻ kho | Có tồn để khách đặt hàng |
| 5 | **Seller:** S5-S6 đơn hàng; **Warehouse:** W6-W7 phiếu xuất và soạn hàng, W8 vận đơn | Hoàn tất luồng đặt hàng đến giao hàng |
| 6 | **Seller:** S8; **Warehouse:** W9; **Admin:** A5-A6 trả hàng và hoàn tiền | Hoàn tất luồng trả hàng |
| 7 | S1/W1/A1 tổng quan, A4 xem đơn, S7 tồn của seller, S9 hồ sơ | Hoàn thiện |
| 8 | A7 người dùng, A8 danh mục, điều chuyển, kiểm kê | Làm nếu còn thời gian |

Luồng demo trọn vẹn: Customer đặt hàng → Seller xác nhận → WM soạn, đóng gói, xuất kho → vận đơn giao thành công → Customer yêu cầu trả → Seller duyệt → WM kiểm hàng → Admin hoàn tiền.

## 6. API cần BE bổ sung (⚠️ gom lại)

| API | Cho màn hình |
|---|---|
| `GET /seller/orders/{id}` | S6 |
| `GET /returns` (lọc theo trạng thái, theo seller) | S8, W9, A5 |
| `GET /receipts`, `GET /receipts/{id}` | W5 |
| `GET /issues/{id}` | W6, W7 |
| `GET /shipments` | W8 |
| `GET /admin/orders/{id}` | A4 |
| Tải ảnh sản phẩm (upload) | S4 |
| Sửa/ngừng dùng vị trí kệ; sửa hồ sơ seller | W2, S9 |
| `GET /admin/users`, khóa/mở khóa, gán vai trò | A7 |
| Thêm/sửa/ẩn danh mục | A8 |
| Đổi quyền gọi `POST /returns/{id}/receive` từ "S, A" thành **WM** (và `/shipments/{id}/status`, `/seller-orders/{id}/shipments` từ "WS" thành WM) trong `api-conventions.md`, vì không còn vai trò `WarehouseStaff` | W8, W9 |

Trong lúc chờ, FE làm màn hình bằng dữ liệu giả (MSW) đúng JSON đã thống nhất. Khi BE thêm endpoint, cập nhật bảng này và `api-conventions.md` **trước khi** code.

## 7. Cách giao việc cho agent

Giao **từng bước ở mục 5, mỗi lần một nhóm màn hình**, không giao cả khu vực một lần. Mẫu:

```
Làm màn hình S3 và S4 (danh sách và tạo/sửa sản phẩm của seller) theo docs/ui-screens-by-role.md mục 2.
Đọc trước: docs/api-conventions.md (Catalog), docs/error-codes.md, docs/ui-guidelines.md, module auth làm mẫu.
Backend chưa có API upload ảnh: dùng ô nhập URL ảnh tạm. Dữ liệu chưa có thì mock bằng MSW trong file riêng.
Không làm các màn hình khác, không thêm thư viện mới khi chưa hỏi.
Xong thì chạy pnpm lint và pnpm build, tóm tắt file đã thêm và phần còn mock.
```
