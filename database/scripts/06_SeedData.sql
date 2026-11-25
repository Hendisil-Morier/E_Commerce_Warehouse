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

SET NAMES utf8mb4;

USE ECommerceWarehouse;

-- Tắt kiểm tra an toàn cập nhật tạm thời để hỗ trợ làm sạch dữ liệu demo
SET SQL_SAFE_UPDATES = 0;

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
AS new_user
ON DUPLICATE KEY UPDATE FullName = new_user.FullName;

-- Gán quyền vào bảng UserRoles
INSERT IGNORE INTO UserRoles (UserId, RoleId)
SELECT 1, RoleId FROM Roles WHERE RoleName = 'Admin'
UNION ALL
SELECT 2, RoleId FROM Roles WHERE RoleName = 'WarehouseManager'
UNION ALL
SELECT 3, RoleId FROM Roles WHERE RoleName = 'Seller'
UNION ALL
SELECT 4, RoleId FROM Roles WHERE RoleName = 'Customer';

-- ============================================================================
-- 5B. LÀM SẠCH DỮ LIỆU DEMO CŨ (NẾU TỒN TẠI) TRƯỚC KHI NẠP MỚI
--     Tự động xóa sạch các sản phẩm, shop, seller demo cũ để nạp lại mới tinh.
--     KHÔNG ảnh hưởng đến tài khoản gốc (Admin, Thủ kho, Khách hàng mẫu, Kho sàn).
-- ============================================================================
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_SAFE_UPDATES = 0;

-- 1. Xóa ảnh sản phẩm cũ của các seller demo
DELETE pi FROM ProductImages pi
JOIN Products p ON pi.ProductId = p.ProductId
JOIN Shops s ON p.ShopId = s.ShopId
JOIN Sellers sel ON s.SellerId = sel.SellerId
WHERE sel.TaxCode LIKE '01099880%';

-- 2. Xóa biến thể sản phẩm cũ của các seller demo
DELETE pv FROM ProductVariants pv
JOIN Products p ON pv.ProductId = p.ProductId
JOIN Shops s ON p.ShopId = s.ShopId
JOIN Sellers sel ON s.SellerId = sel.SellerId
WHERE sel.TaxCode LIKE '01099880%';

-- 3. Xóa sản phẩm cũ của các seller demo
DELETE p FROM Products p
JOIN Shops s ON p.ShopId = s.ShopId
JOIN Sellers sel ON s.SellerId = sel.SellerId
WHERE sel.TaxCode LIKE '01099880%';

-- 4. Xóa các shop của seller demo
DELETE s FROM Shops s
JOIN Sellers sel ON s.SellerId = sel.SellerId
WHERE sel.TaxCode LIKE '01099880%';

-- 5. Xóa hồ sơ các seller demo
DELETE FROM Sellers WHERE TaxCode LIKE '01099880%';

-- 6. Xóa phân quyền và tài khoản seller demo
DELETE ur FROM UserRoles ur
JOIN Users u ON ur.UserId = u.UserId
WHERE u.Email LIKE 'seller%@emarket.com';

DELETE FROM Users WHERE Email LIKE 'seller%@emarket.com';

-- 7. Xóa các danh mục con cũ (để nạp lại chuẩn xác)
DELETE FROM Categories WHERE ParentCategoryId IS NOT NULL;

SET FOREIGN_KEY_CHECKS = 1;
SET SQL_SAFE_UPDATES = 1;

-- ============================================================================
-- 6. DANH MỤC CON (31 danh mục con liên kết với 6 danh mục gốc)
-- ============================================================================
INSERT INTO Categories (ParentCategoryId, CategoryName, Description)
SELECT p.CategoryId, v.CategoryName, v.Description
FROM (
    SELECT 'Điện thoại & Phụ kiện' AS ParentCategoryName, 'Ốp lưng & bảo vệ màn hình' AS CategoryName, 'Ốp lưng, kính cường lực, dán lưng PPF và viền bảo vệ điện thoại' AS Description UNION ALL
    SELECT 'Điện thoại & Phụ kiện' AS ParentCategoryName, 'Sạc, cáp & pin dự phòng' AS CategoryName, 'Củ sạc nhanh, cáp sạc đa năng, pin sạc dự phòng dung lượng cao' AS Description UNION ALL
    SELECT 'Điện thoại & Phụ kiện' AS ParentCategoryName, 'Tai nghe & loa' AS CategoryName, 'Tai nghe bluetooth, tai nghe chụp tai, loa mini di động không dây' AS Description UNION ALL
    SELECT 'Điện thoại & Phụ kiện' AS ParentCategoryName, 'Phụ kiện chụp ảnh & giá đỡ' AS CategoryName, 'Gậy selfie, tripod 3 chân, đèn livestream, giá kẹp điện thoại ô tô' AS Description UNION ALL
    SELECT 'Điện thoại & Phụ kiện' AS ParentCategoryName, 'Đồng hồ thông minh & vòng tay' AS CategoryName, 'Vòng đeo thông minh, dây đồng hồ thay thế, ốp bảo vệ mặt đồng hồ' AS Description UNION ALL
    SELECT 'Máy tính & Laptop' AS ParentCategoryName, 'Chuột, bàn phím & gaming gear' AS CategoryName, 'Bàn phím cơ, chuột không dây công thái học, lót chuột, tay cầm chơi game' AS Description UNION ALL
    SELECT 'Máy tính & Laptop' AS ParentCategoryName, 'Phụ kiện laptop' AS CategoryName, 'Balo, túi chống sốc, đế tản nhiệt laptop, giá đỡ nhôm công thái học' AS Description UNION ALL
    SELECT 'Máy tính & Laptop' AS ParentCategoryName, 'Thiết bị lưu trữ' AS CategoryName, 'Ổ cứng di động SSD, thẻ nhớ MicroSD, USB flash, đầu đọc thẻ nhớ' AS Description UNION ALL
    SELECT 'Máy tính & Laptop' AS ParentCategoryName, 'Màn hình & webcam' AS CategoryName, 'Màn hình vi tính văn phòng, webcam họp trực tuyến, giá treo màn hình đơn đôi' AS Description UNION ALL
    SELECT 'Máy tính & Laptop' AS ParentCategoryName, 'Linh kiện & mạng' AS CategoryName, 'Router phát wifi, bộ chia mạng switch, hub chuyển đổi Type-C, cáp mạng' AS Description UNION ALL
    SELECT 'Thời trang' AS ParentCategoryName, 'Áo thun & sơ mi nam' AS CategoryName, 'Áo polo nam, sơ mi công sở, áo thun cotton cổ tròn, áo khoác gió' AS Description UNION ALL
    SELECT 'Thời trang' AS ParentCategoryName, 'Thời trang nữ' AS CategoryName, 'Váy đầm xòe, áo kiểu nữ, chân váy công sở, đầm suông tiểu thư' AS Description UNION ALL
    SELECT 'Thời trang' AS ParentCategoryName, 'Giày dép' AS CategoryName, 'Giày sneaker thể thao, sandal nữ gót vuông, dép đúc êm chân, giày lười' AS Description UNION ALL
    SELECT 'Thời trang' AS ParentCategoryName, 'Túi xách & ví' AS CategoryName, 'Túi kẹp nách nữ, ví da nam gấp gọn, túi tote vải canvas, balo mini' AS Description UNION ALL
    SELECT 'Thời trang' AS ParentCategoryName, 'Đồ thể thao' AS CategoryName, 'Quần áo tập gym, đồ tập yoga nữ co giãn, đai chạy bộ, áo thun chạy bộ' AS Description UNION ALL
    SELECT 'Thời trang' AS ParentCategoryName, 'Thời trang trẻ em' AS CategoryName, 'Bộ quần áo cotton sợi tre cho bé, váy công chúa bé gái, áo khoác gió trẻ em' AS Description UNION ALL
    SELECT 'Nhà cửa & Đời sống' AS ParentCategoryName, 'Đồ nhà bếp' AS CategoryName, 'Bộ dao làm bếp, chảo chống dính đáy từ, hộp thủy tinh lò vi sóng, thớt kháng khuẩn' AS Description UNION ALL
    SELECT 'Nhà cửa & Đời sống' AS ParentCategoryName, 'Dụng cụ & thiết bị gia đình' AS CategoryName, 'Bộ dụng cụ cầm tay sửa chữa, bóng đèn LED thông minh, ổ cắm điện, máy khoan pin' AS Description UNION ALL
    SELECT 'Nhà cửa & Đời sống' AS ParentCategoryName, 'Đồ dùng phòng ngủ' AS CategoryName, 'Set ga gối cotton lụa, gối cao su non chống đau cổ, đệm topper, chăn nỉ hè thu' AS Description UNION ALL
    SELECT 'Nhà cửa & Đời sống' AS ParentCategoryName, 'Đồ trang trí & lưu trữ' AS CategoryName, 'Hộp vải lưu trữ quần áo, đồng hồ treo tường, kệ gỗ, thảm trải sàn lông xù' AS Description UNION ALL
    SELECT 'Nhà cửa & Đời sống' AS ParentCategoryName, 'Văn phòng phẩm & đồ học tập' AS CategoryName, 'Sổ tay bìa da, hộp bút để bàn, màu vẽ acrylic, đèn bàn chống cận thị' AS Description UNION ALL
    SELECT 'Sức khỏe & Làm đẹp' AS ParentCategoryName, 'Chăm sóc da' AS CategoryName, 'Sữa rửa mặt tạo bọt dịu nhẹ, serum phục hồi da B5, kem chống nắng kiềm dầu' AS Description UNION ALL
    SELECT 'Sức khỏe & Làm đẹp' AS ParentCategoryName, 'Trang điểm' AS CategoryName, 'Son kem lì, phấn nước cushion kiềm dầu, mascara uốn mi cong, bảng phấn mắt' AS Description UNION ALL
    SELECT 'Sức khỏe & Làm đẹp' AS ParentCategoryName, 'Chăm sóc tóc & cơ thể' AS CategoryName, 'Dầu gội bưởi mọc tóc, sữa tắm nước hoa dưỡng ẩm, tẩy tế bào chết cà phê body' AS Description UNION ALL
    SELECT 'Sức khỏe & Làm đẹp' AS ParentCategoryName, 'Thực phẩm chức năng & vitamin' AS CategoryName, 'Nước uống collagen peptide, viên sủi vitamin C, bột đạm whey protein thực vật' AS Description UNION ALL
    SELECT 'Sức khỏe & Làm đẹp' AS ParentCategoryName, 'Dụng cụ y tế gia đình' AS CategoryName, 'Nhiệt kế điện tử đầu mềm, máy đo huyết áp bắp tay tự động, khẩu trang y tế 4 lớp' AS Description UNION ALL
    SELECT 'Thực phẩm & Đồ uống' AS ParentCategoryName, 'Đồ khô & gia vị' AS CategoryName, 'Nước mắm cá cơm truyền thống, hạt tiêu đen Phú Quốc, nấm hương rừng khô' AS Description UNION ALL
    SELECT 'Thực phẩm & Đồ uống' AS ParentCategoryName, 'Bánh kẹo & snack' AS CategoryName, 'Khô gà lá chanh, khô bò miếng mềm, hạt điều rang muối, bánh quy bơ hộp thiếc' AS Description UNION ALL
    SELECT 'Thực phẩm & Đồ uống' AS ParentCategoryName, 'Đồ uống' AS CategoryName, 'Trà xanh búp Thái Nguyên, cà phê Robusta rang mộc, bột ngũ cốc dinh dưỡng' AS Description UNION ALL
    SELECT 'Thực phẩm & Đồ uống' AS ParentCategoryName, 'Thực phẩm tươi & đông lạnh' AS CategoryName, 'Chả giò tôm thịt rế vàng giòn, xúc xích xông khói, tôm nõn hấp đông lạnh' AS Description UNION ALL
    SELECT 'Thực phẩm & Đồ uống' AS ParentCategoryName, 'Đặc sản vùng miền' AS CategoryName, 'Bánh pía Sóc Trăng sầu riêng trứng muối, kẹo dừa Bến Tre, mè xửng giòn xứ Huế' AS Description
) v
JOIN Categories p ON p.CategoryName = v.ParentCategoryName AND p.ParentCategoryId IS NULL
WHERE NOT EXISTS (
    SELECT 1 FROM Categories c WHERE c.CategoryName = v.CategoryName AND c.ParentCategoryId = p.CategoryId
);

-- ============================================================================
-- 7. TÀI KHOẢN NGƯỜI BÁN (Users) VÀ PHÂN QUYỀN (UserRoles)
--    5 Seller (seller01 đến seller05), Mật khẩu: Demo@123
-- ============================================================================
INSERT INTO Users (FullName, Email, PasswordHash, PhoneNumber, IsActive)
VALUES
    ('Nguyễn Minh Phát', 'seller01@emarket.com', 'AQAAAAIAAYagAAAAEFTzNy4PQ5UTXcRpEcV2YSX7AtigZFpVw2NQDsIEsypmbeKy8A+E0ppZMYF2jGDu1A==', '0912345601', 1),
    ('Hoàng Hải Long', 'seller02@emarket.com', 'AQAAAAIAAYagAAAAEFTzNy4PQ5UTXcRpEcV2YSX7AtigZFpVw2NQDsIEsypmbeKy8A+E0ppZMYF2jGDu1A==', '0912345602', 1),
    ('Trần Thị Hoa Mai', 'seller03@emarket.com', 'AQAAAAIAAYagAAAAEFTzNy4PQ5UTXcRpEcV2YSX7AtigZFpVw2NQDsIEsypmbeKy8A+E0ppZMYF2jGDu1A==', '0912345603', 1),
    ('Lê Gia Bảo', 'seller04@emarket.com', 'AQAAAAIAAYagAAAAEFTzNy4PQ5UTXcRpEcV2YSX7AtigZFpVw2NQDsIEsypmbeKy8A+E0ppZMYF2jGDu1A==', '0912345604', 1),
    ('Nguyễn Mỹ Linh', 'seller05@emarket.com', 'AQAAAAIAAYagAAAAEFTzNy4PQ5UTXcRpEcV2YSX7AtigZFpVw2NQDsIEsypmbeKy8A+E0ppZMYF2jGDu1A==', '0912345605', 1)
AS new_seller
ON DUPLICATE KEY UPDATE FullName = new_seller.FullName, PhoneNumber = new_seller.PhoneNumber;

-- Gán vai trò 'Seller' cho 5 người bán
INSERT IGNORE INTO UserRoles (UserId, RoleId)
SELECT u.UserId, r.RoleId
FROM Users u
CROSS JOIN Roles r
WHERE r.RoleName = 'Seller' AND u.Email IN (
    'seller01@emarket.com', 'seller02@emarket.com', 'seller03@emarket.com', 'seller04@emarket.com', 'seller05@emarket.com'
);

-- ============================================================================
-- 8. HỒ SƠ DOANH NGHIỆP SELLER (5 Sellers)
-- ============================================================================
INSERT INTO Sellers (UserId, BusinessName, TaxCode, Description, Status, ApprovedAt, CommissionRate)
SELECT u.UserId, v.BusinessName, v.TaxCode, v.Description, 'Approved', NOW() - INTERVAL v.DaysAgoApproved DAY, 5.00
FROM (
    SELECT 'seller01@emarket.com' AS Email, 'Công ty TNHH Công nghệ Minh Phát' AS BusinessName, '0109988001' AS TaxCode, 'Đơn vị chuyên nhập khẩu và phân phối phụ kiện di động, thiết bị bảo vệ và sạc nhanh thông minh.' AS Description, 21 AS DaysAgoApproved UNION ALL
    SELECT 'seller02@emarket.com' AS Email, 'Hộ kinh doanh Hải Long Computer' AS BusinessName, '0109988002' AS TaxCode, 'Chuyên phân phối thiết bị ngoại vi máy tính, phụ kiện laptop và gaming gear chính hãng chất lượng cao.' AS Description, 28 AS DaysAgoApproved UNION ALL
    SELECT 'seller03@emarket.com' AS Email, 'Công ty TNHH Thời Trang Hoa Mai' AS BusinessName, '0109988003' AS TaxCode, 'Thiết kế và sản xuất trang phục may mặc, giày dép và phụ kiện thời trang trẻ trung, thanh lịch.' AS Description, 25 AS DaysAgoApproved UNION ALL
    SELECT 'seller04@emarket.com' AS Email, 'Công ty TNHH Gia Bảo Lifestyle' AS BusinessName, '0109988004' AS TaxCode, 'Cung cấp đồ gia dụng, thiết bị tiện ích nhà bếp và trang trí phòng ngủ thông minh cho gia đình hiện đại.' AS Description, 22 AS DaysAgoApproved UNION ALL
    SELECT 'seller05@emarket.com' AS Email, 'Mỹ Linh Beauty' AS BusinessName, '0109988005' AS TaxCode, 'Mỹ phẩm chăm sóc da, trang điểm và sản phẩm làm đẹp an toàn, lành tính cho phụ nữ Việt.' AS Description, 19 AS DaysAgoApproved
) v
JOIN Users u ON u.Email = v.Email
ON DUPLICATE KEY UPDATE BusinessName = v.BusinessName, Description = v.Description;

-- ============================================================================
-- 9. GIAN HÀNG (10 Shops - mỗi seller sở hữu 2 shop)
-- ============================================================================
INSERT INTO Shops (SellerId, ShopName, Description, LogoUrl, IsActive)
SELECT sel.SellerId, v.ShopName, v.Description, v.LogoUrl, 1
FROM (
    SELECT '0109988001' AS TaxCode, 'Minh Phát Case & Kính' AS ShopName, 'Ốp lưng thời trang chống sốc và kính cường lực bảo vệ màn hình toàn diện.' AS Description, 'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?w=200&auto=format&fit=crop&q=80&sig=11' AS LogoUrl UNION ALL
    SELECT '0109988001' AS TaxCode, 'Minh Phát Nguồn & Cáp' AS ShopName, 'Nguồn sạc công suất cao, an toàn chống cháy nổ cho thiết bị di động.' AS Description, 'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?w=200&auto=format&fit=crop&q=80&sig=12' AS LogoUrl UNION ALL
    SELECT '0109988002' AS TaxCode, 'Hải Long Gaming Gear' AS ShopName, 'Cung cấp thiết bị ngoại vi chuyên dụng cho game thủ và dân văn phòng.' AS Description, 'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?w=200&auto=format&fit=crop&q=80&sig=21' AS LogoUrl UNION ALL
    SELECT '0109988002' AS TaxCode, 'Hải Long Laptop Pro' AS ShopName, 'Phụ kiện bảo vệ và tản nhiệt tối ưu dành cho máy tính xách tay.' AS Description, 'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?w=200&auto=format&fit=crop&q=80&sig=22' AS LogoUrl UNION ALL
    SELECT '0109988003' AS TaxCode, 'Hoa Mai Men Classic' AS ShopName, 'Trang phục nam giới hiện đại, lịch lãm phù hợp đi làm và dạo phố.' AS Description, 'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?w=200&auto=format&fit=crop&q=80&sig=31' AS LogoUrl UNION ALL
    SELECT '0109988003' AS TaxCode, 'Hoa Mai Lady Chic' AS ShopName, 'Thời trang nữ tính, sang trọng tôn vinh nét đẹp phái đẹp hiện đại.' AS Description, 'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?w=200&auto=format&fit=crop&q=80&sig=32' AS LogoUrl UNION ALL
    SELECT '0109988004' AS TaxCode, 'Gia Bảo Kitchen Chef' AS ShopName, 'Dụng cụ nhà bếp tiện lợi, nấu nướng dễ dàng và an toàn cho sức khỏe.' AS Description, 'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?w=200&auto=format&fit=crop&q=80&sig=41' AS LogoUrl UNION ALL
    SELECT '0109988004' AS TaxCode, 'Gia Bảo Bedding Cozy' AS ShopName, 'Nâng niu giấc ngủ ngon cho cả gia đình bằng chất liệu êm ái, thoáng mát.' AS Description, 'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?w=200&auto=format&fit=crop&q=80&sig=42' AS LogoUrl UNION ALL
    SELECT '0109988005' AS TaxCode, 'Mỹ Linh Skincare Glow' AS ShopName, 'Giải pháp chăm sóc da dịu nhẹ, sáng khỏe nuôi dưỡng từ sâu bên trong.' AS Description, 'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?w=200&auto=format&fit=crop&q=80&sig=51' AS LogoUrl UNION ALL
    SELECT '0109988005' AS TaxCode, 'Mỹ Linh Makeup Studio' AS ShopName, 'Mỹ phẩm trang điểm tự nhiên, tôn vinh nét rạng ngời tươi trẻ mỗi ngày.' AS Description, 'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?w=200&auto=format&fit=crop&q=80&sig=52' AS LogoUrl
) v
JOIN Sellers sel ON sel.TaxCode = v.TaxCode
ON DUPLICATE KEY UPDATE Description = v.Description, LogoUrl = v.LogoUrl;

