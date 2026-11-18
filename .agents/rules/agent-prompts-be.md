# Chuỗi prompt giao việc cho agent (Backend)

Đi cặp với `docs/agent-prompts-fe.md`. Mỗi bước làm **BE trước, thử trên Swagger, rồi FE cùng số bước gọi API thật** (không dùng dữ liệu giả). Mỗi bước dùng một nhánh riêng và một Pull Request; có thể tách nhánh BE và nhánh FE.

Cách dùng: gửi agent = **PHẦN MỞ ĐẦU CHUNG** (mục A) + **prompt của bước** (mục B).

Thứ tự và cặp bước:

| Bước | BE (file này) | FE (agent-prompts-fe.md) |
|---|---|---|
| 1 | Nền tảng BE: lỗi, phân quyền, seed, dọn Swagger | Bước 1 (khung 3 khu vực) và Bước 2 (component) |
| 3 | Seller: đăng ký, duyệt | Bước 3 |
| 4 | Catalog: shop, sản phẩm, biến thể, ảnh, duyệt, public | Bước 4 và 4b |
| 5 | Kho: kho, vị trí, tồn, sổ cái, phiếu nhập | Bước 5 |
| 6 | Giỏ hàng, đặt hàng, giữ chỗ, đơn của seller | Bước 6 và 6b |
| 7 | Phiếu xuất, soạn hàng, vận đơn | Bước 7 |
| 8 | Trả hàng, hoàn tiền | Bước 8 và 8b |
| 9 | Các API còn thiếu cho tổng quan, đơn Admin, hồ sơ | Bước 9 |
| 10 | Người dùng, danh mục (Admin) | Bước 10 |

---

## A. Phần mở đầu chung (dán vào đầu MỌI prompt BE)

```
Bạn làm việc trong repo E_Commerce_Warehouse, phần backend (.NET 9 Web API, Clean Architecture, EF Core + Pomelo MySQL). Các luật trong .agents/rules/ đã được nạp, hãy tuân theo (đặc biệt 10-backend-dotnet.md và 30-inventory-order-rules.md).

QUY TRÌNH BẮT BUỘC:
1. Đọc các tài liệu chỉ định bên dưới. Đọc module Identity/Auth làm khuôn mẫu: cách đặt Controller → Service → Repository/UnitOfWork → DTO → Validator → Mapping, và cách đăng ký DI.
2. Trước khi viết code: tóm tắt bạn hiểu yêu cầu thế nào, liệt kê file/lớp sẽ thêm hoặc sửa (theo từng project Domain/Application/Infrastructure/WebAPI), và nêu chỗ chưa rõ. Rồi DỪNG chờ tôi xác nhận.
3. Sau khi tôi xác nhận mới viết code.

NGUYÊN TẮC:
- Schema DB do script trong database/scripts/ quyết định. Entity và Fluent API khớp ĐÚNG tên bảng, cột, kiểu, CHECK. KHÔNG tạo EF Migrations, KHÔNG sửa file SQL; nếu cần schema khác, nêu đề xuất cho tôi thay vì tự sửa.
- Controller mỏng; logic ở Application Service; Repository và UnitOfWork ở Infrastructure; interface đặt ở Application. API chỉ nhận/trả DTO, không trả Entity. Mọi request DTO có FluentValidation.
- URL, JSON, mã trạng thái và định dạng lỗi theo docs/api-conventions.md và docs/error-codes.md. Mọi endpoint có [ProducesResponseType] cho các mã trả về (kể cả ProblemDetails cho 400/401/403/404/409) và hiện trong Swagger.
- Lỗi nghiệp vụ: ném exception trong Domain/Exceptions có Code, middleware toàn cục đổi thành ProblemDetails có trường code. Không nuốt lỗi, không lộ stack trace.
- Mọi thay đổi tồn kho, trạng thái đơn, thanh toán, hoàn tiền chạy trong MỘT transaction qua UnitOfWork. Chuyển trạng thái bằng POST hành động con; service kiểm tra thứ tự chuyển và ghi lịch sử.
- Kiểm tra quyền sở hữu ở service (khách chỉ thấy đơn mình, seller chỉ thấy dữ liệu shop mình), không chỉ attribute. Trả 404 nếu không thuộc về người gọi.
- async + CancellationToken, AsNoTracking cho truy vấn đọc, tránh N+1, tiền dùng decimal, thời gian UTC, không nối chuỗi SQL.
- Làm đúng phạm vi bước; không refactor ngoài phạm vi; không đụng frontend; không thêm thư viện mới khi chưa hỏi tôi. Không tự commit hay push.

KHI XONG:
- dotnet build không lỗi và không warning mới; thêm test cho logic nghiệp vụ mới được nêu ở bước (xunit).
- Báo cáo: file đã thêm/sửa, endpoint đã làm (method, URL, quyền), phần bạn chưa chắc.
- Hướng dẫn tôi thử trên Swagger từng bước: đăng nhập tài khoản nào, gọi endpoint nào theo thứ tự, kết quả kỳ vọng, và một vài trường hợp lỗi cần thử.
```

