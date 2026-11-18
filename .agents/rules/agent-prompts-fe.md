# Chuỗi prompt giao việc cho agent (Frontend)

Dùng sau **Bước 1** (khung layout, menu, phân quyền route; prompt đã gửi riêng). Làm **lần lượt, xong bước nào kiểm tra bước đó rồi mới sang bước sau**. Mỗi bước dùng một nhánh riêng và một Pull Request.

Cách dùng: mỗi lần gửi agent = **PHẦN MỞ ĐẦU CHUNG** (mục A) + **prompt của bước đó** (mục B). Bạn dán hai khối liền nhau vào một tin nhắn.

**Backend và frontend làm song song theo từng lát cắt dọc, không dùng dữ liệu giả (không MSW).** Mỗi bước FE (N) chạy **sau** bước BE cùng số trong `docs/agent-prompts-be.md`: BE làm endpoint và thử trên Swagger, rồi FE gọi API thật. Các bước có hậu tố `b` (4b, 6b, 8b) là màn hình phía **Customer** đi kèm bước BE cùng số.

Tài khoản test (seed): Customer, Seller, Admin, WarehouseManager. Với các việc cần hai người kho (phiếu nhập), cần thêm tài khoản `manager2` (làm ở bước BE 1). Xem `docs/ui-screens-by-role.md` mục 0.

---

## A. Phần mở đầu chung (dán vào đầu MỌI prompt)

```
Bạn làm việc trong repo E_Commerce_Warehouse, phần frontend (React 19 + TypeScript + Vite). Các luật trong .agents/rules/ đã được nạp, hãy tuân theo.

QUY TRÌNH BẮT BUỘC:
1. Đọc các tài liệu được chỉ định bên dưới, và đọc code mẫu (module auth và các màn hình đã làm ở bước trước) để làm theo ĐÚNG cách tổ chức đang dùng: features/<module>/, services/, hooks, types/, constants/, routes/.
2. Trước khi viết code: tóm tắt bạn hiểu yêu cầu thế nào, liệt kê file sẽ thêm/sửa, và nêu chỗ nào chưa rõ. Rồi DỪNG chờ tôi xác nhận.
3. Sau khi tôi xác nhận mới viết code.

NGUYÊN TẮC:
- Dữ liệu từ server dùng TanStack Query; trạng thái phía client dùng Zustand; không sao chép dữ liệu server vào Zustand.
- Gọi API qua Axios client dùng chung và các file trong services/; endpoint khai báo trong constants/; không hard-code URL trong component; không dùng any.
- Kiểu request/response khớp docs/api-conventions.md. Tiền dùng formatCurrency, thời gian là UTC và chuyển sang giờ địa phương khi hiển thị.
- FE chỉ hiển thị, server quyết định: không tự tính tồn khả dụng, tổng tiền, hay quyết định chuyển trạng thái.
- Mọi màn hình có đủ 3 trạng thái: đang tải, rỗng, lỗi (có nút Thử lại). Nút hành động gọi đúng endpoint con và khóa khi đang gửi. Lỗi hiển thị theo ProblemDetails.code qua getErrorMessage.
- Backend và frontend được làm CÙNG LÚC theo từng bước: các endpoint màn hình cần đã được làm ở bước BE tương ứng (docs/agent-prompts-be.md) và chạy được trên Swagger. Màn hình gọi API THẬT; không tạo dữ liệu giả, không thêm thư viện mock. Nếu một endpoint cần mà chưa chạy hoặc trả JSON khác docs/api-conventions.md, DỪNG và báo tôi (không tự bịa dữ liệu).
- Chỉ web desktop 1280/1440px. Không thêm thư viện mới khi chưa hỏi tôi. Không sửa backend, database, docs. Không tự commit hay push.

KHI XONG:
- Chạy pnpm lint và pnpm build, phải sạch. Không để console.log hay mã chết.
- Báo cáo: file đã thêm/sửa, endpoint nào đã gọi thật và thử được, phần nào bạn chưa chắc.
- Hướng dẫn tôi các bước thử bằng tay (tài khoản nào, bấm gì, kỳ vọng gì).
```

---

## B. Các prompt theo bước

