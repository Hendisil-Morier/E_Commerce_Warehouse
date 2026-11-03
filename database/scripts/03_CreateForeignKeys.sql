/*
================================================================================
 Dự án      : E-Commerce Marketplace (đa người bán) + Warehouse Management
 Database   : ECommerceWarehouse (MySQL 8.0.16+)
 File       : 03_CreateForeignKeys.sql
 Mục đích   : Tạo toàn bộ khóa ngoại (FK) bảo đảm toàn vẹn dữ liệu giữa các bảng.
 Chạy sau   : 02_CreateTables.sql

 DANH SÁCH MỤC:
   1. Identity & Sellers          6. Nhập kho (Receipts)
   2. Product Catalog             7. Xuất kho (Issues)
   3. Customer Interactions       8. Điều chuyển (Transfers)
   4. Orders & Payments           9. Kiểm kê (Stock Counts) & Sổ cái (Movements)
   5. Warehouse & Inventory      10. Shipping, Returns & Reviews

 GHI CHÚ:
   - MySQL tự tạo chỉ mục cho cột FK nếu chưa có, nên file 04 chỉ bổ sung chỉ mục phục vụ truy vấn.
   - Mặc định ON DELETE/UPDATE = RESTRICT (không xóa được bản ghi cha khi còn con).
     Chỉ dùng CASCADE cho dữ liệu "phụ thuộc hoàn toàn": UserRoles, RefreshTokens, CartItems, WishlistItems.
   - KHÓA NGOẠI KÉP (composite FK): (LocationId, WarehouseId) -> WarehouseLocations và
     (ReceiptId|IssueId|StockCountId, WarehouseId) -> bảng phiếu. Nhờ đó không thể ghi vị trí của
     kho A kèm mã kho B, và chi tiết phiếu luôn cùng kho với phiếu cha. Đây là ràng buộc khai báo,
     không cần trigger.
================================================================================
*/

USE ECommerceWarehouse;

-- ============================================================================
-- 1. IDENTITY & SELLERS (TÀI KHOẢN, PHÂN QUYỀN, NGƯỜI BÁN, GIAN HÀNG)
-- ============================================================================

-- Phân quyền: xóa người dùng (nếu được phép) thì xóa luôn bản ghi vai trò đi kèm.
ALTER TABLE UserRoles
    ADD CONSTRAINT FK_UserRoles_Users FOREIGN KEY (UserId) REFERENCES Users (UserId) ON DELETE CASCADE;

-- Phân quyền: vai trò cấp phát phải tồn tại trong danh mục Roles.
ALTER TABLE UserRoles
    ADD CONSTRAINT FK_UserRoles_Roles FOREIGN KEY (RoleId) REFERENCES Roles (RoleId);

-- Refresh token thuộc về một tài khoản; xóa tài khoản thì xóa token.
ALTER TABLE RefreshTokens
    ADD CONSTRAINT FK_RefreshTokens_Users FOREIGN KEY (UserId) REFERENCES Users (UserId) ON DELETE CASCADE;

-- Hồ sơ người bán gắn với một tài khoản đã đăng ký.
ALTER TABLE Sellers
    ADD CONSTRAINT FK_Sellers_Users FOREIGN KEY (UserId) REFERENCES Users (UserId);

-- Mỗi shop thuộc một seller.
ALTER TABLE Shops
    ADD CONSTRAINT FK_Shops_Sellers FOREIGN KEY (SellerId) REFERENCES Sellers (SellerId);


-- ============================================================================
-- 2. PRODUCT CATALOG (DANH MỤC, SẢN PHẨM, BIẾN THỂ, HÌNH ẢNH)
-- ============================================================================

-- Danh mục đa cấp: danh mục con trỏ về danh mục cha (tự tham chiếu).
ALTER TABLE Categories
    ADD CONSTRAINT FK_Categories_Parent FOREIGN KEY (ParentCategoryId) REFERENCES Categories (CategoryId);

