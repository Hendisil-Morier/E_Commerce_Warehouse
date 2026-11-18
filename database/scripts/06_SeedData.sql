/*
================================================================================
 Dự án      : E-Commerce Marketplace (đa người bán) + Warehouse Management
 Database   : ECommerceWarehouse (MySQL 8.0.16+)
 File       : 06_SeedData.sql
 Mục đích   : Dữ liệu gốc tối thiểu để hệ thống chạy được ngay sau khi tạo schema.
 Chạy sau   : 05_TriggersAndViews.sql

 DANH SÁCH MỤC:
   1. Vai trò (Roles)
   2. Hãng vận chuyển (Carriers)
   3. Danh mục gốc (Categories)
   4. Kho sàn mặc định và các khu vực/vị trí (Warehouses, WarehouseLocations)

 KHÔNG seed tài khoản người dùng ở đây vì PasswordHash phải do ứng dụng sinh (BCrypt/PBKDF2).
 Hãy tạo tài khoản Admin đầu tiên bằng code (DataSeeder khi khởi động API) hoặc endpoint đăng ký,
 sau đó gán vai trò 'Admin' trong UserRoles.

 Script an toàn khi chạy lại nhiều lần (dùng INSERT IGNORE / kiểm tra tồn tại).
================================================================================
*/

USE ECommerceWarehouse;

-- ============================================================================
-- 1. VAI TRÒ
-- ============================================================================
INSERT IGNORE INTO Roles (RoleName, Description) VALUES
    ('Admin',            'Quản trị hệ thống: người dùng, phân quyền, duyệt seller/sản phẩm, xem nhật ký'),
    ('Customer',         'Khách hàng: mua hàng, theo dõi đơn, yêu cầu trả hàng, đánh giá'),
    ('Seller',           'Người bán: quản lý shop, sản phẩm, xử lý đơn của mình, gửi hàng vào kho sàn'),
    ('WarehouseManager', 'Quản lý kho: duyệt phiếu nhập/xuất/điều chuyển/kiểm kê, xem báo cáo kho'),
    ('WarehouseStaff',   'Nhân viên kho: nhận hàng, cất kệ, soạn hàng, đóng gói, kiểm tra hàng hoàn'),
    ('CustomerSupport',  'Chăm sóc khách hàng: tra cứu đơn, hỗ trợ hủy/đổi/trả');

-- ============================================================================
-- 2. HÃNG VẬN CHUYỂN
-- ============================================================================
INSERT IGNORE INTO Carriers (CarrierCode, CarrierName) VALUES
    ('GHN',   'Giao Hàng Nhanh'),
    ('GHTK',  'Giao Hàng Tiết Kiệm'),
    ('VTP',   'Viettel Post'),
    ('JT',    'J&T Express'),
    ('SPX',   'SPX Express');

-- ============================================================================
-- 3. DANH MỤC GỐC (cấp 1; các cấp con thêm qua màn hình quản trị)
-- ============================================================================
INSERT INTO Categories (ParentCategoryId, CategoryName, Description)
SELECT NULL, v.CategoryName, v.Description
FROM (
    SELECT 'Điện thoại & Phụ kiện' AS CategoryName, 'Điện thoại, ốp lưng, sạc, tai nghe' AS Description
    UNION ALL SELECT 'Máy tính & Laptop',  'Laptop, linh kiện, phụ kiện máy tính'
    UNION ALL SELECT 'Thời trang',         'Quần áo, giày dép, phụ kiện'
    UNION ALL SELECT 'Nhà cửa & Đời sống', 'Đồ gia dụng, nội thất, dụng cụ'
    UNION ALL SELECT 'Sức khỏe & Làm đẹp', 'Mỹ phẩm, chăm sóc cá nhân'
    UNION ALL SELECT 'Thực phẩm & Đồ uống','Thực phẩm khô, đồ uống, đồ ăn vặt'
) v
WHERE NOT EXISTS (
    SELECT 1 FROM Categories c
    WHERE c.ParentCategoryId IS NULL AND c.CategoryName = v.CategoryName
);