---

## B. Các prompt theo bước

### Bước 1: Nền tảng backend

```
BƯỚC 1 (BE): Dọn nền tảng để các bước sau dùng chung.

ĐỌC: docs/api-conventions.md (mục "Quy ước chung", "Định dạng lỗi"), docs/error-codes.md, docs/roles-and-permissions.md, .agents/rules/10-backend-dotnet.md, Program.cs, module Identity, Infrastructure/Data/Seed (DataSeeder).

BƯỚC 0: Báo tôi hiện đã có gì: middleware xử lý lỗi toàn cục (đã trả ProblemDetails có code chưa), exception nghiệp vụ trong Domain/Exceptions, policy phân quyền theo role, cách lấy userId hiện tại, kiểu phân trang dùng chung, DataSeeder đang seed những gì. Rồi DỪNG chờ xác nhận.

LÀM (chỉ bổ sung phần còn thiếu, dùng lại phần đã có):
1. Exception nghiệp vụ: lớp gốc BusinessException (Code, Message, HttpStatus mặc định 409) và các lớp con hoặc factory cho: INSUFFICIENT_STOCK, INVALID_STATUS_TRANSITION, ORDER_EXPIRED, SELF_APPROVAL_NOT_ALLOWED, CONCURRENCY_CONFLICT, SELLER_NOT_APPROVED, PRODUCT_NOT_AVAILABLE, DUPLICATE_SKU, REFUND_EXCEEDS_PAID, RETURN_NOT_ELIGIBLE.
2. Middleware toàn cục đổi exception thành ProblemDetails có trường code, traceId: BusinessException → status của nó; NotFoundException → 404; DbUpdateConcurrencyException → 409 CONCURRENCY_CONFLICT; lỗi MySQL do trigger (SQLSTATE 45000, mã 1644) → 409 BUSINESS_RULE_VIOLATION kèm thông điệp trigger; lỗi còn lại → 500 INTERNAL_ERROR không lộ chi tiết nội bộ. Lỗi FluentValidation → 400 VALIDATION_ERROR kèm danh sách lỗi theo trường.
3. Phân quyền: policy cho 4 vai trò (Customer, Seller, WarehouseManager, Admin) và một dịch vụ tiện ích ICurrentUser (UserId, Roles, SellerId nếu là seller).
4. PagedResult<T> { items, page, pageSize, totalItems, totalPages } và tiện ích phân trang/sắp xếp (pageSize tối đa 100, sort=-createdAt).
5. DataSeeder: đảm bảo seed đủ 4 vai trò mẫu và thêm tài khoản kho thứ hai manager2 (cùng vai trò WarehouseManager); mật khẩu mẫu lấy từ cấu hình hoặc hằng dành cho môi trường dev, không ghi mật khẩu thật.
6. Swagger: ghim Microsoft.OpenApi về nhánh 1.6.x tương thích Swashbuckle 6.9.0 (điều tra bằng dotnet nuget why trước; không dùng NoWarn cho NU1605; không dùng SerializeAsV2), xóa middleware vá chuỗi 3.0.4 nếu Swagger vẫn chạy được sau đó (nếu không, giữ lại và báo tôi). Bọc UseHttpsRedirection trong điều kiện không phải Development.

TEST: viết test cho middleware lỗi (mỗi loại exception ra đúng status và code).

KHÔNG LÀM: không làm module nghiệp vụ nào (Seller, Catalog...), không sửa logic Auth ngoài việc cần.

TÔI SẼ THỬ: Swagger mở được; gọi một endpoint gây lỗi 404 và 409 thấy ProblemDetails có code; đăng nhập được cả manager1 và manager2.
```

