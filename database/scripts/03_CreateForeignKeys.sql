/*
    Dự án: E-Commerce Marketplace + Warehouse Management
    Cơ sở dữ liệu: ECommerceWarehouse
    Hệ quản trị CSDL: Microsoft SQL Server
    Mục đích file: Định nghĩa và tạo tất cả các khóa ngoại (Foreign Keys - FK) ràng buộc toàn vẹn dữ liệu giữa các bảng.
    Thứ tự thực thi: Chạy sau script 02_CreateTables.sql.
*/

USE ECommerceWarehouse;
GO

-- ============================================================================
-- 1. MODULE PHÂN QUYỀN & NGƯỜI BÁN (IDENTITY, ROLES & SELLERS)
-- ============================================================================

-- Phân quyền: Một người dùng có thể đảm nhiệm một hoặc nhiều vai trò (Admin, Seller, Customer...)
ALTER TABLE dbo.UserRoles 
    ADD CONSTRAINT FK_UserRoles_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId);

-- Phân quyền: Vai trò được cấp phát phải tồn tại trong danh mục Roles
ALTER TABLE dbo.UserRoles 
    ADD CONSTRAINT FK_UserRoles_Roles FOREIGN KEY (RoleId) REFERENCES dbo.Roles(RoleId);

-- Người bán: Mỗi hồ sơ Seller phải gắn liền với một tài khoản người dùng đã đăng ký
ALTER TABLE dbo.Sellers 
    ADD CONSTRAINT FK_Sellers_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId);

-- Gian hàng: Mỗi Shop (cửa hàng kinh doanh) trực thuộc quyền quản lý của một Seller
ALTER TABLE dbo.Shops 
    ADD CONSTRAINT FK_Shops_Sellers FOREIGN KEY (SellerId) REFERENCES dbo.Sellers(SellerId);
GO


-- ============================================================================
-- 2. MODULE DANH MỤC & SẢN PHẨM (CATALOG & PRODUCTS)
-- ============================================================================

-- Danh mục đa cấp: Một danh mục con liên kết với danh mục cha (Self-referencing FK, NULL nếu là cấp cao nhất)
ALTER TABLE dbo.Categories 
    ADD CONSTRAINT FK_Categories_Parent FOREIGN KEY (ParentCategoryId) REFERENCES dbo.Categories(CategoryId);

-- Sản phẩm: Xác định chủ sở hữu sản phẩm (Seller)
ALTER TABLE dbo.Products 
    ADD CONSTRAINT FK_Products_Sellers FOREIGN KEY (SellerId) REFERENCES dbo.Sellers(SellerId);

-- Sản phẩm: Xác định gian hàng cụ thể đang bày bán sản phẩm
ALTER TABLE dbo.Products 
    ADD CONSTRAINT FK_Products_Shops FOREIGN KEY (ShopId) REFERENCES dbo.Shops(ShopId);

-- Sản phẩm: Sản phẩm phải thuộc về một danh mục ngành hàng hợp lệ
ALTER TABLE dbo.Products 
    ADD CONSTRAINT FK_Products_Categories FOREIGN KEY (CategoryId) REFERENCES dbo.Categories(CategoryId);

-- Biến thể sản phẩm: Các phân loại hàng (màu sắc, kích cỡ...) thuộc về sản phẩm gốc
ALTER TABLE dbo.ProductVariants 
    ADD CONSTRAINT FK_Variants_Products FOREIGN KEY (ProductId) REFERENCES dbo.Products(ProductId);

-- Hình ảnh sản phẩm: Hình ảnh minh họa thuộc về sản phẩm tương ứng
ALTER TABLE dbo.ProductImages 
    ADD CONSTRAINT FK_Images_Products FOREIGN KEY (ProductId) REFERENCES dbo.Products(ProductId);
GO


-- ============================================================================
-- 3. MODULE KHÁCH HÀNG & TƯƠNG TÁC (CUSTOMER ADDRESSES, CARTS & WISHLISTS)
-- ============================================================================

-- Sổ địa chỉ: Địa chỉ nhận hàng thuộc về tài khoản khách hàng
ALTER TABLE dbo.UserAddresses 
    ADD CONSTRAINT FK_Addresses_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId);

-- Giỏ hàng: Mỗi khách hàng có một giỏ hàng mua sắm
ALTER TABLE dbo.Carts 
    ADD CONSTRAINT FK_Carts_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId);