-- ============================================================================
-- 10. SẢN PHẨM (Products - đúng 150 sản phẩm, mỗi sản phẩm 1 description riêng biệt)
-- ============================================================================
-- --- Sản phẩm của Seller: Công ty TNHH Công nghệ Minh Phát (0109988001) - 30 sản phẩm (15 SP / shop) ---
INSERT INTO Products (CategoryId, ShopId, ProductName, Description, ProductStatus, RejectReason)
SELECT c.CategoryId, sh.ShopId, v.ProductName, v.Description, v.ProductStatus, v.RejectReason
FROM (
    SELECT 'Minh Phát Case & Kính' AS ShopName, 'Ốp lưng & bảo vệ màn hình' AS CategoryName, 'Ốp lưng iPhone 15 trong suốt viền chống sốc túi khí 4 góc' AS ProductName, 'Chất liệu TPU Bayer Đức kháng ố vàng, 4 góc gia cố đệm khí đạt chuẩn chống rơi va đập quân đội.' AS Description, 'PendingReview' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Minh Phát Case & Kính' AS ShopName, 'Ốp lưng & bảo vệ màn hình' AS CategoryName, 'Kính cường lực 9D viền vát cạnh cho iPhone 14 và 15' AS ProductName, 'Độ cứng 9H phủ nano oleophobic hạn chế bám vân tay và mồ hôi, viền cong 2.5D vuốt êm ái.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Minh Phát Case & Kính' AS ShopName, 'Ốp lưng & bảo vệ màn hình' AS CategoryName, 'Ốp lưng da nhân tạo phong cách doanh nhân cho Galaxy S24 Ultra' AS ProductName, 'Bề mặt da PU cao cấp chống xước, khung viền kim loại bảo vệ camera nhô cao 0.8mm tối ưu.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Minh Phát Case & Kính' AS ShopName, 'Ốp lưng & bảo vệ màn hình' AS CategoryName, 'Miếng dán cường lực chống nhìn trộm góc nghiêng 28 độ bảo mật' AS ProductName, 'Công nghệ phủ vi quang học chỉ hiển thị rõ ở góc nhìn trực diện, bảo mật thông tin cá nhân nơi công cộng.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Minh Phát Case & Kính' AS ShopName, 'Ốp lưng & bảo vệ màn hình' AS CategoryName, 'Ốp lưng silicon dẻo lót nhung mềm chống trầy cho Xiaomi 13' AS ProductName, 'Silicon lỏng kháng bẩn có thể lau sạch vết mực, lớp lót nỉ nhung bên trong bảo vệ lưng máy hoàn hảo.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Minh Phát Case & Kính' AS ShopName, 'Ốp lưng & bảo vệ màn hình' AS CategoryName, 'Bộ kính cường lực bảo vệ cụm camera hợp kim titan nguyên khối' AS ProductName, 'Vòng bảo vệ từng mắt camera làm từ kính sapphire chống trầy cùng viền titan không làm giảm chất lượng ảnh.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Minh Phát Case & Kính' AS ShopName, 'Ốp lưng & bảo vệ màn hình' AS CategoryName, 'Ốp lưng từ tính hỗ trợ sạc MagSafe lực hút mạnh viền màu thời trang' AS ProductName, 'Vòng nam châm N52 lực hút mạnh mẽ tương thích hoàn hảo mọi phụ kiện sạc không dây và ví hít lưng.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Minh Phát Case & Kính' AS ShopName, 'Ốp lưng & bảo vệ màn hình' AS CategoryName, 'Miếng dán film PPF tự phục hồi vết xước nhẹ toàn diện mặt lưng' AS ProductName, 'Chất liệu màng dẻo nhiệt dẻo TPU độ trong suốt 99%, có khả năng làm mờ vết xước lông mèo bằng nhiệt phòng.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Minh Phát Case & Kính' AS ShopName, 'Ốp lưng & bảo vệ màn hình' AS CategoryName, 'Ốp lưng viền kim loại mặt lưng kính cường lực cho Galaxy Z Flip' AS ProductName, 'Thiết kế gập đôi chuẩn xác bảo vệ bản lề máy, mặt kính cường lực sáng bóng chống trầy xước va đập.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Minh Phát Case & Kính' AS ShopName, 'Ốp lưng & bảo vệ màn hình' AS CategoryName, 'Kính cường lực nhám mờ chuyên chơi game chống mồ hôi tay cực nhạy' AS ProductName, 'Bề mặt phủ hạt vi mô siêu mịn triệt tiêu ma sát và chống chói ánh đèn, lướt chiêu thức game mượt mà.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Minh Phát Case & Kính' AS ShopName, 'Ốp lưng & bảo vệ màn hình' AS CategoryName, 'Ốp lưng chống sốc tổ ong tản nhiệt hỗ trợ chân đế dựng máy' AS ProductName, 'Mặt trong dập rãnh tổ ong hỗ trợ thoát nhiệt khi xem phim, chân chống gập mở rảnh tay góc 60 độ.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Minh Phát Case & Kính' AS ShopName, 'Ốp lưng & bảo vệ màn hình' AS CategoryName, 'Miếng dán skin vân da 3M dán lưng điện thoại chống trơn trượt' AS ProductName, 'Decal 3M cao cấp nhập khẩu dập nổi vân da thật cầm nắm chắc tay, rãnh thoát khí dán không bị bọt khí.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Minh Phát Case & Kính' AS ShopName, 'Ốp lưng & bảo vệ màn hình' AS CategoryName, 'Ốp lưng dạ quang phát sáng trong bóng tối họa tiết vũ trụ' AS ProductName, 'Hấp thụ ánh sáng tự nhiên và phát sáng huyền ảo trong đêm, chất liệu nhựa TPU dẻo ôm khít viền máy.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Minh Phát Case & Kính' AS ShopName, 'Ốp lưng & bảo vệ màn hình' AS CategoryName, 'Kính cường lực dẻo nano gốm ceramic không bao giờ bể mép' AS ProductName, 'Hợp chất gốm thủy tinh dẻo dai uốn cong 180 độ không gãy vỡ, bảo vệ màn hình bền bỉ suốt vòng đời máy.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Minh Phát Case & Kính' AS ShopName, 'Ốp lưng & bảo vệ màn hình' AS CategoryName, 'Ốp lưng dây đeo chéo thời trang đính charm hạt cườm handmade' AS ProductName, 'Dây dù bện thổ cẩm phối hạt cườm acrylic cá tính đeo chéo vai như túi xách, tiện lợi khi đi du lịch dạo phố.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Minh Phát Nguồn & Cáp' AS ShopName, 'Sạc, cáp & pin dự phòng' AS CategoryName, 'Củ sạc nhanh GaN 30W chuẩn PD cổng Type-C siêu nhỏ gọn bỏ túi' AS ProductName, 'Sử dụng vật liệu bán dẫn Gallium Nitride giúp củ sạc nhỏ bằng 40% sạc truyền thống nhưng kiểm soát nhiệt vượt trội.' AS Description, 'Rejected' AS ProductStatus, 'Thông tin thông số kỹ thuật chưa rõ ràng, hình ảnh chưa đạt độ phân giải tiêu chuẩn của sàn.' AS RejectReason UNION ALL
    SELECT 'Minh Phát Nguồn & Cáp' AS ShopName, 'Sạc, cáp & pin dự phòng' AS CategoryName, 'Cáp sạc Type-C sang Lightning bọc dù Kevlar siêu bền dài 1.2m' AS ProductName, 'Lõi đồng nguyên chất mạ thiếc chịu được hơn 25.000 lần gập bẻ, hỗ trợ sạc nhanh chuẩn PD lên đến 27W.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Minh Phát Nguồn & Cáp' AS ShopName, 'Sạc, cáp & pin dự phòng' AS CategoryName, 'Pin sạc dự phòng 10000mAh tích hợp màn hình LED báo phần trăm pin' AS ProductName, 'Lõi pin polymer cao cấp mỏng nhẹ, 2 cổng ra sạc nhanh 22.5W hỗ trợ nhiều chuẩn sạc thông dụng hiện nay.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Minh Phát Nguồn & Cáp' AS ShopName, 'Sạc, cáp & pin dự phòng' AS CategoryName, 'Cáp sạc đa năng 3 đầu Type-C Lightning Micro USB dây rút chống rối' AS ProductName, 'Thiết kế cuộn tròn kéo mở mượt mà chống rối dây, tiện dụng mang đi làm hoặc du lịch chỉ với một sợi cáp.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Minh Phát Nguồn & Cáp' AS ShopName, 'Sạc, cáp & pin dự phòng' AS CategoryName, 'Củ sạc nhanh 65W 3 cổng 2C1A cho cả điện thoại và laptop văn phòng' AS ProductName, 'Tự động điều phối công suất thông minh khi sạc cùng lúc nhiều máy, tích hợp 8 lớp bảo vệ an toàn dòng điện.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Minh Phát Nguồn & Cáp' AS ShopName, 'Sạc, cáp & pin dự phòng' AS CategoryName, 'Pin dự phòng hít từ tính không dây 5000mAh siêu mỏng nhẹ cho iPhone' AS ProductName, 'Khối lượng chỉ 120g ôm khít thân máy không che cụm camera, lực hút nam châm cực mạnh chống rơi rớt khi dùng.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Minh Phát Nguồn & Cáp' AS ShopName, 'Sạc, cáp & pin dự phòng' AS CategoryName, 'Cáp sạc Type-C to Type-C 100W có chip E-Marker ổn định dòng sạc' AS ProductName, 'Hỗ trợ truyền dòng điện tối đa 5A cùng tốc độ sao chép dữ liệu 480Mbps, đáp ứng tốt cho máy tính xách tay.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Minh Phát Nguồn & Cáp' AS ShopName, 'Sạc, cáp & pin dự phòng' AS CategoryName, 'Tẩu sạc nhanh ô tô 45W vỏ hợp kim kẽm tản nhiệt nhanh 2 cổng sạc' AS ProductName, 'Thân vỏ kim loại đúc nguyên khối chống cháy, đèn viền LED dịu mắt hỗ trợ cắm sạc chính xác trong bóng tối.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Minh Phát Nguồn & Cáp' AS ShopName, 'Sạc, cáp & pin dự phòng' AS CategoryName, 'Đế sạc không dây chuẩn Qi 15W mặt kính cường lực sang trọng' AS ProductName, 'Tự động ngắt khi sạc đầy bảo vệ tuổi thọ pin điện thoại, độ dày chỉ 6mm tinh tế đặt trên bàn làm việc.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Minh Phát Nguồn & Cáp' AS ShopName, 'Sạc, cáp & pin dự phòng' AS CategoryName, 'Pin sạc dự phòng dung lượng khủng 20000mAh sạc nhanh 65W 2 chiều' AS ProductName, 'Đủ năng lượng sạc đầy 4 lần điện thoại hoặc 1 lần laptop làm việc di động, vỏ nhôm nhám cao cấp.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Minh Phát Nguồn & Cáp' AS ShopName, 'Sạc, cáp & pin dự phòng' AS CategoryName, 'Cáp sạc tự ngắt thông minh Type-C có đèn LED báo sạc đầy pin' AS ProductName, 'Tự ngắt dòng điện hoàn toàn sau khi pin đầy 30 phút chống chai phồng pin khi cắm sạc qua đêm an tâm.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Minh Phát Nguồn & Cáp' AS ShopName, 'Sạc, cáp & pin dự phòng' AS CategoryName, 'Bộ sạc du lịch đa quốc gia All-in-one có 4 đầu cắm chuyển đổi' AS ProductName, 'Tương thích ổ cắm hơn 150 quốc gia Anh Mỹ Âu Úc, tích hợp 3 cổng USB và 1 cổng Type-C sạc nhanh.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Minh Phát Nguồn & Cáp' AS ShopName, 'Sạc, cáp & pin dự phòng' AS CategoryName, 'Cáp sạc nam châm hít xoay 540 độ hỗ trợ chơi game không cấn tay' AS ProductName, 'Đầu cắm nam châm xoay tròn tự do không gãy gập dây sạc khi vừa sạc vừa cầm ngang máy chơi game.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Minh Phát Nguồn & Cáp' AS ShopName, 'Sạc, cáp & pin dự phòng' AS CategoryName, 'Đầu chuyển đổi âm thanh Type-C sang jack tai nghe 3.5mm có DAC' AS ProductName, 'Chip giải mã DAC kỹ thuật số 24bit không suy hao chất lượng âm thanh gốc và hỗ trợ đàm thoại mic.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Minh Phát Nguồn & Cáp' AS ShopName, 'Sạc, cáp & pin dự phòng' AS CategoryName, 'Dây quấn silicon bảo vệ đầu cáp sạc chống gãy nứt hình thú cưng' AS ProductName, 'Bảo vệ vị trí nhạy cảm dễ đứt ngầm nhất của dây sạc điện thoại, tạo điểm nhấn vui nhộn đáng yêu.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason
) v
JOIN Sellers sel ON sel.TaxCode = '0109988001'
JOIN Shops sh ON sh.SellerId = sel.SellerId AND sh.ShopName = v.ShopName
JOIN Categories c ON c.CategoryName = v.CategoryName
WHERE NOT EXISTS (
    SELECT 1 FROM Products p2 WHERE p2.ShopId = sh.ShopId AND p2.ProductName = v.ProductName
);

-- --- Sản phẩm của Seller: Hộ kinh doanh Hải Long Computer (0109988002) - 30 sản phẩm (15 SP / shop) ---
INSERT INTO Products (CategoryId, ShopId, ProductName, Description, ProductStatus, RejectReason)
SELECT c.CategoryId, sh.ShopId, v.ProductName, v.Description, v.ProductStatus, v.RejectReason
FROM (
    SELECT 'Hải Long Gaming Gear' AS ShopName, 'Chuột, bàn phím & gaming gear' AS CategoryName, 'Bàn phím cơ không dây TKL 87 phím Hotswap đèn nền RGB đổi màu' AS ProductName, 'Mạch hotswap 5 pin dễ dàng thay switch mà không cần hàn, đệm tiêu âm silicon giảm thiểu tạp âm gõ lạch cạch.' AS Description, 'PendingReview' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hải Long Gaming Gear' AS ShopName, 'Chuột, bàn phím & gaming gear' AS CategoryName, 'Chuột gaming siêu nhẹ 59g mắt đọc quang học 26000DPI chính xác' AS ProductName, 'Vỏ khoét lỗ tổ ong kết cấu vững chắc, cáp bọc vải mềm Paracord cho cảm giác lướt chuột nhẹ nhàng như không dây.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hải Long Gaming Gear' AS ShopName, 'Chuột, bàn phím & gaming gear' AS CategoryName, 'Lót chuột gaming cỡ lớn 900x400mm viền LED RGB chống trượt bàn' AS ProductName, 'Mặt vải dệt mịn mật độ cao tối ưu hóa cho cả cảm biến quang và laser, đế cao su thiên nhiên bám chặt mặt bàn.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hải Long Gaming Gear' AS ShopName, 'Chuột, bàn phím & gaming gear' AS CategoryName, 'Tai nghe gaming chụp tai giả lập 7.1 có micro lọc tiếng ồn linh hoạt' AS ProductName, 'Củ loa neodymium 50mm tái hiện tiếng bước chân và tiếng súng chính xác trong game, ốp tai da thoáng khí.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hải Long Gaming Gear' AS ShopName, 'Chuột, bàn phím & gaming gear' AS CategoryName, 'Bộ nút phím Keycap PBT Doubleshot profile Cherry 128 phím dày dặn' AS ProductName, 'Ký tự đúc 2 lớp không bao giờ mờ chữ, độ dày 1.5mm mang lại cảm giác gõ đầm tay và âm thanh trầm ấm.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hải Long Gaming Gear' AS ShopName, 'Chuột, bàn phím & gaming gear' AS CategoryName, 'Chuột văn phòng không dây kết nối Dual Mode Bluetooth & 2.4G Silent' AS ProductName, 'Nút bấm Silent giảm 90% tiếng ồn click chuột, phù hợp cho môi trường văn phòng yên tĩnh hoặc làm việc đêm.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hải Long Gaming Gear' AS ShopName, 'Chuột, bàn phím & gaming gear' AS CategoryName, 'Kê tay bàn phím bằng gỗ óc chó tự nhiên vát góc công thái học mỏi' AS ProductName, 'Gọt giũa thủ công phủ dầu sáp thực vật bảo vệ vân gỗ tự nhiên, giúp nâng đỡ cổ tay chống mỏi khớp khi gõ lâu.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hải Long Gaming Gear' AS ShopName, 'Chuột, bàn phím & gaming gear' AS CategoryName, 'Tay cầm chơi game không dây rung kép hỗ trợ PC và điện thoại mượt mà' AS ProductName, 'Cần xoay analog chống trôi Hall Effect độ chính xác cao, pin sạc 600mAh chơi game liên tục 10 giờ.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hải Long Gaming Gear' AS ShopName, 'Chuột, bàn phím & gaming gear' AS CategoryName, 'Bàn phím cơ mini 68 phím Bluetooth 3 chế độ kết nối đa thiết bị' AS ProductName, 'Kích thước siêu nhỏ gọn tiết kiệm 40% diện tích bàn, pin dung lượng 3000mAh dùng 1 tháng không cần cắm dây.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hải Long Gaming Gear' AS ShopName, 'Chuột, bàn phím & gaming gear' AS CategoryName, 'Chuột công thái học dạng đứng dọc bảo vệ hội chứng ống cổ tay' AS ProductName, 'Tư thế cầm tay tự nhiên 57 độ giảm áp lực cơ cẳng tay, tích hợp phím Forward/Back lướt web cực tiện lợi.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hải Long Gaming Gear' AS ShopName, 'Chuột, bàn phím & gaming gear' AS CategoryName, 'Bộ 45 switch bàn phím cơ Linear âm trầm bôi trơn sẵn mượt mà' AS ProductName, 'Nhà máy tra mỡ bôi trơn Krytox sẵn cho hành trình phím êm mượt không sạn ráp, lực nhấn 45g êm dịu tay.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hải Long Gaming Gear' AS ShopName, 'Chuột, bàn phím & gaming gear' AS CategoryName, 'Giá treo tai nghe gaming kim loại hợp kim nhôm để bàn chắc chắn' AS ProductName, 'Đế nặng bọc mút đệm cao su chống lật đổ, mặt tiếp xúc vòm tai nghe bọc da PU bảo vệ đệm đầu tai nghe.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hải Long Gaming Gear' AS ShopName, 'Chuột, bàn phím & gaming gear' AS CategoryName, 'Dụng cụ nhổ keycap và nhổ switch 2 trong 1 bằng thép không gỉ' AS ProductName, 'Đầu gắp dây thép không làm trầy viền phím bấm khi tháo lắp vệ sinh và modding bàn phím cơ tại nhà.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hải Long Gaming Gear' AS ShopName, 'Chuột, bàn phím & gaming gear' AS CategoryName, 'Tấm che bụi bàn phím cơ bằng mica acrylic trong suốt chống nước' AS ProductName, 'Bảo vệ switch và mạch điện khỏi bụi bẩn vụn đồ ăn và nước vô tình rơi vào khi không sử dụng bàn phím.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hải Long Gaming Gear' AS ShopName, 'Chuột, bàn phím & gaming gear' AS CategoryName, 'Bàn di chuột nỉ cao cấp phủ chống thấm nước kích thước 80x30cm' AS ProductName, 'Chất liệu nỉ len ép mật độ cao tạo cảm giác ấm áp êm ái cho mùa đông, viền may chỉ đôi chống bung xơ mép.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hải Long Laptop Pro' AS ShopName, 'Phụ kiện laptop' AS CategoryName, 'Balo laptop công sở 15.6 inch vải Oxford chống thấm nước cao cấp' AS ProductName, 'Ngăn chứa laptop riêng biệt đệm bọt khí 360 độ, tích hợp cổng sạc USB bên ngoài kết nối sạc dự phòng.' AS Description, 'Rejected' AS ProductStatus, 'Thông tin thông số kỹ thuật chưa rõ ràng, hình ảnh chưa đạt độ phân giải tiêu chuẩn của sàn.' AS RejectReason UNION ALL
    SELECT 'Hải Long Laptop Pro' AS ShopName, 'Phụ kiện laptop' AS CategoryName, 'Túi chống sốc laptop nỉ nhung cao cấp có tay xách ẩn tiện lợi gọn' AS ProductName, '3 lớp bảo vệ chống sốc và chống thấm, ngăn phụ mở rộng phía trước đựng vừa sạc, chuột và tài liệu công việc.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hải Long Laptop Pro' AS ShopName, 'Phụ kiện laptop' AS CategoryName, 'Đế tản nhiệt laptop 6 quạt gió tốc độ cao màn hình LCD chỉnh tốc gió' AS ProductName, 'Khung kim loại đục lỗ thoáng khí làm mát tức thì nhiệt độ CPU và GPU, có giá đỡ điện thoại đính kèm.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hải Long Laptop Pro' AS ShopName, 'Phụ kiện laptop' AS CategoryName, 'Giá đỡ laptop hợp kim nhôm nâng hạ 6 nấc gập gọn bỏ túi xách' AS ProductName, 'Nhôm nguyên khối phay CNC chống rung lắc, hỗ trợ nâng màn hình ngang tầm mắt cải thiện tư thế ngồi.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hải Long Laptop Pro' AS ShopName, 'Phụ kiện laptop' AS CategoryName, 'Miếng dán bảo vệ mặt lưng và bàn phím laptop vân nhôm xước sang' AS ProductName, 'Cắt chuẩn xác theo từng model máy, tản nhiệt tốt và bóc ra không để lại keo dính bề mặt máy.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hải Long Laptop Pro' AS ShopName, 'Phụ kiện laptop' AS CategoryName, 'Quạt hút nhiệt laptop gắn khe gió cạnh sườn cảm biến nhiệt độ tự động' AS ProductName, 'Hút khí nóng trực tiếp từ ống đồng tản nhiệt, màn hình hiển thị nhiệt độ gió thoát ra theo thời gian thực.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hải Long Laptop Pro' AS ShopName, 'Phụ kiện laptop' AS CategoryName, 'Bàn kê đùi làm việc với laptop có đệm nệm êm ái chống nóng đùi' AS ProductName, 'Mặt bàn gỗ ép laminate phẳng mịn tích hợp gờ chặn chuột và khe cắm máy tính bảng, mặt đáy đệm xốp êm.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hải Long Laptop Pro' AS ShopName, 'Phụ kiện laptop' AS CategoryName, 'Bộ vệ sinh laptop và tai nghe đa năng 7 trong 1 tiện dụng để bàn' AS ProductName, 'Gồm bàn chải lông mềm quét bụi, bút lau ống kính, cây gắp keycap và bình xịt dung dịch vệ sinh màn hình.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hải Long Laptop Pro' AS ShopName, 'Phụ kiện laptop' AS CategoryName, 'Phủ phím silicon siêu mỏng chống nước chống bụi cho bàn phím laptop' AS ProductName, 'Chất liệu silicon dẻo trong suốt ôm khít từng nút phím không làm giảm cảm giác gõ, dễ rửa sạch bằng xà phòng.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hải Long Laptop Pro' AS ShopName, 'Phụ kiện laptop' AS CategoryName, 'Dây khóa số chống trộm laptop bằng thép bọc nhựa dài 1.8m an toàn' AS ProductName, 'Khóa mã số 4 chữ số bảo mật gắn vào khe khóa chuẩn Kensington của laptop văn phòng thư viện.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hải Long Laptop Pro' AS ShopName, 'Phụ kiện laptop' AS CategoryName, 'Túi đựng củ sạc chuột và phụ kiện công nghệ chống sốc 2 ngăn' AS ProductName, 'Vỏ cứng bọc vải EVA chống va đập rơi rớt, bên trong có đai thun giữ cố định củ sạc dây cáp và chuột.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hải Long Laptop Pro' AS ShopName, 'Phụ kiện laptop' AS CategoryName, 'Chân đế cao su tự dính nâng nghiêng tản nhiệt góc bàn laptop' AS ProductName, 'Tạo góc nghiêng 8 độ cho cổ tay gõ phím tự nhiên, hỗ trợ đáy máy hút gió mát lưu thông tốt hơn.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hải Long Laptop Pro' AS ShopName, 'Phụ kiện laptop' AS CategoryName, 'Tấm lót chuột kiêm sạc không dây 15W trên bàn làm việc bọc da PU' AS ProductName, 'Tích hợp cuộn sạc không dây tiện lợi sạc điện thoại ngay cạnh tay rê chuột, bề mặt da sang trọng.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hải Long Laptop Pro' AS ShopName, 'Phụ kiện laptop' AS CategoryName, 'Túi xách công sở đựng laptop da PU chống nước quai đeo có đệm' AS ProductName, 'Chất da PU vân hạt lịch lãm phong cách doanh nhân, nhiều ngăn đựng hồ sơ tài liệu hợp đồng phẳng phiu.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hải Long Laptop Pro' AS ShopName, 'Phụ kiện laptop' AS CategoryName, 'Miếng đệm kê tay di chuột silicon công thái học chống chai cổ tay' AS ProductName, 'Đệm gel silicon mát lạnh nâng đỡ cổ tay di chuyển chuột êm ái, đáy cao su bám chặt không trượt trên bàn.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason
) v
JOIN Sellers sel ON sel.TaxCode = '0109988002'
JOIN Shops sh ON sh.SellerId = sel.SellerId AND sh.ShopName = v.ShopName
JOIN Categories c ON c.CategoryName = v.CategoryName
WHERE NOT EXISTS (
    SELECT 1 FROM Products p2 WHERE p2.ShopId = sh.ShopId AND p2.ProductName = v.ProductName
);