### Bước 2: Component dùng chung

```
BƯỚC 2: Bộ component dùng chung cho 3 khu vực quản lý.

ĐỌC: docs/ui-guidelines.md (toàn bộ), docs/ui-screens-by-role.md mục 1, docs/api-conventions.md mục "Phân trang, lọc, sắp xếp", docs/error-codes.md mục 5. Xem components/ hiện có để không làm trùng.

LÀM (đặt trong components/ui hoặc components/common; mỗi component dưới ~200 dòng, props có kiểu rõ ràng):
1. Button (biến thể primary/secondary/danger/ghost, trạng thái loading khóa nút), Input, Select, Textarea, FormField (label gắn input, hiện lỗi dưới ô), SearchInput (debounce).
2. Table có kiểu generic: cấu hình cột, hàng bấm được, trạng thái đang tải (skeleton), rỗng, lỗi; kèm Pagination nhận dữ liệu dạng { items, page, pageSize, totalItems, totalPages }.
3. StatusBadge: nhận mã trạng thái, tra nhãn tiếng Việt và màu từ constants/statusLabels.ts (đủ các trạng thái Orders, SellerOrders, InventoryIssues, InventoryReceipts, ReturnRequests, sản phẩm, seller ở docs/business-rules.md mục 4 và docs/ui-screens-by-role.md). Luôn có chữ, không chỉ màu.
4. Modal, ConfirmDialog (tùy chọn ô nhập lý do bắt buộc), Toast (provider + hook useToast).
5. Skeleton, EmptyState (tiêu đề + gợi ý + nút), ErrorState (thông báo + nút Thử lại), PageHeader (tiêu đề + vùng nút hành động).
6. StatusTimeline: hiển thị lịch sử trạng thái (trạng thái, ai, lúc nào, lý do).
7. ScanInput: ô nhập mã vạch tự focus, nhận Enter gọi onScan(code), lấy lại focus sau mỗi lần quét (máy quét USB hoạt động như bàn phím).
8. Hook useUrlFilters: đồng bộ bộ lọc, trang, sắp xếp với URL (useSearchParams).

KHÔNG LÀM: không làm màn hình nghiệp vụ, không gọi API thật, không tạo trang demo riêng cho component, không thêm thư viện UI bên ngoài (hỏi tôi nếu muốn dùng).

TÔI SẼ THỬ: bước này chưa có màn hình để xem; chạy pnpm lint và pnpm build sạch, đọc lại code các component, rồi dùng thử thật ở bước 3 (Table, Modal, ConfirmDialog, Toast, FormField, StatusBadge).
```

### Bước 3: Đăng ký seller (S0) và duyệt seller (A2)

```
BƯỚC 3: Đăng ký làm seller (Customer) và Admin duyệt seller.

ĐỌC: docs/ui-screens-by-role.md mục 1, mục 2 phần S0, mục 4 phần A2; docs/api-conventions.md mục "Seller và Shop"; docs/error-codes.md; docs/ui-guidelines.md; components dùng chung ở bước 2.

LÀM:
1. S0 /become-seller (role Customer): form 3 trường khớp BE: businessName (tên doanh nghiệp), taxCode (mã số thuế), description (mô tả); gửi POST /sellers (địa chỉ là của shop, nhập ở bước 4). Sau khi gửi hoặc nếu đã có hồ sơ: trang trạng thái theo GET /sellers/me: Đang chờ duyệt / Đã duyệt (nút vào Kênh người bán) / Bị từ chối (hiện lý do, cho gửi lại) / Bị khóa.
2. Header Storefront: nút "Kênh người bán" khi người dùng có role Seller (nếu bước 1 chưa làm), và liên kết "Trở thành người bán" tới /become-seller cho Customer chưa là seller.
3. A2 /admin/sellers (role Admin): bảng lọc theo trạng thái (mặc định Pending), tìm kiếm; bấm một dòng mở ngăn chi tiết với đầy đủ thông tin; nút Duyệt, Từ chối (ô lý do bắt buộc), Khóa (chỉ với seller đang hoạt động). Gọi GET /admin/sellers?status= và POST /admin/sellers/{id}/approve|reject|suspend. Sau mỗi hành động tải lại danh sách và hiện Toast.
4. Tạo services/seller.service.ts, types/seller.ts, hooks (useMySeller, useAdminSellers...).

LƯU Ý QUAN TRỌNG: sau khi Admin duyệt, role Seller có thể chưa nằm trong access token hiện tại của người dùng cho tới khi refresh hoặc đăng nhập lại. Hãy nêu giải pháp bạn đề xuất (ví dụ gọi refresh token sau khi thấy trạng thái Approved, hoặc yêu cầu đăng nhập lại kèm thông báo) và hỏi tôi trước khi chọn.

KHÔNG LÀM: không làm shop/sản phẩm (bước 4), không sửa logic auth ngoài việc trên.

TÔI SẼ THỬ: đăng ký Customer mới → vào /become-seller gửi hồ sơ → thấy "Đang chờ duyệt" → đăng nhập Admin duyệt (và thử một hồ sơ khác để Từ chối có lý do) → quay lại Customer, thấy trạng thái cập nhật và vào được /seller.
```