### Bước 3: Seller

```
BƯỚC 3 (BE): Đăng ký seller và Admin duyệt.

ĐỌC: docs/api-conventions.md mục "Seller và Shop"; docs/business-rules.md mục 8; database/documentation/DatabaseDesign.md phần Identity & Sellers (bảng Sellers, Roles, UserRoles, và cột trạng thái, cột lý do nếu có); .agents/rules/10-backend-dotnet.md.

LÀM:
1. Entity, Configuration, Repository cho Sellers (khớp đúng script SQL), enum trạng thái seller lưu dạng chuỗi.
2. POST /sellers (role Customer): tạo hồ sơ Pending; mỗi người dùng chỉ một hồ sơ (trả 409 nếu đã có, kèm code phù hợp). GET /sellers/me.
3. Admin: GET /admin/sellers?status= (phân trang, lọc), POST /admin/sellers/{id}/approve | reject | suspend. Từ chối cần lý do; lưu lý do nếu schema có cột phù hợp, nếu chưa có thì DỪNG và đề xuất cho tôi (không tự sửa SQL). Kiểm tra thứ tự trạng thái (Pending → Approved/Rejected; Approved → Suspended), sai thì INVALID_STATUS_TRANSITION.
4. Khi duyệt: gán thêm vai trò Seller cho người dùng trong cùng transaction. Vấn đề cần hỏi tôi trước khi làm: access token đang dùng của người dùng chưa có role Seller cho tới khi refresh/đăng nhập lại. Hãy đề xuất cách xử lý (ví dụ phản hồi của /auth/refresh luôn đọc lại role từ DB) và chờ tôi chọn.
5. DTO, Validator, Mapping, đăng ký DI, [ProducesResponseType].

TEST: duyệt đúng thứ tự trạng thái; không duyệt hai lần; Customer không gọi được /admin/sellers.

TÔI SẼ THỬ (Swagger): Customer mới POST /sellers → Admin GET danh sách Pending → approve → Customer GET /sellers/me thấy Approved; thử reject có lý do; thử approve lần hai gặp 409.
```

### Bước 4: Catalog

```
BƯỚC 4 (BE): Shop, danh mục, sản phẩm, biến thể, ảnh, duyệt sản phẩm, API công khai.

ĐỌC: docs/api-conventions.md mục "Catalog" và "Seller và Shop"; database/documentation/DatabaseDesign.md phần Catalog (Categories, Products, ProductVariants, ProductImages, Shops; giá trị trạng thái sản phẩm); docs/business-rules.md mục 8; code module Seller ở bước 3.

LÀM:
1. Shops: GET/POST /seller/shops, PUT /seller/shops/{id} (chỉ seller Approved, nếu không SELLER_NOT_APPROVED; chỉ thấy shop của mình). Thêm API công khai GET /shops/{id}.
2. Categories: GET /categories trả cây danh mục (công khai).
3. Seller products: GET /seller/products (lọc theo trạng thái, shop, tìm tên/SKU, phân trang), POST /seller/products (Draft), PUT /seller/products/{id} (không sửa được khi PendingReview), POST /seller/products/{id}/submit (cần có ít nhất 1 biến thể và 1 ảnh, Draft/Rejected → PendingReview). Biến thể: POST /seller/products/{id}/variants, PUT /seller/variants/{id}; SKU không trùng (DUPLICATE_SKU). Lưu lý do từ chối để seller xem lại.
4. Ảnh sản phẩm: endpoint tải ảnh lên (POST /seller/uploads/images, multipart; chỉ nhận jpg/png/webp, giới hạn dung lượng, đổi tên file ngẫu nhiên, lưu vào thư mục wwwroot/uploads hoặc nơi cấu hình được, trả về URL). Cho phép gắn danh sách ảnh (có ảnh đại diện, thứ tự) vào sản phẩm. Phục vụ file tĩnh an toàn.
5. Admin: GET /admin/products?status= (hàng đợi, phân trang), POST /admin/products/{id}/approve | reject (reject bắt buộc lý do).
6. Công khai: GET /products (lọc categoryId, q, khoảng giá, shopId, sắp xếp mới nhất/giá tăng/giá giảm, phân trang; chỉ sản phẩm đã duyệt; mỗi sản phẩm có giá thấp nhất, ảnh đại diện và cờ inStock tính từ tồn khả dụng (OnHand − Reserved) ở các vị trí bán được, dùng view vw_VariantAvailability hoặc truy vấn tương đương), GET /products/{id} (chi tiết, các biến thể kèm giá và tồn khả dụng, ảnh, shop).
7. Cập nhật docs/api-conventions.md với endpoint mới thêm (GET /shops/{id}, upload ảnh, shopId filter) và báo tôi.

TEST: seller chỉ thấy/sửa sản phẩm của shop mình; không sửa khi PendingReview; submit thiếu biến thể bị chặn; SKU trùng; GET /products không trả sản phẩm chưa duyệt; inStock đúng.

TÔI SẼ THỬ (Swagger): Seller (đã Approved) tạo shop → upload ảnh → tạo sản phẩm có 2 biến thể → submit → Admin approve → GET /products công khai thấy; thử reject và sửa lại; thử upload file .exe bị từ chối.
```

