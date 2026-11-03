/*
================================================================================
 Dự án      : E-Commerce Marketplace (đa người bán) + Warehouse Management
 Database   : ECommerceWarehouse (MySQL 8.0.16+)
 File       : 04_CreateIndexes.sql
 Mục đích   : Chỉ mục phụ phục vụ các truy vấn thực tế (lọc, sắp xếp, phân trang, job nền).
 Chạy sau   : 03_CreateForeignKeys.sql (hoặc sau khi nạp dữ liệu mẫu lớn để bulk insert nhanh hơn).

 DANH SÁCH MỤC:
   1. Catalog & Products            4. Kho, giữ chỗ & sổ cái
   2. Orders & Sales                5. Vận chuyển, trả hàng, tài khoản
   3. Payments

 GHI CHÚ QUAN TRỌNG:
   - MySQL TỰ ĐỘNG tạo chỉ mục cho mọi cột khóa ngoại (file 03), nên KHÔNG cần tạo lại chỉ mục chỉ cho FK.
     File này chỉ có chỉ mục phục vụ điều kiện lọc/sắp xếp. Khi một chỉ mục ghép ở đây dùng cột FK làm
     cột đầu, MySQL sẽ tự bỏ chỉ mục FK ngầm định trùng lặp.
   - Với chỉ mục (cột, CreatedAt DESC), MySQL 8 hỗ trợ chỉ mục giảm dần thật sự.
   - Các UNIQUE đã khai báo ở file 02 (SKU, OrderCode, TransactionCode, TrackingNumber...) cũng là chỉ mục tra cứu.
================================================================================
*/

USE ECommerceWarehouse;

-- ============================================================================
-- 1. CATALOG & PRODUCTS
-- ============================================================================

-- Seller Center: danh sách sản phẩm của một shop theo trạng thái (WHERE ShopId = ? AND ProductStatus = ?).
CREATE INDEX IX_Products_Shop_Status
    ON Products (ShopId, ProductStatus);

-- Storefront: duyệt sản phẩm theo ngành hàng đang bán (WHERE CategoryId = ? AND ProductStatus = 'Active').
CREATE INDEX IX_Products_Category_Status
    ON Products (CategoryId, ProductStatus);

-- Admin: hàng đợi duyệt sản phẩm mới nhất trước (WHERE ProductStatus = 'PendingReview' ORDER BY CreatedAt).
CREATE INDEX IX_Products_Status_Created
    ON Products (ProductStatus, CreatedAt);

-- Tìm kiếm theo tên sản phẩm (MATCH ... AGAINST). Parser mặc định tách từ theo khoảng trắng, phù hợp tiếng Việt có dấu.
CREATE FULLTEXT INDEX FT_Products_Name
    ON Products (ProductName);

-- Trang chi tiết: lấy các biến thể đang bán của một sản phẩm (WHERE ProductId = ? AND IsActive = 1).
CREATE INDEX IX_Variants_Product_Active
    ON ProductVariants (ProductId, IsActive);

-- Trang chi tiết: ảnh theo thứ tự hiển thị.
CREATE INDEX IX_Images_Product_Order
    ON ProductImages (ProductId, DisplayOrder);


-- ============================================================================
-- 2. ORDERS & SALES
-- ============================================================================

-- Lịch sử mua hàng của khách, đơn mới nhất trước, phân trang không phải sort lại.
CREATE INDEX IX_Orders_Customer_Created
    ON Orders (CustomerId, CreatedAt DESC);

-- Admin: lọc đơn theo trạng thái, mới nhất trước.
CREATE INDEX IX_Orders_Status_Created
    ON Orders (OrderStatus, CreatedAt DESC);

-- Job nền: tìm đơn chờ thanh toán đã quá hạn để hủy và nhả giữ chỗ
-- (WHERE OrderStatus = 'PendingPayment' AND ExpiresAt < UTC_TIMESTAMP()).
CREATE INDEX IX_Orders_Status_Expires
    ON Orders (OrderStatus, ExpiresAt);

-- Seller Center: xử lý đơn theo trạng thái, mới nhất trước.
CREATE INDEX IX_SellerOrders_Seller_Status_Created
    ON SellerOrders (SellerId, Status, CreatedAt DESC);

-- Hàng đợi của kho: các đơn seller đã phân bổ về một kho và đang chờ xử lý.
CREATE INDEX IX_SellerOrders_Warehouse_Status
    ON SellerOrders (WarehouseId, Status);