### Bước 4: Shop, sản phẩm (Seller) và duyệt sản phẩm (Admin)

```
BƯỚC 4: Seller quản lý shop và sản phẩm; Admin duyệt sản phẩm.

ĐỌC: docs/ui-screens-by-role.md mục 1, mục 2 phần S2, S3, S4, mục 4 phần A3; docs/api-conventions.md mục "Catalog" và "Seller và Shop"; docs/business-rules.md mục 8; docs/DatabaseDesign.md hoặc database/documentation/DatabaseDesign.md phần Catalog (để biết đúng các giá trị trạng thái sản phẩm); docs/error-codes.md; code các màn hình bước 3 làm mẫu.

LÀM:
1. S2 /seller/shops: danh sách shop, tạo và sửa shop (tên, mô tả, logo, địa chỉ). Chỉ cho tạo khi seller Approved (xử lý SELLER_NOT_APPROVED).
2. S3 /seller/products: bảng sản phẩm (ảnh nhỏ, tên, shop, danh mục, số biến thể, khoảng giá, trạng thái), lọc theo trạng thái và shop, tìm theo tên/SKU, nút Thêm. Sản phẩm bị từ chối hiện lý do từ chối.
3. S4 /seller/products/new và /seller/products/:id/edit: thông tin chung (shop, tên, danh mục chọn từ cây GET /categories, mô tả); ảnh (tạm nhập URL ảnh vì BE chưa có API upload; cho chọn ảnh đại diện và sắp xếp); bảng biến thể thêm/sửa/xóa dòng (SKU, thuộc tính, giá; xử lý DUPLICATE_SKU); nút Lưu nháp và Gửi duyệt (chỉ khi có ít nhất 1 biến thể và 1 ảnh). Khóa sửa khi đang PendingReview.
4. A3 /admin/products: hàng đợi PendingReview (ảnh, tên, shop, danh mục, ngày gửi); trang/ngăn chi tiết xem như khách thấy (ảnh, mô tả, biến thể, giá, SKU); nút Duyệt, Từ chối (lý do bắt buộc).
5. services, types, hooks cho catalog.

KHÔNG LÀM: không làm trang sản phẩm phía Storefront (đã có hoặc làm riêng), không nhập tồn ở đây (tồn do kho nhập, xem bước 5), không làm tải ảnh thật.

TÔI SẼ THỬ: Seller tạo shop → tạo sản phẩm có 2 biến thể → Lưu nháp → Gửi duyệt → Admin Từ chối (có lý do) → Seller thấy lý do, sửa, gửi lại → Admin Duyệt → sản phẩm hiện trên Storefront (nếu API đã có).
```

### Bước 4b: Customer: danh sách sản phẩm, chi tiết sản phẩm, trang shop