-- Chi tiết giỏ hàng: Sản phẩm trong giỏ thuộc về giỏ hàng cụ thể
ALTER TABLE dbo.CartItems 
    ADD CONSTRAINT FK_CartItems_Carts FOREIGN KEY (CartId) REFERENCES dbo.Carts(CartId);

-- Chi tiết giỏ hàng: Tham chiếu chính xác đến phân loại/biến thể sản phẩm khách đã chọn
ALTER TABLE dbo.CartItems 
    ADD CONSTRAINT FK_CartItems_Variants FOREIGN KEY (VariantId) REFERENCES dbo.ProductVariants(VariantId);

-- Danh sách yêu thích: Bộ sưu tập yêu thích của khách hàng
ALTER TABLE dbo.Wishlists 
    ADD CONSTRAINT FK_Wishlists_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId);

-- Chi tiết danh sách yêu thích: Sản phẩm lưu trong danh sách yêu thích cụ thể
ALTER TABLE dbo.WishlistItems 
    ADD CONSTRAINT FK_WishlistItems_Wishlists FOREIGN KEY (WishlistId) REFERENCES dbo.Wishlists(WishlistId);

-- Chi tiết danh sách yêu thích: Tham chiếu đến sản phẩm được yêu thích
ALTER TABLE dbo.WishlistItems 
    ADD CONSTRAINT FK_WishlistItems_Products FOREIGN KEY (ProductId) REFERENCES dbo.Products(ProductId);
GO


-- ============================================================================
-- 4. MODULE ĐƠN HÀNG, THANH TOÁN & HOÀN TIỀN (ORDERS, PAYMENTS & REFUNDS)
-- ============================================================================

-- Đơn hàng tổng: Khách hàng thực hiện đặt đơn hàng
ALTER TABLE dbo.Orders 
    ADD CONSTRAINT FK_Orders_Customers FOREIGN KEY (CustomerId) REFERENCES dbo.Users(UserId);

-- Đơn hàng người bán (Sub-Order): Thuộc về đơn hàng tổng của khách
ALTER TABLE dbo.SellerOrders 
    ADD CONSTRAINT FK_SellerOrders_Orders FOREIGN KEY (OrderId) REFERENCES dbo.Orders(OrderId);

-- Đơn hàng người bán: Người bán chịu trách nhiệm đóng gói và xử lý đơn này
ALTER TABLE dbo.SellerOrders 
    ADD CONSTRAINT FK_SellerOrders_Sellers FOREIGN KEY (SellerId) REFERENCES dbo.Sellers(SellerId);

-- Đơn hàng người bán: Kho hàng được phân bổ để xuất đơn (kho sàn hoặc kho seller, có thể NULL trước khi điều phối)
ALTER TABLE dbo.SellerOrders 
    ADD CONSTRAINT FK_SellerOrders_Warehouses FOREIGN KEY (WarehouseId) REFERENCES dbo.Warehouses(WarehouseId);

-- Chi tiết đơn hàng: Dòng hàng thuộc về đơn hàng của seller tương ứng
ALTER TABLE dbo.OrderItems 
    ADD CONSTRAINT FK_OrderItems_SellerOrders FOREIGN KEY (SellerOrderId) REFERENCES dbo.SellerOrders(SellerOrderId);

-- Chi tiết đơn hàng: Biến thể sản phẩm cụ thể được khách đặt mua
ALTER TABLE dbo.OrderItems 
    ADD CONSTRAINT FK_OrderItems_Variants FOREIGN KEY (VariantId) REFERENCES dbo.ProductVariants(VariantId);

-- Thanh toán: Giao dịch thanh toán gắn liền với đơn hàng tổng
ALTER TABLE dbo.Payments 
    ADD CONSTRAINT FK_Payments_Orders FOREIGN KEY (OrderId) REFERENCES dbo.Orders(OrderId);

-- Hoàn tiền: Giao dịch hoàn tiền phải liên kết với khoản thanh toán ban đầu
ALTER TABLE dbo.Refunds 
    ADD CONSTRAINT FK_Refunds_Payments FOREIGN KEY (PaymentId) REFERENCES dbo.Payments(PaymentId);

-- Hoàn tiền: Giao dịch hoàn tiền liên kết đến đơn bán hàng cụ thể bị trả/hủy (nếu có)
ALTER TABLE dbo.Refunds 
    ADD CONSTRAINT FK_Refunds_SellerOrders FOREIGN KEY (SellerOrderId) REFERENCES dbo.SellerOrders(SellerOrderId);
