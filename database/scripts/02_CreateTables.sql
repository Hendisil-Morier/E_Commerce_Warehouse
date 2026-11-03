USE ECommerceWarehouse;
GO
/* IDENTITY */
CREATE TABLE dbo.Users(
 UserId BIGINT IDENTITY PRIMARY KEY, FullName NVARCHAR(150) NOT NULL,
 Email NVARCHAR(255) NOT NULL UNIQUE, PasswordHash NVARCHAR(500) NOT NULL,
 PhoneNumber VARCHAR(20) NULL, AvatarUrl NVARCHAR(1000) NULL,
 IsActive BIT NOT NULL DEFAULT 1, CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
 UpdatedAt DATETIME2 NULL
);

CREATE TABLE dbo.Roles(
 RoleId INT IDENTITY PRIMARY KEY, RoleName VARCHAR(50) NOT NULL UNIQUE,
 Description NVARCHAR(255) NULL
);

CREATE TABLE dbo.UserRoles(
 UserId BIGINT NOT NULL, RoleId INT NOT NULL, AssignedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
 CONSTRAINT PK_UserRoles PRIMARY KEY(UserId,RoleId)
);

CREATE TABLE dbo.Sellers(
 SellerId BIGINT IDENTITY PRIMARY KEY, UserId BIGINT NOT NULL UNIQUE,
 BusinessName NVARCHAR(200) NOT NULL, TaxCode VARCHAR(20) NULL,
 Description NVARCHAR(1000) NULL, Status VARCHAR(30) NOT NULL DEFAULT 'Pending',
 CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
 CONSTRAINT CK_Sellers_Status CHECK(Status IN('Pending','Approved','Rejected','Suspended'))
);

CREATE TABLE dbo.Shops(
 ShopId BIGINT IDENTITY PRIMARY KEY, SellerId BIGINT NOT NULL,
 ShopName NVARCHAR(200) NOT NULL, Description NVARCHAR(1000) NULL,
 LogoUrl NVARCHAR(1000) NULL, IsActive BIT NOT NULL DEFAULT 1,
 CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);

/* CATALOG */
CREATE TABLE dbo.Categories(
 CategoryId BIGINT IDENTITY PRIMARY KEY, ParentCategoryId BIGINT NULL,
 CategoryName NVARCHAR(150) NOT NULL, Description NVARCHAR(1000) NULL,
 IsActive BIT NOT NULL DEFAULT 1
);

CREATE TABLE dbo.Products(
 ProductId BIGINT IDENTITY PRIMARY KEY, SellerId BIGINT NOT NULL, ShopId BIGINT NOT NULL,
 CategoryId BIGINT NOT NULL, ProductName NVARCHAR(250) NOT NULL,
 Description NVARCHAR(MAX) NULL, ProductStatus VARCHAR(30) NOT NULL DEFAULT 'Draft',
 CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(), UpdatedAt DATETIME2 NULL,
 CONSTRAINT CK_Products_Status CHECK(ProductStatus IN('Draft','Active','Inactive','Rejected'))
);

CREATE TABLE dbo.ProductVariants(
 VariantId BIGINT IDENTITY PRIMARY KEY, ProductId BIGINT NOT NULL,
 SKU VARCHAR(80) NOT NULL UNIQUE, VariantName NVARCHAR(150) NOT NULL,
 Price DECIMAL(18,2) NOT NULL CHECK(Price>=0), WeightGrams INT NULL CHECK(WeightGrams IS NULL OR WeightGrams>=0),
 IsActive BIT NOT NULL DEFAULT 1, CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);

CREATE TABLE dbo.ProductImages(
 ImageId BIGINT IDENTITY PRIMARY KEY, ProductId BIGINT NOT NULL,
 ImageUrl NVARCHAR(1000) NOT NULL, IsPrimary BIT NOT NULL DEFAULT 0,
 DisplayOrder INT NOT NULL DEFAULT 0 CHECK(DisplayOrder>=0)
);