```
BƯỚC 4b: Storefront phía Customer: danh sách sản phẩm, chi tiết sản phẩm, trang shop. (Chạy sau bước BE 4.)

ĐỌC: docs/api-conventions.md mục "Catalog" và "Phân trang, lọc, sắp xếp"; docs/ui-guidelines.md; docs/error-codes.md; trang chủ hiện có (tách ProductCard từ đó); components dùng chung ở bước 2.

LÀM:
1. Tách ProductCard dùng chung cho trang chủ và trang danh sách.
2. /products: bộ lọc danh mục (cây từ GET /categories), khoảng giá, sắp xếp (mới nhất, giá tăng, giá giảm), tìm kiếm ?q=; bộ lọc và số trang lưu trên URL bằng useUrlFilters; phân trang; 3 trạng thái. Ô tìm kiếm ở header chuyển tới /products?q=...; menu danh mục ở header lấy từ API, không viết cứng.
3. /products/:id: thư viện ảnh, tên, shop (link /shops/:id), mô tả, chọn biến thể (đổi giá, SKU, tình trạng hàng theo biến thể; tình trạng lấy từ API: Còn hàng, Sắp hết hàng, Hết hàng thì khóa nút mua). Nút "Thêm vào giỏ": chưa đăng nhập thì chuyển /login rồi quay lại đúng trang; việc thêm vào giỏ thật làm ở bước 6b, ở bước này hiện Toast "Tính năng giỏ hàng sắp có".
4. /shops/:id: thông tin shop và danh sách sản phẩm của shop (dùng lại component danh sách).
5. Trang chủ: đổi dữ liệu sản phẩm, danh mục, shop nổi bật từ nội dung cố định sang API thật.

KHÔNG LÀM: không làm giỏ hàng và đặt hàng (bước 6b).

TÔI SẼ THỬ: sản phẩm đã được Admin duyệt ở bước 4 hiện ở trang chủ và /products; lọc, tìm, phân trang đổi URL và dùng được nút Back; vào chi tiết, đổi biến thể thấy giá và tình trạng đổi; biến thể hết hàng khóa nút mua.
```

### Bước 5: Kho (W2, W5, W3, W4)

```
BƯỚC 5: Kho và vị trí, phiếu nhập, tồn kho, thẻ kho (role WarehouseManager).

ĐỌC: docs/ui-screens-by-role.md mục 0, 1, mục 3 phần W2, W3, W4, W5; docs/business-rules.md mục 3 và 5; docs/api-conventions.md mục "Kho (Warehouse)"; docs/error-codes.md (đặc biệt SELF_APPROVAL_NOT_ALLOWED); ScanInput ở bước 2.

LÀM:
1. W2 /warehouse/warehouses và /warehouse/warehouses/:id/locations: danh sách kho; danh sách vị trí kệ (mã, loại khu, bán được hay không, đang hoạt động); tạo kho, tạo vị trí. Khu INBOUND, RETURNS, DAMAGED hiển thị nhãn "Không bán được" và khóa chỉnh cờ này.
2. W5 /warehouse/receipts, /new, /:id: danh sách phiếu nhập (mã, kho, trạng thái Draft/Confirmed/Cancelled, người tạo, ngày); form tạo phiếu (chọn kho, nguồn seller, thêm dòng: tìm biến thể theo SKU hoặc quét bằng ScanInput, số lượng, vị trí kệ nhận); lưu Draft. Chi tiết: nút Xác nhận và Hủy. KHÓA nút Xác nhận khi người tạo là người đang đăng nhập và hiện lý do (cần người khác xác nhận); nếu vẫn gặp SELF_APPROVAL_NOT_ALLOWED thì hiển thị thông báo rõ. Phiếu Confirmed không có nút hủy.
3. W3 /warehouse/inventory: bảng theo (vị trí × biến thể): SKU, tên, seller/shop, vị trí, OnHand, Reserved, Available (lấy từ server, không tự tính); lọc theo kho, vị trí, SKU, seller; làm nổi bật hàng sắp hết; bấm dòng → sang thẻ kho của biến thể.
4. W4 /warehouse/stock-movements: sổ cái chỉ xem (thời gian, loại biến động, thay đổi tồn thực, thay đổi giữ chỗ, tồn sau, chứng từ gốc có link, người thực hiện); lọc theo biến thể, khoảng ngày, loại. Không có nút sửa/xóa.
5. services, types, hooks.

KHÔNG LÀM: không làm phiếu xuất, vận đơn (bước 7); không làm điều chuyển và kiểm kê.

TÔI SẼ THỬ (cần 2 tài khoản kho trên 2 trình duyệt): manager1 tạo phiếu nhập → thử bấm Xác nhận thấy nút bị khóa → manager2 xác nhận → mở Tồn kho thấy số tăng → mở Thẻ kho thấy dòng biến động mới.
```