-- ============================================================================
-- 4. KHO SÀN MẶC ĐỊNH VÀ VỊ TRÍ
--    - Khu bán được (IsSellable = 1): kệ thường A-01-01 .. A-01-03, khu lạnh C-01-01, khu dễ vỡ F-01-01
--    - Khu KHÔNG bán được: INBOUND (hàng mới về chờ cất), RETURNS (hàng khách trả chờ kiểm),
--      DAMAGED (hàng hỏng chờ xử lý). Hàng hoàn chỉ được chuyển sang kệ bán sau khi kiểm tra đạt.
-- ============================================================================
INSERT INTO Warehouses (WarehouseName, WarehouseType, OwnerSellerId, Address)
SELECT 'Kho sàn Hà Nội', 'Platform', NULL, 'Hà Nội (cập nhật địa chỉ thực tế)'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM Warehouses WHERE WarehouseName = 'Kho sàn Hà Nội' AND WarehouseType = 'Platform');

SET @platform_wh := (SELECT WarehouseId FROM Warehouses
                     WHERE WarehouseName = 'Kho sàn Hà Nội' AND WarehouseType = 'Platform' LIMIT 1);

INSERT IGNORE INTO WarehouseLocations (WarehouseId, LocationCode, StorageType, IsSellable) VALUES
    (@platform_wh, 'A-01-01',   'Standard', 1),
    (@platform_wh, 'A-01-02',   'Standard', 1),
    (@platform_wh, 'A-01-03',   'Standard', 1),
    (@platform_wh, 'C-01-01',   'Cold',     1),
    (@platform_wh, 'F-01-01',   'Fragile',  1),
    (@platform_wh, 'INBOUND-01','Inbound',  0),
    (@platform_wh, 'RETURNS-01','Returns',  0),
    (@platform_wh, 'DAMAGED-01','Damaged',  0);

-- ============================================================================
-- 5. TÀI KHOẢN MẪU THỬ NGHIỆM 4 VAI TRÒ (Seed Data)
--    Lưu ý: Bạn cũng có thể để ứng dụng tự động seed khi chạy API (DataSeeder.cs).
--    Mật khẩu mặc định: Demo@123
-- ============================================================================
-- Tạo User mẫu (nếu chưa có)
INSERT INTO Users (UserId, FullName, Email, PasswordHash, PhoneNumber, IsActive)
VALUES 
    (1, 'Quản trị viên Hệ thống', 'admin@emarket.vn', 'AQAAAAIAAYagAAAAENK8/demoHashAdmin1234567890abcdef...', '0988123456', 1),
    (2, 'Nguyễn Văn Kho (Thủ kho)', 'warehouse@emarket.vn', 'AQAAAAIAAYagAAAAENK8/demoHashWarehouse123456...', '0988123456', 1),
    (3, 'Trần Thị Shop (Người bán)', 'seller@emarket.vn', 'AQAAAAIAAYagAAAAENK8/demoHashSeller123456789...', '0988123456', 1),
    (4, 'Lê Hoàng Khách (Khách hàng)', 'customer@gmail.com', 'AQAAAAIAAYagAAAAENK8/demoHashCustomer123456...', '0988123456', 1)
ON DUPLICATE KEY UPDATE FullName = VALUES(FullName);

-- Gán quyền vào bảng UserRoles
INSERT IGNORE INTO UserRoles (UserId, RoleId)
SELECT 1, RoleId FROM Roles WHERE RoleName = 'Admin'
UNION ALL
SELECT 2, RoleId FROM Roles WHERE RoleName = 'WarehouseManager'
UNION ALL
SELECT 3, RoleId FROM Roles WHERE RoleName = 'Seller'
UNION ALL
SELECT 4, RoleId FROM Roles WHERE RoleName = 'Customer';