### Bước 5: Kho

```
BƯỚC 5 (BE): Kho, vị trí, tồn kho, sổ cái, phiếu nhập.

ĐỌC: .agents/rules/30-inventory-order-rules.md (toàn bộ); docs/business-rules.md mục 3, 5; docs/api-conventions.md mục "Kho"; database/documentation/DatabaseDesign.md phần Warehouse & Inventory (Warehouses, WarehouseLocations, Inventory, StockMovements, InventoryReceipts và chi tiết, trigger chặn sổ cái, view vw_StockReconciliation).

LÀM:
1. InventoryService: điểm vào DUY NHẤT để thay đổi bảng Inventory; mỗi thay đổi ghi một dòng StockMovements (OnHandChange, ReservedChange, OnHandAfter, ReservedAfter, ReferenceType, ReferenceId, người thực hiện) trong cùng transaction. Không nơi nào khác được UPDATE Inventory. Cập nhật tồn bằng câu lệnh nguyên tử; xử lý RowVersion.
2. Warehouses: GET/POST /warehouses, GET/POST /warehouses/{id}/locations (WarehouseManager). Vị trí INBOUND/RETURNS/DAMAGED không bán được và không cho đổi cờ này.
3. Tồn kho: GET /inventory?warehouseId&variantId (WM xem tất cả; Seller chỉ thấy hàng thuộc shop của mình, kiểm tra ở service), GET /inventory/availability?variantId (công khai, tồn khả dụng tổng).
4. Thẻ kho: GET /stock-movements?variantId&from&to (WM, phân trang).
5. Phiếu nhập: POST /receipts (Draft; WM), GET /receipts và GET /receipts/{id}, POST /receipts/{id}/confirm (tồn tăng + sổ cái; người xác nhận phải khác người tạo, nếu không SELF_APPROVAL_NOT_ALLOWED), POST /receipts/{id}/cancel (chỉ Draft). Phiếu Confirmed không hủy được.

TEST BẮT BUỘC: confirm phiếu làm tồn tăng đúng và có một dòng sổ cái đúng loại; người tạo tự confirm bị chặn; không UPDATE/DELETE được StockMovements; vw_StockReconciliation không có dòng lệch sau kịch bản.

KHÔNG LÀM: phiếu xuất, giữ chỗ cho đơn (bước 6, 7); điều chuyển, kiểm kê.

TÔI SẼ THỬ (Swagger, đăng nhập manager1 và manager2): manager1 tạo phiếu nhập → manager1 thử confirm bị chặn → manager2 confirm → GET /inventory thấy tồn tăng → GET /stock-movements thấy dòng mới; Seller GET /inventory chỉ thấy hàng của mình.
```

### Bước 6: Giỏ hàng, đặt hàng, giữ chỗ, đơn của seller

