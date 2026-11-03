/*
    Dự án: E-Commerce Marketplace + Warehouse Management
    Cơ sở dữ liệu: ECommerceWarehouse
    Hệ quản trị CSDL: Microsoft SQL Server
    Mục đích file: Định nghĩa các chỉ mục phụ (Non-Clustered Indexes) nhằm tối ưu hóa hiệu năng truy vấn, 
                   tăng tốc phép JOIN và lọc dữ liệu (WHERE, ORDER BY) trên các bảng có tần suất truy cập cao.
    Thứ tự thực thi: Chạy sau script 03_CreateForeignKeys.sql (hoặc sau khi hoàn tất nạp dữ liệu mẫu 05_InsertSeedData.sql để tối ưu tốc độ bulk insert).
*/

USE ECommerceWarehouse;
GO

-- ============================================================================
-- 1. NHÓM TỐI ƯU HÓA DANH MỤC & SẢN PHẨM (CATALOG & PRODUCTS)
-- ============================================================================

-- Tối ưu hóa kênh người bán (Seller Portal):
-- Tăng tốc độ truy vấn danh sách sản phẩm thuộc quyền quản lý của một Seller cụ thể và tối ưu phép JOIN giữa Sellers và Products.
CREATE INDEX IX_Products_SellerId 
    ON dbo.Products(SellerId);

-- Tối ưu hóa trang mua sắm (Storefront / Category Browsing):
-- Composite Index hỗ trợ truy vấn lọc sản phẩm theo ngành hàng kết hợp trạng thái hiển thị (ví dụ: WHERE CategoryId = @CatId AND ProductStatus = 'Active').
-- Giúp giảm thiểu chi phí quét bảng (Table/Index Scan) khi người dùng lướt xem hàng hóa.
CREATE INDEX IX_Products_Category_Status 
    ON dbo.Products(CategoryId, ProductStatus);

-- Tối ưu hóa trang chi tiết sản phẩm (Product Detail Page):
-- Tăng tốc lấy danh sách tất cả các biến thể (SKU, màu sắc, kích cỡ, giá tiền) của một sản phẩm (WHERE ProductId = @ProductId).
-- Đồng thời hỗ trợ tối đa hiệu năng phép JOIN giữa Products và ProductVariants.
CREATE INDEX IX_Variants_ProductId 
    ON dbo.ProductVariants(ProductId);
GO


-- ============================================================================
-- 2. NHÓM TỐI ƯU HÓA ĐƠN HÀNG & BÁN HÀNG (ORDERS & SALES MANAGEMENT)
-- ============================================================================

-- Tối ưu hóa màn hình "Lịch sử mua hàng" của khách hàng (Customer Order History):
-- Composite Index kết hợp sắp xếp giảm dần (DESC) theo thời gian tạo đơn.
-- Hỗ trợ phân trang (Pagination) xem các đơn hàng gần nhất của khách hàng (WHERE CustomerId = @CustomerId ORDER BY CreatedAt DESC) 
-- mà không phải tốn bộ nhớ CPU/RAM để sắp xếp lại (Sort operator).
CREATE INDEX IX_Orders_Customer_Created 
    ON dbo.Orders(CustomerId, CreatedAt DESC);

-- Tối ưu hóa màn hình quản trị đơn hàng (Admin / Operations Dashboard):
-- Giúp ban vận hành lọc nhanh các đơn hàng theo trạng thái xử lý (Pending, Processing, Completed...) 
-- ưu tiên những đơn mới phát sinh gần nhất (WHERE OrderStatus = @Status ORDER BY CreatedAt DESC).
CREATE INDEX IX_Orders_Status_Created 
    ON dbo.Orders(OrderStatus, CreatedAt DESC);

-- Tối ưu hóa quản lý đơn hàng của Seller (Seller Center Order Fulfillment):
-- Composite Index phục vụ màn hình xử lý đơn của người bán, lọc đơn hàng con theo từng gian hàng và trạng thái đơn 
-- (ví dụ: WHERE SellerId = @SellerId AND Status = 'ReadyToShip').
CREATE INDEX IX_SellerOrders_Seller_Status 
    ON dbo.SellerOrders(SellerId, Status);

-- Tối ưu hóa chi tiết mặt hàng đơn hàng:
-- Tăng tốc độ lấy danh sách các mặt hàng thuộc về một đơn hàng của Seller (WHERE SellerOrderId = @SellerOrderId) 
-- khi in phiếu đóng gói, xuất kho hoặc kiểm hàng.
CREATE INDEX IX_OrderItems_SellerOrder 
    ON dbo.OrderItems(SellerOrderId);
GO


-- ============================================================================
-- 3. NHÓM TỐI ƯU HÓA QUẢN LÝ KHO & BIẾN ĐỘNG TỒN KHO (INVENTORY & AUDIT LOG)
-- ============================================================================

-- Tối ưu hóa kiểm tra số lượng tồn kho (Stock Availability Check):
-- Hỗ trợ truy vấn nhanh số lượng tồn (QuantityOnHand, QuantityReserved) theo từng biến thể sản phẩm 
-- khi khách hàng thêm vào giỏ hàng hoặc hệ thống giữ hàng khi đặt cọc (Reserve Stock).
CREATE INDEX IX_Inventory_Variant 
    ON dbo.Inventory(VariantId);