-- --- Sản phẩm của Seller: Công ty TNHH Thời Trang Hoa Mai (0109988003) - 30 sản phẩm (15 SP / shop) ---
INSERT INTO Products (CategoryId, ShopId, ProductName, Description, ProductStatus, RejectReason)
SELECT c.CategoryId, sh.ShopId, v.ProductName, v.Description, v.ProductStatus, v.RejectReason
FROM (
    SELECT 'Hoa Mai Men Classic' AS ShopName, 'Áo thun & sơ mi nam' AS CategoryName, 'Áo sơ mi nam dài tay vải sợi tre tự nhiên chống nhăn tuyệt đối dáng' AS ProductName, 'Thấm hút mồ hôi gấp 3 lần cotton thông thường, giữ phom cổ áo đứng chỉn chu suốt ngày dài công sở.' AS Description, 'PendingReview' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hoa Mai Men Classic' AS ShopName, 'Áo thun & sơ mi nam' AS CategoryName, 'Áo thun nam cổ tròn cotton 100% định lượng 250gsm dày dặn đứng phom' AS ProductName, 'Vải dệt chải kỹ không xù lông và không phai màu khi giặt máy, dáng suông regular thoải mái vận động.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hoa Mai Men Classic' AS ShopName, 'Áo thun & sơ mi nam' AS CategoryName, 'Áo polo nam phối bo cổ dệt tổ ong thoáng khí co giãn 4 chiều mềm' AS ProductName, 'Chất liệu thun gai cá sấu mềm mại, nẹp cổ dập nổi logo tinh tế mang đến diện mạo đĩnh đạc tự tin.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hoa Mai Men Classic' AS ShopName, 'Áo thun & sơ mi nam' AS CategoryName, 'Áo sơ mi nam ngắn tay họa tiết kẻ caro năng động trẻ trung ngày hè' AS ProductName, 'Chất vải cotton pha lụa mỏng nhẹ tạo cảm giác mát mẻ trong mùa hè, vạt áo bo tròn dễ phối quần âu hoặc jean.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hoa Mai Men Classic' AS ShopName, 'Áo thun & sơ mi nam' AS CategoryName, 'Áo thun nam tay lỡ form rộng phong cách đường phố Unisex thoải mái' AS ProductName, 'Thiết kế vai xuôi phóng khoáng che khuyết điểm vai hẹp, đường may trần đè 2 kim chắc chắn tỉ mỉ.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hoa Mai Men Classic' AS ShopName, 'Áo thun & sơ mi nam' AS CategoryName, 'Áo sơ mi nam cổ trụ chất liệu đũi linen tự nhiên mộc mạc thoáng mát' AS ProductName, 'Sợi linen dệt thoáng gió có độ nhăn tự nhiên đặc trưng, tạo phong cách lãng tử thanh lịch khi đi biển hoặc cà phê.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hoa Mai Men Classic' AS ShopName, 'Áo thun & sơ mi nam' AS CategoryName, 'Áo polo nam trơn phong cách tối giản công nghệ dệt không đường may mép' AS ProductName, 'Viền áo và cổ áo ép nhiệt phẳng mịn không gồ ghề cọ xát da, phom dáng tôn bờ vai và ngực săn chắc.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hoa Mai Men Classic' AS ShopName, 'Áo thun & sơ mi nam' AS CategoryName, 'Áo thun nam có cổ dệt jacquard vân chìm sang trọng đi tiệc tối' AS ProductName, 'Họa tiết hình học chìm dệt tỉ mỉ trên nền vải bóng nhẹ, cúc áo khắc laser sắc sảo tôn lên đẳng cấp trang phục.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hoa Mai Men Classic' AS ShopName, 'Áo thun & sơ mi nam' AS CategoryName, 'Áo khoác gió nam thể thao lót lưới cản gió đi phượt nhẹ nhàng' AS ProductName, 'Chất vải dù chống nước nhẹ cản bụi hiệu quả, mũ trùm đầu có thể tháo rời linh hoạt theo thời tiết.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hoa Mai Men Classic' AS ShopName, 'Áo thun & sơ mi nam' AS CategoryName, 'Áo sơ mi nam oxford cổ bẻ cài cúc button-down phong cách học đường' AS ProductName, 'Vải oxford dệt vân chéo dày dặn khỏe khoắn, phối layer đẹp mắt với áo len hoặc mặc trơn lịch sự.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hoa Mai Men Classic' AS ShopName, 'Áo thun & sơ mi nam' AS CategoryName, 'Áo ba lỗ thể thao nam thun lạnh tập gym co giãn đa chiều' AS ProductName, 'Sợi dệt kim thoát mồ hôi siêu tốc không gây bết dính lưng, đường khoét nách chuẩn vận động không cấn da.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hoa Mai Men Classic' AS ShopName, 'Áo thun & sơ mi nam' AS CategoryName, 'Áo thun polo nam phối sọc ngang ngực trẻ trung năng động' AS ProductName, 'Sọc kẻ ngang phối màu hài hòa tôn vinh vóc dáng người mặc, bo tay áo ôm nhẹ bắp tay nam tính.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hoa Mai Men Classic' AS ShopName, 'Áo thun & sơ mi nam' AS CategoryName, 'Áo sơ mi lụa nam tay dài họa tiết baroque phong cách thời thượng' AS ProductName, 'Vải lụa satin bóng mềm rủ sang chảnh, họa tiết in nhiệt sắc nét phù hợp diện đi bar hoặc sự kiện tiệc tùng.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hoa Mai Men Classic' AS ShopName, 'Áo thun & sơ mi nam' AS CategoryName, 'Áo thun nam cổ tim chữ V tôn nét nam tính vải modal gỗ sồi' AS ProductName, 'Sợi sồi tự nhiên siêu mềm mịn và làm mát da tức thì, cổ tim khoét vừa phải không bị sâu phản cảm.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hoa Mai Men Classic' AS ShopName, 'Áo thun & sơ mi nam' AS CategoryName, 'Áo khoác cardigan len mỏng nam cổ tim cài cúc thời trang mùa thu' AS ProductName, 'Sợi len dệt thoáng nhẹ giữ ấm nhẹ nhàng buổi sớm se lạnh, dễ dàng phối cùng áo phông trắng bên trong.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hoa Mai Lady Chic' AS ShopName, 'Thời trang nữ' AS CategoryName, 'Đầm xòe hoa nhí cổ vuông tay phồng dáng dài qua gối nữ tính' AS ProductName, 'Họa tiết hoa nhí vintage trên nền voan cát mềm mại có lót lụa kín đáo, chiết eo nhẹ nhàng tôn dáng vòng 2.' AS Description, 'Rejected' AS ProductStatus, 'Thông tin thông số kỹ thuật chưa rõ ràng, hình ảnh chưa đạt độ phân giải tiêu chuẩn của sàn.' AS RejectReason UNION ALL
    SELECT 'Hoa Mai Lady Chic' AS ShopName, 'Thời trang nữ' AS CategoryName, 'Áo sơ mi lụa tơ tằm cổ thắt nơ thanh lịch cho quý cô công sở nhẹ' AS ProductName, 'Chất lụa óng ả mềm rủ tự nhiên chống tích điện, phần nơ cổ có thể biến tấu nhiều kiểu thắt duyên dáng.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hoa Mai Lady Chic' AS ShopName, 'Thời trang nữ' AS CategoryName, 'Chân váy chữ A dáng dài lưng cao xẻ tà trước quyến rũ bước đi' AS ProductName, 'Chất vải tuyết mưa cao cấp đứng phom không nhăn nhàu, đường xẻ tà vừa phải tạo bước đi uyển chuyển thon gọn.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hoa Mai Lady Chic' AS ShopName, 'Thời trang nữ' AS CategoryName, 'Váy suông cổ tròn đính cúc ngọc trai nhân tạo chất tuyết mưa sang' AS ProductName, 'Dáng suông thoải mái che khuyết điểm vòng eo bánh mì, viền cổ may tỉ mỉ đính ngọc trai sáng bóng sang trọng.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hoa Mai Lady Chic' AS ShopName, 'Thời trang nữ' AS CategoryName, 'Áo kiểu nữ trễ vai bo thun chun ngực bánh bèo tiểu thư điệu đà' AS ProductName, 'Chất vải xốp nổi gợn sóng điệu đà, thun chun co giãn êm ái ôm sát bờ vai trần mảnh mai không gây lằn đỏ da.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hoa Mai Lady Chic' AS ShopName, 'Thời trang nữ' AS CategoryName, 'Set bộ công sở gồm áo vest cộc tay phối chân váy xếp ly đi làm' AS ProductName, 'Đồng bộ chất vải dạ mỏng thích hợp mùa thu hè, mang lại diện mạo chuyên nghiệp và hiện đại nơi công sở.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hoa Mai Lady Chic' AS ShopName, 'Thời trang nữ' AS CategoryName, 'Đầm suông linen thêu hoa thủ công phong cách mộc mạc du lịch' AS ProductName, 'Họa tiết hoa cúc thêu tay tỉ mỉ trước ngực áo, chất đũi tự nhiên mát lạnh cho những chuyến du lịch nghỉ dưỡng.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hoa Mai Lady Chic' AS ShopName, 'Thời trang nữ' AS CategoryName, 'Chân váy xếp ly nhỏ dáng xòe dài lưng thun co giãn thanh lịch nhẹ' AS ProductName, 'Nếp dập ly nhiệt bền bỉ không bị duỗi nếp sau nhiều lần giặt, phối hoàn hảo cùng áo len mỏng hoặc áo phông.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hoa Mai Lady Chic' AS ShopName, 'Thời trang nữ' AS CategoryName, 'Đầm ôm body cổ yếm quyến rũ tôn dáng dự tiệc dạ hội' AS ProductName, 'Chất thun gân dệt dày co giãn đa chiều ôm trọn đường cong cơ thể, lưng khoét nhẹ tinh tế thu hút mọi ánh nhìn.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hoa Mai Lady Chic' AS ShopName, 'Thời trang nữ' AS CategoryName, 'Áo kiểu tay bồng cổ tim phối ren hoa cúc nhã nhặn' AS ProductName, 'Cổ tim thanh thoát khoe xương quai xanh quyến rũ, chất voan tơ mềm mại thoáng mát cho ngày hè rực rỡ.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hoa Mai Lady Chic' AS ShopName, 'Thời trang nữ' AS CategoryName, 'Quần tây ống rộng lưng cao hack dáng tôn chân dài cho nữ' AS ProductName, 'Chất vải tuyết hàn suôn mềm rủ tà bay bổng, khóa kéo giọt lệ bên hông tạo cạp quần phẳng phiu gọn gàng.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hoa Mai Lady Chic' AS ShopName, 'Thời trang nữ' AS CategoryName, 'Áo khoác blazer nữ 1 lớp phom rộng phong cách Hàn Quốc' AS ProductName, 'Thiết kế đệm vai nhẹ tạo phom đứng dáng thanh lịch, phối cùng quần short hoặc chân váy chữ A sành điệu.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hoa Mai Lady Chic' AS ShopName, 'Thời trang nữ' AS CategoryName, 'Đầm sơ mi thắt đai eo dáng xòe nhẹ công sở thanh nhã' AS ProductName, 'Hàng cúc cài dọc thân áo cổ đức chỉn chu, đai lưng vải cùng màu thắt nơ tôn vòng eo con kiến nữ tính.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hoa Mai Lady Chic' AS ShopName, 'Thời trang nữ' AS CategoryName, 'Chân váy đuôi cá vạt chéo phối bèo nhún tôn vòng 3' AS ProductName, 'Đường cắt xéo vạt tạo điểm nhấn bồng bềnh theo từng nhịp bước chân, chất umi co giãn thoải mái khi ngồi.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Hoa Mai Lady Chic' AS ShopName, 'Thời trang nữ' AS CategoryName, 'Áo len tăm cổ lọ 3 phân mỏng nhẹ giữ ấm mùa thu đông' AS ProductName, 'Chất len dệt kim sợi mảnh mềm mịn không gây ngứa cổ, giữ nhiệt tốt làm lớp áo giữ nhiệt mặc trong áo khoác.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason
) v
JOIN Sellers sel ON sel.TaxCode = '0109988003'
JOIN Shops sh ON sh.SellerId = sel.SellerId AND sh.ShopName = v.ShopName
JOIN Categories c ON c.CategoryName = v.CategoryName
WHERE NOT EXISTS (
    SELECT 1 FROM Products p2 WHERE p2.ShopId = sh.ShopId AND p2.ProductName = v.ProductName
);

-- --- Sản phẩm của Seller: Công ty TNHH Gia Bảo Lifestyle (0109988004) - 30 sản phẩm (15 SP / shop) ---
INSERT INTO Products (CategoryId, ShopId, ProductName, Description, ProductStatus, RejectReason)
SELECT c.CategoryId, sh.ShopId, v.ProductName, v.Description, v.ProductStatus, v.RejectReason
FROM (
    SELECT 'Gia Bảo Kitchen Chef' AS ShopName, 'Đồ nhà bếp' AS CategoryName, 'Bộ dao làm bếp 6 món thép không gỉ nguyên khối phủ đá chống dính bếp' AS ProductName, 'Thép carbon tôi nhiệt sắc bén không gỉ sét, chuôi dao đúc liền bọc cao su chống trơn trượt cầm nắm chắc tay.' AS Description, 'PendingReview' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Gia Bảo Kitchen Chef' AS ShopName, 'Đồ nhà bếp' AS CategoryName, 'Chảo chống dính đá hoa cương đáy từ sâu lòng 26cm đúc nguyên khối bền' AS ProductName, 'Lớp chống dính Ceramic không chứa PFOA độc hại, đáy bắt từ 3 lớp dẫn nhiệt nhanh tiết kiệm 30% gas điện.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Gia Bảo Kitchen Chef' AS ShopName, 'Đồ nhà bếp' AS CategoryName, 'Thớt kháng khuẩn inox 304 kết hợp nhựa lúa mạch 2 mặt tiện dụng thái' AS ProductName, 'Mặt inox dùng chặt băm thịt sống không để lại vết xước, mặt nhựa lúa mạch thái rau củ quả chín sạch sẽ vệ sinh.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Gia Bảo Kitchen Chef' AS ShopName, 'Đồ nhà bếp' AS CategoryName, 'Bộ 3 hộp thủy tinh chịu nhiệt Borosilicate chia ngăn lò vi sóng nắp kín' AS ProductName, 'Thủy tinh cao cấp chịu sốc nhiệt từ -20 đến 400 độ C, nắp đậy có gioăng cao su kín hơi chống tràn nước canh tuyệt đối.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Gia Bảo Kitchen Chef' AS ShopName, 'Đồ nhà bếp' AS CategoryName, 'Rổ quay rau và vắt ráo nước ly tâm tiện lợi có khóa gạt xoay nhẹ' AS ProductName, 'Cơ chế bánh răng xoay trợ lực nhẹ nhàng làm ráo nước rau sống trong 10 giây mà không làm nát lá rau.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Gia Bảo Kitchen Chef' AS ShopName, 'Đồ nhà bếp' AS CategoryName, 'Nồi inox 3 đáy nắp kính cường lực cao cấp dùng cho mọi loại bếp từ gas' AS ProductName, 'Thân nồi inox sáng bóng không bị oxy hóa bởi thức ăn mặn chua, vung kính có lỗ thoát hơi chống trào bọt.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Gia Bảo Kitchen Chef' AS ShopName, 'Đồ nhà bếp' AS CategoryName, 'Kéo cắt gà và thực phẩm đa năng lưỡi răng cưa có chốt an toàn trợ lực' AS ProductName, 'Lực cắt mạnh mẽ cắt ngọt xương gà và vây cá, tích hợp chức năng kẹp vỡ hạt óc chó và khui nắp bia.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Gia Bảo Kitchen Chef' AS ShopName, 'Đồ nhà bếp' AS CategoryName, 'Kệ gia vị 2 tầng để bàn bếp thép carbon sơn tĩnh điện chống rỉ sét' AS ProductName, 'Thiết kế vát nghiêng tầng dưới lấy chai lọ thuận tiện, kèm móc treo muôi thìa và ống cắm đũa thoát nước.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Gia Bảo Kitchen Chef' AS ShopName, 'Đồ nhà bếp' AS CategoryName, 'Nồi áp suất cơ nấu bếp từ đáy 3 lớp hầm thịt ninh xương nhanh' AS ProductName, 'Van xả áp an toàn 3 tầng chống nổ, lòng nồi hợp kim nhôm truyền nhiệt đều ninh nhừ gân bò trong 20 phút.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Gia Bảo Kitchen Chef' AS ShopName, 'Đồ nhà bếp' AS CategoryName, 'Bộ 5 muôi thìa nấu ăn bằng gỗ tự nhiên không làm trầy chảo chống dính' AS ProductName, 'Gỗ xà cừ tự nhiên mài bóng láng không sơn phủ hóa chất, chịu nhiệt độ xào nấu không bị cong vênh biến dạng.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Gia Bảo Kitchen Chef' AS ShopName, 'Đồ nhà bếp' AS CategoryName, 'Bộ cối chày đá tự nhiên giã cua đâm tỏi ớt nhuyễn mịn' AS ProductName, 'Đá granite nguyên khối nặng đầm tay không văng bắn gia vị ra ngoài khi giã, bề mặt mài nhẵn dễ rửa trôi.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Gia Bảo Kitchen Chef' AS ShopName, 'Đồ nhà bếp' AS CategoryName, 'Bình xịt dầu ăn phun sương thủy tinh kiểm soát lượng dầu ăn kiêng' AS ProductName, 'Vòi phun áp lực tạo làn sương dầu phân bổ đều bề mặt món chiên nướng nồi chiên không dầu tiết kiệm dầu.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Gia Bảo Kitchen Chef' AS ShopName, 'Đồ nhà bếp' AS CategoryName, 'Dụng cụ nạo gọt vỏ củ quả lưỡi gốm ceramic siêu sắc bén' AS ProductName, 'Lưỡi gọt gốm không bị cùn và không bị gỉ sét khi gọt táo lê cà rốt, cán cầm nhựa kháng khuẩn tiện lợi.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Gia Bảo Kitchen Chef' AS ShopName, 'Đồ nhà bếp' AS CategoryName, 'Khay đá silicon có nắp đậy dẻo dai lấy đá viên dễ dàng một chạm' AS ProductName, 'Đáy silicon dẻo chỉ cần nhấn nhẹ ngón tay là viên đá rơi ra, nắp đậy kín mùi không bị bám mùi thực phẩm tủ lạnh.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Gia Bảo Kitchen Chef' AS ShopName, 'Đồ nhà bếp' AS CategoryName, 'Rổ inox gác bồn rửa bát co giãn tùy chỉnh kích thước đa năng' AS ProductName, 'Rút dài từ 30cm đến 45cm vừa vặn mọi bồn rửa chén bát, để ráo chén đĩa hoặc rửa hoa quả tiện dụng sạch sẽ.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Gia Bảo Bedding Cozy' AS ShopName, 'Đồ dùng phòng ngủ' AS CategoryName, 'Set ga gối cotton lụa phong cách Hàn Quốc 4 món dệt mật độ cao mát' AS ProductName, 'Sợi cotton chải kỹ dệt lụa mịn mát không tích điện, không xù lông co rút sau nhiều lần giặt sấy gia đình.' AS Description, 'Rejected' AS ProductStatus, 'Thông tin thông số kỹ thuật chưa rõ ràng, hình ảnh chưa đạt độ phân giải tiêu chuẩn của sàn.' AS RejectReason UNION ALL
    SELECT 'Gia Bảo Bedding Cozy' AS ShopName, 'Đồ dùng phòng ngủ' AS CategoryName, 'Gối ngủ cao su non công thái học định hình cổ chống đau vai gáy êm' AS ProductName, 'Thiết kế lượn sóng 2 độ cao nâng đỡ đốt sống cổ tự nhiên, vỏ gối vải dệt kim thoáng khí có thể tháo giặt.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Gia Bảo Bedding Cozy' AS ShopName, 'Đồ dùng phòng ngủ' AS CategoryName, 'Ruột chăn hè thu lông vũ nhân tạo micro polyester siêu nhẹ kháng ẩm tốt' AS ProductName, 'Sợi xơ bồng bềnh giữ ấm nhẹ nhàng vào đêm hè nằm điều hòa, đường trần ô vuông ngăn xô lệch bông bên trong.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Gia Bảo Bedding Cozy' AS ShopName, 'Đồ dùng phòng ngủ' AS CategoryName, 'Đệm topper làm mềm nệm dày 7cm bông xơ siêu mịn xuất khẩu êm ái' AS ProductName, 'Khôi phục độ êm ái cho tấm nệm cũ hoặc trải sàn làm đệm ngủ tiện lợi, 4 góc có đai thun cố định vào nệm.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Gia Bảo Bedding Cozy' AS ShopName, 'Đồ dùng phòng ngủ' AS CategoryName, 'Chiếu điều hòa mủ cao su non tự nhiên làm mát dịu nhẹ mùa hè phòng ngủ' AS ProductName, 'Hàng ngàn lỗ thông hơi thoáng khí tản nhiệt cơ thể nhanh chóng, bề mặt vải Tencel mát lịm nâng niu làn da.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Gia Bảo Bedding Cozy' AS ShopName, 'Đồ dùng phòng ngủ' AS CategoryName, 'Vỏ gối ôm cotton trơn màu cao cấp khóa kéo giọt lệ ẩn tinh tế phòng' AS ProductName, 'Đường may mí vắt sổ kỹ càng không tuột chỉ, màu sắc nhã nhặn dễ dàng phối màu với các bộ ga trải giường sẵn có.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Gia Bảo Bedding Cozy' AS ShopName, 'Đồ dùng phòng ngủ' AS CategoryName, 'Màn chụp tự bung gấp gọn thông minh chống muỗi khung thép dẻo bền' AS ProductName, 'Đáy màn may kín chống muỗi và côn trùng chui vào từ kẽ giường, khung thép đàn hồi gấp gọn tròn như bao đàn.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Gia Bảo Bedding Cozy' AS ShopName, 'Đồ dùng phòng ngủ' AS CategoryName, 'Chăn lông tuyết văn phòng mềm mại ấm áp tiện ngủ trưa gấp gọn nhẹ' AS ProductName, 'Sợi lông tuyết mềm mịn như nhung không rụng lông tơ, khối lượng nhẹ dễ dàng cất trong hộc bàn hoặc balo du lịch.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Gia Bảo Bedding Cozy' AS ShopName, 'Đồ dùng phòng ngủ' AS CategoryName, 'Ruột gối đầu bông gòn hạt bi nhân tạo êm ái chống xẹp lún' AS ProductName, 'Hàng triệu hạt bi bông đàn hồi phân tán đều lực nâng đỡ đầu, có khóa kéo bên hông tùy chỉnh độ dày mỏng của gối.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Gia Bảo Bedding Cozy' AS ShopName, 'Đồ dùng phòng ngủ' AS CategoryName, 'Tấm bảo vệ nệm chống thấm nước 100% bọc xung quanh viền nệm' AS ProductName, 'Màng thở TPU ngăn tuyệt đối nước tiểu sữa và mồ hôi thấm xuống nệm cao su, bề mặt cotton mềm không gây tiếng sột soạt.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Gia Bảo Bedding Cozy' AS ShopName, 'Đồ dùng phòng ngủ' AS CategoryName, 'Bộ ga chun bọc đệm vải thun lạnh trơn màu phong cách tối giản' AS ProductName, 'Chun bo viền dày dặn ôm chặt góc đệm không bị xô lệch khi trẻ nhỏ lăn lộn chơi đùa, vải giặt máy cực nhanh khô.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Gia Bảo Bedding Cozy' AS ShopName, 'Đồ dùng phòng ngủ' AS CategoryName, 'Gối tựa lưng kê gối văn phòng hình hoa cúc nhồi bông êm ái' AS ProductName, 'Lông cừu nhân tạo xù mềm mịn làm điểm nhấn trang trí đầu giường hoặc lót ghế ngồi làm việc chống ê mông.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Gia Bảo Bedding Cozy' AS ShopName, 'Đồ dùng phòng ngủ' AS CategoryName, 'Vỏ chăn lồng ruột kéo khóa cotton sọc kẻ tăm dệt chìm sang trọng' AS ProductName, '4 góc bên trong có dây buộc cố định ruột chăn không bị vón cục, chất vải đanh dày dặn dùng cho cả 4 mùa.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Gia Bảo Bedding Cozy' AS ShopName, 'Đồ dùng phòng ngủ' AS CategoryName, 'Gối kê chân chống giãn tĩnh mạch dốc nghiêng cao su non định hình' AS ProductName, 'Góc nghiêng khoa học 30 độ hỗ trợ tuần hoàn máu chi dưới về tim, giảm sưng phù chân cho người đứng lâu và bà bầu.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Gia Bảo Bedding Cozy' AS ShopName, 'Đồ dùng phòng ngủ' AS CategoryName, 'Đèn ngủ cắm tường cảm ứng ánh sáng tự động bật khi trời tối' AS ProductName, 'Bóng LED vàng ấm công suất siêu tiết kiệm điện 0.5W, ánh sáng dịu mắt soi lối đi ban đêm không gây chói giật mình.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason
) v
JOIN Sellers sel ON sel.TaxCode = '0109988004'
JOIN Shops sh ON sh.SellerId = sel.SellerId AND sh.ShopName = v.ShopName
JOIN Categories c ON c.CategoryName = v.CategoryName
WHERE NOT EXISTS (
    SELECT 1 FROM Products p2 WHERE p2.ShopId = sh.ShopId AND p2.ProductName = v.ProductName
);