-- Sản phẩm thuộc một shop (seller suy ra qua shop) và một danh mục.
ALTER TABLE Products
    ADD CONSTRAINT FK_Products_Shops FOREIGN KEY (ShopId) REFERENCES Shops (ShopId);
ALTER TABLE Products
    ADD CONSTRAINT FK_Products_Categories FOREIGN KEY (CategoryId) REFERENCES Categories (CategoryId);

-- Biến thể (SKU) thuộc sản phẩm gốc.
ALTER TABLE ProductVariants
    ADD CONSTRAINT FK_Variants_Products FOREIGN KEY (ProductId) REFERENCES Products (ProductId);

-- Ảnh thuộc sản phẩm.
ALTER TABLE ProductImages
    ADD CONSTRAINT FK_Images_Products FOREIGN KEY (ProductId) REFERENCES Products (ProductId);


-- ============================================================================
-- 3. CUSTOMER INTERACTIONS (SỔ ĐỊA CHỈ, GIỎ HÀNG, YÊU THÍCH)
-- ============================================================================

-- Sổ địa chỉ và giỏ hàng thuộc tài khoản khách.
ALTER TABLE UserAddresses
    ADD CONSTRAINT FK_Addresses_Users FOREIGN KEY (UserId) REFERENCES Users (UserId);
ALTER TABLE Carts
    ADD CONSTRAINT FK_Carts_Users FOREIGN KEY (UserId) REFERENCES Users (UserId);

-- Dòng giỏ hàng: xóa giỏ thì xóa dòng; tham chiếu đúng biến thể khách chọn.
ALTER TABLE CartItems
    ADD CONSTRAINT FK_CartItems_Carts FOREIGN KEY (CartId) REFERENCES Carts (CartId) ON DELETE CASCADE;
ALTER TABLE CartItems
    ADD CONSTRAINT FK_CartItems_Variants FOREIGN KEY (VariantId) REFERENCES ProductVariants (VariantId);

-- Danh sách yêu thích và các mục trong đó.
ALTER TABLE Wishlists
    ADD CONSTRAINT FK_Wishlists_Users FOREIGN KEY (UserId) REFERENCES Users (UserId);
ALTER TABLE WishlistItems
    ADD CONSTRAINT FK_WishlistItems_Wishlists FOREIGN KEY (WishlistId) REFERENCES Wishlists (WishlistId) ON DELETE CASCADE;
ALTER TABLE WishlistItems
    ADD CONSTRAINT FK_WishlistItems_Products FOREIGN KEY (ProductId) REFERENCES Products (ProductId);


-- ============================================================================
-- 4. ORDERS & PAYMENTS (ĐƠN TỔNG, ĐƠN SELLER, DÒNG HÀNG, LỊCH SỬ, THANH TOÁN, HOÀN TIỀN)
-- ============================================================================

-- Đơn tổng thuộc khách đặt hàng.
ALTER TABLE Orders
    ADD CONSTRAINT FK_Orders_Customers FOREIGN KEY (CustomerId) REFERENCES Users (UserId);

-- Đơn con: thuộc đơn tổng, một seller, và (tùy chọn) một kho được phân bổ.
ALTER TABLE SellerOrders
    ADD CONSTRAINT FK_SellerOrders_Orders FOREIGN KEY (OrderId) REFERENCES Orders (OrderId);
ALTER TABLE SellerOrders
    ADD CONSTRAINT FK_SellerOrders_Sellers FOREIGN KEY (SellerId) REFERENCES Sellers (SellerId);
ALTER TABLE SellerOrders
    ADD CONSTRAINT FK_SellerOrders_Warehouses FOREIGN KEY (WarehouseId) REFERENCES Warehouses (WarehouseId);

-- Dòng hàng thuộc đơn seller và trỏ tới biến thể được mua.
ALTER TABLE OrderItems
    ADD CONSTRAINT FK_OrderItems_SellerOrders FOREIGN KEY (SellerOrderId) REFERENCES SellerOrders (SellerOrderId);