GO


-- ============================================================================
-- 5. MODULE CẤU TRÚC KHO & TỒN KHO (WAREHOUSE STRUCTURE & INVENTORY)
-- ============================================================================

-- Kho hàng: Nếu là kho riêng của người bán (WarehouseType = 'Seller'), liên kết đến Seller sở hữu
ALTER TABLE dbo.Warehouses 
    ADD CONSTRAINT FK_Warehouses_Sellers FOREIGN KEY (OwnerSellerId) REFERENCES dbo.Sellers(SellerId);

-- Vị trí trong kho (Kệ/Ngăn/Khu vực): Trực thuộc một kho hàng nhất định
ALTER TABLE dbo.WarehouseLocations 
    ADD CONSTRAINT FK_Locations_Warehouses FOREIGN KEY (WarehouseId) REFERENCES dbo.Warehouses(WarehouseId);

-- Bảng tồn kho tổng hợp: Xác định kho chứa hàng tồn
ALTER TABLE dbo.Inventory 
    ADD CONSTRAINT FK_Inventory_Warehouses FOREIGN KEY (WarehouseId) REFERENCES dbo.Warehouses(WarehouseId);

-- Bảng tồn kho tổng hợp: Xác định vị trí/ô kệ lưu trữ hàng tồn
ALTER TABLE dbo.Inventory 
    ADD CONSTRAINT FK_Inventory_Locations FOREIGN KEY (LocationId) REFERENCES dbo.WarehouseLocations(LocationId);

-- Bảng tồn kho tổng hợp: Xác định biến thể sản phẩm đang tồn kho
ALTER TABLE dbo.Inventory 
    ADD CONSTRAINT FK_Inventory_Variants FOREIGN KEY (VariantId) REFERENCES dbo.ProductVariants(VariantId);
GO


-- ============================================================================
-- 6. MODULE NHẬP KHO (INVENTORY RECEIPTS - INBOUND)
-- ============================================================================

-- Phiếu nhập kho: Kho đích tiếp nhận hàng hóa nhập về
ALTER TABLE dbo.InventoryReceipts 
    ADD CONSTRAINT FK_Receipts_Warehouses FOREIGN KEY (WarehouseId) REFERENCES dbo.Warehouses(WarehouseId);

-- Phiếu nhập kho: Người bán gửi hàng nhập vào kho (áp dụng cho luồng Seller ký gửi hàng)
ALTER TABLE dbo.InventoryReceipts 
    ADD CONSTRAINT FK_Receipts_Sellers FOREIGN KEY (SenderSellerId) REFERENCES dbo.Sellers(SellerId);

-- Chi tiết phiếu nhập: Gắn liền với phiếu nhập kho tương ứng
ALTER TABLE dbo.ReceiptDetails 
    ADD CONSTRAINT FK_ReceiptDetails_Receipts FOREIGN KEY (ReceiptId) REFERENCES dbo.InventoryReceipts(ReceiptId);

-- Chi tiết phiếu nhập: Biến thể hàng hóa được nhập kho
ALTER TABLE dbo.ReceiptDetails 
    ADD CONSTRAINT FK_ReceiptDetails_Variants FOREIGN KEY (VariantId) REFERENCES dbo.ProductVariants(VariantId);

-- Chi tiết phiếu nhập: Vị trí/ô kệ lưu trữ được chỉ định cất hàng
ALTER TABLE dbo.ReceiptDetails 
    ADD CONSTRAINT FK_ReceiptDetails_Locations FOREIGN KEY (LocationId) REFERENCES dbo.WarehouseLocations(LocationId);
GO


-- ============================================================================
-- 7. MODULE XUẤT KHO (INVENTORY ISSUES - OUTBOUND)
-- ============================================================================

-- Phiếu xuất kho: Kho thực hiện việc xuất hàng đi
ALTER TABLE dbo.InventoryIssues 
    ADD CONSTRAINT FK_Issues_Warehouses FOREIGN KEY (WarehouseId) REFERENCES dbo.Warehouses(WarehouseId);

-- Phiếu xuất kho: Đơn hàng cần xuất kho để đóng gói/giao hàng (NULL nếu xuất do điều chỉnh/tiêu hủy)
ALTER TABLE dbo.InventoryIssues 
    ADD CONSTRAINT FK_Issues_SellerOrders FOREIGN KEY (SellerOrderId) REFERENCES dbo.SellerOrders(SellerOrderId);