### Bước 6: Đơn hàng của seller (S5, S6)

```
BƯỚC 6: Seller xem và xử lý đơn con của shop.

ĐỌC: docs/ui-screens-by-role.md mục 1, mục 2 phần S5, S6; docs/business-rules.md mục 1, 2, 4; docs/api-conventions.md mục "Giỏ hàng và đơn hàng"; docs/error-codes.md (INVALID_STATUS_TRANSITION); StatusTimeline, StatusBadge ở bước 2.

LÀM:
1. S5 /seller/orders: bảng đơn con (mã, ngày đặt, tên khách, số dòng hàng, tổng tiền, trạng thái, hãng vận chuyển); các tab trạng thái: Chờ xác nhận, Đã xác nhận, Đang chuẩn bị, Sẵn sàng giao, Đã giao, Hủy/Trả; tìm theo mã; phân trang; bộ lọc lưu trên URL.
2. S6 /seller/orders/:id: thông tin đơn, địa chỉ giao (bản chụp lúc đặt), phương thức và trạng thái thanh toán; dòng hàng (tên, SKU, đơn giá, số lượng, thành tiền, tất cả là bản chụp từ server); StatusTimeline; vận đơn (hãng, mã, trạng thái) khi có. Nút Xác nhận (khi Pending) và Hủy (ô lý do bắt buộc, không hủy được sau Shipped). Soạn hàng, đóng gói, xuất kho do kho làm nên seller CHỈ theo dõi.
3. Sau mỗi hành động invalidate đúng query của danh sách và chi tiết; gặp INVALID_STATUS_TRANSITION hoặc CONCURRENCY_CONFLICT thì tải lại và báo rõ.
4. services, types, hooks.

KHÔNG LÀM: không làm phía Customer đặt hàng, không làm kho (bước 7), không tạo vận đơn ở màn hình seller.

TÔI SẼ THỬ: với dữ liệu thật có đơn ở trạng thái Pending: Seller Xác nhận → trạng thái đổi và timeline có thêm dòng; thử Hủy có lý do; thử bấm hành động trên đơn đã Shipped, nút hủy không còn.
```

### Bước 6b: Customer: giỏ hàng, đặt hàng, đơn của tôi

```
BƯỚC 6b: Customer: giỏ hàng, checkout, đơn của tôi. (Chạy sau bước BE 6.)

ĐỌC: docs/api-conventions.md mục "Giỏ hàng và đơn hàng" và "Thanh toán"; docs/business-rules.md mục 2, 5; docs/error-codes.md (INSUFFICIENT_STOCK, ORDER_EXPIRED, INVALID_STATUS_TRANSITION).

LÀM:
1. /cart: GET /cart, thêm, đổi số lượng, xóa; cảnh báo hết hàng lấy từ server; tổng tiền hiển thị theo server. Icon giỏ trên header hiện số lượng. Nút "Thêm vào giỏ" ở /products/:id gọi API thật (bỏ Toast tạm của bước 4b).
2. /checkout: chọn địa chỉ (sổ địa chỉ, cho thêm địa chỉ mới), phương thức thanh toán (COD; online nếu BE có), xem lại hàng nhóm theo shop. Nút Đặt hàng gọi POST /orders kèm header Idempotency-Key (tạo một khóa mỗi lần vào trang checkout, giữ nguyên khi bấm lại), khóa nút khi đang gửi. Gặp INSUFFICIENT_STOCK thì quay về giỏ và báo dòng thiếu. Thành công thì sang trang kết quả với mã đơn.
3. /orders và /orders/:id: lịch sử đơn (lọc theo trạng thái); chi tiết: đơn con theo shop, dòng hàng (bản chụp), địa chỉ, thanh toán, StatusTimeline; nút Hủy đơn (POST /orders/{id}/cancel, có ConfirmDialog, chỉ hiện khi còn được hủy).

KHÔNG LÀM: không tự tính tổng tiền, giảm giá, phí vận chuyển ở FE; không làm theo dõi vận đơn và trả hàng (bước 8b).

TÔI SẼ THỬ: thêm hàng của 2 shop khác nhau vào giỏ → đặt hàng → thấy 1 đơn có 2 đơn con; Seller ở bước 6 thấy đơn con của shop mình; tồn kho khả dụng giảm đúng; đặt lại món cuối cùng bị hết hàng thì báo INSUFFICIENT_STOCK; hủy đơn thì tồn khả dụng trở lại.
```