/* CUSTOMER */
CREATE TABLE dbo.UserAddresses(
 AddressId BIGINT IDENTITY PRIMARY KEY, UserId BIGINT NOT NULL,
 RecipientName NVARCHAR(150) NOT NULL, PhoneNumber VARCHAR(20) NOT NULL,
 Province NVARCHAR(100) NOT NULL, District NVARCHAR(100) NOT NULL,
 Ward NVARCHAR(100) NOT NULL, StreetAddress NVARCHAR(300) NOT NULL,
 IsDefault BIT NOT NULL DEFAULT 0, CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);

CREATE TABLE dbo.Carts(
 CartId BIGINT IDENTITY PRIMARY KEY, UserId BIGINT NOT NULL UNIQUE,
 CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(), UpdatedAt DATETIME2 NULL
);

CREATE TABLE dbo.CartItems(
 CartItemId BIGINT IDENTITY PRIMARY KEY, CartId BIGINT NOT NULL, VariantId BIGINT NOT NULL,
 Quantity INT NOT NULL CHECK(Quantity>0), AddedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
 CONSTRAINT UQ_CartItems UNIQUE(CartId,VariantId)
);

CREATE TABLE dbo.Wishlists(
 WishlistId BIGINT IDENTITY PRIMARY KEY, UserId BIGINT NOT NULL,
 WishlistName NVARCHAR(100) NOT NULL DEFAULT N'Yêu thích',
 CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);

CREATE TABLE dbo.WishlistItems(
 WishlistItemId BIGINT IDENTITY PRIMARY KEY, WishlistId BIGINT NOT NULL, ProductId BIGINT NOT NULL,
 AddedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(), CONSTRAINT UQ_WishlistItems UNIQUE(WishlistId,ProductId)
);

/* ORDERS & PAYMENTS */
CREATE TABLE dbo.Orders(
 OrderId BIGINT IDENTITY PRIMARY KEY, CustomerId BIGINT NOT NULL, OrderCode VARCHAR(40) NOT NULL UNIQUE,
 RecipientName NVARCHAR(150) NOT NULL, RecipientPhone VARCHAR(20) NOT NULL,
 ShippingProvince NVARCHAR(100) NOT NULL, ShippingDistrict NVARCHAR(100) NOT NULL,
 ShippingWard NVARCHAR(100) NOT NULL, ShippingStreetAddress NVARCHAR(300) NOT NULL,
 Subtotal DECIMAL(18,2) NOT NULL CHECK(Subtotal>=0),
 ShippingFee DECIMAL(18,2) NOT NULL DEFAULT 0 CHECK(ShippingFee>=0),
 DiscountAmount DECIMAL(18,2) NOT NULL DEFAULT 0 CHECK(DiscountAmount>=0),
 TotalAmount DECIMAL(18,2) NOT NULL CHECK(TotalAmount>=0),
 OrderStatus VARCHAR(30) NOT NULL DEFAULT 'Pending'
 CHECK(OrderStatus IN('Pending','Confirmed','Processing','PartiallyShipped','Completed','Cancelled')),
 CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);

CREATE TABLE dbo.SellerOrders(
 SellerOrderId BIGINT IDENTITY PRIMARY KEY, OrderId BIGINT NOT NULL, SellerId BIGINT NOT NULL,
 WarehouseId BIGINT NULL, Subtotal DECIMAL(18,2) NOT NULL CHECK(Subtotal>=0),
 Status VARCHAR(30) NOT NULL DEFAULT 'Pending'
 CHECK(Status IN('Pending','Confirmed','Preparing','ReadyToShip','Shipped','Delivered','Cancelled','Returned')),
 CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(), CONSTRAINT UQ_SellerOrders UNIQUE(OrderId,SellerId)
);

CREATE TABLE dbo.OrderItems(
 OrderItemId BIGINT IDENTITY PRIMARY KEY, SellerOrderId BIGINT NOT NULL, VariantId BIGINT NOT NULL,
 ProductNameSnapshot NVARCHAR(250) NOT NULL, SKUSnapshot VARCHAR(80) NOT NULL,
 UnitPrice DECIMAL(18,2) NOT NULL CHECK(UnitPrice>=0), Quantity INT NOT NULL CHECK(Quantity>0),
 LineTotal AS(UnitPrice*Quantity) PERSISTED
);