-- --- Sản phẩm của Seller: Mỹ Linh Beauty (0109988005) - 30 sản phẩm (15 SP / shop) ---
INSERT INTO Products (CategoryId, ShopId, ProductName, Description, ProductStatus, RejectReason)
SELECT c.CategoryId, sh.ShopId, v.ProductName, v.Description, v.ProductStatus, v.RejectReason
FROM (
    SELECT 'Mỹ Linh Skincare Glow' AS ShopName, 'Chăm sóc da' AS CategoryName, 'Sữa rửa mặt tạo bọt dịu nhẹ tràm trà và BHA ngừa mụn 150ml sạch' AS ProductName, 'Độ pH chuẩn 5.5 không gây khô căng sau khi rửa, tinh dầu tràm trà kiểm soát bã nhờn và làm sạch sâu lỗ chân lông.' AS Description, 'PendingReview' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Mỹ Linh Skincare Glow' AS ShopName, 'Chăm sóc da' AS CategoryName, 'Serum cấp ẩm phục hồi da Hyaluronic Acid & Vitamin B5 30ml thấm' AS ProductName, 'Kết cấu dạng gel trong thấm nhanh không bết dính, làm dịu vùng da mẩn đỏ và củng cố hàng rào lipid bảo vệ da.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Mỹ Linh Skincare Glow' AS ShopName, 'Chăm sóc da' AS CategoryName, 'Kem chống nắng nâng tone kiềm dầu SPF50+ PA++++ dung tích 50ml mịn' AS ProductName, 'Màng lọc chống nắng phổ rộng kết hợp hạt phấn hút dầu silica, tạo lớp finish mịn lì tự nhiên thay thế kem lót trang điểm.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Mỹ Linh Skincare Glow' AS ShopName, 'Chăm sóc da' AS CategoryName, 'Nước hoa hồng cân bằng da chiết xuất cánh hoa cúc làm dịu da 200ml tươi' AS ProductName, 'Chứa cánh hoa cúc tươi ngâm ủ tự nhiên, cân bằng lại độ ẩm tức thì và giảm kích ứng sau bước làm sạch mặt.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Mỹ Linh Skincare Glow' AS ShopName, 'Chăm sóc da' AS CategoryName, 'Nước tẩy trang công nghệ Micellar không cồn dịu nhẹ cho mắt môi 400ml sâu' AS ProductName, 'Hút sạch bụi mịn PM2.5 và cặn trang điểm lâu trôi mà không cần chà xát mạnh, chiết xuất rau má làm mềm mát da.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Mỹ Linh Skincare Glow' AS ShopName, 'Chăm sóc da' AS CategoryName, 'Kem dưỡng ẩm khóa ẩm phục hồi Ceramide và rau má hũ 50g mềm mại' AS ProductName, 'Dạng cream mỏng nhẹ thẩm thấu vào biểu bì khóa chặt dưỡng chất qua đêm, nuôi dưỡng làn da căng mọng tràn đầy sức sống.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Mỹ Linh Skincare Glow' AS ShopName, 'Chăm sóc da' AS CategoryName, 'Hộp 10 mặt nạ giấy dưỡng trắng sáng da chiết xuất ngọc trai biển sâu mát' AS ProductName, 'Chất liệu sợi tơ bạch đàn ôm sát khuôn mặt không chảy tinh chất, bổ sung niacinamide làm đều màu da mờ vết thâm sạm.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Mỹ Linh Skincare Glow' AS ShopName, 'Chăm sóc da' AS CategoryName, 'Gel tẩy tế bào chết da mặt dịu nhẹ chiết xuất enzyme đu đủ và táo xanh sạch' AS ProductName, 'Nhẹ nhàng cuốn trôi lớp sừng già cỗi trên bề mặt da mà không gây rát xước, hỗ trợ hấp thu dưỡng chất ở các bước sau.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Mỹ Linh Skincare Glow' AS ShopName, 'Chăm sóc da' AS CategoryName, 'Kem dưỡng mắt giảm quầng thâm và bọng mắt đầu lăn kim loại mát lạnh' AS ProductName, 'Đầu bi kim loại massage kích thích tuần hoàn vùng da mắt nhạy cảm, phức hợp caffeine làm mờ vết thâm quầng mệt mỏi.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Mỹ Linh Skincare Glow' AS ShopName, 'Chăm sóc da' AS CategoryName, 'Xịt khoáng cấp ẩm tức thì từ nguồn suối khoáng núi lửa Pháp 150ml' AS ProductName, 'Hạt phun sương siêu mịn làm dịu tức thì làn da cháy nắng hoặc khô rát do ngồi điều hòa máy lạnh văn phòng.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Mỹ Linh Skincare Glow' AS ShopName, 'Chăm sóc da' AS CategoryName, 'Dầu tẩy trang nhũ hóa sạch sâu tinh dầu cám gạo tự nhiên 150ml' AS ProductName, 'Nhũ hóa nhanh chóng thành dạng sữa trắng cuốn sạch cặn trang điểm mắt mascara chống nước mà không gây bí mụn ẩn.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Mỹ Linh Skincare Glow' AS ShopName, 'Chăm sóc da' AS CategoryName, 'Serum tinh chất Vitamin C 15% làm sáng da mờ thâm mụn dưỡng ẩm' AS ProductName, 'Dẫn xuất vitamin C thế hệ mới ổn định lâu oxy hóa, cải thiện tone da xỉn màu và kích thích tăng sinh collagen tự nhiên.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Mỹ Linh Skincare Glow' AS ShopName, 'Chăm sóc da' AS CategoryName, 'Mặt nạ đất sét tro núi lửa hút dầu thu nhỏ lỗ chân lông hũ 100g' AS ProductName, 'Đất sét khoáng bentonite kết hợp than hoạt tính hút sạch bã nhờn đầu đen vùng mũi, bổ sung rau má không gây khô rát.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Mỹ Linh Skincare Glow' AS ShopName, 'Chăm sóc da' AS CategoryName, 'Gel chấm mụn cấp tốc gom cùi mụn viêm sưng tràm trà và kẽm 15g' AS ProductName, 'Làm khô cồi mụn trứng cá và mụn bọc trong 24 giờ, giảm đỏ sưng tấy không để lại vết thâm sẹo lõm xấu xí.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Mỹ Linh Skincare Glow' AS ShopName, 'Chăm sóc da' AS CategoryName, 'Xịt dưỡng ẩm khóa nền cấp nước khoáng hoa hồng chưng cất 100ml' AS ProductName, 'Chưng cất từ cánh hoa hồng hữu cơ giữ lớp trang điểm bền màu rạng rỡ suốt ngày dài và se khít lỗ chân lông.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Mỹ Linh Makeup Studio' AS ShopName, 'Trang điểm' AS CategoryName, 'Son kem lì mịn màng lâu trôi không khô môi tone đỏ gạch quyến rũ môi' AS ProductName, 'Chất son velvet xốp mịn lướt nhẹ trên môi che phủ rãnh môi hoàn hảo, bền màu suốt 6 đến 8 tiếng ăn uống nhẹ.' AS Description, 'Rejected' AS ProductStatus, 'Thông tin thông số kỹ thuật chưa rõ ràng, hình ảnh chưa đạt độ phân giải tiêu chuẩn của sàn.' AS RejectReason UNION ALL
    SELECT 'Mỹ Linh Makeup Studio' AS ShopName, 'Trang điểm' AS CategoryName, 'Phấn nước cushion kiềm dầu che khuyết điểm chống nắng hoàn hảo tự nhiên' AS ProductName, 'Hạt phấn siêu vi len lỏi che mờ lỗ chân lông và vết thâm mụn, mang lại lớp nền mỏng mịn tự nhiên chuẩn Hàn Quốc.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Mỹ Linh Makeup Studio' AS ShopName, 'Trang điểm' AS CategoryName, 'Mascara làm dài và tơi mi cong vút chống thấm nước suốt 24h không lem' AS ProductName, 'Đầu cọ uốn cong luồn lách chạm đến từng sợi mi ngắn góc mắt, công thức chống trôi không lem khi đổ mồ hôi hoặc đi mưa.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Mỹ Linh Makeup Studio' AS ShopName, 'Trang điểm' AS CategoryName, 'Bảng phấn mắt 9 ô tone cam đào ấm áp kết hợp nhũ mịn bắt sáng tiệc' AS ProductName, 'Chất bột mịn nhuyễn không rơi bụi phấn khi tán cọ, bảng màu phối hợp hài hòa từ trang điểm hàng ngày đến dự tiệc tối.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Mỹ Linh Makeup Studio' AS ShopName, 'Trang điểm' AS CategoryName, 'Bút kẻ mắt nước dạ nét siêu mảnh 0.01mm mực ra đều không đứt đoạn kẻ' AS ProductName, 'Ngòi bút dạ đàn hồi dễ dàng tạo đường viền mí mỏng tự nhiên hoặc mắt mèo sắc sảo, khô nhanh chỉ sau 3 giây.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Mỹ Linh Makeup Studio' AS ShopName, 'Trang điểm' AS CategoryName, 'Chì kẻ mày định hình 2 đầu dạng vát kèm đầu chải tán mày tự nhiên mềm' AS ProductName, 'Đầu chì tam giác góc cạnh vẽ từng sợi lông mày chân thật, chất sáp chống thấm nước bám màu lâu trôi suốt cả ngày.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Mỹ Linh Makeup Studio' AS ShopName, 'Trang điểm' AS CategoryName, 'Phấn phủ dạng bột khoáng kiềm dầu trong suốt mịn màng khóa nền lâu' AS ProductName, 'Hạt bột silica hút dầu thừa giữ bề mặt da khô thoáng không bóng nhờn, không làm đổi màu lớp kem nền bên dưới.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Mỹ Linh Makeup Studio' AS ShopName, 'Trang điểm' AS CategoryName, 'Xịt khóa nền cố định lớp trang điểm lâu trôi kiềm dầu vòi xịt phun sương mịn' AS ProductName, 'Tạo màng khóa vô hình ngăn lớp phấn nền bị mốc và trượt nứt, bổ sung chiết xuất lô hội giữ ẩm da mềm mại.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Mỹ Linh Makeup Studio' AS ShopName, 'Trang điểm' AS CategoryName, 'Son dưỡng môi có màu ửng hồng tự nhiên dầu hạt bơ và vitamin E' AS ProductName, 'Dưỡng ẩm làm mềm môi nứt nẻ bong tróc, tạo hiệu ứng môi căng mọng tự nhiên nhẹ nhàng cho ngày không trang điểm.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Mỹ Linh Makeup Studio' AS ShopName, 'Trang điểm' AS CategoryName, 'Má hồng dạng kem lỏng tệp da tự nhiên bắt sáng trong veo' AS ProductName, 'Chất kem mỏng mịn dễ tán đều bằng đầu ngón tay không làm xê dịch lớp phấn nền, giữ gò má ửng hồng suốt cả ngày.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Mỹ Linh Makeup Studio' AS ShopName, 'Trang điểm' AS CategoryName, 'Kem che khuyết điểm độ che phủ cao che quầng thâm và mụn đỏ' AS ProductName, 'Đầu cọ vát dễ chấm chính xác lên từng đốm mụn và khóe mắt, kết cấu mỏng mịn không đọng rãnh nhăn chân chim.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Mỹ Linh Makeup Studio' AS ShopName, 'Trang điểm' AS CategoryName, 'Bút tạo khối và bắt sáng 2 đầu thon gọn khuôn mặt chữ V-line' AS ProductName, 'Một đầu contour tạo chiều sâu sống mũi và xương hàm, một đầu highlight bắt sáng gò má và nhân trung rạng ngời.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Mỹ Linh Makeup Studio' AS ShopName, 'Trang điểm' AS CategoryName, 'Kẹp bấm mi lò xo góc rộng tạo độ cong tròn tự nhiên không gãy mi' AS ProductName, 'Miếng đệm cao su silicon cao cấp đàn hồi nâng đỡ hàng mi cong vút từ chân mi, thiết kế vừa vặn hốc mắt châu Á.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Mỹ Linh Makeup Studio' AS ShopName, 'Trang điểm' AS CategoryName, 'Bút kẻ bọng mắt cười 2 đầu tạo mắt to tròn ngây thơ phong cách Hàn' AS ProductName, 'Một đầu chì màu bóng tạo độ phồng bọng mắt, một đầu chì nâu nhạt tạo bóng đổ tự nhiên cho nụ cười rạng rỡ.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason UNION ALL
    SELECT 'Mỹ Linh Makeup Studio' AS ShopName, 'Trang điểm' AS CategoryName, 'Gel định hình lông mày trong suốt giữ nếp phẩy sợi tơi suốt ngày' AS ProductName, 'Đầu chải xoắn ốc chải vuốt từng sợi lông mày đứng dáng tự nhiên không vón cục và không tạo mảng trắng khô cứng.' AS Description, 'Active' AS ProductStatus, NULL AS RejectReason
) v
JOIN Sellers sel ON sel.TaxCode = '0109988005'
JOIN Shops sh ON sh.SellerId = sel.SellerId AND sh.ShopName = v.ShopName
JOIN Categories c ON c.CategoryName = v.CategoryName
WHERE NOT EXISTS (
    SELECT 1 FROM Products p2 WHERE p2.ShopId = sh.ShopId AND p2.ProductName = v.ProductName
);

-- ============================================================================
-- 11. HÌNH ẢNH SẢN PHẨM (ProductImages - 1 đến 3 ảnh/sản phẩm)
-- ============================================================================
-- --- Ảnh sản phẩm của Seller: Công ty TNHH Công nghệ Minh Phát ---
INSERT IGNORE INTO ProductImages (ProductId, ImageUrl, IsPrimary, DisplayOrder)
SELECT p.ProductId, v.ImageUrl, v.IsPrimary, v.DisplayOrder
FROM (
    SELECT 'Ốp lưng iPhone 15 trong suốt viền chống sốc túi khí 4 góc' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1110' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Kính cường lực 9D viền vát cạnh cho iPhone 14 và 15' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1120' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Kính cường lực 9D viền vát cạnh cho iPhone 14 và 15' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1121' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Ốp lưng da nhân tạo phong cách doanh nhân cho Galaxy S24 Ultra' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1130' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Ốp lưng da nhân tạo phong cách doanh nhân cho Galaxy S24 Ultra' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1131' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Ốp lưng da nhân tạo phong cách doanh nhân cho Galaxy S24 Ultra' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1132' AS ImageUrl, 0 AS IsPrimary, 2 AS DisplayOrder UNION ALL
    SELECT 'Miếng dán cường lực chống nhìn trộm góc nghiêng 28 độ bảo mật' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1140' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Ốp lưng silicon dẻo lót nhung mềm chống trầy cho Xiaomi 13' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1150' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Ốp lưng silicon dẻo lót nhung mềm chống trầy cho Xiaomi 13' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1151' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Bộ kính cường lực bảo vệ cụm camera hợp kim titan nguyên khối' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1160' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Bộ kính cường lực bảo vệ cụm camera hợp kim titan nguyên khối' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1161' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Bộ kính cường lực bảo vệ cụm camera hợp kim titan nguyên khối' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1162' AS ImageUrl, 0 AS IsPrimary, 2 AS DisplayOrder UNION ALL
    SELECT 'Ốp lưng từ tính hỗ trợ sạc MagSafe lực hút mạnh viền màu thời trang' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1170' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Miếng dán film PPF tự phục hồi vết xước nhẹ toàn diện mặt lưng' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1180' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Miếng dán film PPF tự phục hồi vết xước nhẹ toàn diện mặt lưng' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1181' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Ốp lưng viền kim loại mặt lưng kính cường lực cho Galaxy Z Flip' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1190' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Ốp lưng viền kim loại mặt lưng kính cường lực cho Galaxy Z Flip' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1191' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Ốp lưng viền kim loại mặt lưng kính cường lực cho Galaxy Z Flip' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1192' AS ImageUrl, 0 AS IsPrimary, 2 AS DisplayOrder UNION ALL
    SELECT 'Kính cường lực nhám mờ chuyên chơi game chống mồ hôi tay cực nhạy' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1200' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Ốp lưng chống sốc tổ ong tản nhiệt hỗ trợ chân đế dựng máy' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1210' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Ốp lưng chống sốc tổ ong tản nhiệt hỗ trợ chân đế dựng máy' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1211' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Miếng dán skin vân da 3M dán lưng điện thoại chống trơn trượt' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1220' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Miếng dán skin vân da 3M dán lưng điện thoại chống trơn trượt' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1221' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Miếng dán skin vân da 3M dán lưng điện thoại chống trơn trượt' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1222' AS ImageUrl, 0 AS IsPrimary, 2 AS DisplayOrder UNION ALL
    SELECT 'Ốp lưng dạ quang phát sáng trong bóng tối họa tiết vũ trụ' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1230' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Kính cường lực dẻo nano gốm ceramic không bao giờ bể mép' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1240' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Kính cường lực dẻo nano gốm ceramic không bao giờ bể mép' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1241' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Ốp lưng dây đeo chéo thời trang đính charm hạt cườm handmade' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1250' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Ốp lưng dây đeo chéo thời trang đính charm hạt cườm handmade' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1251' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Ốp lưng dây đeo chéo thời trang đính charm hạt cườm handmade' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1252' AS ImageUrl, 0 AS IsPrimary, 2 AS DisplayOrder UNION ALL
    SELECT 'Củ sạc nhanh GaN 30W chuẩn PD cổng Type-C siêu nhỏ gọn bỏ túi' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1210' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Cáp sạc Type-C sang Lightning bọc dù Kevlar siêu bền dài 1.2m' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1220' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Cáp sạc Type-C sang Lightning bọc dù Kevlar siêu bền dài 1.2m' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1221' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Pin sạc dự phòng 10000mAh tích hợp màn hình LED báo phần trăm pin' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1230' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Pin sạc dự phòng 10000mAh tích hợp màn hình LED báo phần trăm pin' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1231' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Pin sạc dự phòng 10000mAh tích hợp màn hình LED báo phần trăm pin' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1232' AS ImageUrl, 0 AS IsPrimary, 2 AS DisplayOrder UNION ALL
    SELECT 'Cáp sạc đa năng 3 đầu Type-C Lightning Micro USB dây rút chống rối' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1240' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Củ sạc nhanh 65W 3 cổng 2C1A cho cả điện thoại và laptop văn phòng' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1250' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Củ sạc nhanh 65W 3 cổng 2C1A cho cả điện thoại và laptop văn phòng' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1251' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Pin dự phòng hít từ tính không dây 5000mAh siêu mỏng nhẹ cho iPhone' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1260' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Pin dự phòng hít từ tính không dây 5000mAh siêu mỏng nhẹ cho iPhone' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1261' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Pin dự phòng hít từ tính không dây 5000mAh siêu mỏng nhẹ cho iPhone' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1262' AS ImageUrl, 0 AS IsPrimary, 2 AS DisplayOrder UNION ALL
    SELECT 'Cáp sạc Type-C to Type-C 100W có chip E-Marker ổn định dòng sạc' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1270' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Tẩu sạc nhanh ô tô 45W vỏ hợp kim kẽm tản nhiệt nhanh 2 cổng sạc' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1280' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Tẩu sạc nhanh ô tô 45W vỏ hợp kim kẽm tản nhiệt nhanh 2 cổng sạc' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1281' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Đế sạc không dây chuẩn Qi 15W mặt kính cường lực sang trọng' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1290' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Đế sạc không dây chuẩn Qi 15W mặt kính cường lực sang trọng' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1291' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Đế sạc không dây chuẩn Qi 15W mặt kính cường lực sang trọng' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1292' AS ImageUrl, 0 AS IsPrimary, 2 AS DisplayOrder UNION ALL
    SELECT 'Pin sạc dự phòng dung lượng khủng 20000mAh sạc nhanh 65W 2 chiều' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1300' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Cáp sạc tự ngắt thông minh Type-C có đèn LED báo sạc đầy pin' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1310' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Cáp sạc tự ngắt thông minh Type-C có đèn LED báo sạc đầy pin' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1311' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Bộ sạc du lịch đa quốc gia All-in-one có 4 đầu cắm chuyển đổi' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1320' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Bộ sạc du lịch đa quốc gia All-in-one có 4 đầu cắm chuyển đổi' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1321' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Bộ sạc du lịch đa quốc gia All-in-one có 4 đầu cắm chuyển đổi' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1322' AS ImageUrl, 0 AS IsPrimary, 2 AS DisplayOrder UNION ALL
    SELECT 'Cáp sạc nam châm hít xoay 540 độ hỗ trợ chơi game không cấn tay' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1330' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Đầu chuyển đổi âm thanh Type-C sang jack tai nghe 3.5mm có DAC' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1340' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Đầu chuyển đổi âm thanh Type-C sang jack tai nghe 3.5mm có DAC' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1341' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Dây quấn silicon bảo vệ đầu cáp sạc chống gãy nứt hình thú cưng' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1350' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Dây quấn silicon bảo vệ đầu cáp sạc chống gãy nứt hình thú cưng' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1351' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Dây quấn silicon bảo vệ đầu cáp sạc chống gãy nứt hình thú cưng' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=1352' AS ImageUrl, 0 AS IsPrimary, 2 AS DisplayOrder
) v
JOIN Sellers sel ON sel.TaxCode = '0109988001'
JOIN Shops sh ON sh.SellerId = sel.SellerId
JOIN Products p ON p.ShopId = sh.ShopId AND p.ProductName = v.ProductName;

-- --- Ảnh sản phẩm của Seller: Hộ kinh doanh Hải Long Computer ---
INSERT IGNORE INTO ProductImages (ProductId, ImageUrl, IsPrimary, DisplayOrder)
SELECT p.ProductId, v.ImageUrl, v.IsPrimary, v.DisplayOrder
FROM (
    SELECT 'Bàn phím cơ không dây TKL 87 phím Hotswap đèn nền RGB đổi màu' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2110' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Chuột gaming siêu nhẹ 59g mắt đọc quang học 26000DPI chính xác' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2120' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Chuột gaming siêu nhẹ 59g mắt đọc quang học 26000DPI chính xác' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2121' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Lót chuột gaming cỡ lớn 900x400mm viền LED RGB chống trượt bàn' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2130' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Lót chuột gaming cỡ lớn 900x400mm viền LED RGB chống trượt bàn' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2131' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Lót chuột gaming cỡ lớn 900x400mm viền LED RGB chống trượt bàn' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2132' AS ImageUrl, 0 AS IsPrimary, 2 AS DisplayOrder UNION ALL
    SELECT 'Tai nghe gaming chụp tai giả lập 7.1 có micro lọc tiếng ồn linh hoạt' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2140' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Bộ nút phím Keycap PBT Doubleshot profile Cherry 128 phím dày dặn' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2150' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Bộ nút phím Keycap PBT Doubleshot profile Cherry 128 phím dày dặn' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2151' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Chuột văn phòng không dây kết nối Dual Mode Bluetooth & 2.4G Silent' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2160' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Chuột văn phòng không dây kết nối Dual Mode Bluetooth & 2.4G Silent' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2161' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Chuột văn phòng không dây kết nối Dual Mode Bluetooth & 2.4G Silent' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2162' AS ImageUrl, 0 AS IsPrimary, 2 AS DisplayOrder UNION ALL
    SELECT 'Kê tay bàn phím bằng gỗ óc chó tự nhiên vát góc công thái học mỏi' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2170' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Tay cầm chơi game không dây rung kép hỗ trợ PC và điện thoại mượt mà' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2180' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Tay cầm chơi game không dây rung kép hỗ trợ PC và điện thoại mượt mà' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2181' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Bàn phím cơ mini 68 phím Bluetooth 3 chế độ kết nối đa thiết bị' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2190' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Bàn phím cơ mini 68 phím Bluetooth 3 chế độ kết nối đa thiết bị' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2191' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Bàn phím cơ mini 68 phím Bluetooth 3 chế độ kết nối đa thiết bị' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2192' AS ImageUrl, 0 AS IsPrimary, 2 AS DisplayOrder UNION ALL
    SELECT 'Chuột công thái học dạng đứng dọc bảo vệ hội chứng ống cổ tay' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2200' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Bộ 45 switch bàn phím cơ Linear âm trầm bôi trơn sẵn mượt mà' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2210' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Bộ 45 switch bàn phím cơ Linear âm trầm bôi trơn sẵn mượt mà' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2211' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Giá treo tai nghe gaming kim loại hợp kim nhôm để bàn chắc chắn' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2220' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Giá treo tai nghe gaming kim loại hợp kim nhôm để bàn chắc chắn' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2221' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Giá treo tai nghe gaming kim loại hợp kim nhôm để bàn chắc chắn' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2222' AS ImageUrl, 0 AS IsPrimary, 2 AS DisplayOrder UNION ALL
    SELECT 'Dụng cụ nhổ keycap và nhổ switch 2 trong 1 bằng thép không gỉ' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2230' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Tấm che bụi bàn phím cơ bằng mica acrylic trong suốt chống nước' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2240' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Tấm che bụi bàn phím cơ bằng mica acrylic trong suốt chống nước' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2241' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Bàn di chuột nỉ cao cấp phủ chống thấm nước kích thước 80x30cm' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2250' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Bàn di chuột nỉ cao cấp phủ chống thấm nước kích thước 80x30cm' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2251' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Bàn di chuột nỉ cao cấp phủ chống thấm nước kích thước 80x30cm' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2252' AS ImageUrl, 0 AS IsPrimary, 2 AS DisplayOrder UNION ALL
    SELECT 'Balo laptop công sở 15.6 inch vải Oxford chống thấm nước cao cấp' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2210' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Túi chống sốc laptop nỉ nhung cao cấp có tay xách ẩn tiện lợi gọn' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2220' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Túi chống sốc laptop nỉ nhung cao cấp có tay xách ẩn tiện lợi gọn' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2221' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Đế tản nhiệt laptop 6 quạt gió tốc độ cao màn hình LCD chỉnh tốc gió' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2230' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Đế tản nhiệt laptop 6 quạt gió tốc độ cao màn hình LCD chỉnh tốc gió' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2231' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Đế tản nhiệt laptop 6 quạt gió tốc độ cao màn hình LCD chỉnh tốc gió' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2232' AS ImageUrl, 0 AS IsPrimary, 2 AS DisplayOrder UNION ALL
    SELECT 'Giá đỡ laptop hợp kim nhôm nâng hạ 6 nấc gập gọn bỏ túi xách' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2240' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Miếng dán bảo vệ mặt lưng và bàn phím laptop vân nhôm xước sang' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2250' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Miếng dán bảo vệ mặt lưng và bàn phím laptop vân nhôm xước sang' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2251' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Quạt hút nhiệt laptop gắn khe gió cạnh sườn cảm biến nhiệt độ tự động' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2260' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Quạt hút nhiệt laptop gắn khe gió cạnh sườn cảm biến nhiệt độ tự động' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2261' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Quạt hút nhiệt laptop gắn khe gió cạnh sườn cảm biến nhiệt độ tự động' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2262' AS ImageUrl, 0 AS IsPrimary, 2 AS DisplayOrder UNION ALL
    SELECT 'Bàn kê đùi làm việc với laptop có đệm nệm êm ái chống nóng đùi' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2270' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Bộ vệ sinh laptop và tai nghe đa năng 7 trong 1 tiện dụng để bàn' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2280' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Bộ vệ sinh laptop và tai nghe đa năng 7 trong 1 tiện dụng để bàn' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2281' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Phủ phím silicon siêu mỏng chống nước chống bụi cho bàn phím laptop' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2290' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Phủ phím silicon siêu mỏng chống nước chống bụi cho bàn phím laptop' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2291' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Phủ phím silicon siêu mỏng chống nước chống bụi cho bàn phím laptop' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2292' AS ImageUrl, 0 AS IsPrimary, 2 AS DisplayOrder UNION ALL
    SELECT 'Dây khóa số chống trộm laptop bằng thép bọc nhựa dài 1.8m an toàn' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2300' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Túi đựng củ sạc chuột và phụ kiện công nghệ chống sốc 2 ngăn' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2310' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Túi đựng củ sạc chuột và phụ kiện công nghệ chống sốc 2 ngăn' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2311' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Chân đế cao su tự dính nâng nghiêng tản nhiệt góc bàn laptop' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2320' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Chân đế cao su tự dính nâng nghiêng tản nhiệt góc bàn laptop' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2321' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Chân đế cao su tự dính nâng nghiêng tản nhiệt góc bàn laptop' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2322' AS ImageUrl, 0 AS IsPrimary, 2 AS DisplayOrder UNION ALL
    SELECT 'Tấm lót chuột kiêm sạc không dây 15W trên bàn làm việc bọc da PU' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2330' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Túi xách công sở đựng laptop da PU chống nước quai đeo có đệm' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2340' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Túi xách công sở đựng laptop da PU chống nước quai đeo có đệm' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2341' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Miếng đệm kê tay di chuột silicon công thái học chống chai cổ tay' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2350' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Miếng đệm kê tay di chuột silicon công thái học chống chai cổ tay' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2351' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Miếng đệm kê tay di chuột silicon công thái học chống chai cổ tay' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=2352' AS ImageUrl, 0 AS IsPrimary, 2 AS DisplayOrder
) v
JOIN Sellers sel ON sel.TaxCode = '0109988002'
JOIN Shops sh ON sh.SellerId = sel.SellerId
JOIN Products p ON p.ShopId = sh.ShopId AND p.ProductName = v.ProductName;