```
BƯỚC 6 (BE): Đây là bước khó nhất: giỏ hàng, checkout (tách đơn, giữ chỗ nguyên tử), đơn của seller. Hãy chia thành các phần nhỏ và nói rõ nếu cần tách bước.

ĐỌC: .agents/rules/30-inventory-order-rules.md (toàn bộ); docs/business-rules.md mục 1 đến 6; docs/api-conventions.md mục "Giỏ hàng và đơn hàng" và "Thanh toán"; database/documentation/DatabaseDesign.md phần Customer, Orders & Payments, Warehouse & Inventory (Carts, CartItems, UserAddresses, Orders, SellerOrders, OrderItems, OrderStatusHistory, Payments, StockReservations); InventoryService ở bước 5.

LÀM:
1. Địa chỉ: GET/POST/PUT/DELETE /users/me/addresses (Customer), có địa chỉ mặc định.
2. Giỏ hàng: GET /cart (kèm cảnh báo hết hàng, giá và tổng do server tính), POST /cart/items, PUT/DELETE /cart/items/{id}.
3. POST /orders (Customer, header Idempotency-Key bắt buộc): trong MỘT transaction: kiểm tra sản phẩm còn bán; tách theo seller (Variant → Product → Shop → Seller) thành SellerOrders; phân bổ kho sàn (WarehouseType = 'Platform') cho từng đơn con TRƯỚC khi giữ chỗ; giữ chỗ bằng UPDATE nguyên tử (QuantityOnHand − QuantityReserved >= @q), kiểm tra số dòng bị ảnh hưởng, bằng 0 thì rollback toàn bộ và ném INSUFFICIENT_STOCK; tạo StockReservations (Active, ExpiresAt nếu thanh toán online, COD có thể NULL) và ghi sổ cái loại Reserve; lưu bản chụp tên, SKU, đơn giá, địa chỉ giao; tính Subtotal, ShippingFee, DiscountAmount, TotalAmount ở server (TotalAmount = Subtotal + ShippingFee − DiscountAmount); ghi OrderStatusHistory; xóa các dòng giỏ đã đặt. Gửi lại cùng Idempotency-Key trả lại đơn cũ, không tạo đơn thứ hai.
4. Khách: GET /orders, GET /orders/{id} (chỉ đơn của mình, kèm đơn con và lịch sử), POST /orders/{id}/cancel (chỉ khi chưa bàn giao vận chuyển; nhả giữ chỗ, đơn con về Cancelled, ghi sổ cái ReleaseReserve).
5. Thanh toán cơ bản: POST /orders/{id}/payments với COD. Callback cổng online (idempotent theo PaymentMethod + TransactionCode) CHỈ làm khung nếu tôi yêu cầu.
6. Seller: GET /seller/orders?status= và GET /seller/orders/{id} (chỉ đơn con của shop mình), POST /seller/orders/{id}/confirm | cancel (Pending → Confirmed; hủy cần lý do, không hủy được sau Shipped). Mỗi lần đơn con đổi trạng thái thì tính lại trạng thái tổng hợp của Orders.
7. Hết hạn giữ chỗ: một hosted service chạy nền đổi StockReservations quá hạn thành Expired, nhả ReservedChange, ghi sổ cái, và đưa đơn quá hạn thanh toán về Expired.
8. Máy trạng thái: chỉ cho các bước chuyển hợp lệ (xem docs/business-rules.md mục 4), sai thì INVALID_STATUS_TRANSITION.

TEST BẮT BUỘC: hai request đồng thời cùng mua món cuối cùng, chỉ một thành công; hủy đơn và hết hạn nhả đúng giữ chỗ; sau mỗi kịch bản vw_StockReconciliation không lệch; gửi lại cùng Idempotency-Key không tạo đơn mới; đơn nhiều seller tách đúng số đơn con; khách khác không xem được đơn; giá lấy từ DB, không từ client.

KHÔNG LÀM: phiếu xuất và soạn hàng (bước 7), trả hàng và hoàn tiền (bước 8).

TÔI SẼ THỬ (Swagger): thêm hàng của 2 shop vào giỏ → POST /orders → thấy 1 đơn có 2 đơn con, tồn khả dụng giảm; Seller xác nhận đơn con; đặt vượt tồn gặp 409 INSUFFICIENT_STOCK; hủy đơn thì tồn khả dụng trở lại.
```

### Bước 7: Phiếu xuất, soạn hàng, vận đơn