-- Chi tiết phiếu xuất: Gắn liền với phiếu xuất kho tương ứng
ALTER TABLE dbo.IssueDetails 
    ADD CONSTRAINT FK_IssueDetails_Issues FOREIGN KEY (IssueId) REFERENCES dbo.InventoryIssues(IssueId);

-- Chi tiết phiếu xuất: Biến thể hàng hóa được lấy ra khỏi kho
ALTER TABLE dbo.IssueDetails 
    ADD CONSTRAINT FK_IssueDetails_Variants FOREIGN KEY (VariantId) REFERENCES dbo.ProductVariants(VariantId);

-- Chi tiết phiếu xuất: Vị trí/ô kệ thực tế đã thực hiện lấy hàng ra
ALTER TABLE dbo.IssueDetails 
    ADD CONSTRAINT FK_IssueDetails_Locations FOREIGN KEY (LocationId) REFERENCES dbo.WarehouseLocations(LocationId);
GO


-- ============================================================================
-- 8. MODULE ĐIỀU CHUYỂN KHO NỘI BỘ (STOCK TRANSFERS)
-- ============================================================================

-- Phiếu điều chuyển kho: Kho nguồn xuất hàng đi
ALTER TABLE dbo.StockTransfers 
    ADD CONSTRAINT FK_Transfers_Source FOREIGN KEY (SourceWarehouseId) REFERENCES dbo.Warehouses(WarehouseId);

-- Phiếu điều chuyển kho: Kho đích tiếp nhận hàng đến
ALTER TABLE dbo.StockTransfers 
    ADD CONSTRAINT FK_Transfers_Destination FOREIGN KEY (DestinationWarehouseId) REFERENCES dbo.Warehouses(WarehouseId);

-- Chi tiết điều chuyển: Gắn liền với phiếu điều chuyển kho
ALTER TABLE dbo.StockTransferDetails 
    ADD CONSTRAINT FK_TransferDetails_Transfers FOREIGN KEY (TransferId) REFERENCES dbo.StockTransfers(TransferId);

-- Chi tiết điều chuyển: Biến thể hàng hóa cần điều chuyển
ALTER TABLE dbo.StockTransferDetails 
    ADD CONSTRAINT FK_TransferDetails_Variants FOREIGN KEY (VariantId) REFERENCES dbo.ProductVariants(VariantId);

-- Chi tiết điều chuyển: Vị trí lấy hàng tại kho nguồn
ALTER TABLE dbo.StockTransferDetails 
    ADD CONSTRAINT FK_TransferDetails_SourceLocation FOREIGN KEY (SourceLocationId) REFERENCES dbo.WarehouseLocations(LocationId);

-- Chi tiết điều chuyển: Vị trí sắp xếp vào kho đích (có thể cập nhật khi kho đích nhận hàng)
ALTER TABLE dbo.StockTransferDetails 
    ADD CONSTRAINT FK_TransferDetails_DestinationLocation FOREIGN KEY (DestinationLocationId) REFERENCES dbo.WarehouseLocations(LocationId);
GO


-- ============================================================================
-- 9. MODULE NHẬT KÝ BIẾN ĐỘNG KHO (STOCK MOVEMENTS / AUDIT TRAIL)
-- ============================================================================

-- Nhật ký kho: Kho hàng diễn ra giao dịch biến động tồn kho
ALTER TABLE dbo.StockMovements 
    ADD CONSTRAINT FK_Movements_Warehouses FOREIGN KEY (WarehouseId) REFERENCES dbo.Warehouses(WarehouseId);

-- Nhật ký kho: Vị trí/ô kệ diễn ra biến động tồn kho
ALTER TABLE dbo.StockMovements 
    ADD CONSTRAINT FK_Movements_Locations FOREIGN KEY (LocationId) REFERENCES dbo.WarehouseLocations(LocationId);

-- Nhật ký kho: Biến thể hàng hóa có số lượng tồn kho thay đổi
ALTER TABLE dbo.StockMovements 
    ADD CONSTRAINT FK_Movements_Variants FOREIGN KEY (VariantId) REFERENCES dbo.ProductVariants(VariantId);
GO


-- ============================================================================
-- 10. MODULE VẬN CHUYỂN & ĐÁNH GIÁ (SHIPMENTS & REVIEWS)
-- ============================================================================