ALTER TABLE OrderItems
    ADD CONSTRAINT FK_OrderItems_Variants FOREIGN KEY (VariantId) REFERENCES ProductVariants (VariantId);

-- Lịch sử trạng thái: thuộc đơn tổng, (tùy chọn) đơn seller, và người thực hiện.
ALTER TABLE OrderStatusHistory
    ADD CONSTRAINT FK_StatusHistory_Orders FOREIGN KEY (OrderId) REFERENCES Orders (OrderId);
ALTER TABLE OrderStatusHistory
    ADD CONSTRAINT FK_StatusHistory_SellerOrders FOREIGN KEY (SellerOrderId) REFERENCES SellerOrders (SellerOrderId);
ALTER TABLE OrderStatusHistory
    ADD CONSTRAINT FK_StatusHistory_Users FOREIGN KEY (ChangedBy) REFERENCES Users (UserId);

-- Thanh toán gắn với đơn tổng.
ALTER TABLE Payments
    ADD CONSTRAINT FK_Payments_Orders FOREIGN KEY (OrderId) REFERENCES Orders (OrderId);

-- Hoàn tiền: liên kết khoản thanh toán gốc, đơn seller bị hủy/trả, yêu cầu trả hàng và người duyệt.
ALTER TABLE Refunds
    ADD CONSTRAINT FK_Refunds_Payments FOREIGN KEY (PaymentId) REFERENCES Payments (PaymentId);
ALTER TABLE Refunds
    ADD CONSTRAINT FK_Refunds_SellerOrders FOREIGN KEY (SellerOrderId) REFERENCES SellerOrders (SellerOrderId);
ALTER TABLE Refunds
    ADD CONSTRAINT FK_Refunds_ReturnRequests FOREIGN KEY (ReturnRequestId) REFERENCES ReturnRequests (ReturnRequestId);
ALTER TABLE Refunds
    ADD CONSTRAINT FK_Refunds_ApprovedBy FOREIGN KEY (ApprovedBy) REFERENCES Users (UserId);


-- ============================================================================
-- 5. WAREHOUSE & INVENTORY (KHO, VỊ TRÍ, TỒN KHO, GIỮ CHỖ)
-- ============================================================================

-- Kho riêng của seller trỏ về seller sở hữu.
ALTER TABLE Warehouses
    ADD CONSTRAINT FK_Warehouses_Sellers FOREIGN KEY (OwnerSellerId) REFERENCES Sellers (SellerId);

-- Vị trí thuộc một kho.
ALTER TABLE WarehouseLocations
    ADD CONSTRAINT FK_Locations_Warehouses FOREIGN KEY (WarehouseId) REFERENCES Warehouses (WarehouseId);

-- Tồn kho: FK KÉP (vị trí phải thuộc đúng kho) + biến thể.
ALTER TABLE Inventory
    ADD CONSTRAINT FK_Inventory_Locations FOREIGN KEY (LocationId, WarehouseId)
        REFERENCES WarehouseLocations (LocationId, WarehouseId);
ALTER TABLE Inventory
    ADD CONSTRAINT FK_Inventory_Variants FOREIGN KEY (VariantId) REFERENCES ProductVariants (VariantId);

-- Giữ chỗ: gắn dòng đơn hàng; vị trí đúng kho; và PHẢI có dòng tồn (vị trí, biến thể) tương ứng.
ALTER TABLE StockReservations
    ADD CONSTRAINT FK_Reservations_OrderItems FOREIGN KEY (OrderItemId) REFERENCES OrderItems (OrderItemId);
ALTER TABLE StockReservations
    ADD CONSTRAINT FK_Reservations_Locations FOREIGN KEY (LocationId, WarehouseId)
        REFERENCES WarehouseLocations (LocationId, WarehouseId);