CREATE TABLE dbo.Payments(
 PaymentId BIGINT IDENTITY PRIMARY KEY, OrderId BIGINT NOT NULL, PaymentMethod VARCHAR(30) NOT NULL
 CHECK(PaymentMethod IN('COD','BankTransfer','EWallet','CreditCard')),
 Amount DECIMAL(18,2) NOT NULL CHECK(Amount>=0),
 PaymentStatus VARCHAR(30) NOT NULL DEFAULT 'Pending'
 CHECK(PaymentStatus IN('Pending','Paid','Failed','Refunded','PartiallyRefunded')),
 TransactionCode VARCHAR(100) NULL, PaidAt DATETIME2 NULL, CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);

CREATE TABLE dbo.Refunds(
 RefundId BIGINT IDENTITY PRIMARY KEY, PaymentId BIGINT NOT NULL, SellerOrderId BIGINT NULL,
 Amount DECIMAL(18,2) NOT NULL CHECK(Amount>0), Reason NVARCHAR(500) NULL,
 RefundStatus VARCHAR(30) NOT NULL DEFAULT 'Pending'
 CHECK(RefundStatus IN('Pending','Approved','Rejected','Completed')),
 CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);

/* WAREHOUSE */
CREATE TABLE dbo.Warehouses(
 WarehouseId BIGINT IDENTITY PRIMARY KEY, WarehouseName NVARCHAR(200) NOT NULL,
 WarehouseType VARCHAR(20) NOT NULL CHECK(WarehouseType IN('Platform','Seller')),
 OwnerSellerId BIGINT NULL, Address NVARCHAR(500) NOT NULL,
 IsActive BIT NOT NULL DEFAULT 1, CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
 CONSTRAINT CK_Warehouse_Owner CHECK((WarehouseType='Platform' AND OwnerSellerId IS NULL) OR (WarehouseType='Seller' AND OwnerSellerId IS NOT NULL))
);

CREATE TABLE dbo.WarehouseLocations(
 LocationId BIGINT IDENTITY PRIMARY KEY, WarehouseId BIGINT NOT NULL, LocationCode VARCHAR(50) NOT NULL,
 StorageType VARCHAR(30) NOT NULL DEFAULT 'Standard' CHECK(StorageType IN('Standard','Cold','Hazardous','Fragile')),
 IsActive BIT NOT NULL DEFAULT 1, CONSTRAINT UQ_WarehouseLocation UNIQUE(WarehouseId,LocationCode)
);

CREATE TABLE dbo.Inventory(
 InventoryId BIGINT IDENTITY PRIMARY KEY, WarehouseId BIGINT NOT NULL, LocationId BIGINT NOT NULL,
 VariantId BIGINT NOT NULL, QuantityOnHand INT NOT NULL DEFAULT 0,
 QuantityReserved INT NOT NULL DEFAULT 0, UpdatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
 CONSTRAINT UQ_Inventory UNIQUE(WarehouseId,LocationId,VariantId),
 CONSTRAINT CK_Inventory_Qty CHECK(QuantityOnHand>=0 AND QuantityReserved>=0 AND QuantityReserved<=QuantityOnHand)
);

CREATE TABLE dbo.InventoryReceipts(
 ReceiptId BIGINT IDENTITY PRIMARY KEY, WarehouseId BIGINT NOT NULL, SenderSellerId BIGINT NULL,
 ReceiptCode VARCHAR(40) NOT NULL UNIQUE,
 ReceiptType VARCHAR(30) NOT NULL CHECK(ReceiptType IN('SellerInbound','Purchase','TransferInbound','Return')),
 Status VARCHAR(30) NOT NULL DEFAULT 'Draft' CHECK(Status IN('Draft','Confirmed','Cancelled')),
 Note NVARCHAR(500) NULL, CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(), ConfirmedAt DATETIME2 NULL
);

CREATE TABLE dbo.ReceiptDetails(
 ReceiptDetailId BIGINT IDENTITY PRIMARY KEY, ReceiptId BIGINT NOT NULL, VariantId BIGINT NOT NULL,
 LocationId BIGINT NOT NULL, Quantity INT NOT NULL CHECK(Quantity>0),
 UnitCost DECIMAL(18,2) NULL CHECK(UnitCost IS NULL OR UnitCost>=0)
);