### Bước 7: Phiếu xuất, soạn hàng, vận đơn (W6, W7, W8)

```
BƯỚC 7: Kho xuất hàng cho đơn: phiếu xuất, soạn hàng bằng quét mã, vận đơn.

ĐỌC: docs/ui-screens-by-role.md mục 3 phần W6, W7, W8; docs/business-rules.md mục 2, 3, 4, 5; docs/api-conventions.md mục "Kho" và "Vận chuyển, trả hàng"; docs/error-codes.md; ScanInput, StatusBadge, ConfirmDialog.

LÀM:
1. W6 /warehouse/issues: bảng phiếu xuất (mã, đơn con gốc, loại, trạng thái Draft/Approved/Picking/Packed/Dispatched/Cancelled), lọc theo trạng thái. /warehouse/issues/:id: dòng hàng (SKU, vị trí lấy, cần lấy, đã lấy) và các nút hiện ĐÚNG theo trạng thái: Draft → Duyệt; Approved → Bắt đầu soạn; Picking → Đóng gói (chỉ khi đã lấy đủ); Packed → Xuất kho. Mỗi nút gọi đúng endpoint hành động con, khóa khi đang gửi, có ConfirmDialog cho Xuất kho.
2. W7 /warehouse/issues/:id/pick: màn hình tối giản cho thao tác tại kệ. ScanInput tự focus; danh sách dòng cần lấy (vị trí, SKU, tên, cần/đã lấy), dòng đủ đổi màu và có dấu đánh dấu; thanh tiến độ tổng. Quét mã → POST /issues/{id}/lines/{lineId}/scan; mã sai hoặc dư hiện cảnh báo nổi bật. Đủ hết các dòng thì hiện nút Hoàn tất soạn.
   Hỏi tôi cách tìm lineId từ mã vạch (gửi mã cho BE khớp, hay FE tra theo SKU) trước khi code phần này.
3. W8 /warehouse/shipments: danh sách đơn con đã đóng gói chờ giao và vận đơn đã tạo. Tạo vận đơn: chọn hãng từ GET /carriers (GHN, GHTK, VTP, JT, SPX), nhập mã vận đơn → POST /seller-orders/{id}/shipments. Cập nhật trạng thái (Đã lấy, Đang giao, Đã giao, Giao thất bại) → PATCH /shipments/{id}/status.
4. Xử lý lỗi: INSUFFICIENT_STOCK, INVALID_STATUS_TRANSITION, SELF_APPROVAL_NOT_ALLOWED (nếu áp dụng với loại phiếu đặc biệt).

KHÔNG LÀM: không làm hàng trả về (bước 8), điều chuyển, kiểm kê. Không tự tính tồn.

TÔI SẼ THỬ: có một phiếu xuất của đơn đã được seller xác nhận → Duyệt → Bắt đầu soạn → vào màn hình soạn, nhập mã SKU vào ô quét + Enter đến khi đủ → Đóng gói → Xuất kho → tạo vận đơn → cập nhật Đang giao rồi Đã giao; kiểm tra Tồn kho và Thẻ kho ở bước 5 đã giảm đúng.
```

### Bước 8: Trả hàng và hoàn tiền (S8, W9, A5, A6)