ALTER TABLE StockReservations
    ADD CONSTRAINT FK_Reservations_Inventory FOREIGN KEY (LocationId, VariantId)
        REFERENCES Inventory (LocationId, VariantId);


-- ============================================================================
-- 6. NHẬP KHO (INVENTORY RECEIPTS - INBOUND)
-- ============================================================================

-- Phiếu nhập: kho đích, seller gửi hàng, phiếu điều chuyển/yêu cầu trả hàng nguồn, người tạo/xác nhận.
ALTER TABLE InventoryReceipts
    ADD CONSTRAINT FK_Receipts_Warehouses FOREIGN KEY (WarehouseId) REFERENCES Warehouses (WarehouseId);
ALTER TABLE InventoryReceipts
    ADD CONSTRAINT FK_Receipts_Sellers FOREIGN KEY (SenderSellerId) REFERENCES Sellers (SellerId);
ALTER TABLE InventoryReceipts
    ADD CONSTRAINT FK_Receipts_Transfers FOREIGN KEY (TransferId) REFERENCES StockTransfers (TransferId);
ALTER TABLE InventoryReceipts
    ADD CONSTRAINT FK_Receipts_ReturnRequests FOREIGN KEY (ReturnRequestId) REFERENCES ReturnRequests (ReturnRequestId);
ALTER TABLE InventoryReceipts
    ADD CONSTRAINT FK_Receipts_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES Users (UserId);
ALTER TABLE InventoryReceipts
    ADD CONSTRAINT FK_Receipts_ConfirmedBy FOREIGN KEY (ConfirmedBy) REFERENCES Users (UserId);

-- Chi tiết phiếu nhập: FK KÉP với phiếu cha (cùng kho) và với vị trí (vị trí thuộc kho của phiếu).
ALTER TABLE ReceiptDetails
    ADD CONSTRAINT FK_ReceiptDetails_Receipts FOREIGN KEY (ReceiptId, WarehouseId)
        REFERENCES InventoryReceipts (ReceiptId, WarehouseId);
ALTER TABLE ReceiptDetails
    ADD CONSTRAINT FK_ReceiptDetails_Locations FOREIGN KEY (LocationId, WarehouseId)
        REFERENCES WarehouseLocations (LocationId, WarehouseId);
ALTER TABLE ReceiptDetails
    ADD CONSTRAINT FK_ReceiptDetails_Variants FOREIGN KEY (VariantId) REFERENCES ProductVariants (VariantId);


-- ============================================================================
-- 7. XUẤT KHO (INVENTORY ISSUES - OUTBOUND)
-- ============================================================================

-- Phiếu xuất: kho, đơn seller cần xuất, phiếu điều chuyển, người tạo/duyệt/xuất.
ALTER TABLE InventoryIssues
    ADD CONSTRAINT FK_Issues_Warehouses FOREIGN KEY (WarehouseId) REFERENCES Warehouses (WarehouseId);
ALTER TABLE InventoryIssues
    ADD CONSTRAINT FK_Issues_SellerOrders FOREIGN KEY (SellerOrderId) REFERENCES SellerOrders (SellerOrderId);
ALTER TABLE InventoryIssues
    ADD CONSTRAINT FK_Issues_Transfers FOREIGN KEY (TransferId) REFERENCES StockTransfers (TransferId);
ALTER TABLE InventoryIssues
    ADD CONSTRAINT FK_Issues_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES Users (UserId);
ALTER TABLE InventoryIssues
    ADD CONSTRAINT FK_Issues_ApprovedBy FOREIGN KEY (ApprovedBy) REFERENCES Users (UserId);
ALTER TABLE InventoryIssues
    ADD CONSTRAINT FK_Issues_DispatchedBy FOREIGN KEY (DispatchedBy) REFERENCES Users (UserId);

-- Chi tiết phiếu xuất: FK KÉP với phiếu cha và vị trí; biến thể; dòng giữ chỗ được tiêu thụ.
ALTER TABLE IssueDetails
    ADD CONSTRAINT FK_IssueDetails_Issues FOREIGN KEY (IssueId, WarehouseId)
        REFERENCES InventoryIssues (IssueId, WarehouseId);