CREATE TABLE dbo.InventoryIssues(
 IssueId BIGINT IDENTITY PRIMARY KEY, WarehouseId BIGINT NOT NULL, SellerOrderId BIGINT NULL,
 IssueCode VARCHAR(40) NOT NULL UNIQUE,
 IssueType VARCHAR(30) NOT NULL CHECK(IssueType IN('OrderFulfillment','TransferOutbound','Adjustment','ReturnToSeller')),
 Status VARCHAR(30) NOT NULL DEFAULT 'Draft' CHECK(Status IN('Draft','Approved','Dispatched','Cancelled')),
 Note NVARCHAR(500) NULL, CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(), DispatchedAt DATETIME2 NULL
);

CREATE TABLE dbo.IssueDetails(
 IssueDetailId BIGINT IDENTITY PRIMARY KEY, IssueId BIGINT NOT NULL, VariantId BIGINT NOT NULL,
 LocationId BIGINT NOT NULL, Quantity INT NOT NULL CHECK(Quantity>0)
);

CREATE TABLE dbo.StockTransfers(
 TransferId BIGINT IDENTITY PRIMARY KEY, SourceWarehouseId BIGINT NOT NULL,
 DestinationWarehouseId BIGINT NOT NULL, TransferCode VARCHAR(40) NOT NULL UNIQUE,
 Status VARCHAR(30) NOT NULL DEFAULT 'Draft'
 CHECK(Status IN('Draft','Approved','InTransit','Received','Cancelled')),
 Note NVARCHAR(500) NULL, CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
 ShippedAt DATETIME2 NULL, ReceivedAt DATETIME2 NULL,
 CONSTRAINT CK_Transfer_Warehouses CHECK(SourceWarehouseId<>DestinationWarehouseId)
);

CREATE TABLE dbo.StockTransferDetails(
 TransferDetailId BIGINT IDENTITY PRIMARY KEY, TransferId BIGINT NOT NULL, VariantId BIGINT NOT NULL,
 SourceLocationId BIGINT NOT NULL, DestinationLocationId BIGINT NULL, Quantity INT NOT NULL CHECK(Quantity>0)
);

CREATE TABLE dbo.StockMovements(
 StockMovementId BIGINT IDENTITY PRIMARY KEY, WarehouseId BIGINT NOT NULL, LocationId BIGINT NOT NULL,
 VariantId BIGINT NOT NULL,
 MovementType VARCHAR(30) NOT NULL CHECK(MovementType IN('Receipt','Issue','TransferIn','TransferOut','Adjustment','Reservation','ReleaseReservation')),
 QuantityChange INT NOT NULL CHECK(QuantityChange<>0),
 ReferenceType VARCHAR(30) NOT NULL, ReferenceId BIGINT NOT NULL,
 CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(), Note NVARCHAR(500) NULL
);

/* SHIPPING & REVIEWS */
CREATE TABLE dbo.Shipments(
 ShipmentId BIGINT IDENTITY PRIMARY KEY, SellerOrderId BIGINT NOT NULL,
 CarrierName NVARCHAR(100) NULL, TrackingNumber VARCHAR(100) NULL,
 ShippingStatus VARCHAR(30) NOT NULL DEFAULT 'Preparing'
 CHECK(ShippingStatus IN('Preparing','PickedUp','InTransit','Delivered','Failed','Returned')),
 ShippedAt DATETIME2 NULL, DeliveredAt DATETIME2 NULL, CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);

CREATE TABLE dbo.Reviews(
 ReviewId BIGINT IDENTITY PRIMARY KEY, CustomerId BIGINT NOT NULL, OrderItemId BIGINT NOT NULL,
 Rating TINYINT NOT NULL CHECK(Rating BETWEEN 1 AND 5), Comment NVARCHAR(2000) NULL,
 CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(), CONSTRAINT UQ_Review UNIQUE(CustomerId,OrderItemId)
);

GO