-- Giao hàng: Kiện hàng vận chuyển gắn liền với đơn hàng của người bán
ALTER TABLE dbo.Shipments 
    ADD CONSTRAINT FK_Shipments_SellerOrders FOREIGN KEY (SellerOrderId) REFERENCES dbo.SellerOrders(SellerOrderId);

-- Đánh giá sản phẩm: Khách hàng thực hiện viết đánh giá sản phẩm
ALTER TABLE dbo.Reviews 
    ADD CONSTRAINT FK_Reviews_Customers FOREIGN KEY (CustomerId) REFERENCES dbo.Users(UserId);

-- Đánh giá sản phẩm: Đánh giá phải gắn liền với từng chi tiết đơn hàng đã mua
ALTER TABLE dbo.Reviews 
    ADD CONSTRAINT FK_Reviews_OrderItems FOREIGN KEY (OrderItemId) REFERENCES dbo.OrderItems(OrderItemId);
GO



-- ============================================================================
-- 2. MODULE DANH MỤC & SẢN PHẨM (CATALOG & PRODUCTS)
-- ============================================================================

-- Danh mục đa cấp: Một danh mục con liên kết với danh mục cha (Self-referencing FK, NULL nếu là cấp cao nhất)
ALTER TABLE dbo.Categories 
    ADD CONSTRAINT FK_Categories_Parent FOREIGN KEY (ParentCategoryId) REFERENCES dbo.Categories(CategoryId);

-- Sản phẩm: Xác định chủ sở hữu sản phẩm (Seller)
ALTER TABLE dbo.Products 
    ADD CONSTRAINT FK_Products_Sellers FOREIGN KEY (SellerId) REFERENCES dbo.Sellers(SellerId);

-- Sản phẩm: Xác định gian hàng cụ thể đang bày bán sản phẩm
ALTER TABLE dbo.Products 
    ADD CONSTRAINT FK_Products_Shops FOREIGN KEY (ShopId) REFERENCES dbo.Shops(ShopId);

-- Sản phẩm: Sản phẩm phải thuộc về một danh mục ngành hàng hợp lệ
ALTER TABLE dbo.Products 
    ADD CONSTRAINT FK_Products_Categories FOREIGN KEY (CategoryId) REFERENCES dbo.Categories(CategoryId);

-- Biến thể sản phẩm: Các phân loại hàng (màu sắc, kích cỡ...) thuộc về sản phẩm gốc
ALTER TABLE dbo.ProductVariants 
    ADD CONSTRAINT FK_Variants_Products FOREIGN KEY (ProductId) REFERENCES dbo.Products(ProductId);

-- Hình ảnh sản phẩm: Hình ảnh minh họa thuộc về sản phẩm tương ứng
ALTER TABLE dbo.ProductImages 
    ADD CONSTRAINT FK_Images_Products FOREIGN KEY (ProductId) REFERENCES dbo.Products(ProductId);
GO


-- ============================================================================
-- 3. MODULE KHÁCH HÀNG & TƯƠNG TÁC (CUSTOMER ADDRESSES, CARTS & WISHLISTS)
-- ============================================================================

-- Sổ địa chỉ: Địa chỉ nhận hàng thuộc về tài khoản khách hàng
ALTER TABLE dbo.UserAddresses 
    ADD CONSTRAINT FK_Addresses_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId);

-- Giỏ hàng: Mỗi khách hàng có một giỏ hàng mua sắm
ALTER TABLE dbo.Carts 
    ADD CONSTRAINT FK_Carts_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId);

-- Chi tiết giỏ hàng: Sản phẩm trong giỏ thuộc về giỏ hàng cụ thể
ALTER TABLE dbo.CartItems 
    ADD CONSTRAINT FK_CartItems_Carts FOREIGN KEY (CartId) REFERENCES dbo.Carts(CartId);

-- Chi tiết giỏ hàng: Tham chiếu chính xác đến phân loại/biến thể sản phẩm khách đã chọn
ALTER TABLE dbo.CartItems 
    ADD CONSTRAINT FK_CartItems_Variants FOREIGN KEY (VariantId) REFERENCES dbo.ProductVariants(VariantId);

-- Danh sách yêu thích: Bộ sưu tập yêu thích của khách hàng
ALTER TABLE dbo.Wishlists 
    ADD CONSTRAINT FK_Wishlists_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId);