ALTER TABLE IssueDetails
    ADD CONSTRAINT FK_IssueDetails_Locations FOREIGN KEY (LocationId, WarehouseId)
        REFERENCES WarehouseLocations (LocationId, WarehouseId);
ALTER TABLE IssueDetails
    ADD CONSTRAINT FK_IssueDetails_Variants FOREIGN KEY (VariantId) REFERENCES ProductVariants (VariantId);
ALTER TABLE IssueDetails
    ADD CONSTRAINT FK_IssueDetails_Reservations FOREIGN KEY (ReservationId) REFERENCES StockReservations (ReservationId);


-- ============================================================================
-- 8. ĐIỀU CHUYỂN KHO NỘI BỘ (STOCK TRANSFERS)
-- ============================================================================

-- Phiếu điều chuyển: kho nguồn, kho đích, người tạo/duyệt/nhận.
ALTER TABLE StockTransfers
    ADD CONSTRAINT FK_Transfers_Source FOREIGN KEY (SourceWarehouseId) REFERENCES Warehouses (WarehouseId);
ALTER TABLE StockTransfers
    ADD CONSTRAINT FK_Transfers_Destination FOREIGN KEY (DestinationWarehouseId) REFERENCES Warehouses (WarehouseId);
ALTER TABLE StockTransfers
    ADD CONSTRAINT FK_Transfers_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES Users (UserId);
ALTER TABLE StockTransfers
    ADD CONSTRAINT FK_Transfers_ApprovedBy FOREIGN KEY (ApprovedBy) REFERENCES Users (UserId);
ALTER TABLE StockTransfers
    ADD CONSTRAINT FK_Transfers_ReceivedBy FOREIGN KEY (ReceivedBy) REFERENCES Users (UserId);

-- Chi tiết điều chuyển: phiếu, biến thể, vị trí lấy (kho nguồn), vị trí cất (kho đích).
-- Việc vị trí thuộc đúng kho nguồn/đích được kiểm tra bằng trigger (file 05).
ALTER TABLE StockTransferDetails
    ADD CONSTRAINT FK_TransferDetails_Transfers FOREIGN KEY (TransferId) REFERENCES StockTransfers (TransferId);
ALTER TABLE StockTransferDetails
    ADD CONSTRAINT FK_TransferDetails_Variants FOREIGN KEY (VariantId) REFERENCES ProductVariants (VariantId);
ALTER TABLE StockTransferDetails
    ADD CONSTRAINT FK_TransferDetails_SourceLocation FOREIGN KEY (SourceLocationId) REFERENCES WarehouseLocations (LocationId);
ALTER TABLE StockTransferDetails
    ADD CONSTRAINT FK_TransferDetails_DestinationLocation FOREIGN KEY (DestinationLocationId) REFERENCES WarehouseLocations (LocationId);


-- ============================================================================
-- 9. KIỂM KÊ (STOCK COUNTS) & SỔ CÁI BIẾN ĐỘNG KHO (STOCK MOVEMENTS)
-- ============================================================================

-- Phiếu kiểm kê: kho, người tạo/duyệt.
ALTER TABLE StockCounts
    ADD CONSTRAINT FK_StockCounts_Warehouses FOREIGN KEY (WarehouseId) REFERENCES Warehouses (WarehouseId);
ALTER TABLE StockCounts
    ADD CONSTRAINT FK_StockCounts_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES Users (UserId);
ALTER TABLE StockCounts
    ADD CONSTRAINT FK_StockCounts_ApprovedBy FOREIGN KEY (ApprovedBy) REFERENCES Users (UserId);

-- Chi tiết kiểm kê: FK KÉP với phiếu cha và vị trí.
ALTER TABLE StockCountDetails
    ADD CONSTRAINT FK_StockCountDetails_Counts FOREIGN KEY (StockCountId, WarehouseId)
        REFERENCES StockCounts (StockCountId, WarehouseId);
