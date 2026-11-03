USE ECommerceWarehouse;
GO
-- Table inventory
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME;
GO
-- Users and roles
SELECT u.UserId,u.FullName,u.Email,r.RoleName
FROM dbo.Users u LEFT JOIN dbo.UserRoles ur ON ur.UserId=u.UserId
LEFT JOIN dbo.Roles r ON r.RoleId=ur.RoleId;
GO
-- Product catalog
SELECT p.ProductName,s.BusinessName,sh.ShopName,c.CategoryName,v.SKU,v.Price
FROM dbo.Products p JOIN dbo.Sellers s ON s.SellerId=p.SellerId
JOIN dbo.Shops sh ON sh.ShopId=p.ShopId JOIN dbo.Categories c ON c.CategoryId=p.CategoryId
JOIN dbo.ProductVariants v ON v.ProductId=p.ProductId;
GO
-- Available stock
SELECT w.WarehouseName,v.SKU,i.QuantityOnHand,i.QuantityReserved,
(i.QuantityOnHand-i.QuantityReserved) AS AvailableQuantity
FROM dbo.Inventory i JOIN dbo.Warehouses w ON w.WarehouseId=i.WarehouseId
JOIN dbo.ProductVariants v ON v.VariantId=i.VariantId;
GO
-- Foreign key count
SELECT COUNT(*) AS ForeignKeyCount FROM sys.foreign_keys;
GO