-- Chi tiết danh sách yêu thích: Sản phẩm lưu trong danh sách yêu thích cụ thể
ALTER TABLE dbo.WishlistItems 
    ADD CONSTRAINT FK_WishlistItems_Wishlists FOREIGN KEY (WishlistId) REFERENCES dbo.Wishlists(WishlistId);

-- Chi tiết danh sách yêu thích: Tham chiếu đến sản phẩm được yêu thích
ALTER TABLE dbo.WishlistItems 
    ADD CONSTRAINT FK_WishlistItems_Products FOREIGN KEY (ProductId) REFERENCES dbo.Products(ProductId);
GO


-- ============================================================================
-- 4. MODULE ĐƠN HÀNG, THANH TOÁN & HOÀN TIỀN (ORDERS, PAYMENTS & REFUNDS)
-- ============================================================================

-- Đơn hàng tổng: Khách hàng thực hiện đặt đơn hàng
ALTER TABLE dbo.Orders 
    ADD CONSTRAINT FK_Orders_Customers FOREIGN KEY (CustomerId) REFERENCES dbo.Users(UserId);

-- Đơn hàng người bán (Sub-Order): Thuộc về đơn hàng tổng của khách
ALTER TABLE dbo.SellerOrders 
    ADD CONSTRAINT FK_SellerOrders_Orders FOREIGN KEY (OrderId) REFERENCES dbo.Orders(OrderId);

-- Đơn hàng người bán: Người bán chịu trách nhiệm đóng gói và xử lý đơn này
ALTER TABLE dbo.SellerOrders 
    ADD CONSTRAINT FK_SellerOrders_Sellers FOREIGN KEY (SellerId) REFERENCES dbo.Sellers(SellerId);

-- Đơn hàng người bán: Kho hàng được phân bổ để xuất đơn (kho sàn hoặc kho seller, có thể NULL trước khi điều phối)
ALTER TABLE dbo.SellerOrders 
    ADD CONSTRAINT FK_SellerOrders_Warehouses FOREIGN KEY (WarehouseId) REFERENCES dbo.Warehouses(WarehouseId);

-- Chi tiết đơn hàng: Dòng hàng thuộc về đơn hàng của seller tương ứng
ALTER TABLE dbo.OrderItems 
    ADD CONSTRAINT FK_OrderItems_SellerOrders FOREIGN KEY (SellerOrderId) REFERENCES dbo.SellerOrders(SellerOrderId);

-- Chi tiết đơn hàng: Biến thể sản phẩm cụ thể được khách đặt mua
ALTER TABLE dbo.OrderItems 
    ADD CONSTRAINT FK_OrderItems_Variants FOREIGN KEY (VariantId) REFERENCES dbo.ProductVariants(VariantId);

-- Thanh toán: Giao dịch thanh toán gắn liền với đơn hàng tổng
ALTER TABLE dbo.Payments 
    ADD CONSTRAINT FK_Payments_Orders FOREIGN KEY (OrderId) REFERENCES dbo.Orders(OrderId);

-- Hoàn tiền: Giao dịch hoàn tiền phải liên kết với khoản thanh toán ban đầu
ALTER TABLE dbo.Refunds 
    ADD CONSTRAINT FK_Refunds_Payments FOREIGN KEY (PaymentId) REFERENCES dbo.Payments(PaymentId);

-- Hoàn tiền: Giao dịch hoàn tiền liên kết đến đơn bán hàng cụ thể bị trả/hủy (nếu có)
ALTER TABLE dbo.Refunds 
    ADD CONSTRAINT FK_Refunds_SellerOrders FOREIGN KEY (SellerOrderId) REFERENCES dbo.SellerOrders(SellerOrderId);
GO


-- ============================================================================
-- 5. MODULE CẤU TRÚC KHO & TỒN KHO (WAREHOUSE STRUCTURE & INVENTORY)
-- ============================================================================

-- Kho hàng: Nếu là kho riêng của người bán (WarehouseType = 'Seller'), liên kết đến Seller sở hữu
ALTER TABLE dbo.Warehouses 
    ADD CONSTRAINT FK_Warehouses_Sellers FOREIGN KEY (OwnerSellerId) REFERENCES dbo.Sellers(SellerId);

-- Vị trí trong kho (Kệ/Ngăn/Khu vực): Trực thuộc một kho hàng nhất định
ALTER TABLE dbo.WarehouseLocations 
    ADD CONSTRAINT FK_Locations_Warehouses FOREIGN KEY (WarehouseId) REFERENCES dbo.Warehouses(WarehouseId);