```
BƯỚC 8: Luồng trả hàng và hoàn tiền: Seller duyệt, Kho kiểm hàng, Admin xử lý hoàn tiền.

ĐỌC: docs/ui-screens-by-role.md mục 2 phần S8, mục 3 phần W9, mục 4 phần A5, A6; docs/business-rules.md mục 6, 7; docs/api-conventions.md mục "Thanh toán và hoàn tiền" và "Vận chuyển, trả hàng"; docs/error-codes.md (REFUND_EXCEEDS_PAID, RETURN_NOT_ELIGIBLE).

LÀM:
1. S8 /seller/returns: bảng yêu cầu trả hàng thuộc đơn của shop (mã, đơn gốc, lý do, trạng thái); chi tiết (lý do, ảnh nếu có, dòng hàng trả); nút Duyệt và Từ chối (lý do bắt buộc) khi Requested.
2. W9 /warehouse/returns: danh sách yêu cầu đã Approved chờ nhận/chờ kiểm; nút Đã nhận hàng (POST /returns/{id}/receive); kiểm từng dòng: chọn tình trạng Tốt / Lỗi nhẹ / Hỏng và vị trí đích (kệ bán cho Tốt, khu DAMAGED cho Hỏng) → POST /returns/{id}/items/{itemId}/inspect. Ghi chú trên giao diện rằng hàng trả không tự vào tồn bán được cho đến khi kiểm xong.
3. A5 /admin/returns: xem mọi yêu cầu trả hàng; Duyệt/Từ chối thay seller khi cần.
4. A6 /admin/refunds: hàng đợi lọc Pending (mã, đơn gốc, số tiền, lý do, ngày); chi tiết hiển thị số đã thanh toán, số đã hoàn, số còn được hoàn; nút Duyệt, Từ chối (lý do), Hoàn thành. Xử lý REFUND_EXCEEDS_PAID.

KHÔNG LÀM: phía Customer tạo yêu cầu trả hàng (thuộc Storefront), không làm dashboard.

TÔI SẼ THỬ: có một yêu cầu trả hàng Requested → Seller Duyệt → WM đánh dấu Đã nhận, kiểm một dòng Tốt và một dòng Hỏng → Admin Duyệt rồi Hoàn thành hoàn tiền; kiểm tra Tồn kho chỉ cộng đúng dòng Tốt.
```

### Bước 8b: Customer: theo dõi vận đơn, trả hàng, hồ sơ

```
BƯỚC 8b: Customer: theo dõi vận đơn, yêu cầu trả hàng, hồ sơ và sổ địa chỉ. (Chạy sau bước BE 8.)

ĐỌC: docs/api-conventions.md mục "Identity" và "Vận chuyển, trả hàng"; docs/business-rules.md mục 7; docs/error-codes.md (RETURN_NOT_ELIGIBLE).

LÀM:
1. Trong /orders/:id: theo dõi vận đơn (GET /shipments/track/{trackingNumber}) hiển thị hãng, mã và hành trình.
2. Yêu cầu trả hàng: nút trên đơn con đã Delivered (POST /seller-orders/{id}/returns): chọn dòng hàng, số lượng, lý do; xem trạng thái yêu cầu; xử lý RETURN_NOT_ELIGIBLE.
3. /account: hồ sơ (GET/PUT /users/me); sổ địa chỉ (thêm, sửa, xóa, đặt mặc định).

TÔI SẼ THỬ: đơn đã giao có nút Yêu cầu trả hàng, đơn chưa giao thì không; sau khi tạo yêu cầu, Seller ở bước 8 thấy và xử lý được; sửa hồ sơ và địa chỉ lưu đúng.
```

### Bước 9: Tổng quan và các màn hình còn lại (S1, W1, A1, A4, S7, S9)