-- --- Ảnh sản phẩm của Seller: Công ty TNHH Thời Trang Hoa Mai ---
INSERT IGNORE INTO ProductImages (ProductId, ImageUrl, IsPrimary, DisplayOrder)
SELECT p.ProductId, v.ImageUrl, v.IsPrimary, v.DisplayOrder
FROM (
    SELECT 'Áo sơ mi nam dài tay vải sợi tre tự nhiên chống nhăn tuyệt đối dáng' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3110' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Áo thun nam cổ tròn cotton 100% định lượng 250gsm dày dặn đứng phom' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3120' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Áo thun nam cổ tròn cotton 100% định lượng 250gsm dày dặn đứng phom' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3121' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Áo polo nam phối bo cổ dệt tổ ong thoáng khí co giãn 4 chiều mềm' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3130' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Áo polo nam phối bo cổ dệt tổ ong thoáng khí co giãn 4 chiều mềm' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3131' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Áo polo nam phối bo cổ dệt tổ ong thoáng khí co giãn 4 chiều mềm' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3132' AS ImageUrl, 0 AS IsPrimary, 2 AS DisplayOrder UNION ALL
    SELECT 'Áo sơ mi nam ngắn tay họa tiết kẻ caro năng động trẻ trung ngày hè' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3140' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Áo thun nam tay lỡ form rộng phong cách đường phố Unisex thoải mái' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3150' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Áo thun nam tay lỡ form rộng phong cách đường phố Unisex thoải mái' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3151' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Áo sơ mi nam cổ trụ chất liệu đũi linen tự nhiên mộc mạc thoáng mát' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3160' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Áo sơ mi nam cổ trụ chất liệu đũi linen tự nhiên mộc mạc thoáng mát' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3161' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Áo sơ mi nam cổ trụ chất liệu đũi linen tự nhiên mộc mạc thoáng mát' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3162' AS ImageUrl, 0 AS IsPrimary, 2 AS DisplayOrder UNION ALL
    SELECT 'Áo polo nam trơn phong cách tối giản công nghệ dệt không đường may mép' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3170' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Áo thun nam có cổ dệt jacquard vân chìm sang trọng đi tiệc tối' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3180' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Áo thun nam có cổ dệt jacquard vân chìm sang trọng đi tiệc tối' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3181' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Áo khoác gió nam thể thao lót lưới cản gió đi phượt nhẹ nhàng' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3190' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Áo khoác gió nam thể thao lót lưới cản gió đi phượt nhẹ nhàng' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3191' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Áo khoác gió nam thể thao lót lưới cản gió đi phượt nhẹ nhàng' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3192' AS ImageUrl, 0 AS IsPrimary, 2 AS DisplayOrder UNION ALL
    SELECT 'Áo sơ mi nam oxford cổ bẻ cài cúc button-down phong cách học đường' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3200' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Áo ba lỗ thể thao nam thun lạnh tập gym co giãn đa chiều' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3210' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Áo ba lỗ thể thao nam thun lạnh tập gym co giãn đa chiều' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3211' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Áo thun polo nam phối sọc ngang ngực trẻ trung năng động' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3220' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Áo thun polo nam phối sọc ngang ngực trẻ trung năng động' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3221' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Áo thun polo nam phối sọc ngang ngực trẻ trung năng động' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3222' AS ImageUrl, 0 AS IsPrimary, 2 AS DisplayOrder UNION ALL
    SELECT 'Áo sơ mi lụa nam tay dài họa tiết baroque phong cách thời thượng' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3230' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Áo thun nam cổ tim chữ V tôn nét nam tính vải modal gỗ sồi' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3240' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Áo thun nam cổ tim chữ V tôn nét nam tính vải modal gỗ sồi' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3241' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Áo khoác cardigan len mỏng nam cổ tim cài cúc thời trang mùa thu' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3250' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Áo khoác cardigan len mỏng nam cổ tim cài cúc thời trang mùa thu' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3251' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Áo khoác cardigan len mỏng nam cổ tim cài cúc thời trang mùa thu' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3252' AS ImageUrl, 0 AS IsPrimary, 2 AS DisplayOrder UNION ALL
    SELECT 'Đầm xòe hoa nhí cổ vuông tay phồng dáng dài qua gối nữ tính' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3210' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Áo sơ mi lụa tơ tằm cổ thắt nơ thanh lịch cho quý cô công sở nhẹ' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3220' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Áo sơ mi lụa tơ tằm cổ thắt nơ thanh lịch cho quý cô công sở nhẹ' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3221' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Chân váy chữ A dáng dài lưng cao xẻ tà trước quyến rũ bước đi' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3230' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Chân váy chữ A dáng dài lưng cao xẻ tà trước quyến rũ bước đi' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3231' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Chân váy chữ A dáng dài lưng cao xẻ tà trước quyến rũ bước đi' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3232' AS ImageUrl, 0 AS IsPrimary, 2 AS DisplayOrder UNION ALL
    SELECT 'Váy suông cổ tròn đính cúc ngọc trai nhân tạo chất tuyết mưa sang' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3240' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Áo kiểu nữ trễ vai bo thun chun ngực bánh bèo tiểu thư điệu đà' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3250' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Áo kiểu nữ trễ vai bo thun chun ngực bánh bèo tiểu thư điệu đà' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3251' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Set bộ công sở gồm áo vest cộc tay phối chân váy xếp ly đi làm' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3260' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Set bộ công sở gồm áo vest cộc tay phối chân váy xếp ly đi làm' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3261' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Set bộ công sở gồm áo vest cộc tay phối chân váy xếp ly đi làm' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3262' AS ImageUrl, 0 AS IsPrimary, 2 AS DisplayOrder UNION ALL
    SELECT 'Đầm suông linen thêu hoa thủ công phong cách mộc mạc du lịch' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3270' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Chân váy xếp ly nhỏ dáng xòe dài lưng thun co giãn thanh lịch nhẹ' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3280' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Chân váy xếp ly nhỏ dáng xòe dài lưng thun co giãn thanh lịch nhẹ' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3281' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Đầm ôm body cổ yếm quyến rũ tôn dáng dự tiệc dạ hội' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3290' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Đầm ôm body cổ yếm quyến rũ tôn dáng dự tiệc dạ hội' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3291' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Đầm ôm body cổ yếm quyến rũ tôn dáng dự tiệc dạ hội' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3292' AS ImageUrl, 0 AS IsPrimary, 2 AS DisplayOrder UNION ALL
    SELECT 'Áo kiểu tay bồng cổ tim phối ren hoa cúc nhã nhặn' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3300' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Quần tây ống rộng lưng cao hack dáng tôn chân dài cho nữ' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3310' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Quần tây ống rộng lưng cao hack dáng tôn chân dài cho nữ' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3311' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Áo khoác blazer nữ 1 lớp phom rộng phong cách Hàn Quốc' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3320' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Áo khoác blazer nữ 1 lớp phom rộng phong cách Hàn Quốc' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3321' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Áo khoác blazer nữ 1 lớp phom rộng phong cách Hàn Quốc' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3322' AS ImageUrl, 0 AS IsPrimary, 2 AS DisplayOrder UNION ALL
    SELECT 'Đầm sơ mi thắt đai eo dáng xòe nhẹ công sở thanh nhã' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3330' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Chân váy đuôi cá vạt chéo phối bèo nhún tôn vòng 3' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3340' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Chân váy đuôi cá vạt chéo phối bèo nhún tôn vòng 3' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3341' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Áo len tăm cổ lọ 3 phân mỏng nhẹ giữ ấm mùa thu đông' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3350' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Áo len tăm cổ lọ 3 phân mỏng nhẹ giữ ấm mùa thu đông' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3351' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Áo len tăm cổ lọ 3 phân mỏng nhẹ giữ ấm mùa thu đông' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=3352' AS ImageUrl, 0 AS IsPrimary, 2 AS DisplayOrder
) v
JOIN Sellers sel ON sel.TaxCode = '0109988003'
JOIN Shops sh ON sh.SellerId = sel.SellerId
JOIN Products p ON p.ShopId = sh.ShopId AND p.ProductName = v.ProductName;

-- --- Ảnh sản phẩm của Seller: Công ty TNHH Gia Bảo Lifestyle ---
INSERT IGNORE INTO ProductImages (ProductId, ImageUrl, IsPrimary, DisplayOrder)
SELECT p.ProductId, v.ImageUrl, v.IsPrimary, v.DisplayOrder
FROM (
    SELECT 'Bộ dao làm bếp 6 món thép không gỉ nguyên khối phủ đá chống dính bếp' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4110' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Chảo chống dính đá hoa cương đáy từ sâu lòng 26cm đúc nguyên khối bền' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4120' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Chảo chống dính đá hoa cương đáy từ sâu lòng 26cm đúc nguyên khối bền' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4121' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Thớt kháng khuẩn inox 304 kết hợp nhựa lúa mạch 2 mặt tiện dụng thái' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4130' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Thớt kháng khuẩn inox 304 kết hợp nhựa lúa mạch 2 mặt tiện dụng thái' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4131' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Thớt kháng khuẩn inox 304 kết hợp nhựa lúa mạch 2 mặt tiện dụng thái' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4132' AS ImageUrl, 0 AS IsPrimary, 2 AS DisplayOrder UNION ALL
    SELECT 'Bộ 3 hộp thủy tinh chịu nhiệt Borosilicate chia ngăn lò vi sóng nắp kín' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4140' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Rổ quay rau và vắt ráo nước ly tâm tiện lợi có khóa gạt xoay nhẹ' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4150' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Rổ quay rau và vắt ráo nước ly tâm tiện lợi có khóa gạt xoay nhẹ' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4151' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Nồi inox 3 đáy nắp kính cường lực cao cấp dùng cho mọi loại bếp từ gas' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4160' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Nồi inox 3 đáy nắp kính cường lực cao cấp dùng cho mọi loại bếp từ gas' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4161' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Nồi inox 3 đáy nắp kính cường lực cao cấp dùng cho mọi loại bếp từ gas' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4162' AS ImageUrl, 0 AS IsPrimary, 2 AS DisplayOrder UNION ALL
    SELECT 'Kéo cắt gà và thực phẩm đa năng lưỡi răng cưa có chốt an toàn trợ lực' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4170' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Kệ gia vị 2 tầng để bàn bếp thép carbon sơn tĩnh điện chống rỉ sét' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4180' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Kệ gia vị 2 tầng để bàn bếp thép carbon sơn tĩnh điện chống rỉ sét' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4181' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Nồi áp suất cơ nấu bếp từ đáy 3 lớp hầm thịt ninh xương nhanh' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4190' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Nồi áp suất cơ nấu bếp từ đáy 3 lớp hầm thịt ninh xương nhanh' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4191' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Nồi áp suất cơ nấu bếp từ đáy 3 lớp hầm thịt ninh xương nhanh' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4192' AS ImageUrl, 0 AS IsPrimary, 2 AS DisplayOrder UNION ALL
    SELECT 'Bộ 5 muôi thìa nấu ăn bằng gỗ tự nhiên không làm trầy chảo chống dính' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4200' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Bộ cối chày đá tự nhiên giã cua đâm tỏi ớt nhuyễn mịn' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4210' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Bộ cối chày đá tự nhiên giã cua đâm tỏi ớt nhuyễn mịn' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4211' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Bình xịt dầu ăn phun sương thủy tinh kiểm soát lượng dầu ăn kiêng' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4220' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Bình xịt dầu ăn phun sương thủy tinh kiểm soát lượng dầu ăn kiêng' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4221' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Bình xịt dầu ăn phun sương thủy tinh kiểm soát lượng dầu ăn kiêng' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4222' AS ImageUrl, 0 AS IsPrimary, 2 AS DisplayOrder UNION ALL
    SELECT 'Dụng cụ nạo gọt vỏ củ quả lưỡi gốm ceramic siêu sắc bén' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4230' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Khay đá silicon có nắp đậy dẻo dai lấy đá viên dễ dàng một chạm' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4240' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Khay đá silicon có nắp đậy dẻo dai lấy đá viên dễ dàng một chạm' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4241' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Rổ inox gác bồn rửa bát co giãn tùy chỉnh kích thước đa năng' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4250' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Rổ inox gác bồn rửa bát co giãn tùy chỉnh kích thước đa năng' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4251' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Rổ inox gác bồn rửa bát co giãn tùy chỉnh kích thước đa năng' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4252' AS ImageUrl, 0 AS IsPrimary, 2 AS DisplayOrder UNION ALL
    SELECT 'Set ga gối cotton lụa phong cách Hàn Quốc 4 món dệt mật độ cao mát' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4210' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Gối ngủ cao su non công thái học định hình cổ chống đau vai gáy êm' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4220' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Gối ngủ cao su non công thái học định hình cổ chống đau vai gáy êm' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4221' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Ruột chăn hè thu lông vũ nhân tạo micro polyester siêu nhẹ kháng ẩm tốt' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4230' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Ruột chăn hè thu lông vũ nhân tạo micro polyester siêu nhẹ kháng ẩm tốt' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4231' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Ruột chăn hè thu lông vũ nhân tạo micro polyester siêu nhẹ kháng ẩm tốt' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4232' AS ImageUrl, 0 AS IsPrimary, 2 AS DisplayOrder UNION ALL
    SELECT 'Đệm topper làm mềm nệm dày 7cm bông xơ siêu mịn xuất khẩu êm ái' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4240' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Chiếu điều hòa mủ cao su non tự nhiên làm mát dịu nhẹ mùa hè phòng ngủ' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4250' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Chiếu điều hòa mủ cao su non tự nhiên làm mát dịu nhẹ mùa hè phòng ngủ' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4251' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Vỏ gối ôm cotton trơn màu cao cấp khóa kéo giọt lệ ẩn tinh tế phòng' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4260' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Vỏ gối ôm cotton trơn màu cao cấp khóa kéo giọt lệ ẩn tinh tế phòng' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4261' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Vỏ gối ôm cotton trơn màu cao cấp khóa kéo giọt lệ ẩn tinh tế phòng' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4262' AS ImageUrl, 0 AS IsPrimary, 2 AS DisplayOrder UNION ALL
    SELECT 'Màn chụp tự bung gấp gọn thông minh chống muỗi khung thép dẻo bền' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4270' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Chăn lông tuyết văn phòng mềm mại ấm áp tiện ngủ trưa gấp gọn nhẹ' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4280' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Chăn lông tuyết văn phòng mềm mại ấm áp tiện ngủ trưa gấp gọn nhẹ' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4281' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Ruột gối đầu bông gòn hạt bi nhân tạo êm ái chống xẹp lún' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4290' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Ruột gối đầu bông gòn hạt bi nhân tạo êm ái chống xẹp lún' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4291' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Ruột gối đầu bông gòn hạt bi nhân tạo êm ái chống xẹp lún' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4292' AS ImageUrl, 0 AS IsPrimary, 2 AS DisplayOrder UNION ALL
    SELECT 'Tấm bảo vệ nệm chống thấm nước 100% bọc xung quanh viền nệm' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4300' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Bộ ga chun bọc đệm vải thun lạnh trơn màu phong cách tối giản' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4310' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Bộ ga chun bọc đệm vải thun lạnh trơn màu phong cách tối giản' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4311' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Gối tựa lưng kê gối văn phòng hình hoa cúc nhồi bông êm ái' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4320' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Gối tựa lưng kê gối văn phòng hình hoa cúc nhồi bông êm ái' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4321' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Gối tựa lưng kê gối văn phòng hình hoa cúc nhồi bông êm ái' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4322' AS ImageUrl, 0 AS IsPrimary, 2 AS DisplayOrder UNION ALL
    SELECT 'Vỏ chăn lồng ruột kéo khóa cotton sọc kẻ tăm dệt chìm sang trọng' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4330' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Gối kê chân chống giãn tĩnh mạch dốc nghiêng cao su non định hình' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4340' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Gối kê chân chống giãn tĩnh mạch dốc nghiêng cao su non định hình' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4341' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Đèn ngủ cắm tường cảm ứng ánh sáng tự động bật khi trời tối' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4350' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Đèn ngủ cắm tường cảm ứng ánh sáng tự động bật khi trời tối' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4351' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Đèn ngủ cắm tường cảm ứng ánh sáng tự động bật khi trời tối' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=4352' AS ImageUrl, 0 AS IsPrimary, 2 AS DisplayOrder
) v
JOIN Sellers sel ON sel.TaxCode = '0109988004'
JOIN Shops sh ON sh.SellerId = sel.SellerId
JOIN Products p ON p.ShopId = sh.ShopId AND p.ProductName = v.ProductName;

-- --- Ảnh sản phẩm của Seller: Mỹ Linh Beauty ---
INSERT IGNORE INTO ProductImages (ProductId, ImageUrl, IsPrimary, DisplayOrder)
SELECT p.ProductId, v.ImageUrl, v.IsPrimary, v.DisplayOrder
FROM (
    SELECT 'Sữa rửa mặt tạo bọt dịu nhẹ tràm trà và BHA ngừa mụn 150ml sạch' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5110' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Serum cấp ẩm phục hồi da Hyaluronic Acid & Vitamin B5 30ml thấm' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5120' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Serum cấp ẩm phục hồi da Hyaluronic Acid & Vitamin B5 30ml thấm' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5121' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Kem chống nắng nâng tone kiềm dầu SPF50+ PA++++ dung tích 50ml mịn' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5130' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Kem chống nắng nâng tone kiềm dầu SPF50+ PA++++ dung tích 50ml mịn' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5131' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Kem chống nắng nâng tone kiềm dầu SPF50+ PA++++ dung tích 50ml mịn' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5132' AS ImageUrl, 0 AS IsPrimary, 2 AS DisplayOrder UNION ALL
    SELECT 'Nước hoa hồng cân bằng da chiết xuất cánh hoa cúc làm dịu da 200ml tươi' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5140' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Nước tẩy trang công nghệ Micellar không cồn dịu nhẹ cho mắt môi 400ml sâu' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5150' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Nước tẩy trang công nghệ Micellar không cồn dịu nhẹ cho mắt môi 400ml sâu' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5151' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Kem dưỡng ẩm khóa ẩm phục hồi Ceramide và rau má hũ 50g mềm mại' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5160' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Kem dưỡng ẩm khóa ẩm phục hồi Ceramide và rau má hũ 50g mềm mại' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5161' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Kem dưỡng ẩm khóa ẩm phục hồi Ceramide và rau má hũ 50g mềm mại' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5162' AS ImageUrl, 0 AS IsPrimary, 2 AS DisplayOrder UNION ALL
    SELECT 'Hộp 10 mặt nạ giấy dưỡng trắng sáng da chiết xuất ngọc trai biển sâu mát' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5170' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Gel tẩy tế bào chết da mặt dịu nhẹ chiết xuất enzyme đu đủ và táo xanh sạch' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5180' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Gel tẩy tế bào chết da mặt dịu nhẹ chiết xuất enzyme đu đủ và táo xanh sạch' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5181' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Kem dưỡng mắt giảm quầng thâm và bọng mắt đầu lăn kim loại mát lạnh' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5190' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Kem dưỡng mắt giảm quầng thâm và bọng mắt đầu lăn kim loại mát lạnh' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5191' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Kem dưỡng mắt giảm quầng thâm và bọng mắt đầu lăn kim loại mát lạnh' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5192' AS ImageUrl, 0 AS IsPrimary, 2 AS DisplayOrder UNION ALL
    SELECT 'Xịt khoáng cấp ẩm tức thì từ nguồn suối khoáng núi lửa Pháp 150ml' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5200' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Dầu tẩy trang nhũ hóa sạch sâu tinh dầu cám gạo tự nhiên 150ml' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5210' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Dầu tẩy trang nhũ hóa sạch sâu tinh dầu cám gạo tự nhiên 150ml' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5211' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Serum tinh chất Vitamin C 15% làm sáng da mờ thâm mụn dưỡng ẩm' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5220' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Serum tinh chất Vitamin C 15% làm sáng da mờ thâm mụn dưỡng ẩm' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5221' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Serum tinh chất Vitamin C 15% làm sáng da mờ thâm mụn dưỡng ẩm' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5222' AS ImageUrl, 0 AS IsPrimary, 2 AS DisplayOrder UNION ALL
    SELECT 'Mặt nạ đất sét tro núi lửa hút dầu thu nhỏ lỗ chân lông hũ 100g' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5230' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Gel chấm mụn cấp tốc gom cùi mụn viêm sưng tràm trà và kẽm 15g' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5240' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Gel chấm mụn cấp tốc gom cùi mụn viêm sưng tràm trà và kẽm 15g' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5241' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Xịt dưỡng ẩm khóa nền cấp nước khoáng hoa hồng chưng cất 100ml' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5250' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Xịt dưỡng ẩm khóa nền cấp nước khoáng hoa hồng chưng cất 100ml' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5251' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Xịt dưỡng ẩm khóa nền cấp nước khoáng hoa hồng chưng cất 100ml' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5252' AS ImageUrl, 0 AS IsPrimary, 2 AS DisplayOrder UNION ALL
    SELECT 'Son kem lì mịn màng lâu trôi không khô môi tone đỏ gạch quyến rũ môi' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5210' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Phấn nước cushion kiềm dầu che khuyết điểm chống nắng hoàn hảo tự nhiên' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5220' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Phấn nước cushion kiềm dầu che khuyết điểm chống nắng hoàn hảo tự nhiên' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5221' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Mascara làm dài và tơi mi cong vút chống thấm nước suốt 24h không lem' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5230' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Mascara làm dài và tơi mi cong vút chống thấm nước suốt 24h không lem' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5231' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Mascara làm dài và tơi mi cong vút chống thấm nước suốt 24h không lem' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5232' AS ImageUrl, 0 AS IsPrimary, 2 AS DisplayOrder UNION ALL
    SELECT 'Bảng phấn mắt 9 ô tone cam đào ấm áp kết hợp nhũ mịn bắt sáng tiệc' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5240' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Bút kẻ mắt nước dạ nét siêu mảnh 0.01mm mực ra đều không đứt đoạn kẻ' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5250' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Bút kẻ mắt nước dạ nét siêu mảnh 0.01mm mực ra đều không đứt đoạn kẻ' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5251' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Chì kẻ mày định hình 2 đầu dạng vát kèm đầu chải tán mày tự nhiên mềm' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5260' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Chì kẻ mày định hình 2 đầu dạng vát kèm đầu chải tán mày tự nhiên mềm' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5261' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Chì kẻ mày định hình 2 đầu dạng vát kèm đầu chải tán mày tự nhiên mềm' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5262' AS ImageUrl, 0 AS IsPrimary, 2 AS DisplayOrder UNION ALL
    SELECT 'Phấn phủ dạng bột khoáng kiềm dầu trong suốt mịn màng khóa nền lâu' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5270' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Xịt khóa nền cố định lớp trang điểm lâu trôi kiềm dầu vòi xịt phun sương mịn' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5280' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Xịt khóa nền cố định lớp trang điểm lâu trôi kiềm dầu vòi xịt phun sương mịn' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5281' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Son dưỡng môi có màu ửng hồng tự nhiên dầu hạt bơ và vitamin E' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5290' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Son dưỡng môi có màu ửng hồng tự nhiên dầu hạt bơ và vitamin E' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5291' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Son dưỡng môi có màu ửng hồng tự nhiên dầu hạt bơ và vitamin E' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5292' AS ImageUrl, 0 AS IsPrimary, 2 AS DisplayOrder UNION ALL
    SELECT 'Má hồng dạng kem lỏng tệp da tự nhiên bắt sáng trong veo' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5300' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Kem che khuyết điểm độ che phủ cao che quầng thâm và mụn đỏ' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5310' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Kem che khuyết điểm độ che phủ cao che quầng thâm và mụn đỏ' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5311' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Bút tạo khối và bắt sáng 2 đầu thon gọn khuôn mặt chữ V-line' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5320' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Bút tạo khối và bắt sáng 2 đầu thon gọn khuôn mặt chữ V-line' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5321' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Bút tạo khối và bắt sáng 2 đầu thon gọn khuôn mặt chữ V-line' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5322' AS ImageUrl, 0 AS IsPrimary, 2 AS DisplayOrder UNION ALL
    SELECT 'Kẹp bấm mi lò xo góc rộng tạo độ cong tròn tự nhiên không gãy mi' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5330' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Bút kẻ bọng mắt cười 2 đầu tạo mắt to tròn ngây thơ phong cách Hàn' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5340' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Bút kẻ bọng mắt cười 2 đầu tạo mắt to tròn ngây thơ phong cách Hàn' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5341' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Gel định hình lông mày trong suốt giữ nếp phẩy sợi tơi suốt ngày' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5350' AS ImageUrl, 1 AS IsPrimary, 0 AS DisplayOrder UNION ALL
    SELECT 'Gel định hình lông mày trong suốt giữ nếp phẩy sợi tơi suốt ngày' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5351' AS ImageUrl, 0 AS IsPrimary, 1 AS DisplayOrder UNION ALL
    SELECT 'Gel định hình lông mày trong suốt giữ nếp phẩy sợi tơi suốt ngày' AS ProductName, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&sig=5352' AS ImageUrl, 0 AS IsPrimary, 2 AS DisplayOrder
) v
JOIN Sellers sel ON sel.TaxCode = '0109988005'
JOIN Shops sh ON sh.SellerId = sel.SellerId
JOIN Products p ON p.ShopId = sh.ShopId AND p.ProductName = v.ProductName;