```
BƯỚC 7 (BE): Phiếu xuất cho đơn, soạn hàng bằng quét mã, vận đơn.

ĐỌC: .agents/rules/30-inventory-order-rules.md (mục 2, 3, 6, 7); docs/business-rules.md mục 2 đến 5; docs/api-conventions.md mục "Kho" và "Vận chuyển, trả hàng"; DatabaseDesign.md phần Warehouse (InventoryIssues và chi tiết) và Shipping (Carriers, Shipments); code bước 5, 6.

LÀM:
1. Phiếu xuất tự sinh từ đơn con khi seller Xác nhận (Draft, loại đơn hàng, các dòng theo vị trí lấy hàng chọn bởi service từ tồn khả dụng của kho sàn). Hỏi tôi: phiếu tự sinh ghi CreatedBy là ai (hệ thống/NULL hay người xác nhận) và cách tránh vướng ràng buộc người tạo ≠ người duyệt.
2. GET /issues?status= và GET /issues/{id} (WM). Máy trạng thái: Draft → Approved → Picking → Packed → Dispatched; Cancelled. Endpoint: POST /issues/{id}/approve, /start-picking, /pack (chỉ khi mọi dòng đã lấy đủ), /dispatch.
3. POST /issues/{id}/lines/{lineId}/scan: tăng pickedQuantity khi quét đúng; quét sai mã hoặc dư số lượng thì trả lỗi rõ ràng. Hỏi tôi cách tìm lineId từ mã vạch (nhận mã trong body và BE tự khớp theo SKU/mã vạch là phương án ưu tiên).
4. Dispatch: trong một transaction, trừ OnHand và Reserved cho từng dòng (ghi sổ cái loại Issue có OnHandChange −N và ReservedChange −N), StockReservations → Consumed, SellerOrders → Shipped, tính lại trạng thái Orders. Các loại xuất Adjustment/ReturnToSeller/Disposal bắt buộc người duyệt khác người tạo (SELF_APPROVAL_NOT_ALLOWED).
5. Vận chuyển: GET /carriers; POST /seller-orders/{id}/shipments (WM; chọn hãng, mã vận đơn); PATCH /shipments/{id}/status (Đã lấy, Đang giao, Đã giao, Giao thất bại; Đã giao → SellerOrders Delivered, thất bại → DeliveryFailed); GET /shipments (WM) và GET /shipments/track/{trackingNumber} (Customer, chỉ đơn của mình).
6. Mỗi lần đổi trạng thái đơn con thì ghi OrderStatusHistory và tính lại trạng thái đơn tổng.

TEST BẮT BUỘC: dispatch trừ cả OnHand lẫn Reserved và đối soát không lệch; không pack khi chưa lấy đủ; scan sai mã bị từ chối; sai thứ tự trạng thái bị chặn; Customer chỉ tra được vận đơn của mình.

TÔI SẼ THỬ (Swagger): đơn đã được seller xác nhận → GET /issues thấy phiếu → approve → start-picking → scan đủ → pack → dispatch → tạo shipment → cập nhật Đang giao rồi Đã giao; kiểm tra tồn và thẻ kho đã giảm đúng.
```

### Bước 8: Trả hàng và hoàn tiền

```
BƯỚC 8 (BE): Trả hàng và hoàn tiền.

ĐỌC: docs/business-rules.md mục 6, 7; .agents/rules/30-inventory-order-rules.md mục 8; docs/api-conventions.md mục "Thanh toán và hoàn tiền" và "Vận chuyển, trả hàng"; DatabaseDesign.md phần Shipping/Returns (ReturnRequests, ReturnItems), Payments và Refunds (trigger chặn hoàn vượt, trigger chỉ cho trả hàng khi Delivered).

LÀM:
1. Customer: POST /seller-orders/{id}/returns (chỉ đơn con Delivered và đúng khách đã mua, nếu không RETURN_NOT_ELIGIBLE; chọn dòng, số lượng, lý do); GET /returns (khách thấy yêu cầu của mình; seller thấy của shop mình; Admin thấy tất cả; lọc theo trạng thái; phân trang) và GET /returns/{id}.
2. POST /returns/{id}/approve | reject (Seller của đơn đó hoặc Admin; reject cần lý do). Máy trạng thái: Requested → Approved → ItemsReceived → Inspected → Completed; Rejected, Cancelled.
3. POST /returns/{id}/receive (WM): nhập hàng vào khu RETURNS (không bán được) qua InventoryService (sổ cái ReturnIn). POST /returns/{id}/items/{itemId}/inspect (WM): chọn Good / MinorDefect / Damaged và vị trí đích; chuyển từ RETURNS sang kệ bán (Good) hoặc khu DAMAGED bằng cặp bút toán Adjustment (ReferenceType = 'ReturnRequest'). Hàng trả không tự cộng vào tồn bán được.
4. Hoàn tiền: tạo yêu cầu hoàn tiền khi trả hàng được duyệt hoặc khi callback đến muộn; GET /admin/refunds?status=; POST /admin/refunds/{id}/approve | reject | complete. Trước khi tạo hoàn tiền khóa dòng Payments (SELECT ... FOR UPDATE); tổng hoàn không vượt số đã thanh toán (REFUND_EXCEEDS_PAID).

TEST BẮT BUỘC: không trả hàng cho đơn chưa Delivered hoặc của người khác; hàng Damaged không vào tồn bán được; hoàn tiền vượt số đã thanh toán bị chặn; hai yêu cầu hoàn đồng thời không vượt tổng; sổ cái ghi đủ bút toán.

TÔI SẼ THỬ (Swagger): đơn Delivered → Customer tạo yêu cầu trả → Seller approve → WM receive và inspect (một dòng Good, một dòng Damaged) → kiểm tra tồn chỉ cộng dòng Good → Admin duyệt và hoàn thành hoàn tiền.
```