-- Báo cáo bán chạy / truy ngược các đơn chứa một biến thể.
CREATE INDEX IX_OrderItems_Variant
    ON OrderItems (VariantId);

-- Màn hình chi tiết đơn: timeline trạng thái theo thời gian.
CREATE INDEX IX_StatusHistory_Order_Created
    ON OrderStatusHistory (OrderId, CreatedAt);


-- ============================================================================
-- 3. PAYMENTS
-- ============================================================================

-- Tra các giao dịch của một đơn theo trạng thái (kiểm tra đã thanh toán chưa, đối soát).
CREATE INDEX IX_Payments_Order_Status
    ON Payments (OrderId, PaymentStatus);

-- Đối soát hoàn tiền: các yêu cầu hoàn đang chờ xử lý.
CREATE INDEX IX_Refunds_Status_Created
    ON Refunds (RefundStatus, CreatedAt);


-- ============================================================================
-- 4. KHO, GIỮ CHỖ & SỔ CÁI TỒN KHO
-- ============================================================================

-- Kiểm tra tồn khả dụng theo biến thể trong một kho (đầu vào của việc chọn kho và giữ chỗ).
CREATE INDEX IX_Inventory_Variant_Warehouse
    ON Inventory (VariantId, WarehouseId);

-- Job nền: nhả các giữ chỗ Active đã hết hạn (WHERE Status = 'Active' AND ExpiresAt < UTC_TIMESTAMP()).
CREATE INDEX IX_Reservations_Status_Expires
    ON StockReservations (Status, ExpiresAt);

-- Tìm giữ chỗ của một dòng đơn hàng khi hủy/xuất.
CREATE INDEX IX_Reservations_OrderItem_Status
    ON StockReservations (OrderItemId, Status);

-- Tổng giữ chỗ đang Active theo (kho, biến thể) - dùng đối soát và tính tồn khả dụng.
CREATE INDEX IX_Reservations_Warehouse_Variant_Status
    ON StockReservations (WarehouseId, VariantId, Status);

-- Thẻ kho của một mặt hàng theo thời gian (mới nhất trước).
CREATE INDEX IX_StockMovements_Variant_Created
    ON StockMovements (VariantId, CreatedAt DESC);

-- Nhật ký của một kho theo thời gian (báo cáo nhập-xuất-tồn theo kỳ).
CREATE INDEX IX_StockMovements_Warehouse_Created
    ON StockMovements (WarehouseId, CreatedAt);

-- Truy ngược sổ cái từ chứng từ gốc (ví dụ mọi biến động của phiếu xuất #123).
CREATE INDEX IX_StockMovements_Reference
    ON StockMovements (ReferenceType, ReferenceId);

-- Danh sách phiếu theo kho + trạng thái, mới nhất trước (màn hình duyệt phiếu của quản lý kho).
CREATE INDEX IX_Receipts_Warehouse_Status_Created
    ON InventoryReceipts (WarehouseId, Status, CreatedAt DESC);

CREATE INDEX IX_Issues_Warehouse_Status_Created
    ON InventoryIssues (WarehouseId, Status, CreatedAt DESC);

-- Phiếu xuất của một đơn seller.
CREATE INDEX IX_Issues_SellerOrder
    ON InventoryIssues (SellerOrderId);

CREATE INDEX IX_Transfers_Source_Status
    ON StockTransfers (SourceWarehouseId, Status);

CREATE INDEX IX_Transfers_Destination_Status
    ON StockTransfers (DestinationWarehouseId, Status);


-- ============================================================================
-- 5. VẬN CHUYỂN, TRẢ HÀNG & TÀI KHOẢN
-- ============================================================================

-- Kiện hàng của một đơn seller theo trạng thái vận chuyển.
CREATE INDEX IX_Shipments_SellerOrder_Status
    ON Shipments (SellerOrderId, ShippingStatus);

-- Hàng đợi xử lý trả hàng theo trạng thái.
CREATE INDEX IX_ReturnRequests_Status_Created
    ON ReturnRequests (Status, CreatedAt);

-- Yêu cầu trả hàng của một khách.
CREATE INDEX IX_ReturnRequests_Customer_Created
    ON ReturnRequests (CustomerId, CreatedAt DESC);

-- Dọn token hết hạn và tìm token còn hiệu lực của một người dùng.
CREATE INDEX IX_RefreshTokens_User_Expires
    ON RefreshTokens (UserId, ExpiresAt);

-- Seller duyệt/ngừng: lọc hồ sơ seller theo trạng thái.
CREATE INDEX IX_Sellers_Status
    ON Sellers (Status);