ALTER TABLE StockCountDetails
    ADD CONSTRAINT FK_StockCountDetails_Locations FOREIGN KEY (LocationId, WarehouseId)
        REFERENCES WarehouseLocations (LocationId, WarehouseId);
ALTER TABLE StockCountDetails
    ADD CONSTRAINT FK_StockCountDetails_Variants FOREIGN KEY (VariantId) REFERENCES ProductVariants (VariantId);

-- Sổ cái: FK KÉP vị trí-kho, biến thể, người thực hiện.
ALTER TABLE StockMovements
    ADD CONSTRAINT FK_Movements_Locations FOREIGN KEY (LocationId, WarehouseId)
        REFERENCES WarehouseLocations (LocationId, WarehouseId);
ALTER TABLE StockMovements
    ADD CONSTRAINT FK_Movements_Variants FOREIGN KEY (VariantId) REFERENCES ProductVariants (VariantId);
ALTER TABLE StockMovements
    ADD CONSTRAINT FK_Movements_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES Users (UserId);


-- ============================================================================
-- 10. SHIPPING, RETURNS & REVIEWS (VẬN CHUYỂN, TRẢ HÀNG, ĐÁNH GIÁ)
-- ============================================================================

-- Kiện hàng thuộc đơn seller và (tùy chọn) một hãng vận chuyển.
ALTER TABLE Shipments
    ADD CONSTRAINT FK_Shipments_SellerOrders FOREIGN KEY (SellerOrderId) REFERENCES SellerOrders (SellerOrderId);
ALTER TABLE Shipments
    ADD CONSTRAINT FK_Shipments_Carriers FOREIGN KEY (CarrierId) REFERENCES Carriers (CarrierId);

-- Yêu cầu trả hàng: đơn seller, khách yêu cầu, người duyệt.
ALTER TABLE ReturnRequests
    ADD CONSTRAINT FK_ReturnRequests_SellerOrders FOREIGN KEY (SellerOrderId) REFERENCES SellerOrders (SellerOrderId);
ALTER TABLE ReturnRequests
    ADD CONSTRAINT FK_ReturnRequests_Customers FOREIGN KEY (CustomerId) REFERENCES Users (UserId);
ALTER TABLE ReturnRequests
    ADD CONSTRAINT FK_ReturnRequests_ReviewedBy FOREIGN KEY (ReviewedBy) REFERENCES Users (UserId);

-- Dòng hàng trả: yêu cầu cha, dòng đơn gốc, người kiểm tra, vị trí nhập lại.
ALTER TABLE ReturnRequestItems
    ADD CONSTRAINT FK_ReturnItems_Requests FOREIGN KEY (ReturnRequestId) REFERENCES ReturnRequests (ReturnRequestId);
ALTER TABLE ReturnRequestItems
    ADD CONSTRAINT FK_ReturnItems_OrderItems FOREIGN KEY (OrderItemId) REFERENCES OrderItems (OrderItemId);
ALTER TABLE ReturnRequestItems
    ADD CONSTRAINT FK_ReturnItems_InspectedBy FOREIGN KEY (InspectedBy) REFERENCES Users (UserId);
ALTER TABLE ReturnRequestItems
    ADD CONSTRAINT FK_ReturnItems_RestockLocation FOREIGN KEY (RestockLocationId) REFERENCES WarehouseLocations (LocationId);

-- Đánh giá: khách viết và dòng hàng đã mua.
ALTER TABLE Reviews
    ADD CONSTRAINT FK_Reviews_Customers FOREIGN KEY (CustomerId) REFERENCES Users (UserId);
ALTER TABLE Reviews
    ADD CONSTRAINT FK_Reviews_OrderItems FOREIGN KEY (OrderItemId) REFERENCES OrderItems (OrderItemId);
