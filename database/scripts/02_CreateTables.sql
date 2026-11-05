/*
================================================================================
 Dự án      : E-Commerce Marketplace (đa người bán) + Warehouse Management
 Database   : ECommerceWarehouse (MySQL 8.0.16+)
 File       : 02_CreateTables.sql
 Mục đích   : Tạo toàn bộ 39 bảng, khóa chính, UNIQUE và CHECK.
              CHẠY LẠI ĐƯỢC NHIỀU LẦN: mỗi bảng có DROP TABLE IF EXISTS phía trước.
              CẢNH BÁO: chạy lại sẽ XÓA TOÀN BỘ DỮ LIỆU và các khóa ngoại/chỉ mục đã tạo.
              Sau khi chạy lại file này phải chạy lại 03, 04, 05, 06 theo thứ tự.
              Khóa ngoại nằm ở 03_CreateForeignKeys.sql, chỉ mục truy vấn ở 04.

 DANH SÁCH MỤC (39 bảng):
   1. Identity & Sellers        : Users, Roles, UserRoles, RefreshTokens, Sellers, Shops            (6)
   2. Product Catalog           : Categories, Products, ProductVariants, ProductImages               (4)
   3. Customer Interactions     : UserAddresses, Carts, CartItems, Wishlists, WishlistItems          (5)
   4. Orders & Payments         : Orders, SellerOrders, OrderItems, OrderStatusHistory, Payments, Refunds (6)
   5. Warehouse & Inventory     : Warehouses, WarehouseLocations, Inventory, StockReservations,
                                  InventoryReceipts, ReceiptDetails, InventoryIssues, IssueDetails,
                                  StockTransfers, StockTransferDetails, StockCounts, StockCountDetails,
                                  StockMovements                                                    (13)
   6. Shipping, Returns, Reviews: Carriers, Shipments, ReturnRequests, ReturnRequestItems, Reviews  (5)

 NHỮNG ĐIỂM THIẾT KẾ QUAN TRỌNG (so với bản cũ):
   - Bỏ Products.SellerId: người bán suy ra qua Shops (tránh mâu thuẫn Seller/Shop).
   - Inventory: bỏ UNIQUE(Warehouse,Location,Variant) -> UNIQUE(Location,Variant);
     WarehouseId giữ lại nhưng được khóa kép với LocationId ở file 03 để không thể lệch kho.
   - Giữ chỗ tồn kho (StockReservations) theo từng vị trí kệ, có hạn (ExpiresAt) cho job nền nhả hàng.
   - StockMovements là sổ cái chỉ-thêm: tách OnHandChange / ReservedChange, có người thực hiện, tồn sau.
   - Mọi chứng từ kho có người tạo / người duyệt và CHECK "người tạo không tự duyệt".
   - Thêm luồng hàng hoàn (ReturnRequests), kiểm kê (StockCounts), lịch sử trạng thái đơn.

 TRẠNG THÁI THAM CHIẾU NHANH:
   Orders       : PendingPayment -> Confirmed -> Processing -> PartiallyShipped/Shipped -> Completed
                  (nhánh phụ: Cancelled, Expired)
   SellerOrders : Pending -> Confirmed -> Preparing -> ReadyToShip -> Shipped -> Delivered
                  (nhánh phụ: DeliveryFailed, Cancelled, Returned)
================================================================================
*/

USE ECommerceWarehouse;

-- Tắt kiểm tra khóa ngoại trong lúc xóa/tạo lại bảng (chỉ có hiệu lực trong phiên chạy script này).
-- Bắt buộc khi chạy lại: các FK đã tạo ở file 03 sẽ chặn việc DROP bảng cha.
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- 1. IDENTITY & SELLERS (TÀI KHOẢN, PHÂN QUYỀN, NGƯỜI BÁN, GIAN HÀNG)
-- ============================================================================

