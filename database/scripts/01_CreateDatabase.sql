/*
================================================================================
 Dự án      : E-Commerce Marketplace (đa người bán) + Warehouse Management
 Database   : ECommerceWarehouse
 Hệ quản trị: MySQL 8.0.16+ (bắt buộc >= 8.0.16 để CHECK constraint thật sự có hiệu lực)
 File       : 01_CreateDatabase.sql
 Mục đích   : Tạo database với bộ ký tự hỗ trợ tiếng Việt đầy đủ.

 THỨ TỰ CHẠY (bắt buộc):
   01_CreateDatabase.sql   -> tạo database
   02_CreateTables.sql     -> tạo bảng (kèm PK, UNIQUE, CHECK)
   03_CreateForeignKeys.sql-> tạo khóa ngoại
   04_CreateIndexes.sql    -> tạo chỉ mục truy vấn
   05_TriggersAndViews.sql -> trigger bảo vệ nghiệp vụ + view đối soát
   06_SeedData.sql         -> dữ liệu gốc (vai trò, hãng vận chuyển, kho sàn...)

 Cách chạy bằng dòng lệnh:
   mysql -u root -p < 01_CreateDatabase.sql
   mysql -u root -p ECommerceWarehouse < 02_CreateTables.sql
   ... (tương tự cho các file còn lại)
 Lưu ý: file 05 dùng DELIMITER nên chạy bằng mysql client hoặc MySQL Workbench
        (không chạy được qua một số công cụ chỉ nhận 1 câu lệnh mỗi lần).

 QUY ƯỚC CHUNG CỦA SCHEMA:
   - Engine InnoDB, charset utf8mb4, collation utf8mb4_unicode_ci (so sánh không phân biệt hoa thường).
   - Thời gian lưu theo UTC: DATETIME(3) mặc định UTC_TIMESTAMP(3).
     Cột UpdatedAt do tầng ứng dụng (EF Core) tự gán vì MySQL không hỗ trợ ON UPDATE UTC_TIMESTAMP.
   - Tiền tệ: DECIMAL(18,2).
   - Cột RowVersion (TIMESTAMP(6) ON UPDATE) dùng làm concurrency token cho EF Core (Pomelo: .IsRowVersion()).
   - Tên bảng/cột viết PascalCase. TRÊN LINUX tên bảng PHÂN BIỆT HOA THƯỜNG, hãy dùng đúng
     chữ hoa/thường như trong script (hoặc đặt lower_case_table_names=1 ngay khi khởi tạo server).
================================================================================
*/

CREATE DATABASE IF NOT EXISTS ECommerceWarehouse
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE ECommerceWarehouse;