### Bước 9: API còn thiếu cho tổng quan và hồ sơ

```
BƯỚC 9 (BE): Bổ sung các API còn thiếu cho các màn hình tổng quan và hồ sơ.

ĐỌC: docs/ui-screens-by-role.md mục 2 (S1, S7, S9), mục 3 (W1), mục 4 (A1, A4) và mục 6; docs/api-conventions.md.

LÀM:
1. GET /admin/orders (phân trang, lọc trạng thái, khoảng ngày, tìm theo mã/khách) và GET /admin/orders/{id} (đơn tổng → đơn con → dòng hàng, thanh toán, vận đơn, lịch sử).
2. GET/PUT /users/me (hồ sơ) nếu chưa có; PUT /sellers/me (sửa hồ sơ seller).
3. Kiểm tra các danh sách đã có hỗ trợ lọc theo status và trả totalItems đúng, để FE dùng làm số liệu cho thẻ tổng quan (pageSize=1). Nếu thiếu, bổ sung.
4. Cập nhật docs/api-conventions.md cho các endpoint mới.

TÔI SẼ THỬ (Swagger): các danh sách có lọc trạng thái trả totalItems đúng; GET /admin/orders/{id} hiện đủ thông tin.
```

### Bước 10: Người dùng và danh mục (làm nếu còn thời gian)

```
BƯỚC 10 (BE): Quản lý người dùng và danh mục cho Admin.

ĐỌC: docs/ui-screens-by-role.md phần A7, A8; DatabaseDesign.md phần Identity và Categories.

LÀM:
1. GET /admin/users (tìm kiếm, lọc theo vai trò, phân trang), POST /admin/users/{id}/lock | unlock. Tài khoản bị khóa không đăng nhập được và refresh token bị thu hồi. Không cho Admin tự khóa chính mình.
2. Categories: POST/PUT /admin/categories, ẩn/hiện danh mục (không xóa nếu còn sản phẩm). GET /categories công khai chỉ trả danh mục đang hiện.
3. Cập nhật docs/api-conventions.md.

TEST: tài khoản bị khóa đăng nhập thất bại; Admin không tự khóa mình.
```

---

## C. Mẹo

- **Đọc kỹ phần "Hỏi tôi" trong prompt**: đó là chỗ tôi không biết đáp án (cách làm mới token sau khi duyệt seller, cách tìm dòng hàng từ mã vạch, người tạo của phiếu xuất tự sinh). Agent sẽ dừng lại hỏi; hãy trả lời hoặc hỏi lại bạn trước khi cho đi tiếp.
- **Bước 6 là bước nặng**: nếu agent trả lời quá dài hoặc làm dở, tách thành hai lần (6a: địa chỉ, giỏ hàng; 6b: checkout, giữ chỗ, đơn của seller) và kiểm tra từng phần.
- **Kiểm tra đối soát tồn kho** sau mỗi bước làm đổi tồn: chạy `SELECT * FROM vw_StockReconciliation;` phải ra rỗng.
- **Đừng để agent sửa file SQL.** Nếu thiếu cột hay bảng, bàn với nhóm rồi sửa script và `DatabaseDesign.md` cùng lúc, sau đó nạp lại DB (`docker compose down -v` rồi `up -d`).