```
BƯỚC 9: Các trang tổng quan và màn hình còn lại.

ĐỌC: docs/ui-screens-by-role.md các phần S1, S7, S9, W1, A1, A4; docs/api-conventions.md; các bước trước làm mẫu.

LÀM:
1. S1 /seller, W1 /warehouse, A1 /admin: thẻ số liệu và danh sách "việc cần làm" bấm để vào màn hình tương ứng. Số liệu lấy từ totalItems của các danh sách có lọc (gọi với pageSize=1), chưa cần API riêng. Mỗi thẻ có trạng thái đang tải/lỗi riêng.
2. S7 /seller/inventory (chỉ xem): bảng theo biến thể (SKU, tên, tồn thực, giữ chỗ, khả dụng, vị trí), lọc theo shop/sản phẩm, làm nổi bật biến thể sắp hết.
3. S9 /seller/profile: xem thông tin doanh nghiệp và trạng thái tài khoản seller.
4. A4 /admin/orders (chỉ xem): bảng đơn tổng (mã, khách, ngày, tổng tiền, trạng thái, thanh toán); chi tiết: đơn tổng → các đơn con → dòng hàng, thanh toán, vận đơn, lịch sử trạng thái.

KHÔNG LÀM: không làm biểu đồ doanh thu hay báo cáo, không thêm thư viện biểu đồ.

TÔI SẼ THỬ: mở trang tổng quan của từng role, các số khớp với danh sách thật; bấm thẻ chuyển đúng trang đã lọc sẵn.
```

### Bước 10: Người dùng, danh mục (A7, A8) (làm nếu còn thời gian)

```
BƯỚC 10: Quản lý người dùng và danh mục của Admin.

ĐỌC: docs/ui-screens-by-role.md phần A7, A8 và mục 6 (API cần BE bổ sung); các bước trước làm mẫu.

LÀM:
1. A7 /admin/users: bảng (tên, email, vai trò, trạng thái), tìm kiếm, lọc theo vai trò; nút Khóa/Mở khóa với ConfirmDialog; xem vai trò.
2. A8 /admin/categories: hiển thị cây danh mục; thêm, sửa, ẩn danh mục.
3. Các API này do phần BE của bước 10 làm; màn hình gọi API thật.

TÔI SẼ THỬ: khóa một tài khoản thử rồi đăng nhập bằng tài khoản đó phải bị chặn (kiểm với BE khi có API thật); thêm một danh mục con và thấy nó xuất hiện ở bộ lọc danh mục.
```

### Bước 11: Rà soát chung trước khi nộp

```
BƯỚC 11: Rà soát chất lượng toàn bộ frontend, KHÔNG thêm tính năng mới.

ĐỌC: .agents/rules/20-frontend-react.md, docs/ui-guidelines.md, docs/roles-and-permissions.md.

KIỂM TRA VÀ BÁO CÁO (sửa lỗi nhỏ rõ ràng; việc lớn thì liệt kê và hỏi tôi):
1. Mọi trang có đủ 3 trạng thái (đang tải, rỗng, lỗi có nút Thử lại).
2. Không có any, console.log, mã chết, import thừa; pnpm lint và pnpm build sạch.
3. Không có URL hard-code trong component; mọi lệnh gọi API đi qua services/ và Axios client dùng chung; dữ liệu server không bị sao chép vào Zustand.
4. Phân quyền route đúng ma trận ở roles-and-permissions.md (thử gõ tay đường dẫn khu vực khác).
5. Nút hành động khóa khi đang gửi; mọi hành động nguy hiểm có xác nhận; lỗi hiển thị bằng tiếng Việt theo code.
6. Giao diện không tràn ngang ở 1280px và 1440px; nút chỉ có icon có aria-label; form có label.
7. Tìm mọi dữ liệu giả, TODO hoặc chỗ gọi API chưa nối thật; liệt kê màn hình và endpoint liên quan.

KHÔNG LÀM: không thêm tính năng, không đổi thiết kế, không sửa backend.
```

---

## C. Mẹo khi dùng

- **Gặp lỗi khi chạy:** dán nguyên văn thông báo lỗi và tên file vào chat với agent, kèm bước tái hiện; đừng chỉ nói "bị lỗi".
- **Agent làm sai hướng:** quay lại bước trước, nói rõ điểm sai và yêu cầu sửa; không chồng thêm bước mới lên trên.
- **Hợp đồng API đổi:** sửa `docs/api-conventions.md` (và `docs/ui-screens-by-role.md` mục 6) trước, báo bạn BE, rồi mới bảo agent sửa code.
- **Sau mỗi bước:** chạy thử bằng tay theo phần "TÔI SẼ THỬ", đọc lại code nhanh, commit lên nhánh riêng, tạo PR cho bạn khác review.