-- Bảng tồn kho tổng hợp: Xác định kho chứa hàng tồn
ALTER TABLE dbo.Inventory 
    ADD CONSTRAINT FK_Inventory_Warehouses FOREIGN KEY (WarehouseId) REFERENCES dbo.Warehouses(WarehouseId);

-- Bảng tồn kho tổng hợp: Xác định vị trí/ô kệ lưu trữ hàng tồn
ALTER TABLE dbo.Inventory 
    ADD CONSTRAINT FK_Inventory_Locations FOREIGN KEY (LocationId) REFERENCES dbo.WarehouseLocations(LocationId);

-- Bảng tồn kho tổng hợp: Xác định biến thể sản phẩm đang tồn kho
ALTER TABLE dbo.Inventory 
    ADD CONSTRAINT FK_Inventory_Variants FOREIGN KEY (VariantId) REFERENCES dbo.ProductVariants(VariantId);
GO


-- ============================================================================
-- 6. MODULE NHẬP KHO (INVENTORY RECEIPTS - INBOUND)
-- ============================================================================

-- Phiếu nhập kho: Kho đích tiếp nhận hàng hóa nhập về
ALTER TABLE dbo.InventoryReceipts 
    ADD CONSTRAINT FK_Receipts_Warehouses FOREIGN KEY (WarehouseId) REFERENCES dbo.Warehouses(WarehouseId);

-- Phiếu nhập kho: Người bán gửi hàng nhập vào kho (áp dụng cho luồng Seller ký gửi hàng)
ALTER TABLE dbo.InventoryReceipts 
    ADD CONSTRAINT FK_Receipts_Sellers FOREIGN KEY (SenderSellerId) REFERENCES dbo.Sellers(SellerId);

-- Chi tiết phiếu nhập: Gắn liền với phiếu nhập kho tương ứng
ALTER TABLE dbo.ReceiptDetails 
    ADD CONSTRAINT FK_ReceiptDetails_Receipts FOREIGN KEY (ReceiptId) REFERENCES dbo.InventoryReceipts(ReceiptId);

-- Chi tiết phiếu nhập: Biến thể hàng hóa được nhập kho
ALTER TABLE dbo.ReceiptDetails 
    ADD CONSTRAINT FK_ReceiptDetails_Variants FOREIGN KEY (VariantId) REFERENCES dbo.ProductVariants(VariantId);

-- Chi tiết phiếu nhập: Vị trí/ô kệ lưu trữ được chỉ định cất hàng
ALTER TABLE dbo.ReceiptDetails 
    ADD CONSTRAINT FK_ReceiptDetails_Locations FOREIGN KEY (LocationId) REFERENCES dbo.WarehouseLocations(LocationId);
GO


-- ============================================================================
-- 7. MODULE XUẤT KHO (INVENTORY ISSUES - OUTBOUND)
-- ============================================================================

-- Phiếu xuất kho: Kho thực hiện việc xuất hàng đi
ALTER TABLE dbo.InventoryIssues 
    ADD CONSTRAINT FK_Issues_Warehouses FOREIGN KEY (WarehouseId) REFERENCES dbo.Warehouses(WarehouseId);

-- Phiếu xuất kho: Đơn hàng cần xuất kho để đóng gói/giao hàng (NULL nếu xuất do điều chỉnh/tiêu hủy)
ALTER TABLE dbo.InventoryIssues 
    ADD CONSTRAINT FK_Issues_SellerOrders FOREIGN KEY (SellerOrderId) REFERENCES dbo.SellerOrders(SellerOrderId);

-- Chi tiết phiếu xuất: Gắn liền với phiếu xuất kho tương ứng
ALTER TABLE dbo.IssueDetails 
    ADD CONSTRAINT FK_IssueDetails_Issues FOREIGN KEY (IssueId) REFERENCES dbo.InventoryIssues(IssueId);

-- Chi tiết phiếu xuất: Biến thể hàng hóa được lấy ra khỏi kho
ALTER TABLE dbo.IssueDetails 
    ADD CONSTRAINT FK_IssueDetails_Variants FOREIGN KEY (VariantId) REFERENCES dbo.ProductVariants(VariantId);

-- Chi tiết phiếu xuất: Vị trí/ô kệ thực tế đã thực hiện lấy hàng ra
ALTER TABLE dbo.IssueDetails 
    ADD CONSTRAINT FK_IssueDetails_Locations FOREIGN KEY (LocationId) REFERENCES dbo.WarehouseLocations(LocationId);