-- ============================================================================
-- 12. BIẾN THỂ SẢN PHẨM (ProductVariants - SKU duy nhất, giá thực tế)
-- ============================================================================
-- --- Biến thể sản phẩm của Seller: Công ty TNHH Công nghệ Minh Phát ---
INSERT INTO ProductVariants (ProductId, SKU, VariantName, Price, WeightGrams, IsActive)
SELECT p.ProductId, v.SKU, v.VariantName, v.Price, v.WeightGrams, v.IsActive
FROM (
    SELECT 'Ốp lưng iPhone 15 trong suốt viền chống sốc túi khí 4 góc' AS ProductName, 'S01-H1-CK-001-TRONG-SUOT-VIE-V1' AS SKU, 'Trong Suốt Viền Đen' AS VariantName, 65000 AS Price, 45 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Ốp lưng iPhone 15 trong suốt viền chống sốc túi khí 4 góc' AS ProductName, 'S01-H1-CK-001-TRONG-SUOT-VIE-V2' AS SKU, 'Trong Suốt Viền Trắng' AS VariantName, 75000 AS Price, 45 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Kính cường lực 9D viền vát cạnh cho iPhone 14 và 15' AS ProductName, 'S01-H1-CK-002-HOP-1-KINH' AS SKU, 'Hộp 1 Kính' AS VariantName, 45000 AS Price, 35 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Kính cường lực 9D viền vát cạnh cho iPhone 14 và 15' AS ProductName, 'S01-H1-CK-002-HOP-2-KINH-KEM-V2' AS SKU, 'Hộp 2 Kính Kèm Khung Dán' AS VariantName, 52000 AS Price, 35 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Ốp lưng da nhân tạo phong cách doanh nhân cho Galaxy S24 Ultra' AS ProductName, 'S01-H1-CK-003-NAU-CO-IEN' AS SKU, 'Nâu Cổ Điển' AS VariantName, 135000 AS Price, 60 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Ốp lưng da nhân tạo phong cách doanh nhân cho Galaxy S24 Ultra' AS ProductName, 'S01-H1-CK-003-EN-LICH-LAM' AS SKU, 'Đen Lịch Lãm' AS VariantName, 155000 AS Price, 60 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Miếng dán cường lực chống nhìn trộm góc nghiêng 28 độ bảo mật' AS ProductName, 'S01-H1-CK-004-BAN-MO-CHONG-C-V1' AS SKU, 'Bản Mờ Chống Chói' AS VariantName, 75000 AS Price, 40 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Miếng dán cường lực chống nhìn trộm góc nghiêng 28 độ bảo mật' AS ProductName, 'S01-H1-CK-004-BAN-TRONG-HD' AS SKU, 'Bản Trong HD' AS VariantName, 86000 AS Price, 40 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Ốp lưng silicon dẻo lót nhung mềm chống trầy cho Xiaomi 13' AS ProductName, 'S01-H1-CK-005-XANH-REU' AS SKU, 'Xanh Rêu' AS VariantName, 55000 AS Price, 50 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Ốp lưng silicon dẻo lót nhung mềm chống trầy cho Xiaomi 13' AS ProductName, 'S01-H1-CK-005-EN-NHAM' AS SKU, 'Đen Nhám' AS VariantName, 63000 AS Price, 50 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Bộ kính cường lực bảo vệ cụm camera hợp kim titan nguyên khối' AS ProductName, 'S01-H1-CK-006-MAU-TITAN-TU-N-V1' AS SKU, 'Màu Titan Tự Nhiên' AS VariantName, 85000 AS Price, 20 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Bộ kính cường lực bảo vệ cụm camera hợp kim titan nguyên khối' AS ProductName, 'S01-H1-CK-006-MAU-XAM-AM' AS SKU, 'Màu Xám Đậm' AS VariantName, 98000 AS Price, 20 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Ốp lưng từ tính hỗ trợ sạc MagSafe lực hút mạnh viền màu thời trang' AS ProductName, 'S01-H1-CK-007-VIEN-XANH-TITAN' AS SKU, 'Viền Xanh Titan' AS VariantName, 115000 AS Price, 55 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Ốp lưng từ tính hỗ trợ sạc MagSafe lực hút mạnh viền màu thời trang' AS ProductName, 'S01-H1-CK-007-VIEN-TIM-AM' AS SKU, 'Viền Tím Đậm' AS VariantName, 132000 AS Price, 55 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Miếng dán film PPF tự phục hồi vết xước nhẹ toàn diện mặt lưng' AS ProductName, 'S01-H1-CK-008-MAT-LUNG-NHAM' AS SKU, 'Mặt Lưng Nhám' AS VariantName, 39000 AS Price, 15 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Miếng dán film PPF tự phục hồi vết xước nhẹ toàn diện mặt lưng' AS ProductName, 'S01-H1-CK-008-MAT-LUNG-TRONG' AS SKU, 'Mặt Lưng Trong' AS VariantName, 45000 AS Price, 15 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Ốp lưng viền kim loại mặt lưng kính cường lực cho Galaxy Z Flip' AS ProductName, 'S01-H1-CK-009-VIEN-VANG-KIM' AS SKU, 'Viền Vàng Kim' AS VariantName, 145000 AS Price, 55 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Ốp lưng viền kim loại mặt lưng kính cường lực cho Galaxy Z Flip' AS ProductName, 'S01-H1-CK-009-VIEN-EN-NHAM' AS SKU, 'Viền Đen Nhám' AS VariantName, 167000 AS Price, 55 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Kính cường lực nhám mờ chuyên chơi game chống mồ hôi tay cực nhạy' AS ProductName, 'S01-H1-CK-010-BAN-MO-CHONG-V-V1' AS SKU, 'Bản Mờ Chống Vân Tay' AS VariantName, 55000 AS Price, 35 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Ốp lưng chống sốc tổ ong tản nhiệt hỗ trợ chân đế dựng máy' AS ProductName, 'S01-H1-CK-011-EN-VIEN-O' AS SKU, 'Đen Viền Đỏ' AS VariantName, 85000 AS Price, 65 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Ốp lưng chống sốc tổ ong tản nhiệt hỗ trợ chân đế dựng máy' AS ProductName, 'S01-H1-CK-011-XANH-REU-AM' AS SKU, 'Xanh Rêu Đậm' AS VariantName, 98000 AS Price, 65 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Miếng dán skin vân da 3M dán lưng điện thoại chống trơn trượt' AS ProductName, 'S01-H1-CK-012-VAN-DA-EN' AS SKU, 'Vân Da Đen' AS VariantName, 45000 AS Price, 20 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Miếng dán skin vân da 3M dán lưng điện thoại chống trơn trượt' AS ProductName, 'S01-H1-CK-012-VAN-DA-NAU-BO' AS SKU, 'Vân Da Nâu Bò' AS VariantName, 52000 AS Price, 20 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Ốp lưng dạ quang phát sáng trong bóng tối họa tiết vũ trụ' AS ProductName, 'S01-H1-CK-013-HOA-TIET-HANH-V1' AS SKU, 'Họa Tiết Hành Tinh' AS VariantName, 69000 AS Price, 48 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Ốp lưng dạ quang phát sáng trong bóng tối họa tiết vũ trụ' AS ProductName, 'S01-H1-CK-013-HOA-TIET-PHI-H-V2' AS SKU, 'Họa Tiết Phi Hành Gia' AS VariantName, 79000 AS Price, 48 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Kính cường lực dẻo nano gốm ceramic không bao giờ bể mép' AS ProductName, 'S01-H1-CK-014-BAN-FULL-MAN-H-V1' AS SKU, 'Bản Full Màn Hình Đen' AS VariantName, 42000 AS Price, 25 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Ốp lưng dây đeo chéo thời trang đính charm hạt cườm handmade' AS ProductName, 'S01-H1-CK-015-DAY-CAU-VONG' AS SKU, 'Dây Cầu Vồng' AS VariantName, 95000 AS Price, 70 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Ốp lưng dây đeo chéo thời trang đính charm hạt cườm handmade' AS ProductName, 'S01-H1-CK-015-DAY-TRANG-EN' AS SKU, 'Dây Trắng Đen' AS VariantName, 109000 AS Price, 70 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Củ sạc nhanh GaN 30W chuẩn PD cổng Type-C siêu nhỏ gọn bỏ túi' AS ProductName, 'S01-H2-NC-001-MAU-TRANG-CHAN-V1' AS SKU, 'Màu Trắng Chân Tròn' AS VariantName, 185000 AS Price, 55 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Củ sạc nhanh GaN 30W chuẩn PD cổng Type-C siêu nhỏ gọn bỏ túi' AS ProductName, 'S01-H2-NC-001-MAU-EN-CHAN-TRON' AS SKU, 'Màu Đen Chân Tròn' AS VariantName, 213000 AS Price, 55 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Cáp sạc Type-C sang Lightning bọc dù Kevlar siêu bền dài 1.2m' AS ProductName, 'S01-H2-NC-002-EN-1-2M' AS SKU, 'Đen 1.2m' AS VariantName, 95000 AS Price, 45 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Cáp sạc Type-C sang Lightning bọc dù Kevlar siêu bền dài 1.2m' AS ProductName, 'S01-H2-NC-002-XAM-2M' AS SKU, 'Xám 2m' AS VariantName, 109000 AS Price, 45 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Pin sạc dự phòng 10000mAh tích hợp màn hình LED báo phần trăm pin' AS ProductName, 'S01-H2-NC-003-TRANG-SUA-1000-V1' AS SKU, 'Trắng Sữa 10000mAh' AS VariantName, 250000 AS Price, 220 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Pin sạc dự phòng 10000mAh tích hợp màn hình LED báo phần trăm pin' AS ProductName, 'S01-H2-NC-003-EN-NHAM-10000MAH' AS SKU, 'Đen Nhám 10000mAh' AS VariantName, 288000 AS Price, 220 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Cáp sạc đa năng 3 đầu Type-C Lightning Micro USB dây rút chống rối' AS ProductName, 'S01-H2-NC-004-O-O' AS SKU, 'Đỏ Đô' AS VariantName, 65000 AS Price, 60 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Cáp sạc đa năng 3 đầu Type-C Lightning Micro USB dây rút chống rối' AS ProductName, 'S01-H2-NC-004-EN' AS SKU, 'Đen' AS VariantName, 75000 AS Price, 60 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Củ sạc nhanh 65W 3 cổng 2C1A cho cả điện thoại và laptop văn phòng' AS ProductName, 'S01-H2-NC-005-EN-CHAN-GAP' AS SKU, 'Đen Chân Gập' AS VariantName, 380000 AS Price, 145 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Củ sạc nhanh 65W 3 cổng 2C1A cho cả điện thoại và laptop văn phòng' AS ProductName, 'S01-H2-NC-005-TRANG-CHAN-GAP' AS SKU, 'Trắng Chân Gập' AS VariantName, 437000 AS Price, 145 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Pin dự phòng hít từ tính không dây 5000mAh siêu mỏng nhẹ cho iPhone' AS ProductName, 'S01-H2-NC-006-XANH-MINT' AS SKU, 'Xanh Mint' AS VariantName, 295000 AS Price, 135 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Pin dự phòng hít từ tính không dây 5000mAh siêu mỏng nhẹ cho iPhone' AS ProductName, 'S01-H2-NC-006-XAM-BAC' AS SKU, 'Xám Bạc' AS VariantName, 339000 AS Price, 135 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Cáp sạc Type-C to Type-C 100W có chip E-Marker ổn định dòng sạc' AS ProductName, 'S01-H2-NC-007-DAI-1-5M' AS SKU, 'Dài 1.5m' AS VariantName, 110000 AS Price, 50 AS WeightGrams, 0 AS IsActive UNION ALL
    SELECT 'Cáp sạc Type-C to Type-C 100W có chip E-Marker ổn định dòng sạc' AS ProductName, 'S01-H2-NC-007-DAI-2M' AS SKU, 'Dài 2m' AS VariantName, 126000 AS Price, 50 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Tẩu sạc nhanh ô tô 45W vỏ hợp kim kẽm tản nhiệt nhanh 2 cổng sạc' AS ProductName, 'S01-H2-NC-008-MAU-BAC' AS SKU, 'Màu Bạc' AS VariantName, 125000 AS Price, 40 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Tẩu sạc nhanh ô tô 45W vỏ hợp kim kẽm tản nhiệt nhanh 2 cổng sạc' AS ProductName, 'S01-H2-NC-008-MAU-XAM-CHI' AS SKU, 'Màu Xám Chì' AS VariantName, 144000 AS Price, 40 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Đế sạc không dây chuẩn Qi 15W mặt kính cường lực sang trọng' AS ProductName, 'S01-H2-NC-009-MAT-KINH-EN' AS SKU, 'Mặt Kính Đen' AS VariantName, 160000 AS Price, 85 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Đế sạc không dây chuẩn Qi 15W mặt kính cường lực sang trọng' AS ProductName, 'S01-H2-NC-009-MAT-KINH-TRANG' AS SKU, 'Mặt Kính Trắng' AS VariantName, 184000 AS Price, 85 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Pin sạc dự phòng dung lượng khủng 20000mAh sạc nhanh 65W 2 chiều' AS ProductName, 'S01-H2-NC-010-EN-NHAM-20000MAH' AS SKU, 'Đen Nhám 20000mAh' AS VariantName, 590000 AS Price, 430 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Cáp sạc tự ngắt thông minh Type-C có đèn LED báo sạc đầy pin' AS ProductName, 'S01-H2-NC-011-EN-DAI-1M' AS SKU, 'Đen Dài 1m' AS VariantName, 75000 AS Price, 45 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Cáp sạc tự ngắt thông minh Type-C có đèn LED báo sạc đầy pin' AS ProductName, 'S01-H2-NC-011-EN-DAI-2M' AS SKU, 'Đen Dài 2m' AS VariantName, 86000 AS Price, 45 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Bộ sạc du lịch đa quốc gia All-in-one có 4 đầu cắm chuyển đổi' AS ProductName, 'S01-H2-NC-012-TRANG-DU-LICH' AS SKU, 'Trắng Du Lịch' AS VariantName, 210000 AS Price, 130 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Cáp sạc nam châm hít xoay 540 độ hỗ trợ chơi game không cấn tay' AS ProductName, 'S01-H2-NC-013-KEM-AU-TYPE-C' AS SKU, 'Kèm Đầu Type-C' AS VariantName, 55000 AS Price, 40 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Cáp sạc nam châm hít xoay 540 độ hỗ trợ chơi game không cấn tay' AS ProductName, 'S01-H2-NC-013-KEM-AU-LIGHTNING' AS SKU, 'Kèm Đầu Lightning' AS VariantName, 63000 AS Price, 40 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Đầu chuyển đổi âm thanh Type-C sang jack tai nghe 3.5mm có DAC' AS ProductName, 'S01-H2-NC-014-VO-NHOM-XAM' AS SKU, 'Vỏ Nhôm Xám' AS VariantName, 65000 AS Price, 15 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Dây quấn silicon bảo vệ đầu cáp sạc chống gãy nứt hình thú cưng' AS ProductName, 'S01-H2-NC-015-SET-4-CON-THU' AS SKU, 'Set 4 Con Thú' AS VariantName, 15000 AS Price, 20 AS WeightGrams, 1 AS IsActive
) v
JOIN Sellers sel ON sel.TaxCode = '0109988001'
JOIN Shops sh ON sh.SellerId = sel.SellerId
JOIN Products p ON p.ShopId = sh.ShopId AND p.ProductName = v.ProductName
ON DUPLICATE KEY UPDATE Price = v.Price, IsActive = v.IsActive;

-- --- Biến thể sản phẩm của Seller: Hộ kinh doanh Hải Long Computer ---
INSERT INTO ProductVariants (ProductId, SKU, VariantName, Price, WeightGrams, IsActive)
SELECT p.ProductId, v.SKU, v.VariantName, v.Price, v.WeightGrams, v.IsActive
FROM (
    SELECT 'Bàn phím cơ không dây TKL 87 phím Hotswap đèn nền RGB đổi màu' AS ProductName, 'S02-H1-GG-001-RED-SWITCH-EN' AS SKU, 'Red Switch Đen' AS VariantName, 750000 AS Price, 850 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Bàn phím cơ không dây TKL 87 phím Hotswap đèn nền RGB đổi màu' AS ProductName, 'S02-H1-GG-001-BROWN-SWITCH-EN' AS SKU, 'Brown Switch Đen' AS VariantName, 862000 AS Price, 850 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Bàn phím cơ không dây TKL 87 phím Hotswap đèn nền RGB đổi màu' AS ProductName, 'S02-H1-GG-001-BLUE-SWITCH-TR-V3' AS SKU, 'Blue Switch Trắng' AS VariantName, 975000 AS Price, 850 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Chuột gaming siêu nhẹ 59g mắt đọc quang học 26000DPI chính xác' AS ProductName, 'S02-H1-GG-002-EN-NHAM' AS SKU, 'Đen Nhám' AS VariantName, 680000 AS Price, 60 AS WeightGrams, 0 AS IsActive UNION ALL
    SELECT 'Chuột gaming siêu nhẹ 59g mắt đọc quang học 26000DPI chính xác' AS ProductName, 'S02-H1-GG-002-TRANG-SUA' AS SKU, 'Trắng Sữa' AS VariantName, 782000 AS Price, 60 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Lót chuột gaming cỡ lớn 900x400mm viền LED RGB chống trượt bàn' AS ProductName, 'S02-H1-GG-003-BAN-O-THE-GIOI' AS SKU, 'Bản Đồ Thế Giới' AS VariantName, 180000 AS Price, 450 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Lót chuột gaming cỡ lớn 900x400mm viền LED RGB chống trượt bàn' AS ProductName, 'S02-H1-GG-003-EN-TOI-GIAN' AS SKU, 'Đen Tối Giản' AS VariantName, 207000 AS Price, 450 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Tai nghe gaming chụp tai giả lập 7.1 có micro lọc tiếng ồn linh hoạt' AS ProductName, 'S02-H1-GG-004-EN-EN-LED-O' AS SKU, 'Đen Đèn LED Đỏ' AS VariantName, 420000 AS Price, 350 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Tai nghe gaming chụp tai giả lập 7.1 có micro lọc tiếng ồn linh hoạt' AS ProductName, 'S02-H1-GG-004-TRANG-EN-LED-X-V2' AS SKU, 'Trắng Đèn LED Xanh' AS VariantName, 483000 AS Price, 350 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Bộ nút phím Keycap PBT Doubleshot profile Cherry 128 phím dày dặn' AS ProductName, 'S02-H1-GG-005-PHOI-MAU-RETRO' AS SKU, 'Phối Màu Retro' AS VariantName, 320000 AS Price, 280 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Bộ nút phím Keycap PBT Doubleshot profile Cherry 128 phím dày dặn' AS ProductName, 'S02-H1-GG-005-PHOI-MAU-MATCH-V2' AS SKU, 'Phối Màu Matcha Xanh' AS VariantName, 368000 AS Price, 280 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Chuột văn phòng không dây kết nối Dual Mode Bluetooth & 2.4G Silent' AS ProductName, 'S02-H1-GG-006-MAU-XAM-CHI' AS SKU, 'Màu Xám Chì' AS VariantName, 160000 AS Price, 75 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Chuột văn phòng không dây kết nối Dual Mode Bluetooth & 2.4G Silent' AS ProductName, 'S02-H1-GG-006-MAU-XANH-PASTEL' AS SKU, 'Màu Xanh Pastel' AS VariantName, 184000 AS Price, 75 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Kê tay bàn phím bằng gỗ óc chó tự nhiên vát góc công thái học mỏi' AS ProductName, 'S02-H1-GG-007-SIZE-87-PHIM-TKL' AS SKU, 'Size 87 Phím (TKL)' AS VariantName, 145000 AS Price, 320 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Kê tay bàn phím bằng gỗ óc chó tự nhiên vát góc công thái học mỏi' AS ProductName, 'S02-H1-GG-007-SIZE-104-PHIM-V2' AS SKU, 'Size 104 Phím (Fullsize)' AS VariantName, 167000 AS Price, 320 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Tay cầm chơi game không dây rung kép hỗ trợ PC và điện thoại mượt mà' AS ProductName, 'S02-H1-GG-008-MAU-TRANG-BANG-V1' AS SKU, 'Màu Trắng Băng Tuyết' AS VariantName, 490000 AS Price, 230 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Tay cầm chơi game không dây rung kép hỗ trợ PC và điện thoại mượt mà' AS ProductName, 'S02-H1-GG-008-MAU-EN-NHAM' AS SKU, 'Màu Đen Nhám' AS VariantName, 564000 AS Price, 230 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Bàn phím cơ mini 68 phím Bluetooth 3 chế độ kết nối đa thiết bị' AS ProductName, 'S02-H1-GG-009-LINEAR-EN' AS SKU, 'Linear Đen' AS VariantName, 590000 AS Price, 620 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Bàn phím cơ mini 68 phím Bluetooth 3 chế độ kết nối đa thiết bị' AS ProductName, 'S02-H1-GG-009-LINEAR-TRANG' AS SKU, 'Linear Trắng' AS VariantName, 678000 AS Price, 620 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Chuột công thái học dạng đứng dọc bảo vệ hội chứng ống cổ tay' AS ProductName, 'S02-H1-GG-010-EN-KHONG-DAY' AS SKU, 'Đen Không Dây' AS VariantName, 280000 AS Price, 110 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Bộ 45 switch bàn phím cơ Linear âm trầm bôi trơn sẵn mượt mà' AS ProductName, 'S02-H1-GG-011-SWITCH-45G' AS SKU, 'Switch 45g' AS VariantName, 225000 AS Price, 120 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Bộ 45 switch bàn phím cơ Linear âm trầm bôi trơn sẵn mượt mà' AS ProductName, 'S02-H1-GG-011-SWITCH-55G' AS SKU, 'Switch 55g' AS VariantName, 259000 AS Price, 120 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Giá treo tai nghe gaming kim loại hợp kim nhôm để bàn chắc chắn' AS ProductName, 'S02-H1-GG-012-MAU-BAC' AS SKU, 'Màu Bạc' AS VariantName, 135000 AS Price, 210 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Giá treo tai nghe gaming kim loại hợp kim nhôm để bàn chắc chắn' AS ProductName, 'S02-H1-GG-012-MAU-EN' AS SKU, 'Màu Đen' AS VariantName, 155000 AS Price, 210 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Dụng cụ nhổ keycap và nhổ switch 2 trong 1 bằng thép không gỉ' AS ProductName, 'S02-H1-GG-013-THEP-KHONG-GI' AS SKU, 'Thép Không Gỉ' AS VariantName, 35000 AS Price, 25 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Tấm che bụi bàn phím cơ bằng mica acrylic trong suốt chống nước' AS ProductName, 'S02-H1-GG-014-SIZE-TKL-87' AS SKU, 'Size TKL 87' AS VariantName, 75000 AS Price, 180 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Tấm che bụi bàn phím cơ bằng mica acrylic trong suốt chống nước' AS ProductName, 'S02-H1-GG-014-SIZE-FULL-104' AS SKU, 'Size Full 104' AS VariantName, 86000 AS Price, 180 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Bàn di chuột nỉ cao cấp phủ chống thấm nước kích thước 80x30cm' AS ProductName, 'S02-H1-GG-015-XAM-AM' AS SKU, 'Xám Đậm' AS VariantName, 95000 AS Price, 180 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Bàn di chuột nỉ cao cấp phủ chống thấm nước kích thước 80x30cm' AS ProductName, 'S02-H1-GG-015-XAM-NHAT' AS SKU, 'Xám Nhạt' AS VariantName, 109000 AS Price, 180 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Balo laptop công sở 15.6 inch vải Oxford chống thấm nước cao cấp' AS ProductName, 'S02-H2-LP-001-EN-CHONG-NUOC' AS SKU, 'Đen Chống Nước' AS VariantName, 380000 AS Price, 750 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Balo laptop công sở 15.6 inch vải Oxford chống thấm nước cao cấp' AS ProductName, 'S02-H2-LP-001-XAM-GHI' AS SKU, 'Xám Ghi' AS VariantName, 437000 AS Price, 750 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Túi chống sốc laptop nỉ nhung cao cấp có tay xách ẩn tiện lợi gọn' AS ProductName, 'S02-H2-LP-002-SIZE-13-3-14-I-V1' AS SKU, 'Size 13.3 - 14 inch' AS VariantName, 185000 AS Price, 320 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Túi chống sốc laptop nỉ nhung cao cấp có tay xách ẩn tiện lợi gọn' AS ProductName, 'S02-H2-LP-002-SIZE-15-6-INCH' AS SKU, 'Size 15.6 inch' AS VariantName, 213000 AS Price, 320 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Đế tản nhiệt laptop 6 quạt gió tốc độ cao màn hình LCD chỉnh tốc gió' AS ProductName, 'S02-H2-LP-003-LED-XANH-DUONG' AS SKU, 'Led Xanh Dương' AS VariantName, 290000 AS Price, 780 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Đế tản nhiệt laptop 6 quạt gió tốc độ cao màn hình LCD chỉnh tốc gió' AS ProductName, 'S02-H2-LP-003-LED-O' AS SKU, 'Led Đỏ' AS VariantName, 334000 AS Price, 780 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Giá đỡ laptop hợp kim nhôm nâng hạ 6 nấc gập gọn bỏ túi xách' AS ProductName, 'S02-H2-LP-004-BAC-NHOM' AS SKU, 'Bạc Nhôm' AS VariantName, 195000 AS Price, 260 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Giá đỡ laptop hợp kim nhôm nâng hạ 6 nấc gập gọn bỏ túi xách' AS ProductName, 'S02-H2-LP-004-XAM-SPACE' AS SKU, 'Xám Space' AS VariantName, 224000 AS Price, 260 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Miếng dán bảo vệ mặt lưng và bàn phím laptop vân nhôm xước sang' AS ProductName, 'S02-H2-LP-005-VAN-NHOM-XUOC-V1' AS SKU, 'Vân Nhôm Xước Bạc' AS VariantName, 90000 AS Price, 50 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Miếng dán bảo vệ mặt lưng và bàn phím laptop vân nhôm xước sang' AS ProductName, 'S02-H2-LP-005-VAN-CARBON-EN' AS SKU, 'Vân Carbon Đen' AS VariantName, 103000 AS Price, 50 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Quạt hút nhiệt laptop gắn khe gió cạnh sườn cảm biến nhiệt độ tự động' AS ProductName, 'S02-H2-LP-006-BAN-TU-ONG-IEU-V1' AS SKU, 'Bản Tự Động Điều Tốc' AS VariantName, 175000 AS Price, 180 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Bàn kê đùi làm việc với laptop có đệm nệm êm ái chống nóng đùi' AS ProductName, 'S02-H2-LP-007-VAN-GO-SOI-SANG' AS SKU, 'Vân Gỗ Sồi Sáng' AS VariantName, 260000 AS Price, 950 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Bàn kê đùi làm việc với laptop có đệm nệm êm ái chống nóng đùi' AS ProductName, 'S02-H2-LP-007-VAN-GO-OC-CHO' AS SKU, 'Vân Gỗ Óc Chó' AS VariantName, 299000 AS Price, 950 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Bộ vệ sinh laptop và tai nghe đa năng 7 trong 1 tiện dụng để bàn' AS ProductName, 'S02-H2-LP-008-HOP-TRANG-HONG' AS SKU, 'Hộp Trắng Hồng' AS VariantName, 65000 AS Price, 110 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Bộ vệ sinh laptop và tai nghe đa năng 7 trong 1 tiện dụng để bàn' AS ProductName, 'S02-H2-LP-008-HOP-TRANG-XANH' AS SKU, 'Hộp Trắng Xanh' AS VariantName, 75000 AS Price, 110 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Phủ phím silicon siêu mỏng chống nước chống bụi cho bàn phím laptop' AS ProductName, 'S02-H2-LP-009-TRONG-SUOT-PHO-V1' AS SKU, 'Trong Suốt Phổ Thông' AS VariantName, 45000 AS Price, 30 AS WeightGrams, 0 AS IsActive UNION ALL
    SELECT 'Dây khóa số chống trộm laptop bằng thép bọc nhựa dài 1.8m an toàn' AS ProductName, 'S02-H2-LP-010-DAI-1-8M-KHOA-SO' AS SKU, 'Dài 1.8m Khóa Số' AS VariantName, 85000 AS Price, 140 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Túi đựng củ sạc chuột và phụ kiện công nghệ chống sốc 2 ngăn' AS ProductName, 'S02-H2-LP-011-XAM-BAC' AS SKU, 'Xám Bạc' AS VariantName, 89000 AS Price, 120 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Túi đựng củ sạc chuột và phụ kiện công nghệ chống sốc 2 ngăn' AS ProductName, 'S02-H2-LP-011-XANH-NAVY' AS SKU, 'Xanh Navy' AS VariantName, 102000 AS Price, 120 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Chân đế cao su tự dính nâng nghiêng tản nhiệt góc bàn laptop' AS ProductName, 'S02-H2-LP-012-BO-NHO-2-CAI' AS SKU, 'Bộ Nhỏ 2 Cái' AS VariantName, 39000 AS Price, 40 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Chân đế cao su tự dính nâng nghiêng tản nhiệt góc bàn laptop' AS ProductName, 'S02-H2-LP-012-BO-LON-2-CAI' AS SKU, 'Bộ Lớn 2 Cái' AS VariantName, 45000 AS Price, 40 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Tấm lót chuột kiêm sạc không dây 15W trên bàn làm việc bọc da PU' AS ProductName, 'S02-H2-LP-013-MAU-NAU-TAY' AS SKU, 'Màu Nâu Tây' AS VariantName, 195000 AS Price, 320 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Tấm lót chuột kiêm sạc không dây 15W trên bàn làm việc bọc da PU' AS ProductName, 'S02-H2-LP-013-MAU-EN' AS SKU, 'Màu Đen' AS VariantName, 224000 AS Price, 320 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Túi xách công sở đựng laptop da PU chống nước quai đeo có đệm' AS ProductName, 'S02-H2-LP-014-NAU-CA-PHE' AS SKU, 'Nâu Cà Phê' AS VariantName, 340000 AS Price, 680 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Túi xách công sở đựng laptop da PU chống nước quai đeo có đệm' AS ProductName, 'S02-H2-LP-014-EN-LICH-LAM' AS SKU, 'Đen Lịch Lãm' AS VariantName, 391000 AS Price, 680 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Miếng đệm kê tay di chuột silicon công thái học chống chai cổ tay' AS ProductName, 'S02-H2-LP-015-MAU-EN' AS SKU, 'Màu Đen' AS VariantName, 45000 AS Price, 95 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Miếng đệm kê tay di chuột silicon công thái học chống chai cổ tay' AS ProductName, 'S02-H2-LP-015-MAU-XANH-CO-VIT' AS SKU, 'Màu Xanh Cổ Vịt' AS VariantName, 52000 AS Price, 95 AS WeightGrams, 1 AS IsActive
) v
JOIN Sellers sel ON sel.TaxCode = '0109988002'
JOIN Shops sh ON sh.SellerId = sel.SellerId
JOIN Products p ON p.ShopId = sh.ShopId AND p.ProductName = v.ProductName
ON DUPLICATE KEY UPDATE Price = v.Price, IsActive = v.IsActive;