-- Tối ưu hóa truy vấn lịch sử thẻ kho (Stock Movement Card / Audit Trail):
-- Hỗ trợ thủ kho và kế toán tra cứu toàn bộ lịch sử xuất/nhập/điều chỉnh của một mặt hàng 
-- theo trình tự thời gian mới nhất (WHERE VariantId = @VariantId ORDER BY CreatedAt DESC).
CREATE INDEX IX_StockMovements_Variant_Created 
    ON dbo.StockMovements(VariantId, CreatedAt DESC);
GO


-- ============================================================================
-- 4. NHÓM TỐI ƯU HÓA VẬN CHUYỂN & TRA CỨU ĐƠN (LOGISTICS & SHIPMENTS)
-- ============================================================================

-- Tối ưu hóa tra cứu hành trình kiện hàng (Shipment Tracking):
-- Filtered Index (Chỉ mục có điều kiện lọc WHERE TrackingNumber IS NOT NULL):
-- Chỉ lập chỉ mục cho các bản ghi đã có mã vận đơn thực tế, giúp tiết kiệm dung lượng lưu trữ chỉ mục
-- và tăng tốc độ tối đa cho thao tác tìm kiếm kiện hàng theo mã vận đơn từ đối tác vận chuyển.
CREATE INDEX IX_Shipments_Tracking 
    ON dbo.Shipments(TrackingNumber) 
    WHERE TrackingNumber IS NOT NULL;
GO



-- ============================================================================
-- 2. NHÓM TỐI ƯU HÓA ĐƠN HÀNG & BÁN HÀNG (ORDERS & SALES MANAGEMENT)
-- ============================================================================

-- Tối ưu hóa màn hình "Lịch sử mua hàng" của khách hàng (Customer Order History):
-- Composite Index kết hợp sắp xếp giảm dần (DESC) theo thời gian tạo đơn.
-- Hỗ trợ phân trang (Pagination) xem các đơn hàng gần nhất của khách hàng (WHERE CustomerId = @CustomerId ORDER BY CreatedAt DESC) 
-- mà không phải tốn bộ nhớ CPU/RAM để sắp xếp lại (Sort operator).
CREATE INDEX IX_Orders_Customer_Created 
    ON dbo.Orders(CustomerId, CreatedAt DESC);

-- Tối ưu hóa màn hình quản trị đơn hàng (Admin / Operations Dashboard):
-- Giúp ban vận hành lọc nhanh các đơn hàng theo trạng thái xử lý (Pending, Processing, Completed...) 
-- ưu tiên những đơn mới phát sinh gần nhất (WHERE OrderStatus = @Status ORDER BY CreatedAt DESC).
CREATE INDEX IX_Orders_Status_Created 
    ON dbo.Orders(OrderStatus, CreatedAt DESC);

-- Tối ưu hóa quản lý đơn hàng của Seller (Seller Center Order Fulfillment):
-- Composite Index phục vụ màn hình xử lý đơn của người bán, lọc đơn hàng con theo từng gian hàng và trạng thái đơn 
-- (ví dụ: WHERE SellerId = @SellerId AND Status = 'ReadyToShip').
CREATE INDEX IX_SellerOrders_Seller_Status 
    ON dbo.SellerOrders(SellerId, Status);

-- Tối ưu hóa chi tiết mặt hàng đơn hàng:
-- Tăng tốc độ lấy danh sách các mặt hàng thuộc về một đơn hàng của Seller (WHERE SellerOrderId = @SellerOrderId) 
-- khi in phiếu đóng gói, xuất kho hoặc kiểm hàng.
CREATE INDEX IX_OrderItems_SellerOrder 
    ON dbo.OrderItems(SellerOrderId);
GO


-- ============================================================================
-- 3. NHÓM TỐI ƯU HÓA QUẢN LÝ KHO & BIẾN ĐỘNG TỒN KHO (INVENTORY & AUDIT LOG)
-- ============================================================================

-- Tối ưu hóa kiểm tra số lượng tồn kho (Stock Availability Check):
-- Hỗ trợ truy vấn nhanh số lượng tồn (QuantityOnHand, QuantityReserved) theo từng biến thể sản phẩm 
-- khi khách hàng thêm vào giỏ hàng hoặc hệ thống giữ hàng khi đặt cọc (Reserve Stock).
CREATE INDEX IX_Inventory_Variant 
    ON dbo.Inventory(VariantId);

-- Tối ưu hóa truy vấn lịch sử thẻ kho (Stock Movement Card / Audit Trail):
-- Hỗ trợ thủ kho và kế toán tra cứu toàn bộ lịch sử xuất/nhập/điều chỉnh của một mặt hàng 
-- theo trình tự thời gian mới nhất (WHERE VariantId = @VariantId ORDER BY CreatedAt DESC).
CREATE INDEX IX_StockMovements_Variant_Created 
    ON dbo.StockMovements(VariantId, CreatedAt DESC);
GO


-- ============================================================================
-- 4. NHÓM TỐI ƯU HÓA VẬN CHUYỂN & TRA CỨU ĐƠN (LOGISTICS & SHIPMENTS)
-- ============================================================================

-- Tối ưu hóa tra cứu hành trình kiện hàng (Shipment Tracking):
-- Filtered Index (Chỉ mục có điều kiện lọc WHERE TrackingNumber IS NOT NULL):
-- Chỉ lập chỉ mục cho các bản ghi đã có mã vận đơn thực tế, giúp tiết kiệm dung lượng lưu trữ chỉ mục
-- và tăng tốc độ tối đa cho thao tác tìm kiếm kiện hàng theo mã vận đơn từ đối tác vận chuyển.
CREATE INDEX IX_Shipments_Tracking 
    ON dbo.Shipments(TrackingNumber) 
    WHERE TrackingNumber IS NOT NULL;
GO