GO


-- ============================================================================
-- 8. MODULE ĐIỀU CHUYỂN KHO NỘI BỘ (STOCK TRANSFERS)
-- ============================================================================

-- Phiếu điều chuyển kho: Kho nguồn xuất hàng đi
ALTER TABLE dbo.StockTransfers 
    ADD CONSTRAINT FK_Transfers_Source FOREIGN KEY (SourceWarehouseId) REFERENCES dbo.Warehouses(WarehouseId);

-- Phiếu điều chuyển kho: Kho đích tiếp nhận hàng đến
ALTER TABLE dbo.StockTransfers 
    ADD CONSTRAINT FK_Transfers_Destination FOREIGN KEY (DestinationWarehouseId) REFERENCES dbo.Warehouses(WarehouseId);

-- Chi tiết điều chuyển: Gắn liền với phiếu điều chuyển kho
ALTER TABLE dbo.StockTransferDetails 
    ADD CONSTRAINT FK_TransferDetails_Transfers FOREIGN KEY (TransferId) REFERENCES dbo.StockTransfers(TransferId);

-- Chi tiết điều chuyển: Biến thể hàng hóa cần điều chuyển
ALTER TABLE dbo.StockTransferDetails 
    ADD CONSTRAINT FK_TransferDetails_Variants FOREIGN KEY (VariantId) REFERENCES dbo.ProductVariants(VariantId);

-- Chi tiết điều chuyển: Vị trí lấy hàng tại kho nguồn
ALTER TABLE dbo.StockTransferDetails 
    ADD CONSTRAINT FK_TransferDetails_SourceLocation FOREIGN KEY (SourceLocationId) REFERENCES dbo.WarehouseLocations(LocationId);

-- Chi tiết điều chuyển: Vị trí sắp xếp vào kho đích (có thể cập nhật khi kho đích nhận hàng)
ALTER TABLE dbo.StockTransferDetails 
    ADD CONSTRAINT FK_TransferDetails_DestinationLocation FOREIGN KEY (DestinationLocationId) REFERENCES dbo.WarehouseLocations(LocationId);
GO


-- ============================================================================
-- 9. MODULE NHẬT KÝ BIẾN ĐỘNG KHO (STOCK MOVEMENTS / AUDIT TRAIL)
-- ============================================================================

-- Nhật ký kho: Kho hàng diễn ra giao dịch biến động tồn kho
ALTER TABLE dbo.StockMovements 
    ADD CONSTRAINT FK_Movements_Warehouses FOREIGN KEY (WarehouseId) REFERENCES dbo.Warehouses(WarehouseId);

-- Nhật ký kho: Vị trí/ô kệ diễn ra biến động tồn kho
ALTER TABLE dbo.StockMovements 
    ADD CONSTRAINT FK_Movements_Locations FOREIGN KEY (LocationId) REFERENCES dbo.WarehouseLocations(LocationId);

-- Nhật ký kho: Biến thể hàng hóa có số lượng tồn kho thay đổi
ALTER TABLE dbo.StockMovements 
    ADD CONSTRAINT FK_Movements_Variants FOREIGN KEY (VariantId) REFERENCES dbo.ProductVariants(VariantId);
GO


-- ============================================================================
-- 10. MODULE VẬN CHUYỂN & ĐÁNH GIÁ (SHIPMENTS & REVIEWS)
-- ============================================================================

-- Giao hàng: Kiện hàng vận chuyển gắn liền với đơn hàng của người bán
ALTER TABLE dbo.Shipments 
    ADD CONSTRAINT FK_Shipments_SellerOrders FOREIGN KEY (SellerOrderId) REFERENCES dbo.SellerOrders(SellerOrderId);

-- Đánh giá sản phẩm: Khách hàng thực hiện viết đánh giá sản phẩm
ALTER TABLE dbo.Reviews 
    ADD CONSTRAINT FK_Reviews_Customers FOREIGN KEY (CustomerId) REFERENCES dbo.Users(UserId);

-- Đánh giá sản phẩm: Đánh giá phải gắn liền với từng chi tiết đơn hàng đã mua
ALTER TABLE dbo.Reviews 
    ADD CONSTRAINT FK_Reviews_OrderItems FOREIGN KEY (OrderItemId) REFERENCES dbo.OrderItems(OrderItemId);
GO