-- --- Biến thể sản phẩm của Seller: Công ty TNHH Thời Trang Hoa Mai ---
INSERT INTO ProductVariants (ProductId, SKU, VariantName, Price, WeightGrams, IsActive)
SELECT p.ProductId, v.SKU, v.VariantName, v.Price, v.WeightGrams, v.IsActive
FROM (
    SELECT 'Áo sơ mi nam dài tay vải sợi tre tự nhiên chống nhăn tuyệt đối dáng' AS ProductName, 'S03-H1-MN-001-TRANG-SOI-TRE-V1' AS SKU, 'Trắng Sợi Tre Size M' AS VariantName, 280000 AS Price, 220 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Áo sơ mi nam dài tay vải sợi tre tự nhiên chống nhăn tuyệt đối dáng' AS ProductName, 'S03-H1-MN-001-TRANG-SOI-TRE-V2' AS SKU, 'Trắng Sợi Tre Size L' AS VariantName, 322000 AS Price, 220 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Áo sơ mi nam dài tay vải sợi tre tự nhiên chống nhăn tuyệt đối dáng' AS ProductName, 'S03-H1-MN-001-XANH-NHAT-SIZE-L' AS SKU, 'Xanh Nhạt Size L' AS VariantName, 364000 AS Price, 220 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Áo thun nam cổ tròn cotton 100% định lượng 250gsm dày dặn đứng phom' AS ProductName, 'S03-H1-MN-002-EN-SIZE-M' AS SKU, 'Đen Size M' AS VariantName, 145000 AS Price, 250 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Áo thun nam cổ tròn cotton 100% định lượng 250gsm dày dặn đứng phom' AS ProductName, 'S03-H1-MN-002-EN-SIZE-L' AS SKU, 'Đen Size L' AS VariantName, 167000 AS Price, 250 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Áo thun nam cổ tròn cotton 100% định lượng 250gsm dày dặn đứng phom' AS ProductName, 'S03-H1-MN-002-TRANG-SIZE-L' AS SKU, 'Trắng Size L' AS VariantName, 188000 AS Price, 250 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Áo polo nam phối bo cổ dệt tổ ong thoáng khí co giãn 4 chiều mềm' AS ProductName, 'S03-H1-MN-003-XANH-NAVY-SIZE-M' AS SKU, 'Xanh Navy Size M' AS VariantName, 195000 AS Price, 230 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Áo polo nam phối bo cổ dệt tổ ong thoáng khí co giãn 4 chiều mềm' AS ProductName, 'S03-H1-MN-003-XANH-NAVY-SIZE-L' AS SKU, 'Xanh Navy Size L' AS VariantName, 224000 AS Price, 230 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Áo polo nam phối bo cổ dệt tổ ong thoáng khí co giãn 4 chiều mềm' AS ProductName, 'S03-H1-MN-003-XAM-SIZE-L' AS SKU, 'Xám Size L' AS VariantName, 254000 AS Price, 230 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Áo sơ mi nam ngắn tay họa tiết kẻ caro năng động trẻ trung ngày hè' AS ProductName, 'S03-H1-MN-004-CARO-XANH-SIZE-M' AS SKU, 'Caro Xanh Size M' AS VariantName, 220000 AS Price, 190 AS WeightGrams, 0 AS IsActive UNION ALL
    SELECT 'Áo sơ mi nam ngắn tay họa tiết kẻ caro năng động trẻ trung ngày hè' AS ProductName, 'S03-H1-MN-004-CARO-XAM-SIZE-L' AS SKU, 'Caro Xám Size L' AS VariantName, 253000 AS Price, 190 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Áo thun nam tay lỡ form rộng phong cách đường phố Unisex thoải mái' AS ProductName, 'S03-H1-MN-005-EN-OVERSIZE' AS SKU, 'Đen Oversize' AS VariantName, 135000 AS Price, 260 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Áo thun nam tay lỡ form rộng phong cách đường phố Unisex thoải mái' AS ProductName, 'S03-H1-MN-005-TRANG-OVERSIZE' AS SKU, 'Trắng Oversize' AS VariantName, 155000 AS Price, 260 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Áo sơ mi nam cổ trụ chất liệu đũi linen tự nhiên mộc mạc thoáng mát' AS ProductName, 'S03-H1-MN-006-TRANG-KEM-SIZE-L' AS SKU, 'Trắng Kem Size L' AS VariantName, 265000 AS Price, 200 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Áo sơ mi nam cổ trụ chất liệu đũi linen tự nhiên mộc mạc thoáng mát' AS ProductName, 'S03-H1-MN-006-XANH-REU-SIZE-L' AS SKU, 'Xanh Rêu Size L' AS VariantName, 305000 AS Price, 200 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Áo polo nam trơn phong cách tối giản công nghệ dệt không đường may mép' AS ProductName, 'S03-H1-MN-007-EN-SIZE-L' AS SKU, 'Đen Size L' AS VariantName, 185000 AS Price, 220 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Áo polo nam trơn phong cách tối giản công nghệ dệt không đường may mép' AS ProductName, 'S03-H1-MN-007-BE-SIZE-L' AS SKU, 'Be Size L' AS VariantName, 213000 AS Price, 220 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Áo thun nam có cổ dệt jacquard vân chìm sang trọng đi tiệc tối' AS ProductName, 'S03-H1-MN-008-EN-DET-VAN' AS SKU, 'Đen Dệt Vân' AS VariantName, 240000 AS Price, 240 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Áo thun nam có cổ dệt jacquard vân chìm sang trọng đi tiệc tối' AS ProductName, 'S03-H1-MN-008-XANH-DET-VAN' AS SKU, 'Xanh Dệt Vân' AS VariantName, 276000 AS Price, 240 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Áo khoác gió nam thể thao lót lưới cản gió đi phượt nhẹ nhàng' AS ProductName, 'S03-H1-MN-009-EN-PHOI-XAM-L' AS SKU, 'Đen Phối Xám L' AS VariantName, 230000 AS Price, 310 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Áo khoác gió nam thể thao lót lưới cản gió đi phượt nhẹ nhàng' AS ProductName, 'S03-H1-MN-009-XANH-REU-SIZE-L' AS SKU, 'Xanh Rêu Size L' AS VariantName, 264000 AS Price, 310 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Áo sơ mi nam oxford cổ bẻ cài cúc button-down phong cách học đường' AS ProductName, 'S03-H1-MN-010-XANH-DA-TROI-S-V1' AS SKU, 'Xanh Da Trời Size L' AS VariantName, 270000 AS Price, 240 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Áo sơ mi nam oxford cổ bẻ cài cúc button-down phong cách học đường' AS ProductName, 'S03-H1-MN-010-TRANG-SIZE-L' AS SKU, 'Trắng Size L' AS VariantName, 310000 AS Price, 240 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Áo ba lỗ thể thao nam thun lạnh tập gym co giãn đa chiều' AS ProductName, 'S03-H1-MN-011-EN-SIZE-L' AS SKU, 'Đen Size L' AS VariantName, 89000 AS Price, 130 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Áo ba lỗ thể thao nam thun lạnh tập gym co giãn đa chiều' AS ProductName, 'S03-H1-MN-011-XAM-SIZE-L' AS SKU, 'Xám Size L' AS VariantName, 102000 AS Price, 130 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Áo thun polo nam phối sọc ngang ngực trẻ trung năng động' AS ProductName, 'S03-H1-MN-012-TRANG-SOC-XANH-V1' AS SKU, 'Trắng Sọc Xanh Size L' AS VariantName, 190000 AS Price, 230 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Áo thun polo nam phối sọc ngang ngực trẻ trung năng động' AS ProductName, 'S03-H1-MN-012-EN-SOC-TRANG-S-V2' AS SKU, 'Đen Sọc Trắng Size L' AS VariantName, 218000 AS Price, 230 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Áo sơ mi lụa nam tay dài họa tiết baroque phong cách thời thượng' AS ProductName, 'S03-H1-MN-013-HOA-TIET-EN-VA-V1' AS SKU, 'Họa Tiết Đen Vàng Size L' AS VariantName, 295000 AS Price, 180 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Áo thun nam cổ tim chữ V tôn nét nam tính vải modal gỗ sồi' AS ProductName, 'S03-H1-MN-014-TRANG-SIZE-L' AS SKU, 'Trắng Size L' AS VariantName, 155000 AS Price, 210 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Áo thun nam cổ tim chữ V tôn nét nam tính vải modal gỗ sồi' AS ProductName, 'S03-H1-MN-014-EN-SIZE-L' AS SKU, 'Đen Size L' AS VariantName, 178000 AS Price, 210 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Áo khoác cardigan len mỏng nam cổ tim cài cúc thời trang mùa thu' AS ProductName, 'S03-H1-MN-015-NAU-BE-SIZE-L' AS SKU, 'Nâu Be Size L' AS VariantName, 260000 AS Price, 380 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Áo khoác cardigan len mỏng nam cổ tim cài cúc thời trang mùa thu' AS ProductName, 'S03-H1-MN-015-XAM-AM-SIZE-L' AS SKU, 'Xám Đậm Size L' AS VariantName, 299000 AS Price, 380 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Đầm xòe hoa nhí cổ vuông tay phồng dáng dài qua gối nữ tính' AS ProductName, 'S03-H2-LD-001-HOA-NHI-VANG-S-V1' AS SKU, 'Hoa Nhí Vàng Size S' AS VariantName, 320000 AS Price, 280 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Đầm xòe hoa nhí cổ vuông tay phồng dáng dài qua gối nữ tính' AS ProductName, 'S03-H2-LD-001-HOA-NHI-VANG-S-V2' AS SKU, 'Hoa Nhí Vàng Size M' AS VariantName, 368000 AS Price, 280 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Đầm xòe hoa nhí cổ vuông tay phồng dáng dài qua gối nữ tính' AS ProductName, 'S03-H2-LD-001-HOA-NHI-XANH-S-V3' AS SKU, 'Hoa Nhí Xanh Size M' AS VariantName, 416000 AS Price, 280 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Áo sơ mi lụa tơ tằm cổ thắt nơ thanh lịch cho quý cô công sở nhẹ' AS ProductName, 'S03-H2-LD-002-TRANG-KEM-SIZE-S' AS SKU, 'Trắng Kem Size S' AS VariantName, 275000 AS Price, 160 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Áo sơ mi lụa tơ tằm cổ thắt nơ thanh lịch cho quý cô công sở nhẹ' AS ProductName, 'S03-H2-LD-002-TRANG-KEM-SIZE-M' AS SKU, 'Trắng Kem Size M' AS VariantName, 316000 AS Price, 160 AS WeightGrams, 0 AS IsActive UNION ALL
    SELECT 'Áo sơ mi lụa tơ tằm cổ thắt nơ thanh lịch cho quý cô công sở nhẹ' AS ProductName, 'S03-H2-LD-002-HONG-PASTEL-SI-V3' AS SKU, 'Hồng Pastel Size M' AS VariantName, 358000 AS Price, 160 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Chân váy chữ A dáng dài lưng cao xẻ tà trước quyến rũ bước đi' AS ProductName, 'S03-H2-LD-003-EN-SIZE-S' AS SKU, 'Đen Size S' AS VariantName, 195000 AS Price, 240 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Chân váy chữ A dáng dài lưng cao xẻ tà trước quyến rũ bước đi' AS ProductName, 'S03-H2-LD-003-EN-SIZE-M' AS SKU, 'Đen Size M' AS VariantName, 224000 AS Price, 240 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Chân váy chữ A dáng dài lưng cao xẻ tà trước quyến rũ bước đi' AS ProductName, 'S03-H2-LD-003-NAU-TAY-SIZE-M' AS SKU, 'Nâu Tây Size M' AS VariantName, 254000 AS Price, 240 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Váy suông cổ tròn đính cúc ngọc trai nhân tạo chất tuyết mưa sang' AS ProductName, 'S03-H2-LD-004-EN-SIZE-M' AS SKU, 'Đen Size M' AS VariantName, 290000 AS Price, 300 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Váy suông cổ tròn đính cúc ngọc trai nhân tạo chất tuyết mưa sang' AS ProductName, 'S03-H2-LD-004-XANH-COM-SIZE-M' AS SKU, 'Xanh Cốm Size M' AS VariantName, 334000 AS Price, 300 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Áo kiểu nữ trễ vai bo thun chun ngực bánh bèo tiểu thư điệu đà' AS ProductName, 'S03-H2-LD-005-TRANG-FREESIZE' AS SKU, 'Trắng Freesize' AS VariantName, 165000 AS Price, 150 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Áo kiểu nữ trễ vai bo thun chun ngực bánh bèo tiểu thư điệu đà' AS ProductName, 'S03-H2-LD-005-HONG-FREESIZE' AS SKU, 'Hồng Freesize' AS VariantName, 190000 AS Price, 150 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Set bộ công sở gồm áo vest cộc tay phối chân váy xếp ly đi làm' AS ProductName, 'S03-H2-LD-006-XAM-KHOI-SIZE-S' AS SKU, 'Xám Khói Size S' AS VariantName, 450000 AS Price, 450 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Set bộ công sở gồm áo vest cộc tay phối chân váy xếp ly đi làm' AS ProductName, 'S03-H2-LD-006-XAM-KHOI-SIZE-M' AS SKU, 'Xám Khói Size M' AS VariantName, 517000 AS Price, 450 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Đầm suông linen thêu hoa thủ công phong cách mộc mạc du lịch' AS ProductName, 'S03-H2-LD-007-TRANG-THEU-HOA' AS SKU, 'Trắng Thêu Hoa' AS VariantName, 340000 AS Price, 270 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Đầm suông linen thêu hoa thủ công phong cách mộc mạc du lịch' AS ProductName, 'S03-H2-LD-007-VANG-MU-TAT' AS SKU, 'Vàng Mù Tạt' AS VariantName, 391000 AS Price, 270 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Chân váy xếp ly nhỏ dáng xòe dài lưng thun co giãn thanh lịch nhẹ' AS ProductName, 'S03-H2-LD-008-EN-FREESIZE' AS SKU, 'Đen Freesize' AS VariantName, 185000 AS Price, 250 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Chân váy xếp ly nhỏ dáng xòe dài lưng thun co giãn thanh lịch nhẹ' AS ProductName, 'S03-H2-LD-008-BE-NUDE-FREESIZE' AS SKU, 'Be Nude Freesize' AS VariantName, 213000 AS Price, 250 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Đầm ôm body cổ yếm quyến rũ tôn dáng dự tiệc dạ hội' AS ProductName, 'S03-H2-LD-009-EN-HUYEN-BI-SI-V1' AS SKU, 'Đen Huyền Bí Size S' AS VariantName, 280000 AS Price, 260 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Đầm ôm body cổ yếm quyến rũ tôn dáng dự tiệc dạ hội' AS ProductName, 'S03-H2-LD-009-O-RUOU-SIZE-M' AS SKU, 'Đỏ Rượu Size M' AS VariantName, 322000 AS Price, 260 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Áo kiểu tay bồng cổ tim phối ren hoa cúc nhã nhặn' AS ProductName, 'S03-H2-LD-010-TRANG-KEM' AS SKU, 'Trắng Kem' AS VariantName, 175000 AS Price, 140 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Áo kiểu tay bồng cổ tim phối ren hoa cúc nhã nhặn' AS ProductName, 'S03-H2-LD-010-HONG-PHAN' AS SKU, 'Hồng Phấn' AS VariantName, 201000 AS Price, 140 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Quần tây ống rộng lưng cao hack dáng tôn chân dài cho nữ' AS ProductName, 'S03-H2-LD-011-EN-SIZE-S' AS SKU, 'Đen Size S' AS VariantName, 220000 AS Price, 320 AS WeightGrams, 0 AS IsActive UNION ALL
    SELECT 'Quần tây ống rộng lưng cao hack dáng tôn chân dài cho nữ' AS ProductName, 'S03-H2-LD-011-EN-SIZE-M' AS SKU, 'Đen Size M' AS VariantName, 253000 AS Price, 320 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Quần tây ống rộng lưng cao hack dáng tôn chân dài cho nữ' AS ProductName, 'S03-H2-LD-011-KEM-SIZE-M' AS SKU, 'Kem Size M' AS VariantName, 286000 AS Price, 320 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Áo khoác blazer nữ 1 lớp phom rộng phong cách Hàn Quốc' AS ProductName, 'S03-H2-LD-012-NAU-TAY-SIZE-M' AS SKU, 'Nâu Tây Size M' AS VariantName, 310000 AS Price, 420 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Áo khoác blazer nữ 1 lớp phom rộng phong cách Hàn Quốc' AS ProductName, 'S03-H2-LD-012-EN-SIZE-M' AS SKU, 'Đen Size M' AS VariantName, 356000 AS Price, 420 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Đầm sơ mi thắt đai eo dáng xòe nhẹ công sở thanh nhã' AS ProductName, 'S03-H2-LD-013-XANH-PASTEL-SI-V1' AS SKU, 'Xanh Pastel Size M' AS VariantName, 295000 AS Price, 290 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Đầm sơ mi thắt đai eo dáng xòe nhẹ công sở thanh nhã' AS ProductName, 'S03-H2-LD-013-TRANG-SIZE-M' AS SKU, 'Trắng Size M' AS VariantName, 339000 AS Price, 290 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Chân váy đuôi cá vạt chéo phối bèo nhún tôn vòng 3' AS ProductName, 'S03-H2-LD-014-EN-SIZE-S' AS SKU, 'Đen Size S' AS VariantName, 190000 AS Price, 260 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Chân váy đuôi cá vạt chéo phối bèo nhún tôn vòng 3' AS ProductName, 'S03-H2-LD-014-EN-SIZE-M' AS SKU, 'Đen Size M' AS VariantName, 218000 AS Price, 260 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Áo len tăm cổ lọ 3 phân mỏng nhẹ giữ ấm mùa thu đông' AS ProductName, 'S03-H2-LD-015-TRANG-KEM' AS SKU, 'Trắng Kem' AS VariantName, 135000 AS Price, 210 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Áo len tăm cổ lọ 3 phân mỏng nhẹ giữ ấm mùa thu đông' AS ProductName, 'S03-H2-LD-015-EN' AS SKU, 'Đen' AS VariantName, 155000 AS Price, 210 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Áo len tăm cổ lọ 3 phân mỏng nhẹ giữ ấm mùa thu đông' AS ProductName, 'S03-H2-LD-015-NAU-TAY' AS SKU, 'Nâu Tây' AS VariantName, 176000 AS Price, 210 AS WeightGrams, 1 AS IsActive
) v
JOIN Sellers sel ON sel.TaxCode = '0109988003'
JOIN Shops sh ON sh.SellerId = sel.SellerId
JOIN Products p ON p.ShopId = sh.ShopId AND p.ProductName = v.ProductName
ON DUPLICATE KEY UPDATE Price = v.Price, IsActive = v.IsActive;