DROP TABLE IF EXISTS Users;
-- Tài khoản dùng chung cho khách hàng, người bán, nhân viên kho, quản trị.
CREATE TABLE Users (
    UserId        BIGINT        NOT NULL AUTO_INCREMENT,
    Username      VARCHAR(100)  NULL,
    FullName      VARCHAR(150)  NOT NULL,
    Email         VARCHAR(255)  NOT NULL,
    PasswordHash  VARCHAR(500)  NOT NULL,                       -- chỉ lưu hash (BCrypt/PBKDF2), không lưu mật khẩu thô
    PhoneNumber   VARCHAR(20)   NULL,
    AvatarUrl     VARCHAR(1000) NULL,
    IsActive      BOOLEAN       NOT NULL DEFAULT TRUE,          -- FALSE = khóa tài khoản
    CreatedAt     DATETIME(3)   NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    UpdatedAt     DATETIME(3)   NULL,
    CONSTRAINT PK_Users PRIMARY KEY (UserId),
    CONSTRAINT UQ_Users_Email UNIQUE (Email),
    CONSTRAINT UQ_Users_Username UNIQUE (Username)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS Roles;
-- Danh mục vai trò: Admin, Customer, Seller, WarehouseManager, WarehouseStaff, CustomerSupport...
CREATE TABLE Roles (
    RoleId       INT          NOT NULL AUTO_INCREMENT,
    RoleName     VARCHAR(50)  NOT NULL,
    Description  VARCHAR(255) NULL,
    CONSTRAINT PK_Roles PRIMARY KEY (RoleId),
    CONSTRAINT UQ_Roles_RoleName UNIQUE (RoleName)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS UserRoles;
-- Một người dùng có thể giữ nhiều vai trò.
CREATE TABLE UserRoles (
    UserId      BIGINT      NOT NULL,
    RoleId      INT         NOT NULL,
    AssignedAt  DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    CONSTRAINT PK_UserRoles PRIMARY KEY (UserId, RoleId)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS RefreshTokens;
-- Refresh token của JWT. Chỉ lưu hash của token; thu hồi bằng RevokedAt.
CREATE TABLE RefreshTokens (
    RefreshTokenId   BIGINT       NOT NULL AUTO_INCREMENT,
    UserId           BIGINT       NOT NULL,
    TokenHash        CHAR(64)     NOT NULL,                     -- SHA-256 dạng hex
    ExpiresAt        DATETIME(3)  NOT NULL,
    CreatedAt        DATETIME(3)  NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    CreatedByIp      VARCHAR(45)  NULL,
    RevokedAt        DATETIME(3)  NULL,
    ReplacedByHash   CHAR(64)     NULL,                         -- token mới thay thế khi xoay vòng (rotation)
    CONSTRAINT PK_RefreshTokens PRIMARY KEY (RefreshTokenId),
    CONSTRAINT UQ_RefreshTokens_Hash UNIQUE (TokenHash)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS Sellers;
-- Hồ sơ người bán (1 tài khoản = tối đa 1 hồ sơ). Admin duyệt trước khi được bán.
CREATE TABLE Sellers (
    SellerId        BIGINT        NOT NULL AUTO_INCREMENT,
    UserId          BIGINT        NOT NULL,
    BusinessName    VARCHAR(200)  NOT NULL,
    TaxCode         VARCHAR(20)   NULL,
    Description     VARCHAR(1000) NULL,
    CommissionRate  DECIMAL(5,2)  NOT NULL DEFAULT 5.00,        -- % hoa hồng sàn thu trên doanh thu
    Status          VARCHAR(30)   NOT NULL DEFAULT 'Pending',
    ApprovedAt      DATETIME(3)   NULL,
    CreatedAt       DATETIME(3)   NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    UpdatedAt       DATETIME(3)   NULL,
    CONSTRAINT PK_Sellers PRIMARY KEY (SellerId),
    CONSTRAINT UQ_Sellers_User UNIQUE (UserId),
    CONSTRAINT CK_Sellers_Status CHECK (Status IN ('Pending','Approved','Rejected','Suspended')),
    CONSTRAINT CK_Sellers_Commission CHECK (CommissionRate BETWEEN 0 AND 100)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS Shops;
-- Gian hàng của người bán (một seller có thể mở nhiều shop).
CREATE TABLE Shops (
    ShopId       BIGINT        NOT NULL AUTO_INCREMENT,
    SellerId     BIGINT        NOT NULL,
    ShopName     VARCHAR(200)  NOT NULL,
    Description  VARCHAR(1000) NULL,
    LogoUrl      VARCHAR(1000) NULL,
    IsActive     BOOLEAN       NOT NULL DEFAULT TRUE,
    CreatedAt    DATETIME(3)   NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    UpdatedAt    DATETIME(3)   NULL,
    CONSTRAINT PK_Shops PRIMARY KEY (ShopId),
    CONSTRAINT UQ_Shops_Seller_Name UNIQUE (SellerId, ShopName)
) ENGINE=InnoDB;


-- ============================================================================
-- 2. PRODUCT CATALOG (DANH MỤC, SẢN PHẨM, BIẾN THỂ, HÌNH ẢNH)
-- ============================================================================

DROP TABLE IF EXISTS Categories;
-- Danh mục đa cấp (tự tham chiếu qua ParentCategoryId, NULL = danh mục gốc).
CREATE TABLE Categories (
    CategoryId        BIGINT        NOT NULL AUTO_INCREMENT,
    ParentCategoryId  BIGINT        NULL,
    CategoryName      VARCHAR(150)  NOT NULL,
    Description       VARCHAR(1000) NULL,
    IsActive          BOOLEAN       NOT NULL DEFAULT TRUE,
    CONSTRAINT PK_Categories PRIMARY KEY (CategoryId),
    CONSTRAINT UQ_Categories_Parent_Name UNIQUE (ParentCategoryId, CategoryName)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS Products;
-- Sản phẩm. Người bán suy ra qua Shops.SellerId (không lưu SellerId ở đây).
-- Luồng: Draft -> PendingReview (seller gửi duyệt) -> Active / Rejected (admin) -> Inactive (ẩn bán).
CREATE TABLE Products (
    ProductId      BIGINT        NOT NULL AUTO_INCREMENT,
    ShopId         BIGINT        NOT NULL,
    CategoryId     BIGINT        NOT NULL,
    ProductName    VARCHAR(250)  NOT NULL,
    Description    TEXT          NULL,
    ProductStatus  VARCHAR(30)   NOT NULL DEFAULT 'Draft',
    CreatedAt      DATETIME(3)   NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    UpdatedAt      DATETIME(3)   NULL,
    CONSTRAINT PK_Products PRIMARY KEY (ProductId),
    CONSTRAINT CK_Products_Status CHECK (ProductStatus IN ('Draft','PendingReview','Active','Inactive','Rejected'))
) ENGINE=InnoDB;

DROP TABLE IF EXISTS ProductVariants;
-- Biến thể (SKU) là đơn vị bán và đơn vị tồn kho. Giá hiện hành nằm ở đây;
-- đơn hàng chỉ lưu bản chụp giá (OrderItems.UnitPrice).
CREATE TABLE ProductVariants (
    VariantId    BIGINT        NOT NULL AUTO_INCREMENT,
    ProductId    BIGINT        NOT NULL,
    SKU          VARCHAR(80)   NOT NULL,
    Barcode      VARCHAR(50)   NULL,                            -- mã vạch để quét khi nhập/soạn/đóng gói
    VariantName  VARCHAR(150)  NOT NULL,
    Price        DECIMAL(18,2) NOT NULL,
    WeightGrams  INT           NULL,
    IsActive     BOOLEAN       NOT NULL DEFAULT TRUE,
    CreatedAt    DATETIME(3)   NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    UpdatedAt    DATETIME(3)   NULL,
    CONSTRAINT PK_ProductVariants PRIMARY KEY (VariantId),
    CONSTRAINT UQ_ProductVariants_SKU UNIQUE (SKU),
    CONSTRAINT UQ_ProductVariants_Barcode UNIQUE (Barcode),     -- NULL được phép lặp
    CONSTRAINT CK_Variants_Price CHECK (Price >= 0),
    CONSTRAINT CK_Variants_Weight CHECK (WeightGrams IS NULL OR WeightGrams >= 0)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS ProductImages;
-- Album ảnh sản phẩm. Mỗi sản phẩm tối đa 1 ảnh đại diện (ràng buộc bằng cột sinh PrimaryFlag).
CREATE TABLE ProductImages (
    ImageId       BIGINT        NOT NULL AUTO_INCREMENT,
    ProductId     BIGINT        NOT NULL,
    ImageUrl      VARCHAR(1000) NOT NULL,
    IsPrimary     BOOLEAN       NOT NULL DEFAULT FALSE,
    PrimaryFlag   TINYINT GENERATED ALWAYS AS (IF(IsPrimary, 1, NULL)) STORED,
    DisplayOrder  INT           NOT NULL DEFAULT 0,
    CONSTRAINT PK_ProductImages PRIMARY KEY (ImageId),
    CONSTRAINT UQ_ProductImages_OnePrimary UNIQUE (ProductId, PrimaryFlag),
    CONSTRAINT CK_Images_Order CHECK (DisplayOrder >= 0)
) ENGINE=InnoDB;


-- ============================================================================
-- 3. CUSTOMER INTERACTIONS (SỔ ĐỊA CHỈ, GIỎ HÀNG, YÊU THÍCH)
-- ============================================================================

DROP TABLE IF EXISTS UserAddresses;
-- Sổ địa chỉ giao hàng. Mỗi người dùng tối đa 1 địa chỉ mặc định (cột sinh DefaultFlag).
-- Khi đặt địa chỉ mặc định mới, service phải bỏ cờ mặc định của địa chỉ cũ trong cùng transaction.
CREATE TABLE UserAddresses (
    AddressId      BIGINT        NOT NULL AUTO_INCREMENT,
    UserId         BIGINT        NOT NULL,
    RecipientName  VARCHAR(150)  NOT NULL,
    PhoneNumber    VARCHAR(20)   NOT NULL,
    Province       VARCHAR(100)  NOT NULL,
    District       VARCHAR(100)  NOT NULL,
    Ward           VARCHAR(100)  NOT NULL,
    StreetAddress  VARCHAR(300)  NOT NULL,
    IsDefault      BOOLEAN       NOT NULL DEFAULT FALSE,
    DefaultFlag    TINYINT GENERATED ALWAYS AS (IF(IsDefault, 1, NULL)) STORED,
    CreatedAt      DATETIME(3)   NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    UpdatedAt      DATETIME(3)   NULL,
    CONSTRAINT PK_UserAddresses PRIMARY KEY (AddressId),
    CONSTRAINT UQ_UserAddresses_OneDefault UNIQUE (UserId, DefaultFlag)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS Carts;
-- Giỏ hàng: mỗi khách đúng 1 giỏ. Giỏ chỉ KIỂM TRA tồn, KHÔNG giữ chỗ.
CREATE TABLE Carts (
    CartId     BIGINT      NOT NULL AUTO_INCREMENT,
    UserId     BIGINT      NOT NULL,
    CreatedAt  DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    UpdatedAt  DATETIME(3) NULL,
    CONSTRAINT PK_Carts PRIMARY KEY (CartId),
    CONSTRAINT UQ_Carts_User UNIQUE (UserId)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS CartItems;
CREATE TABLE CartItems (
    CartItemId  BIGINT      NOT NULL AUTO_INCREMENT,
    CartId      BIGINT      NOT NULL,
    VariantId   BIGINT      NOT NULL,
    Quantity    INT         NOT NULL,
    AddedAt     DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    CONSTRAINT PK_CartItems PRIMARY KEY (CartItemId),
    CONSTRAINT UQ_CartItems_Cart_Variant UNIQUE (CartId, VariantId),
    CONSTRAINT CK_CartItems_Qty CHECK (Quantity > 0)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS Wishlists;
CREATE TABLE Wishlists (
    WishlistId    BIGINT       NOT NULL AUTO_INCREMENT,
    UserId        BIGINT       NOT NULL,
    WishlistName  VARCHAR(100) NOT NULL DEFAULT 'Yêu thích',
    CreatedAt     DATETIME(3)  NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    CONSTRAINT PK_Wishlists PRIMARY KEY (WishlistId),
    CONSTRAINT UQ_Wishlists_User_Name UNIQUE (UserId, WishlistName)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS WishlistItems;
CREATE TABLE WishlistItems (
    WishlistItemId  BIGINT      NOT NULL AUTO_INCREMENT,
    WishlistId      BIGINT      NOT NULL,
    ProductId       BIGINT      NOT NULL,
    AddedAt         DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    CONSTRAINT PK_WishlistItems PRIMARY KEY (WishlistItemId),
    CONSTRAINT UQ_WishlistItems UNIQUE (WishlistId, ProductId)
) ENGINE=InnoDB;


-- ============================================================================
-- 4. ORDERS & PAYMENTS (ĐƠN TỔNG, ĐƠN THEO SELLER, DÒNG HÀNG, THANH TOÁN, HOÀN TIỀN)
-- ============================================================================

DROP TABLE IF EXISTS Orders;
-- Đơn tổng của khách (một lần checkout). Địa chỉ giao là BẢN CHỤP, không phụ thuộc UserAddresses.
-- ExpiresAt: hạn thanh toán với đơn online; job nền hủy đơn + nhả giữ chỗ khi quá hạn (Status = 'Expired').
-- Tổng tiền phải luôn khớp: TotalAmount = Subtotal + ShippingFee - DiscountAmount.
CREATE TABLE Orders (
    OrderId                BIGINT        NOT NULL AUTO_INCREMENT,
    CustomerId             BIGINT        NOT NULL,
    OrderCode              VARCHAR(40)   NOT NULL,
    RecipientName          VARCHAR(150)  NOT NULL,
    RecipientPhone         VARCHAR(20)   NOT NULL,
    ShippingProvince       VARCHAR(100)  NOT NULL,
    ShippingDistrict       VARCHAR(100)  NOT NULL,
    ShippingWard           VARCHAR(100)  NOT NULL,
    ShippingStreetAddress  VARCHAR(300)  NOT NULL,
    Subtotal               DECIMAL(18,2) NOT NULL,
    ShippingFee            DECIMAL(18,2) NOT NULL DEFAULT 0,
    DiscountAmount         DECIMAL(18,2) NOT NULL DEFAULT 0,
    TotalAmount            DECIMAL(18,2) NOT NULL,
    OrderStatus            VARCHAR(30)   NOT NULL DEFAULT 'PendingPayment',
    ExpiresAt              DATETIME(3)   NULL,
    CancelReason           VARCHAR(500)  NULL,
    CancelledAt            DATETIME(3)   NULL,
    Note                   VARCHAR(500)  NULL,
    CreatedAt              DATETIME(3)   NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    UpdatedAt              DATETIME(3)   NULL,
    RowVersion             TIMESTAMP(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT PK_Orders PRIMARY KEY (OrderId),
    CONSTRAINT UQ_Orders_Code UNIQUE (OrderCode),
    CONSTRAINT CK_Orders_Amounts   CHECK (Subtotal >= 0 AND ShippingFee >= 0 AND DiscountAmount >= 0 AND TotalAmount >= 0),
    CONSTRAINT CK_Orders_Total     CHECK (TotalAmount = Subtotal + ShippingFee - DiscountAmount),
    CONSTRAINT CK_Orders_Discount  CHECK (DiscountAmount <= Subtotal + ShippingFee),
    CONSTRAINT CK_Orders_Status    CHECK (OrderStatus IN ('PendingPayment','Confirmed','Processing','PartiallyShipped','Shipped','Completed','Cancelled','Expired')),
    CONSTRAINT CK_Orders_Cancel    CHECK (CancelledAt IS NULL OR OrderStatus IN ('Cancelled','Expired'))
) ENGINE=InnoDB;

DROP TABLE IF EXISTS SellerOrders;
-- Đơn con theo từng seller (đa người bán). Mỗi seller tự xử lý/ xuất kho phần của mình.
-- WarehouseId: kho được phân bổ để xuất (kho sàn hoặc kho của chính seller đó); NULL cho tới khi phân bổ.
CREATE TABLE SellerOrders (
    SellerOrderId  BIGINT        NOT NULL AUTO_INCREMENT,
    OrderId        BIGINT        NOT NULL,
    SellerId       BIGINT        NOT NULL,
    WarehouseId    BIGINT        NULL,
    Subtotal       DECIMAL(18,2) NOT NULL,
    Status         VARCHAR(30)   NOT NULL DEFAULT 'Pending',
    CancelReason   VARCHAR(500)  NULL,
    CancelledAt    DATETIME(3)   NULL,
    CreatedAt      DATETIME(3)   NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    UpdatedAt      DATETIME(3)   NULL,
    RowVersion     TIMESTAMP(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT PK_SellerOrders PRIMARY KEY (SellerOrderId),
    CONSTRAINT UQ_SellerOrders_Order_Seller UNIQUE (OrderId, SellerId),
    CONSTRAINT CK_SellerOrders_Subtotal CHECK (Subtotal >= 0),
    CONSTRAINT CK_SellerOrders_Status CHECK (Status IN ('Pending','Confirmed','Preparing','ReadyToShip','Shipped','Delivered','DeliveryFailed','Cancelled','Returned')),
    CONSTRAINT CK_SellerOrders_Cancel CHECK (CancelledAt IS NULL OR Status = 'Cancelled')
) ENGINE=InnoDB;

DROP TABLE IF EXISTS OrderItems;
-- Dòng hàng. Lưu BẢN CHỤP tên, SKU, đơn giá tại thời điểm đặt (đổi giá sau này không ảnh hưởng đơn cũ).
CREATE TABLE OrderItems (
    OrderItemId          BIGINT        NOT NULL AUTO_INCREMENT,
    SellerOrderId        BIGINT        NOT NULL,
    VariantId            BIGINT        NOT NULL,
    ProductNameSnapshot  VARCHAR(250)  NOT NULL,
    SKUSnapshot          VARCHAR(80)   NOT NULL,
    UnitPrice            DECIMAL(18,2) NOT NULL,
    Quantity             INT           NOT NULL,
    LineTotal            DECIMAL(18,2) GENERATED ALWAYS AS (UnitPrice * Quantity) STORED,
    CONSTRAINT PK_OrderItems PRIMARY KEY (OrderItemId),
    CONSTRAINT UQ_OrderItems_SellerOrder_Variant UNIQUE (SellerOrderId, VariantId),
    CONSTRAINT CK_OrderItems_Price CHECK (UnitPrice >= 0),
    CONSTRAINT CK_OrderItems_Qty CHECK (Quantity > 0)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS OrderStatusHistory;
-- Lịch sử đổi trạng thái (ai, lúc nào, vì sao). SellerOrderId NULL = đổi trạng thái đơn tổng.
-- ChangedBy NULL = hệ thống/job nền (ví dụ hết hạn thanh toán).
CREATE TABLE OrderStatusHistory (
    HistoryId      BIGINT       NOT NULL AUTO_INCREMENT,
    OrderId        BIGINT       NOT NULL,
    SellerOrderId  BIGINT       NULL,
    FromStatus     VARCHAR(30)  NULL,
    ToStatus       VARCHAR(30)  NOT NULL,
    Reason         VARCHAR(500) NULL,
    ChangedBy      BIGINT       NULL,
    CreatedAt      DATETIME(3)  NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    CONSTRAINT PK_OrderStatusHistory PRIMARY KEY (HistoryId)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS Payments;
-- Giao dịch thanh toán của đơn tổng.
-- UNIQUE(PaymentMethod, TransactionCode): callback cổng thanh toán gọi lại nhiều lần chỉ tạo/xử lý 1 lần (idempotent).
CREATE TABLE Payments (
    PaymentId        BIGINT        NOT NULL AUTO_INCREMENT,
    OrderId          BIGINT        NOT NULL,
    PaymentMethod    VARCHAR(30)   NOT NULL,
    Amount           DECIMAL(18,2) NOT NULL,
    PaymentStatus    VARCHAR(30)   NOT NULL DEFAULT 'Pending',
    TransactionCode  VARCHAR(100)  NULL,
    PaidAt           DATETIME(3)   NULL,
    CreatedAt        DATETIME(3)   NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    UpdatedAt        DATETIME(3)   NULL,
    CONSTRAINT PK_Payments PRIMARY KEY (PaymentId),
    CONSTRAINT UQ_Payments_Method_Txn UNIQUE (PaymentMethod, TransactionCode),   -- NULL được phép lặp (COD chưa có mã)
    CONSTRAINT CK_Payments_Method CHECK (PaymentMethod IN ('COD','BankTransfer','EWallet','CreditCard')),
    CONSTRAINT CK_Payments_Amount CHECK (Amount >= 0),
    CONSTRAINT CK_Payments_Status CHECK (PaymentStatus IN ('Pending','Paid','Failed','Refunded','PartiallyRefunded')),
    CONSTRAINT CK_Payments_PaidAt CHECK (PaymentStatus NOT IN ('Paid','Refunded','PartiallyRefunded') OR PaidAt IS NOT NULL)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS Refunds;
-- Hoàn tiền. Tổng hoàn không được vượt số đã thanh toán (trigger trg_Refunds_BI ở file 05).
CREATE TABLE Refunds (
    RefundId        BIGINT        NOT NULL AUTO_INCREMENT,
    PaymentId       BIGINT        NOT NULL,
    SellerOrderId   BIGINT        NULL,
    ReturnRequestId BIGINT        NULL,                         -- hoàn tiền phát sinh từ yêu cầu trả hàng (nếu có)
    Amount          DECIMAL(18,2) NOT NULL,
    Reason          VARCHAR(500)  NULL,
    RefundStatus    VARCHAR(30)   NOT NULL DEFAULT 'Pending',
    ApprovedBy      BIGINT        NULL,
    ProcessedAt     DATETIME(3)   NULL,
    CreatedAt       DATETIME(3)   NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    CONSTRAINT PK_Refunds PRIMARY KEY (RefundId),
    CONSTRAINT CK_Refunds_Amount CHECK (Amount > 0),
    CONSTRAINT CK_Refunds_Status CHECK (RefundStatus IN ('Pending','Approved','Rejected','Completed')),
    CONSTRAINT CK_Refunds_Completed CHECK (RefundStatus <> 'Completed' OR ProcessedAt IS NOT NULL)
) ENGINE=InnoDB;


-- ============================================================================
-- 5. WAREHOUSE & INVENTORY (KHO, VỊ TRÍ, TỒN KHO, GIỮ CHỖ, NHẬP/XUẤT/CHUYỂN/KIỂM KÊ, SỔ CÁI)
-- ============================================================================

DROP TABLE IF EXISTS Warehouses;
-- Kho: 'Platform' (kho sàn, giữ hàng của nhiều seller) hoặc 'Seller' (kho riêng của 1 seller).
CREATE TABLE Warehouses (
    WarehouseId    BIGINT        NOT NULL AUTO_INCREMENT,
    WarehouseName  VARCHAR(200)  NOT NULL,
    WarehouseType  VARCHAR(20)   NOT NULL,
    OwnerSellerId  BIGINT        NULL,
    Address        VARCHAR(500)  NOT NULL,
    IsActive       BOOLEAN       NOT NULL DEFAULT TRUE,
    CreatedAt      DATETIME(3)   NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    UpdatedAt      DATETIME(3)   NULL,
    CONSTRAINT PK_Warehouses PRIMARY KEY (WarehouseId),
    CONSTRAINT CK_Warehouses_Type CHECK (WarehouseType IN ('Platform','Seller')),
    CONSTRAINT CK_Warehouse_Owner CHECK (
        (WarehouseType = 'Platform' AND OwnerSellerId IS NULL) OR
        (WarehouseType = 'Seller'   AND OwnerSellerId IS NOT NULL))
) ENGINE=InnoDB;

DROP TABLE IF EXISTS WarehouseLocations;
-- Vị trí lưu trữ (khu/kệ/ô). IsSellable = TRUE: hàng ở đây được tính vào tồn bán được.
-- Khu đặc biệt (Inbound = chờ cất, Returns = chờ kiểm hàng hoàn, Damaged = hàng hỏng) KHÔNG bán được.
-- UNIQUE(LocationId, WarehouseId) là đích của khóa ngoại kép để mọi bảng không thể ghi vị trí của kho này kèm mã kho khác.
CREATE TABLE WarehouseLocations (
    LocationId    BIGINT       NOT NULL AUTO_INCREMENT,
    WarehouseId   BIGINT       NOT NULL,
    LocationCode  VARCHAR(50)  NOT NULL,
    StorageType   VARCHAR(30)  NOT NULL DEFAULT 'Standard',
    IsSellable    BOOLEAN      NOT NULL DEFAULT TRUE,
    IsActive      BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT PK_WarehouseLocations PRIMARY KEY (LocationId),
    CONSTRAINT UQ_WarehouseLocation_Code UNIQUE (WarehouseId, LocationCode),
    CONSTRAINT UQ_WarehouseLocation_WithWarehouse UNIQUE (LocationId, WarehouseId),
    CONSTRAINT CK_Locations_StorageType CHECK (StorageType IN ('Standard','Cold','Hazardous','Fragile','Inbound','Returns','Damaged')),
    CONSTRAINT CK_Locations_Sellable CHECK (StorageType IN ('Standard','Cold','Hazardous','Fragile') OR IsSellable = FALSE)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS Inventory;
-- Tồn kho theo (vị trí, biến thể). Available = QuantityOnHand - QuantityReserved (tính khi truy vấn, không lưu).
-- QuantityReserved luôn bằng tổng StockReservations 'Active' tại vị trí đó (đối chiếu bằng view vw_StockReconciliation).
-- RowVersion: chống 2 request cùng giữ món cuối. Khi giữ chỗ nên dùng câu lệnh nguyên tử:
--   UPDATE Inventory SET QuantityReserved = QuantityReserved + @q
--   WHERE InventoryId = @id AND QuantityOnHand - QuantityReserved >= @q;   -- kiểm tra ROW_COUNT() = 1
CREATE TABLE Inventory (
    InventoryId       BIGINT       NOT NULL AUTO_INCREMENT,
    WarehouseId       BIGINT       NOT NULL,
    LocationId        BIGINT       NOT NULL,
    VariantId         BIGINT       NOT NULL,
    QuantityOnHand    INT          NOT NULL DEFAULT 0,
    QuantityReserved  INT          NOT NULL DEFAULT 0,
    UpdatedAt         DATETIME(3)  NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    RowVersion        TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT PK_Inventory PRIMARY KEY (InventoryId),
    CONSTRAINT UQ_Inventory_Location_Variant UNIQUE (LocationId, VariantId),
    CONSTRAINT CK_Inventory_Qty CHECK (QuantityOnHand >= 0 AND QuantityReserved >= 0 AND QuantityReserved <= QuantityOnHand)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS StockReservations;
-- Giữ chỗ tồn kho cho từng dòng đơn hàng.
-- Active   : đang giữ (đơn chờ thanh toán/chờ xuất).  ExpiresAt NULL = không hết hạn (ví dụ COD).
-- Consumed : đã xuất kho thật.  Released: hủy đơn/nhả tay.  Expired: job nền nhả do quá hạn thanh toán.
CREATE TABLE StockReservations (
    ReservationId  BIGINT       NOT NULL AUTO_INCREMENT,
    OrderItemId    BIGINT       NOT NULL,
    WarehouseId    BIGINT       NOT NULL,
    LocationId     BIGINT       NOT NULL,
    VariantId      BIGINT       NOT NULL,
    Quantity       INT          NOT NULL,
    Status         VARCHAR(20)  NOT NULL DEFAULT 'Active',
    ExpiresAt      DATETIME(3)  NULL,
    CreatedAt      DATETIME(3)  NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    ResolvedAt     DATETIME(3)  NULL,
    CONSTRAINT PK_StockReservations PRIMARY KEY (ReservationId),
    CONSTRAINT CK_Reservations_Qty CHECK (Quantity > 0),
    CONSTRAINT CK_Reservations_Status CHECK (Status IN ('Active','Consumed','Released','Expired')),
    CONSTRAINT CK_Reservations_Resolved CHECK (
        (Status = 'Active' AND ResolvedAt IS NULL) OR (Status <> 'Active' AND ResolvedAt IS NOT NULL))
) ENGINE=InnoDB;

DROP TABLE IF EXISTS InventoryReceipts;
-- Phiếu NHẬP kho (inbound).
--   SellerInbound   : seller gửi hàng vào kho sàn (bắt buộc có SenderSellerId)
--   TransferInbound : nhận hàng điều chuyển (bắt buộc có TransferId)
--   CustomerReturn  : nhận hàng khách trả (bắt buộc có ReturnRequestId)
--   Adjustment      : nhập điều chỉnh (kiểm kê dư)
-- Quy tắc: người xác nhận phải khác người tạo; phiếu đã Confirmed không được hủy (làm phiếu đảo).
CREATE TABLE InventoryReceipts (
    ReceiptId        BIGINT       NOT NULL AUTO_INCREMENT,
    WarehouseId      BIGINT       NOT NULL,
    SenderSellerId   BIGINT       NULL,
    TransferId       BIGINT       NULL,
    ReturnRequestId  BIGINT       NULL,
    ReceiptCode      VARCHAR(40)  NOT NULL,
    ReceiptType      VARCHAR(30)  NOT NULL,
    Status           VARCHAR(30)  NOT NULL DEFAULT 'Draft',
    Note             VARCHAR(500) NULL,
    CreatedBy        BIGINT       NOT NULL,
    ConfirmedBy      BIGINT       NULL,
    CreatedAt        DATETIME(3)  NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    ConfirmedAt      DATETIME(3)  NULL,
    CONSTRAINT PK_InventoryReceipts PRIMARY KEY (ReceiptId),
    CONSTRAINT UQ_Receipts_Code UNIQUE (ReceiptCode),
    CONSTRAINT UQ_Receipts_WithWarehouse UNIQUE (ReceiptId, WarehouseId),
    CONSTRAINT CK_Receipts_Type   CHECK (ReceiptType IN ('SellerInbound','TransferInbound','CustomerReturn','Adjustment')),
    CONSTRAINT CK_Receipts_Status CHECK (Status IN ('Draft','Confirmed','Cancelled')),
    CONSTRAINT CK_Receipts_TypeRefs CHECK (
        ((ReceiptType = 'SellerInbound'   AND SenderSellerId  IS NOT NULL) OR (ReceiptType <> 'SellerInbound'   AND SenderSellerId  IS NULL)) AND
        ((ReceiptType = 'TransferInbound' AND TransferId      IS NOT NULL) OR (ReceiptType <> 'TransferInbound' AND TransferId      IS NULL)) AND
        ((ReceiptType = 'CustomerReturn'  AND ReturnRequestId IS NOT NULL) OR (ReceiptType <> 'CustomerReturn'  AND ReturnRequestId IS NULL))),
    CONSTRAINT CK_Receipts_Confirmed CHECK (
        (Status = 'Confirmed' AND ConfirmedBy IS NOT NULL AND ConfirmedAt IS NOT NULL) OR
        (Status <> 'Confirmed' AND ConfirmedBy IS NULL AND ConfirmedAt IS NULL)),
    CONSTRAINT CK_Receipts_Separation CHECK (ConfirmedBy IS NULL OR ConfirmedBy <> CreatedBy)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS ReceiptDetails;
-- Chi tiết phiếu nhập. WarehouseId lặp lại có chủ đích: khóa ngoại kép (file 03) đảm bảo
-- vị trí cất hàng thuộc đúng kho của phiếu.
CREATE TABLE ReceiptDetails (
    ReceiptDetailId  BIGINT        NOT NULL AUTO_INCREMENT,
    ReceiptId        BIGINT        NOT NULL,
    WarehouseId      BIGINT        NOT NULL,
    VariantId        BIGINT        NOT NULL,
    LocationId       BIGINT        NOT NULL,
    Quantity         INT           NOT NULL,
    UnitCost         DECIMAL(18,2) NULL,
    CONSTRAINT PK_ReceiptDetails PRIMARY KEY (ReceiptDetailId),
    CONSTRAINT CK_ReceiptDetails_Qty  CHECK (Quantity > 0),
    CONSTRAINT CK_ReceiptDetails_Cost CHECK (UnitCost IS NULL OR UnitCost >= 0)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS InventoryIssues;
-- Phiếu XUẤT kho (outbound). Luồng soạn/đóng gói cho đơn hàng: Draft -> Approved -> Picking -> Packed -> Dispatched.
--   OrderFulfillment : xuất cho đơn của seller (bắt buộc SellerOrderId)
--   TransferOutbound : xuất điều chuyển (bắt buộc TransferId)
--   Adjustment / ReturnToSeller / Disposal : điều chỉnh giảm, trả lại seller, tiêu hủy (cần người duyệt)
CREATE TABLE InventoryIssues (
    IssueId        BIGINT       NOT NULL AUTO_INCREMENT,
    WarehouseId    BIGINT       NOT NULL,
    SellerOrderId  BIGINT       NULL,
    TransferId     BIGINT       NULL,
    IssueCode      VARCHAR(40)  NOT NULL,
    IssueType      VARCHAR(30)  NOT NULL,
    Status         VARCHAR(30)  NOT NULL DEFAULT 'Draft',
    Note           VARCHAR(500) NULL,
    CreatedBy      BIGINT       NOT NULL,
    ApprovedBy     BIGINT       NULL,
    DispatchedBy   BIGINT       NULL,
    CreatedAt      DATETIME(3)  NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    ApprovedAt     DATETIME(3)  NULL,
    DispatchedAt   DATETIME(3)  NULL,
    CONSTRAINT PK_InventoryIssues PRIMARY KEY (IssueId),
    CONSTRAINT UQ_Issues_Code UNIQUE (IssueCode),
    CONSTRAINT UQ_Issues_WithWarehouse UNIQUE (IssueId, WarehouseId),
    CONSTRAINT CK_Issues_Type   CHECK (IssueType IN ('OrderFulfillment','TransferOutbound','Adjustment','ReturnToSeller','Disposal')),
    CONSTRAINT CK_Issues_Status CHECK (Status IN ('Draft','Approved','Picking','Packed','Dispatched','Cancelled')),
    CONSTRAINT CK_Issues_TypeRefs CHECK (
        ((IssueType = 'OrderFulfillment' AND SellerOrderId IS NOT NULL) OR (IssueType <> 'OrderFulfillment' AND SellerOrderId IS NULL)) AND
        ((IssueType = 'TransferOutbound' AND TransferId    IS NOT NULL) OR (IssueType <> 'TransferOutbound' AND TransferId    IS NULL))),
    CONSTRAINT CK_Issues_Separation CHECK (ApprovedBy IS NULL OR ApprovedBy <> CreatedBy),
    CONSTRAINT CK_Issues_Dispatched CHECK (Status <> 'Dispatched' OR (DispatchedAt IS NOT NULL AND DispatchedBy IS NOT NULL)),
    CONSTRAINT CK_Issues_NeedApproval CHECK (Status <> 'Dispatched' OR IssueType IN ('OrderFulfillment','TransferOutbound') OR ApprovedBy IS NOT NULL)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS IssueDetails;
-- Chi tiết phiếu xuất. Quantity = số cần lấy, PickedQuantity = số đã quét lấy thực tế.
-- ReservationId: dòng giữ chỗ được tiêu thụ khi xuất (chỉ có với OrderFulfillment).
CREATE TABLE IssueDetails (
    IssueDetailId   BIGINT NOT NULL AUTO_INCREMENT,
    IssueId         BIGINT NOT NULL,
    WarehouseId     BIGINT NOT NULL,
    VariantId       BIGINT NOT NULL,
    LocationId      BIGINT NOT NULL,
    Quantity        INT    NOT NULL,
    PickedQuantity  INT    NOT NULL DEFAULT 0,
    ReservationId   BIGINT NULL,
    CONSTRAINT PK_IssueDetails PRIMARY KEY (IssueDetailId),
    CONSTRAINT CK_IssueDetails_Qty    CHECK (Quantity > 0),
    CONSTRAINT CK_IssueDetails_Picked CHECK (PickedQuantity >= 0 AND PickedQuantity <= Quantity)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS StockTransfers;
-- Phiếu ĐIỀU CHUYỂN giữa hai kho: Draft -> Approved -> InTransit (xuất kho nguồn) -> Received (nhập kho đích).
CREATE TABLE StockTransfers (
    TransferId              BIGINT       NOT NULL AUTO_INCREMENT,
    SourceWarehouseId       BIGINT       NOT NULL,
    DestinationWarehouseId  BIGINT       NOT NULL,
    TransferCode            VARCHAR(40)  NOT NULL,
    Status                  VARCHAR(30)  NOT NULL DEFAULT 'Draft',
    Note                    VARCHAR(500) NULL,
    CreatedBy               BIGINT       NOT NULL,
    ApprovedBy              BIGINT       NULL,
    ReceivedBy              BIGINT       NULL,
    CreatedAt               DATETIME(3)  NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    ApprovedAt              DATETIME(3)  NULL,
    ShippedAt               DATETIME(3)  NULL,
    ReceivedAt              DATETIME(3)  NULL,
    CONSTRAINT PK_StockTransfers PRIMARY KEY (TransferId),
    CONSTRAINT UQ_Transfers_Code UNIQUE (TransferCode),
    CONSTRAINT CK_Transfer_Status CHECK (Status IN ('Draft','Approved','InTransit','Received','Cancelled')),
    CONSTRAINT CK_Transfer_Warehouses CHECK (SourceWarehouseId <> DestinationWarehouseId),
    CONSTRAINT CK_Transfer_Separation CHECK (ApprovedBy IS NULL OR ApprovedBy <> CreatedBy),
    CONSTRAINT CK_Transfer_Received CHECK (Status <> 'Received' OR (ReceivedAt IS NOT NULL AND ReceivedBy IS NOT NULL))
) ENGINE=InnoDB;

DROP TABLE IF EXISTS StockTransferDetails;
-- Chi tiết điều chuyển. ReceivedQuantity ghi số thực nhận (lệch với Quantity = thất thoát khi vận chuyển).
-- Vị trí nguồn/đích phải thuộc đúng kho nguồn/đích (trigger ở file 05).
CREATE TABLE StockTransferDetails (
    TransferDetailId       BIGINT NOT NULL AUTO_INCREMENT,
    TransferId             BIGINT NOT NULL,
    VariantId              BIGINT NOT NULL,
    SourceLocationId       BIGINT NOT NULL,
    DestinationLocationId  BIGINT NULL,
    Quantity               INT    NOT NULL,
    ReceivedQuantity       INT    NULL,
    CONSTRAINT PK_StockTransferDetails PRIMARY KEY (TransferDetailId),
    CONSTRAINT CK_TransferDetails_Qty CHECK (Quantity > 0),
    CONSTRAINT CK_TransferDetails_Received CHECK (ReceivedQuantity IS NULL OR (ReceivedQuantity >= 0 AND ReceivedQuantity <= Quantity))
) ENGINE=InnoDB;

DROP TABLE IF EXISTS StockCounts;
-- Phiếu KIỂM KÊ: Draft -> Counting -> PendingApproval -> Approved (sinh điều chỉnh tồn) / Cancelled.
CREATE TABLE StockCounts (
    StockCountId  BIGINT       NOT NULL AUTO_INCREMENT,
    WarehouseId   BIGINT       NOT NULL,
    CountCode     VARCHAR(40)  NOT NULL,
    Status        VARCHAR(30)  NOT NULL DEFAULT 'Draft',
    Note          VARCHAR(500) NULL,
    CreatedBy     BIGINT       NOT NULL,
    ApprovedBy    BIGINT       NULL,
    CreatedAt     DATETIME(3)  NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    ApprovedAt    DATETIME(3)  NULL,
    CONSTRAINT PK_StockCounts PRIMARY KEY (StockCountId),
    CONSTRAINT UQ_StockCounts_Code UNIQUE (CountCode),
    CONSTRAINT UQ_StockCounts_WithWarehouse UNIQUE (StockCountId, WarehouseId),
    CONSTRAINT CK_StockCounts_Status CHECK (Status IN ('Draft','Counting','PendingApproval','Approved','Cancelled')),
    CONSTRAINT CK_StockCounts_Separation CHECK (ApprovedBy IS NULL OR ApprovedBy <> CreatedBy),
    CONSTRAINT CK_StockCounts_Approved CHECK (Status <> 'Approved' OR (ApprovedBy IS NOT NULL AND ApprovedAt IS NOT NULL))
) ENGINE=InnoDB;

DROP TABLE IF EXISTS StockCountDetails;
-- Chi tiết kiểm kê. SystemQuantity chụp tồn hệ thống lúc bắt đầu; Difference = đếm thực - hệ thống.
-- Chênh lệch bắt buộc có lý do (Reason) khi khác 0 (kiểm tra ở service).
CREATE TABLE StockCountDetails (
    StockCountDetailId  BIGINT       NOT NULL AUTO_INCREMENT,
    StockCountId        BIGINT       NOT NULL,
    WarehouseId         BIGINT       NOT NULL,
    LocationId          BIGINT       NOT NULL,
    VariantId           BIGINT       NOT NULL,
    SystemQuantity      INT          NOT NULL,
    CountedQuantity     INT          NULL,
    Difference          INT GENERATED ALWAYS AS (CountedQuantity - SystemQuantity) STORED,
    Reason              VARCHAR(500) NULL,
    CONSTRAINT PK_StockCountDetails PRIMARY KEY (StockCountDetailId),
    CONSTRAINT UQ_StockCountDetails UNIQUE (StockCountId, LocationId, VariantId),
    CONSTRAINT CK_StockCountDetails_Qty CHECK (SystemQuantity >= 0 AND (CountedQuantity IS NULL OR CountedQuantity >= 0))
) ENGINE=InnoDB;

DROP TABLE IF EXISTS StockMovements;
-- SỔ CÁI TỒN KHO (stock ledger / thẻ kho). CHỈ THÊM, không sửa/xóa (trigger chặn ở file 05).
--   OnHandChange   : thay đổi tồn thực tế (Receipt/Issue/TransferIn/TransferOut/Adjustment/ReturnIn/StockCount)
--   ReservedChange : thay đổi tồn đang giữ (Reserve/ReleaseReserve)
--   Xuất cho đơn: Issue có OnHandChange = -N và ReservedChange = -N (tiêu thụ giữ chỗ).
--   OnHandAfter/ReservedAfter: tồn của (vị trí, biến thể) SAU biến động - dùng đối soát và dựng thẻ kho.
--   CreatedBy NULL = hệ thống/job nền.
CREATE TABLE StockMovements (
    StockMovementId  BIGINT       NOT NULL AUTO_INCREMENT,
    WarehouseId      BIGINT       NOT NULL,
    LocationId       BIGINT       NOT NULL,
    VariantId        BIGINT       NOT NULL,
    MovementType     VARCHAR(30)  NOT NULL,
    OnHandChange     INT          NOT NULL DEFAULT 0,
    ReservedChange   INT          NOT NULL DEFAULT 0,
    OnHandAfter      INT          NOT NULL,
    ReservedAfter    INT          NOT NULL,
    ReferenceType    VARCHAR(30)  NOT NULL,
    ReferenceId      BIGINT       NOT NULL,
    CreatedBy        BIGINT       NULL,
    CreatedAt        DATETIME(3)  NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    Note             VARCHAR(500) NULL,
    CONSTRAINT PK_StockMovements PRIMARY KEY (StockMovementId),
    CONSTRAINT CK_Movements_Type CHECK (MovementType IN ('Receipt','Issue','TransferIn','TransferOut','Adjustment','ReturnIn','StockCount','Reserve','ReleaseReserve')),
    CONSTRAINT CK_Movements_Ref  CHECK (ReferenceType IN ('Receipt','Issue','Transfer','StockCount','Reservation','ReturnRequest','Manual')),
    CONSTRAINT CK_Movements_NotEmpty CHECK (OnHandChange <> 0 OR ReservedChange <> 0),
    CONSTRAINT CK_Movements_After CHECK (OnHandAfter >= 0 AND ReservedAfter >= 0 AND ReservedAfter <= OnHandAfter)
) ENGINE=InnoDB;


-- ============================================================================
-- 6. SHIPPING, RETURNS & REVIEWS (VẬN CHUYỂN, TRẢ HÀNG, ĐÁNH GIÁ)
-- ============================================================================

DROP TABLE IF EXISTS Carriers;
-- Danh mục đơn vị vận chuyển (GHN, GHTK, Viettel Post...).
CREATE TABLE Carriers (
    CarrierId    INT          NOT NULL AUTO_INCREMENT,
    CarrierCode  VARCHAR(30)  NOT NULL,
    CarrierName  VARCHAR(100) NOT NULL,
    IsActive     BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT PK_Carriers PRIMARY KEY (CarrierId),
    CONSTRAINT UQ_Carriers_Code UNIQUE (CarrierCode)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS Shipments;
-- Kiện hàng vận chuyển của một đơn seller (một đơn có thể tách nhiều kiện).
-- CodAmount: số tiền shipper thu hộ (đơn COD), 0 nếu đã thanh toán trước.
CREATE TABLE Shipments (
    ShipmentId      BIGINT        NOT NULL AUTO_INCREMENT,
    SellerOrderId   BIGINT        NOT NULL,
    CarrierId       INT           NULL,
    TrackingNumber  VARCHAR(100)  NULL,
    ShippingStatus  VARCHAR(30)   NOT NULL DEFAULT 'Preparing',
    CodAmount       DECIMAL(18,2) NOT NULL DEFAULT 0,
    FailedReason    VARCHAR(500)  NULL,
    ShippedAt       DATETIME(3)   NULL,
    DeliveredAt     DATETIME(3)   NULL,
    CreatedAt       DATETIME(3)   NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    UpdatedAt       DATETIME(3)   NULL,
    CONSTRAINT PK_Shipments PRIMARY KEY (ShipmentId),
    CONSTRAINT UQ_Shipments_Carrier_Tracking UNIQUE (CarrierId, TrackingNumber),
    CONSTRAINT CK_Shipments_Status CHECK (ShippingStatus IN ('Preparing','PickedUp','InTransit','Delivered','Failed','Returned')),
    CONSTRAINT CK_Shipments_Cod CHECK (CodAmount >= 0),
    CONSTRAINT CK_Shipments_Delivered CHECK (ShippingStatus <> 'Delivered' OR DeliveredAt IS NOT NULL)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS ReturnRequests;
-- Yêu cầu TRẢ HÀNG của khách (theo đơn seller). Hàng hoàn KHÔNG tự cộng tồn bán được:
-- nhận về -> kiểm tra từng dòng (ReturnRequestItems.InspectionResult) -> mới nhập vào kệ bán hoặc khu hàng hỏng.
CREATE TABLE ReturnRequests (
    ReturnRequestId  BIGINT        NOT NULL AUTO_INCREMENT,
    RequestCode      VARCHAR(40)   NOT NULL,
    SellerOrderId    BIGINT        NOT NULL,
    CustomerId       BIGINT        NOT NULL,
    Reason           VARCHAR(500)  NOT NULL,
    Status           VARCHAR(30)   NOT NULL DEFAULT 'Requested',
    ReviewedBy       BIGINT        NULL,
    ReviewedAt       DATETIME(3)   NULL,
    RejectReason     VARCHAR(500)  NULL,
    CreatedAt        DATETIME(3)   NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    UpdatedAt        DATETIME(3)   NULL,
    CONSTRAINT PK_ReturnRequests PRIMARY KEY (ReturnRequestId),
    CONSTRAINT UQ_ReturnRequests_Code UNIQUE (RequestCode),
    CONSTRAINT CK_ReturnRequests_Status CHECK (Status IN ('Requested','Approved','Rejected','ItemsReceived','Inspected','Completed','Cancelled')),
    CONSTRAINT CK_ReturnRequests_Rejected CHECK (Status <> 'Rejected' OR RejectReason IS NOT NULL)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS ReturnRequestItems;
-- Dòng hàng trả + kết quả kiểm tra tình trạng.
--   Good        : nguyên vẹn -> nhập kệ bán      MinorDefect: lỗi nhẹ -> khu giảm giá/bán lại tùy chính sách
--   Damaged     : hỏng       -> khu hàng hỏng    Pending    : chưa kiểm
-- RestockLocationId: vị trí nhập lại (sau khi kiểm tra).
CREATE TABLE ReturnRequestItems (
    ReturnItemId       BIGINT       NOT NULL AUTO_INCREMENT,
    ReturnRequestId    BIGINT       NOT NULL,
    OrderItemId        BIGINT       NOT NULL,
    Quantity           INT          NOT NULL,
    InspectionResult   VARCHAR(20)  NOT NULL DEFAULT 'Pending',
    InspectionNote     VARCHAR(500) NULL,
    InspectedBy        BIGINT       NULL,
    InspectedAt        DATETIME(3)  NULL,
    RestockLocationId  BIGINT       NULL,
    CONSTRAINT PK_ReturnRequestItems PRIMARY KEY (ReturnItemId),
    CONSTRAINT UQ_ReturnRequestItems UNIQUE (ReturnRequestId, OrderItemId),
    CONSTRAINT CK_ReturnItems_Qty CHECK (Quantity > 0),
    CONSTRAINT CK_ReturnItems_Result CHECK (InspectionResult IN ('Pending','Good','MinorDefect','Damaged')),
    CONSTRAINT CK_ReturnItems_Inspected CHECK (
        (InspectionResult = 'Pending' AND InspectedBy IS NULL AND InspectedAt IS NULL) OR
        (InspectionResult <> 'Pending' AND InspectedBy IS NOT NULL AND InspectedAt IS NOT NULL))
) ENGINE=InnoDB;

DROP TABLE IF EXISTS Reviews;
-- Đánh giá sản phẩm: mỗi khách đánh giá 1 lần cho mỗi dòng hàng, chỉ khi đơn đã giao (trigger ở file 05).
CREATE TABLE Reviews (
    ReviewId     BIGINT        NOT NULL AUTO_INCREMENT,
    CustomerId   BIGINT        NOT NULL,
    OrderItemId  BIGINT        NOT NULL,
    Rating       TINYINT       NOT NULL,
    Comment      VARCHAR(2000) NULL,
    IsVisible    BOOLEAN       NOT NULL DEFAULT TRUE,
    CreatedAt    DATETIME(3)   NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    CONSTRAINT PK_Reviews PRIMARY KEY (ReviewId),
    CONSTRAINT UQ_Reviews_Customer_Item UNIQUE (CustomerId, OrderItemId),
    CONSTRAINT CK_Reviews_Rating CHECK (Rating BETWEEN 1 AND 5)
) ENGINE=InnoDB;

-- Bật lại kiểm tra khóa ngoại.
SET FOREIGN_KEY_CHECKS = 1;