-- --- Biến thể sản phẩm của Seller: Công ty TNHH Gia Bảo Lifestyle ---
INSERT INTO ProductVariants (ProductId, SKU, VariantName, Price, WeightGrams, IsActive)
SELECT p.ProductId, v.SKU, v.VariantName, v.Price, v.WeightGrams, v.IsActive
FROM (
    SELECT 'Bộ dao làm bếp 6 món thép không gỉ nguyên khối phủ đá chống dính bếp' AS ProductName, 'S04-H1-KC-001-BO-EN-CAN-VAN-A' AS SKU, 'Bộ Đen Cán Vân Đá' AS VariantName, 380000 AS Price, 1200 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Bộ dao làm bếp 6 món thép không gỉ nguyên khối phủ đá chống dính bếp' AS ProductName, 'S04-H1-KC-001-BO-THEP-SANG' AS SKU, 'Bộ Thép Sáng' AS VariantName, 437000 AS Price, 1200 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Chảo chống dính đá hoa cương đáy từ sâu lòng 26cm đúc nguyên khối bền' AS ProductName, 'S04-H1-KC-002-SIZE-26CM-TAY-V1' AS SKU, 'Size 26cm Tay Cầm Gỗ' AS VariantName, 265000 AS Price, 950 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Chảo chống dính đá hoa cương đáy từ sâu lòng 26cm đúc nguyên khối bền' AS ProductName, 'S04-H1-KC-002-SIZE-28CM-TAY-V2' AS SKU, 'Size 28cm Tay Cầm Gỗ' AS VariantName, 305000 AS Price, 950 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Thớt kháng khuẩn inox 304 kết hợp nhựa lúa mạch 2 mặt tiện dụng thái' AS ProductName, 'S04-H1-KC-003-SIZE-LON-40X28-V1' AS SKU, 'Size Lớn 40x28cm Viền Cao Su' AS VariantName, 145000 AS Price, 680 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Bộ 3 hộp thủy tinh chịu nhiệt Borosilicate chia ngăn lò vi sóng nắp kín' AS ProductName, 'S04-H1-KC-004-BO-3-HOP-CHU-N-V1' AS SKU, 'Bộ 3 Hộp Chữ Nhật 1000ml' AS VariantName, 175000 AS Price, 1400 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Bộ 3 hộp thủy tinh chịu nhiệt Borosilicate chia ngăn lò vi sóng nắp kín' AS ProductName, 'S04-H1-KC-004-BO-3-HOP-TRON-V2' AS SKU, 'Bộ 3 Hộp Tròn 850ml' AS VariantName, 201000 AS Price, 1400 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Rổ quay rau và vắt ráo nước ly tâm tiện lợi có khóa gạt xoay nhẹ' AS ProductName, 'S04-H1-KC-005-DUNG-TICH-4-5L-V1' AS SKU, 'Dung Tích 4.5L Màu Trắng Xanh' AS VariantName, 125000 AS Price, 450 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Nồi inox 3 đáy nắp kính cường lực cao cấp dùng cho mọi loại bếp từ gas' AS ProductName, 'S04-H1-KC-006-UONG-KINH-20CM' AS SKU, 'Đường Kính 20cm' AS VariantName, 310000 AS Price, 1100 AS WeightGrams, 0 AS IsActive UNION ALL
    SELECT 'Nồi inox 3 đáy nắp kính cường lực cao cấp dùng cho mọi loại bếp từ gas' AS ProductName, 'S04-H1-KC-006-UONG-KINH-24CM' AS SKU, 'Đường Kính 24cm' AS VariantName, 356000 AS Price, 1100 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Kéo cắt gà và thực phẩm đa năng lưỡi răng cưa có chốt an toàn trợ lực' AS ProductName, 'S04-H1-KC-007-CAN-BOC-SILICO-V1' AS SKU, 'Cán Bọc Silicon Đen Đỏ' AS VariantName, 85000 AS Price, 190 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Kệ gia vị 2 tầng để bàn bếp thép carbon sơn tĩnh điện chống rỉ sét' AS ProductName, 'S04-H1-KC-008-KE-2-TANG-EN-N-V1' AS SKU, 'Kệ 2 Tầng Đen Nhám' AS VariantName, 195000 AS Price, 1600 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Kệ gia vị 2 tầng để bàn bếp thép carbon sơn tĩnh điện chống rỉ sét' AS ProductName, 'S04-H1-KC-008-KE-3-TANG-EN-N-V2' AS SKU, 'Kệ 3 Tầng Đen Nhám' AS VariantName, 224000 AS Price, 1600 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Nồi áp suất cơ nấu bếp từ đáy 3 lớp hầm thịt ninh xương nhanh' AS ProductName, 'S04-H1-KC-009-DUNG-TICH-4L' AS SKU, 'Dung Tích 4L' AS VariantName, 420000 AS Price, 2400 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Nồi áp suất cơ nấu bếp từ đáy 3 lớp hầm thịt ninh xương nhanh' AS ProductName, 'S04-H1-KC-009-DUNG-TICH-6L' AS SKU, 'Dung Tích 6L' AS VariantName, 483000 AS Price, 2400 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Bộ 5 muôi thìa nấu ăn bằng gỗ tự nhiên không làm trầy chảo chống dính' AS ProductName, 'S04-H1-KC-010-BO-5-MON-KEM-G-V1' AS SKU, 'Bộ 5 Món Kèm Giá Cắm' AS VariantName, 95000 AS Price, 380 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Bộ cối chày đá tự nhiên giã cua đâm tỏi ớt nhuyễn mịn' AS ProductName, 'S04-H1-KC-011-UONG-KINH-14CM' AS SKU, 'Đường Kính 14cm' AS VariantName, 135000 AS Price, 2800 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Bình xịt dầu ăn phun sương thủy tinh kiểm soát lượng dầu ăn kiêng' AS ProductName, 'S04-H1-KC-012-DUNG-TICH-200M-V1' AS SKU, 'Dung Tích 200ml Nắp Bạc' AS VariantName, 45000 AS Price, 210 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Bình xịt dầu ăn phun sương thủy tinh kiểm soát lượng dầu ăn kiêng' AS ProductName, 'S04-H1-KC-012-DUNG-TICH-200M-V2' AS SKU, 'Dung Tích 200ml Nắp Vàng' AS VariantName, 52000 AS Price, 210 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Dụng cụ nạo gọt vỏ củ quả lưỡi gốm ceramic siêu sắc bén' AS ProductName, 'S04-H1-KC-013-LUOI-GOM-MAU-X-V1' AS SKU, 'Lưỡi Gốm Màu Xanh' AS VariantName, 25000 AS Price, 35 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Dụng cụ nạo gọt vỏ củ quả lưỡi gốm ceramic siêu sắc bén' AS ProductName, 'S04-H1-KC-013-LUOI-GOM-MAU-H-V2' AS SKU, 'Lưỡi Gốm Màu Hồng' AS VariantName, 29000 AS Price, 35 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Khay đá silicon có nắp đậy dẻo dai lấy đá viên dễ dàng một chạm' AS ProductName, 'S04-H1-KC-014-KHAY-36-VIEN-M-V1' AS SKU, 'Khay 36 Viên Màu Xanh' AS VariantName, 38000 AS Price, 140 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Khay đá silicon có nắp đậy dẻo dai lấy đá viên dễ dàng một chạm' AS ProductName, 'S04-H1-KC-014-KHAY-36-VIEN-M-V2' AS SKU, 'Khay 36 Viên Màu Vàng' AS VariantName, 44000 AS Price, 140 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Rổ inox gác bồn rửa bát co giãn tùy chỉnh kích thước đa năng' AS ProductName, 'S04-H1-KC-015-INOX-304-CO-KH-V1' AS SKU, 'Inox 304 Có Khóa Ốc' AS VariantName, 65000 AS Price, 360 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Set ga gối cotton lụa phong cách Hàn Quốc 4 món dệt mật độ cao mát' AS ProductName, 'S04-H2-BD-001-BO-1M6X2M-KEM-V1' AS SKU, 'Bộ 1m6x2m Kèm Vỏ Chăn' AS VariantName, 390000 AS Price, 1500 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Set ga gối cotton lụa phong cách Hàn Quốc 4 món dệt mật độ cao mát' AS ProductName, 'S04-H2-BD-001-BO-1M8X2M-KEM-V2' AS SKU, 'Bộ 1m8x2m Kèm Vỏ Chăn' AS VariantName, 448000 AS Price, 1500 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Gối ngủ cao su non công thái học định hình cổ chống đau vai gáy êm' AS ProductName, 'S04-H2-BD-002-XANH-DUONG-NHAT' AS SKU, 'Xanh Dương Nhạt' AS VariantName, 230000 AS Price, 950 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Gối ngủ cao su non công thái học định hình cổ chống đau vai gáy êm' AS ProductName, 'S04-H2-BD-002-XAM-GHI' AS SKU, 'Xám Ghi' AS VariantName, 264000 AS Price, 950 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Ruột chăn hè thu lông vũ nhân tạo micro polyester siêu nhẹ kháng ẩm tốt' AS ProductName, 'S04-H2-BD-003-KICH-THUOC-2MX-V1' AS SKU, 'Kích Thước 2mx2m2' AS VariantName, 290000 AS Price, 1400 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Đệm topper làm mềm nệm dày 7cm bông xơ siêu mịn xuất khẩu êm ái' AS ProductName, 'S04-H2-BD-004-SIZE-1M6X2M-MA-V1' AS SKU, 'Size 1m6x2m Màu Xám' AS VariantName, 450000 AS Price, 3200 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Đệm topper làm mềm nệm dày 7cm bông xơ siêu mịn xuất khẩu êm ái' AS ProductName, 'S04-H2-BD-004-SIZE-1M8X2M-MA-V2' AS SKU, 'Size 1m8x2m Màu Xám' AS VariantName, 517000 AS Price, 3200 AS WeightGrams, 0 AS IsActive UNION ALL
    SELECT 'Chiếu điều hòa mủ cao su non tự nhiên làm mát dịu nhẹ mùa hè phòng ngủ' AS ProductName, 'S04-H2-BD-005-SET-CHIEU-GA-1-V1' AS SKU, 'Set Chiếu Ga 1m6x2m' AS VariantName, 320000 AS Price, 1800 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Chiếu điều hòa mủ cao su non tự nhiên làm mát dịu nhẹ mùa hè phòng ngủ' AS ProductName, 'S04-H2-BD-005-SET-CHIEU-GA-1-V2' AS SKU, 'Set Chiếu Ga 1m8x2m' AS VariantName, 368000 AS Price, 1800 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Vỏ gối ôm cotton trơn màu cao cấp khóa kéo giọt lệ ẩn tinh tế phòng' AS ProductName, 'S04-H2-BD-006-MAU-XANH-NAVY-V1' AS SKU, 'Màu Xanh Navy 35x100cm' AS VariantName, 65000 AS Price, 150 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Vỏ gối ôm cotton trơn màu cao cấp khóa kéo giọt lệ ẩn tinh tế phòng' AS ProductName, 'S04-H2-BD-006-MAU-BE-35X100CM' AS SKU, 'Màu Be 35x100cm' AS VariantName, 75000 AS Price, 150 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Màn chụp tự bung gấp gọn thông minh chống muỗi khung thép dẻo bền' AS ProductName, 'S04-H2-BD-007-MAN-OI-1M8X2M' AS SKU, 'Màn Đôi 1m8x2m' AS VariantName, 175000 AS Price, 1100 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Màn chụp tự bung gấp gọn thông minh chống muỗi khung thép dẻo bền' AS ProductName, 'S04-H2-BD-007-MAN-ON-1M2X2M' AS SKU, 'Màn Đơn 1m2x2m' AS VariantName, 201000 AS Price, 1100 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Chăn lông tuyết văn phòng mềm mại ấm áp tiện ngủ trưa gấp gọn nhẹ' AS ProductName, 'S04-H2-BD-008-MAU-XAM-LONG-C-V1' AS SKU, 'Màu Xám Lông Chuột 1m5x2m' AS VariantName, 160000 AS Price, 800 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Chăn lông tuyết văn phòng mềm mại ấm áp tiện ngủ trưa gấp gọn nhẹ' AS ProductName, 'S04-H2-BD-008-MAU-HONG-KHOI-V2' AS SKU, 'Màu Hồng Khói 1m5x2m' AS VariantName, 184000 AS Price, 800 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Ruột gối đầu bông gòn hạt bi nhân tạo êm ái chống xẹp lún' AS ProductName, 'S04-H2-BD-009-KICH-THUOC-45X-V1' AS SKU, 'Kích Thước 45x65cm' AS VariantName, 75000 AS Price, 750 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Ruột gối đầu bông gòn hạt bi nhân tạo êm ái chống xẹp lún' AS ProductName, 'S04-H2-BD-009-KICH-THUOC-50X-V2' AS SKU, 'Kích Thước 50x70cm' AS VariantName, 86000 AS Price, 750 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Tấm bảo vệ nệm chống thấm nước 100% bọc xung quanh viền nệm' AS ProductName, 'S04-H2-BD-010-SIZE-1M6X2M-TR-V1' AS SKU, 'Size 1m6x2m Trắng' AS VariantName, 135000 AS Price, 620 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Tấm bảo vệ nệm chống thấm nước 100% bọc xung quanh viền nệm' AS ProductName, 'S04-H2-BD-010-SIZE-1M8X2M-TR-V2' AS SKU, 'Size 1m8x2m Trắng' AS VariantName, 155000 AS Price, 620 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Bộ ga chun bọc đệm vải thun lạnh trơn màu phong cách tối giản' AS ProductName, 'S04-H2-BD-011-1M6X2M-XANH-THAN' AS SKU, '1m6x2m Xanh Than' AS VariantName, 120000 AS Price, 580 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Bộ ga chun bọc đệm vải thun lạnh trơn màu phong cách tối giản' AS ProductName, 'S04-H2-BD-011-1M8X2M-XANH-THAN' AS SKU, '1m8x2m Xanh Than' AS VariantName, 138000 AS Price, 580 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Gối tựa lưng kê gối văn phòng hình hoa cúc nhồi bông êm ái' AS ProductName, 'S04-H2-BD-012-UONG-KINH-50CM-V1' AS SKU, 'Đường Kính 50cm Vàng Trắng' AS VariantName, 95000 AS Price, 450 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Gối tựa lưng kê gối văn phòng hình hoa cúc nhồi bông êm ái' AS ProductName, 'S04-H2-BD-012-UONG-KINH-50CM-V2' AS SKU, 'Đường Kính 50cm Hồng Trắng' AS VariantName, 109000 AS Price, 450 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Vỏ chăn lồng ruột kéo khóa cotton sọc kẻ tăm dệt chìm sang trọng' AS ProductName, 'S04-H2-BD-013-KICH-THUOC-2MX-V1' AS SKU, 'Kích Thước 2mx2m2 Kẻ Xám' AS VariantName, 210000 AS Price, 850 AS WeightGrams, 0 AS IsActive UNION ALL
    SELECT 'Vỏ chăn lồng ruột kéo khóa cotton sọc kẻ tăm dệt chìm sang trọng' AS ProductName, 'S04-H2-BD-013-KICH-THUOC-2MX-V2' AS SKU, 'Kích Thước 2mx2m2 Kẻ Xanh' AS VariantName, 241000 AS Price, 850 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Gối kê chân chống giãn tĩnh mạch dốc nghiêng cao su non định hình' AS ProductName, 'S04-H2-BD-014-VO-VAI-NHUNG-XAM' AS SKU, 'Vỏ Vải Nhung Xám' AS VariantName, 240000 AS Price, 1100 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Đèn ngủ cắm tường cảm ứng ánh sáng tự động bật khi trời tối' AS ProductName, 'S04-H2-BD-015-ANH-SANG-VANG-V1' AS SKU, 'Ánh Sáng Vàng Đui Cắm' AS VariantName, 29000 AS Price, 50 AS WeightGrams, 1 AS IsActive
) v
JOIN Sellers sel ON sel.TaxCode = '0109988004'
JOIN Shops sh ON sh.SellerId = sel.SellerId
JOIN Products p ON p.ShopId = sh.ShopId AND p.ProductName = v.ProductName
ON DUPLICATE KEY UPDATE Price = v.Price, IsActive = v.IsActive;

-- --- Biến thể sản phẩm của Seller: Mỹ Linh Beauty ---
INSERT INTO ProductVariants (ProductId, SKU, VariantName, Price, WeightGrams, IsActive)
SELECT p.ProductId, v.SKU, v.VariantName, v.Price, v.WeightGrams, v.IsActive
FROM (
    SELECT 'Sữa rửa mặt tạo bọt dịu nhẹ tràm trà và BHA ngừa mụn 150ml sạch' AS ProductName, 'S05-H1-SK-001-CHAI-BOM-150ML' AS SKU, 'Chai Bơm 150ml' AS VariantName, 135000 AS Price, 180 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Serum cấp ẩm phục hồi da Hyaluronic Acid & Vitamin B5 30ml thấm' AS ProductName, 'S05-H1-SK-002-CHAI-30ML-CO-O-V1' AS SKU, 'Chai 30ml Có Ống Nhỏ' AS VariantName, 220000 AS Price, 110 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Serum cấp ẩm phục hồi da Hyaluronic Acid & Vitamin B5 30ml thấm' AS ProductName, 'S05-H1-SK-002-CHAI-50ML-TIET-V2' AS SKU, 'Chai 50ml Tiết Kiệm' AS VariantName, 253000 AS Price, 110 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Kem chống nắng nâng tone kiềm dầu SPF50+ PA++++ dung tích 50ml mịn' AS ProductName, 'S05-H1-SK-003-TUYP-50ML' AS SKU, 'Tuýp 50ml' AS VariantName, 195000 AS Price, 75 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Nước hoa hồng cân bằng da chiết xuất cánh hoa cúc làm dịu da 200ml tươi' AS ProductName, 'S05-H1-SK-004-CHAI-200ML' AS SKU, 'Chai 200ml' AS VariantName, 160000 AS Price, 240 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Nước tẩy trang công nghệ Micellar không cồn dịu nhẹ cho mắt môi 400ml sâu' AS ProductName, 'S05-H1-SK-005-CHAI-LON-400ML-V1' AS SKU, 'Chai Lớn 400ml Tiết Kiệm' AS VariantName, 145000 AS Price, 450 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Kem dưỡng ẩm khóa ẩm phục hồi Ceramide và rau má hũ 50g mềm mại' AS ProductName, 'S05-H1-SK-006-HU-THUY-TINH-50G' AS SKU, 'Hũ Thủy Tinh 50g' AS VariantName, 240000 AS Price, 120 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Hộp 10 mặt nạ giấy dưỡng trắng sáng da chiết xuất ngọc trai biển sâu mát' AS ProductName, 'S05-H1-SK-007-HOP-10-MIENG-M-V1' AS SKU, 'Hộp 10 Miếng Mặt Nạ' AS VariantName, 95000 AS Price, 280 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Gel tẩy tế bào chết da mặt dịu nhẹ chiết xuất enzyme đu đủ và táo xanh sạch' AS ProductName, 'S05-H1-SK-008-TUYP-120ML' AS SKU, 'Tuýp 120ml' AS VariantName, 110000 AS Price, 140 AS WeightGrams, 0 AS IsActive UNION ALL
    SELECT 'Kem dưỡng mắt giảm quầng thâm và bọng mắt đầu lăn kim loại mát lạnh' AS ProductName, 'S05-H1-SK-009-TUYP-15ML-AU-LAN' AS SKU, 'Tuýp 15ml Đầu Lăn' AS VariantName, 185000 AS Price, 45 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Xịt khoáng cấp ẩm tức thì từ nguồn suối khoáng núi lửa Pháp 150ml' AS ProductName, 'S05-H1-SK-010-CHAI-XIT-150ML' AS SKU, 'Chai Xịt 150ml' AS VariantName, 95000 AS Price, 210 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Xịt khoáng cấp ẩm tức thì từ nguồn suối khoáng núi lửa Pháp 150ml' AS ProductName, 'S05-H1-SK-010-CHAI-XIT-300ML' AS SKU, 'Chai Xịt 300ml' AS VariantName, 109000 AS Price, 210 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Dầu tẩy trang nhũ hóa sạch sâu tinh dầu cám gạo tự nhiên 150ml' AS ProductName, 'S05-H1-SK-011-CHAI-150ML-VOI-V1' AS SKU, 'Chai 150ml Vòi Nhấn' AS VariantName, 175000 AS Price, 190 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Serum tinh chất Vitamin C 15% làm sáng da mờ thâm mụn dưỡng ẩm' AS ProductName, 'S05-H1-SK-012-CHAI-20ML-THUY-V1' AS SKU, 'Chai 20ml Thủy Tinh Tối Màu' AS VariantName, 260000 AS Price, 95 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Mặt nạ đất sét tro núi lửa hút dầu thu nhỏ lỗ chân lông hũ 100g' AS ProductName, 'S05-H1-SK-013-HU-100G-AT-SET' AS SKU, 'Hũ 100g Đất Sét' AS VariantName, 135000 AS Price, 160 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Gel chấm mụn cấp tốc gom cùi mụn viêm sưng tràm trà và kẽm 15g' AS ProductName, 'S05-H1-SK-014-TUYP-15G-CHAM-V1' AS SKU, 'Tuýp 15g Chấm Mụn' AS VariantName, 85000 AS Price, 30 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Xịt dưỡng ẩm khóa nền cấp nước khoáng hoa hồng chưng cất 100ml' AS ProductName, 'S05-H1-SK-015-CHAI-THUY-TINH-V1' AS SKU, 'Chai Thủy Tinh 100ml' AS VariantName, 110000 AS Price, 180 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Son kem lì mịn màng lâu trôi không khô môi tone đỏ gạch quyến rũ môi' AS ProductName, 'S05-H2-MK-001-MAU-01-O-GACH' AS SKU, 'Màu 01 Đỏ Gạch' AS VariantName, 165000 AS Price, 40 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Son kem lì mịn màng lâu trôi không khô môi tone đỏ gạch quyến rũ môi' AS ProductName, 'S05-H2-MK-001-MAU-02-CAM-CHAY' AS SKU, 'Màu 02 Cam Cháy' AS VariantName, 190000 AS Price, 40 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Son kem lì mịn màng lâu trôi không khô môi tone đỏ gạch quyến rũ môi' AS ProductName, 'S05-H2-MK-001-MAU-03-HONG-AT' AS SKU, 'Màu 03 Hồng Đất' AS VariantName, 214000 AS Price, 40 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Phấn nước cushion kiềm dầu che khuyết điểm chống nắng hoàn hảo tự nhiên' AS ProductName, 'S05-H2-MK-002-TONE-21-SANG-T-V1' AS SKU, 'Tone 21 Sáng Tự Nhiên' AS VariantName, 245000 AS Price, 130 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Phấn nước cushion kiềm dầu che khuyết điểm chống nắng hoàn hảo tự nhiên' AS ProductName, 'S05-H2-MK-002-TONE-23-DA-TU-V2' AS SKU, 'Tone 23 Da Tự Nhiên' AS VariantName, 282000 AS Price, 130 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Mascara làm dài và tơi mi cong vút chống thấm nước suốt 24h không lem' AS ProductName, 'S05-H2-MK-003-AU-CO-SIEU-MAN-V1' AS SKU, 'Đầu Cọ Siêu Mảnh Màu Đen' AS VariantName, 120000 AS Price, 35 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Bảng phấn mắt 9 ô tone cam đào ấm áp kết hợp nhũ mịn bắt sáng tiệc' AS ProductName, 'S05-H2-MK-004-TONE-01-CAM-AO-V1' AS SKU, 'Tone 01 Cam Đào Rực Rỡ' AS VariantName, 140000 AS Price, 85 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Bảng phấn mắt 9 ô tone cam đào ấm áp kết hợp nhũ mịn bắt sáng tiệc' AS ProductName, 'S05-H2-MK-004-TONE-02-NAU-TR-V2' AS SKU, 'Tone 02 Nâu Trầm Khói' AS VariantName, 161000 AS Price, 85 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Bút kẻ mắt nước dạ nét siêu mảnh 0.01mm mực ra đều không đứt đoạn kẻ' AS ProductName, 'S05-H2-MK-005-MAU-EN-TUYEN-C-V1' AS SKU, 'Màu Đen Tuyền Cá Tính' AS VariantName, 85000 AS Price, 25 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Bút kẻ mắt nước dạ nét siêu mảnh 0.01mm mực ra đều không đứt đoạn kẻ' AS ProductName, 'S05-H2-MK-005-MAU-NAU-AM-TU-V2' AS SKU, 'Màu Nâu Đậm Tự Nhiên' AS VariantName, 98000 AS Price, 25 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Chì kẻ mày định hình 2 đầu dạng vát kèm đầu chải tán mày tự nhiên mềm' AS ProductName, 'S05-H2-MK-006-MAU-NAU-TU-NHIEN' AS SKU, 'Màu Nâu Tự Nhiên' AS VariantName, 65000 AS Price, 20 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Chì kẻ mày định hình 2 đầu dạng vát kèm đầu chải tán mày tự nhiên mềm' AS ProductName, 'S05-H2-MK-006-MAU-NAU-EN' AS SKU, 'Màu Nâu Đen' AS VariantName, 75000 AS Price, 20 AS WeightGrams, 0 AS IsActive UNION ALL
    SELECT 'Phấn phủ dạng bột khoáng kiềm dầu trong suốt mịn màng khóa nền lâu' AS ProductName, 'S05-H2-MK-007-HOP-10G-KEM-BO-V1' AS SKU, 'Hộp 10g Kèm Bông Phấn' AS VariantName, 115000 AS Price, 60 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Xịt khóa nền cố định lớp trang điểm lâu trôi kiềm dầu vòi xịt phun sương mịn' AS ProductName, 'S05-H2-MK-008-CHAI-XIT-100ML' AS SKU, 'Chai Xịt 100ml' AS VariantName, 130000 AS Price, 140 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Son dưỡng môi có màu ửng hồng tự nhiên dầu hạt bơ và vitamin E' AS ProductName, 'S05-H2-MK-009-HONG-TU-NHIEN' AS SKU, 'Hồng Tự Nhiên' AS VariantName, 75000 AS Price, 25 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Son dưỡng môi có màu ửng hồng tự nhiên dầu hạt bơ và vitamin E' AS ProductName, 'S05-H2-MK-009-CAM-SAN-HO' AS SKU, 'Cam San Hô' AS VariantName, 86000 AS Price, 25 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Má hồng dạng kem lỏng tệp da tự nhiên bắt sáng trong veo' AS ProductName, 'S05-H2-MK-010-CAM-AO' AS SKU, 'Cam Đào' AS VariantName, 95000 AS Price, 40 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Má hồng dạng kem lỏng tệp da tự nhiên bắt sáng trong veo' AS ProductName, 'S05-H2-MK-010-HONG-BABY' AS SKU, 'Hồng Baby' AS VariantName, 109000 AS Price, 40 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Kem che khuyết điểm độ che phủ cao che quầng thâm và mụn đỏ' AS ProductName, 'S05-H2-MK-011-TONE-SANG-01' AS SKU, 'Tone Sáng 01' AS VariantName, 85000 AS Price, 35 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Kem che khuyết điểm độ che phủ cao che quầng thâm và mụn đỏ' AS ProductName, 'S05-H2-MK-011-TONE-TU-NHIEN-02' AS SKU, 'Tone Tự Nhiên 02' AS VariantName, 98000 AS Price, 35 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Bút tạo khối và bắt sáng 2 đầu thon gọn khuôn mặt chữ V-line' AS ProductName, 'S05-H2-MK-012-TONE-NAU-TU-NH-V1' AS SKU, 'Tone Nâu Tự Nhiên' AS VariantName, 69000 AS Price, 30 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Kẹp bấm mi lò xo góc rộng tạo độ cong tròn tự nhiên không gãy mi' AS ProductName, 'S05-H2-MK-013-KEP-BAM-MI-KEM-V1' AS SKU, 'Kẹp Bấm Mi Kèm 2 Đệm' AS VariantName, 35000 AS Price, 35 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Bút kẻ bọng mắt cười 2 đầu tạo mắt to tròn ngây thơ phong cách Hàn' AS ProductName, 'S05-H2-MK-014-NHU-NGOC-TRAI-V1' AS SKU, 'Nhũ Ngọc Trai Nâu' AS VariantName, 55000 AS Price, 20 AS WeightGrams, 1 AS IsActive UNION ALL
    SELECT 'Gel định hình lông mày trong suốt giữ nếp phẩy sợi tơi suốt ngày' AS ProductName, 'S05-H2-MK-015-GEL-TRONG-SUOT-V1' AS SKU, 'Gel Trong Suốt 8ml' AS VariantName, 48000 AS Price, 25 AS WeightGrams, 0 AS IsActive
) v
JOIN Sellers sel ON sel.TaxCode = '0109988005'
JOIN Shops sh ON sh.SellerId = sel.SellerId
JOIN Products p ON p.ShopId = sh.ShopId AND p.ProductName = v.ProductName
ON DUPLICATE KEY UPDATE Price = v.Price, IsActive = v.IsActive;

-- Khôi phục chế độ kiểm tra an toàn sau khi hoàn tất seed
SET SQL_SAFE_UPDATES = 1;
