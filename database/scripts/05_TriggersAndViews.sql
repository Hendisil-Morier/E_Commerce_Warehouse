/*
================================================================================
 Dự án      : E-Commerce Marketplace (đa người bán) + Warehouse Management
 Database   : ECommerceWarehouse (MySQL 8.0.16+)
 File       : 05_TriggersAndViews.sql
 Mục đích   : (a) Trigger bảo vệ các quy tắc nghiệp vụ mà CHECK / FK không diễn đạt được
                  (ràng buộc chéo giữa nhiều bảng).
              (b) View phục vụ tồn khả dụng và đối soát tồn kho.
 Chạy sau   : 04_CreateIndexes.sql
 LƯU Ý     : File dùng DELIMITER -> chạy bằng mysql client / MySQL Workbench.

 DANH SÁCH MỤC:
   1. Sổ cái tồn kho chỉ-thêm (StockMovements)
   2. Ràng buộc chủ sở hữu kho - sản phẩm - đơn hàng (đa seller)
   3. Giữ chỗ tồn kho
   4. Điều chuyển kho
   5. Hoàn tiền, trả hàng, đánh giá
   6. View: tồn khả dụng & đối soát

 Mọi trigger báo lỗi bằng SIGNAL SQLSTATE '45000' (mã lỗi MySQL 1644) để tầng API bắt và đổi thành
 phản hồi nghiệp vụ. Các kiểm tra có thể bị race khi nhiều request đồng thời; service cần khóa dòng
 cha (SELECT ... FOR UPDATE) trong transaction ở những nghiệp vụ được ghi chú bên dưới.
================================================================================
*/

USE ECommerceWarehouse;

DELIMITER $$

-- ============================================================================
-- 1. SỔ CÁI TỒN KHO CHỈ-THÊM (STOCK MOVEMENTS)
-- ============================================================================

-- Sổ cái là bằng chứng kiểm toán: không cho sửa. Muốn đính chính phải ghi thêm bút toán đảo.
CREATE TRIGGER trg_StockMovements_BU
BEFORE UPDATE ON StockMovements
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'StockMovements chỉ được thêm mới, không được sửa. Hãy ghi bút toán đảo.';
END$$

-- Không cho xóa dòng sổ cái.
CREATE TRIGGER trg_StockMovements_BD
BEFORE DELETE ON StockMovements
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'StockMovements chỉ được thêm mới, không được xóa. Hãy ghi bút toán đảo.';
END$$


-- ============================================================================
-- 2. RÀNG BUỘC CHỦ SỞ HỮU KHO - SẢN PHẨM - ĐƠN HÀNG (ĐA SELLER)
-- ============================================================================

-- Kho riêng của seller (Warehouses.WarehouseType = 'Seller') chỉ được chứa hàng của chính seller đó.
-- Kho sàn (Platform) chứa hàng của nhiều seller nên không bị giới hạn.
CREATE TRIGGER trg_Inventory_BI
BEFORE INSERT ON Inventory
FOR EACH ROW
BEGIN
    DECLARE v_type   VARCHAR(20);
    DECLARE v_owner  BIGINT;
    DECLARE v_seller BIGINT;

    SELECT WarehouseType, OwnerSellerId INTO v_type, v_owner
    FROM Warehouses WHERE WarehouseId = NEW.WarehouseId;

    IF v_type = 'Seller' THEN
        SELECT s.SellerId INTO v_seller
        FROM ProductVariants pv
        JOIN Products p ON p.ProductId = pv.ProductId
        JOIN Shops s    ON s.ShopId = p.ShopId
        WHERE pv.VariantId = NEW.VariantId;

        IF v_seller IS NULL OR v_seller <> v_owner THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Kho của seller chỉ được chứa sản phẩm của chính seller đó.';
        END IF;
    END IF;
END$$

-- Kho phân bổ cho đơn seller phải là kho sàn hoặc kho thuộc đúng seller của đơn.
CREATE TRIGGER trg_SellerOrders_BI
BEFORE INSERT ON SellerOrders
FOR EACH ROW
BEGIN
    DECLARE v_type  VARCHAR(20);
    DECLARE v_owner BIGINT;

    IF NEW.WarehouseId IS NOT NULL THEN
        SELECT WarehouseType, OwnerSellerId INTO v_type, v_owner
        FROM Warehouses WHERE WarehouseId = NEW.WarehouseId;

        IF v_type = 'Seller' AND v_owner <> NEW.SellerId THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Đơn của seller chỉ được xuất từ kho sàn hoặc kho của chính seller đó.';
        END IF;
    END IF;
END$$

CREATE TRIGGER trg_SellerOrders_BU
BEFORE UPDATE ON SellerOrders
FOR EACH ROW
BEGIN
    DECLARE v_type  VARCHAR(20);
    DECLARE v_owner BIGINT;

    IF NEW.WarehouseId IS NOT NULL AND NOT (NEW.WarehouseId <=> OLD.WarehouseId) THEN
        SELECT WarehouseType, OwnerSellerId INTO v_type, v_owner
        FROM Warehouses WHERE WarehouseId = NEW.WarehouseId;

        IF v_type = 'Seller' AND v_owner <> NEW.SellerId THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Đơn của seller chỉ được xuất từ kho sàn hoặc kho của chính seller đó.';
        END IF;
    END IF;
END$$

-- Dòng hàng trong đơn seller phải là sản phẩm của đúng seller đó (không lẫn hàng seller khác).
CREATE TRIGGER trg_OrderItems_BI
BEFORE INSERT ON OrderItems
FOR EACH ROW
BEGIN
    DECLARE v_order_seller BIGINT;
    DECLARE v_item_seller  BIGINT;

    SELECT SellerId INTO v_order_seller FROM SellerOrders WHERE SellerOrderId = NEW.SellerOrderId;

    SELECT s.SellerId INTO v_item_seller
    FROM ProductVariants pv
    JOIN Products p ON p.ProductId = pv.ProductId
    JOIN Shops s    ON s.ShopId = p.ShopId
    WHERE pv.VariantId = NEW.VariantId;

    IF v_order_seller IS NULL OR v_item_seller IS NULL OR v_order_seller <> v_item_seller THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Biến thể không thuộc seller của đơn hàng này.';
    END IF;
END$$


-- ============================================================================
-- 3. GIỮ CHỖ TỒN KHO (STOCK RESERVATIONS)
-- ============================================================================

-- Giữ chỗ phải: đúng biến thể của dòng đơn, đúng kho đã phân bổ cho đơn seller,
-- và nằm ở vị trí bán được (không giữ hàng ở khu Inbound/Returns/Damaged).
-- (Việc có đủ tồn khả dụng do câu UPDATE nguyên tử trên Inventory + CK_Inventory_Qty bảo đảm.)
CREATE TRIGGER trg_StockReservations_BI
BEFORE INSERT ON StockReservations
FOR EACH ROW
BEGIN
    DECLARE v_item_variant BIGINT;
    DECLARE v_order_wh     BIGINT;
    DECLARE v_sellable     TINYINT;

    SELECT oi.VariantId, so.WarehouseId INTO v_item_variant, v_order_wh
    FROM OrderItems oi
    JOIN SellerOrders so ON so.SellerOrderId = oi.SellerOrderId
    WHERE oi.OrderItemId = NEW.OrderItemId;

    IF v_item_variant IS NULL OR v_item_variant <> NEW.VariantId THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Biến thể giữ chỗ không khớp dòng đơn hàng.';
    END IF;

    IF v_order_wh IS NULL OR v_order_wh <> NEW.WarehouseId THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Phải phân bổ kho cho đơn seller trước và giữ chỗ đúng kho đó.';
    END IF;

    SELECT IsSellable INTO v_sellable FROM WarehouseLocations WHERE LocationId = NEW.LocationId;
    IF IFNULL(v_sellable, 0) = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Không được giữ chỗ ở vị trí không bán được (Inbound/Returns/Damaged).';
    END IF;
END$$


-- ============================================================================
-- 4. ĐIỀU CHUYỂN KHO (STOCK TRANSFER DETAILS)
-- ============================================================================

-- Vị trí lấy hàng phải thuộc kho nguồn; vị trí cất hàng (nếu đã có) phải thuộc kho đích.
CREATE TRIGGER trg_StockTransferDetails_BI
BEFORE INSERT ON StockTransferDetails
FOR EACH ROW
BEGIN
    DECLARE v_src    BIGINT;
    DECLARE v_dst    BIGINT;
    DECLARE v_loc_wh BIGINT;

    SELECT SourceWarehouseId, DestinationWarehouseId INTO v_src, v_dst
    FROM StockTransfers WHERE TransferId = NEW.TransferId;

    SELECT WarehouseId INTO v_loc_wh FROM WarehouseLocations WHERE LocationId = NEW.SourceLocationId;
    IF v_loc_wh IS NULL OR v_loc_wh <> v_src THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Vị trí lấy hàng không thuộc kho nguồn của phiếu điều chuyển.';
    END IF;

    IF NEW.DestinationLocationId IS NOT NULL THEN
        SELECT WarehouseId INTO v_loc_wh FROM WarehouseLocations WHERE LocationId = NEW.DestinationLocationId;
        IF v_loc_wh IS NULL OR v_loc_wh <> v_dst THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Vị trí cất hàng không thuộc kho đích của phiếu điều chuyển.';
        END IF;
    END IF;
END$$

CREATE TRIGGER trg_StockTransferDetails_BU
BEFORE UPDATE ON StockTransferDetails
FOR EACH ROW
BEGIN
    DECLARE v_src    BIGINT;
    DECLARE v_dst    BIGINT;
    DECLARE v_loc_wh BIGINT;

    SELECT SourceWarehouseId, DestinationWarehouseId INTO v_src, v_dst
    FROM StockTransfers WHERE TransferId = NEW.TransferId;

    IF NEW.SourceLocationId <> OLD.SourceLocationId THEN
        SELECT WarehouseId INTO v_loc_wh FROM WarehouseLocations WHERE LocationId = NEW.SourceLocationId;
        IF v_loc_wh IS NULL OR v_loc_wh <> v_src THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Vị trí lấy hàng không thuộc kho nguồn của phiếu điều chuyển.';
        END IF;
    END IF;

    IF NEW.DestinationLocationId IS NOT NULL AND NOT (NEW.DestinationLocationId <=> OLD.DestinationLocationId) THEN
        SELECT WarehouseId INTO v_loc_wh FROM WarehouseLocations WHERE LocationId = NEW.DestinationLocationId;
        IF v_loc_wh IS NULL OR v_loc_wh <> v_dst THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Vị trí cất hàng không thuộc kho đích của phiếu điều chuyển.';
        END IF;
    END IF;
END$$


-- ============================================================================
-- 5. HOÀN TIỀN, TRẢ HÀNG, ĐÁNH GIÁ
-- ============================================================================

-- Tổng hoàn (không tính khoản bị từ chối) không được vượt số tiền đã thanh toán.
-- Service nên khóa dòng Payments (SELECT ... FOR UPDATE) trước khi tạo hoàn tiền để tránh 2 request đồng thời cùng qua kiểm tra.
CREATE TRIGGER trg_Refunds_BI
BEFORE INSERT ON Refunds
FOR EACH ROW
BEGIN
    DECLARE v_paid     DECIMAL(18,2);
    DECLARE v_status   VARCHAR(30);
    DECLARE v_refunded DECIMAL(18,2);

    SELECT Amount, PaymentStatus INTO v_paid, v_status FROM Payments WHERE PaymentId = NEW.PaymentId;

    IF v_paid IS NULL OR v_status NOT IN ('Paid','PartiallyRefunded') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Chỉ hoàn tiền cho giao dịch đã thanh toán thành công.';
    END IF;

    SELECT IFNULL(SUM(Amount), 0) INTO v_refunded
    FROM Refunds WHERE PaymentId = NEW.PaymentId AND RefundStatus <> 'Rejected';

    IF v_refunded + NEW.Amount > v_paid THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Tổng tiền hoàn vượt quá số tiền đã thanh toán.';
    END IF;
END$$

-- Yêu cầu trả hàng: chỉ cho đơn seller đã giao, và đúng khách đã đặt đơn.
CREATE TRIGGER trg_ReturnRequests_BI
BEFORE INSERT ON ReturnRequests
FOR EACH ROW
BEGIN
    DECLARE v_status   VARCHAR(30);
    DECLARE v_customer BIGINT;

    SELECT so.Status, o.CustomerId INTO v_status, v_customer
    FROM SellerOrders so
    JOIN Orders o ON o.OrderId = so.OrderId
    WHERE so.SellerOrderId = NEW.SellerOrderId;

    IF v_status IS NULL OR v_status <> 'Delivered' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Chỉ được yêu cầu trả hàng cho đơn đã giao thành công.';
    END IF;

    IF v_customer <> NEW.CustomerId THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Khách hàng không phải người đặt đơn này.';
    END IF;
END$$

-- Dòng trả hàng: phải thuộc đúng đơn seller của yêu cầu và tổng số trả không vượt số đã mua.
CREATE TRIGGER trg_ReturnRequestItems_BI
BEFORE INSERT ON ReturnRequestItems
FOR EACH ROW
BEGIN
    DECLARE v_request_so BIGINT;
    DECLARE v_item_so    BIGINT;
    DECLARE v_item_qty   INT;
    DECLARE v_already    INT;

    SELECT SellerOrderId INTO v_request_so FROM ReturnRequests WHERE ReturnRequestId = NEW.ReturnRequestId;
    SELECT SellerOrderId, Quantity INTO v_item_so, v_item_qty FROM OrderItems WHERE OrderItemId = NEW.OrderItemId;

    IF v_request_so IS NULL OR v_item_so IS NULL OR v_request_so <> v_item_so THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Dòng hàng trả không thuộc đơn của yêu cầu trả hàng.';
    END IF;

    SELECT IFNULL(SUM(rri.Quantity), 0) INTO v_already
    FROM ReturnRequestItems rri
    JOIN ReturnRequests rr ON rr.ReturnRequestId = rri.ReturnRequestId
    WHERE rri.OrderItemId = NEW.OrderItemId AND rr.Status NOT IN ('Rejected','Cancelled');

    IF v_already + NEW.Quantity > v_item_qty THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Số lượng trả vượt quá số lượng đã mua.';
    END IF;
END$$

-- Đánh giá: chỉ khi đơn seller đã giao và đúng khách đã mua.
CREATE TRIGGER trg_Reviews_BI
BEFORE INSERT ON Reviews
FOR EACH ROW
BEGIN
    DECLARE v_status   VARCHAR(30);
    DECLARE v_customer BIGINT;

    SELECT so.Status, o.CustomerId INTO v_status, v_customer
    FROM OrderItems oi
    JOIN SellerOrders so ON so.SellerOrderId = oi.SellerOrderId
    JOIN Orders o        ON o.OrderId = so.OrderId
    WHERE oi.OrderItemId = NEW.OrderItemId;

    IF v_status IS NULL OR v_status <> 'Delivered' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Chỉ được đánh giá sau khi đơn đã giao thành công.';
    END IF;

    IF v_customer <> NEW.CustomerId THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Chỉ người đã mua mới được đánh giá.';
    END IF;
END$$

DELIMITER ;


-- ============================================================================
-- 6. VIEW: TỒN KHẢ DỤNG & ĐỐI SOÁT
-- ============================================================================

-- Tồn bán được theo (biến thể, kho): chỉ tính vị trí IsSellable = TRUE và đang hoạt động.
-- Available = OnHand - Reserved. Storefront hiển thị "Hết hàng" khi tổng Available = 0.
CREATE OR REPLACE VIEW vw_VariantAvailability AS
SELECT  i.VariantId,
        i.WarehouseId,
        SUM(i.QuantityOnHand)                          AS OnHand,
        SUM(i.QuantityReserved)                        AS Reserved,
        SUM(i.QuantityOnHand - i.QuantityReserved)     AS Available
FROM Inventory i
JOIN WarehouseLocations l ON l.LocationId = i.LocationId
WHERE l.IsSellable = 1 AND l.IsActive = 1
GROUP BY i.VariantId, i.WarehouseId;

-- Đối soát: Inventory phải khớp (1) tổng OnHandChange/ReservedChange của sổ cái và
-- (2) tổng các giữ chỗ Active. Dòng nào có *_Diff khác 0 là có lỗi dữ liệu cần điều tra.
CREATE OR REPLACE VIEW vw_StockReconciliation AS
SELECT  i.InventoryId,
        i.WarehouseId,
        i.LocationId,
        i.VariantId,
        i.QuantityOnHand,
        i.QuantityReserved,
        IFNULL(m.SumOnHand, 0)                         AS LedgerOnHand,
        IFNULL(m.SumReserved, 0)                       AS LedgerReserved,
        IFNULL(r.ActiveReserved, 0)                    AS ActiveReservations,
        i.QuantityOnHand   - IFNULL(m.SumOnHand, 0)    AS OnHand_Diff,
        i.QuantityReserved - IFNULL(m.SumReserved, 0)  AS ReservedLedger_Diff,
        i.QuantityReserved - IFNULL(r.ActiveReserved, 0) AS ReservedReservation_Diff
FROM Inventory i
LEFT JOIN (
        SELECT LocationId, VariantId,
               SUM(OnHandChange)   AS SumOnHand,
               SUM(ReservedChange) AS SumReserved
        FROM StockMovements
        GROUP BY LocationId, VariantId
     ) m ON m.LocationId = i.LocationId AND m.VariantId = i.VariantId
LEFT JOIN (
        SELECT LocationId, VariantId, SUM(Quantity) AS ActiveReserved
        FROM StockReservations
        WHERE Status = 'Active'
        GROUP BY LocationId, VariantId
     ) r ON r.LocationId = i.LocationId AND r.VariantId = i.VariantId;

-- Kiểm tra nhanh: SELECT * FROM vw_StockReconciliation
--                 WHERE OnHand_Diff <> 0 OR ReservedLedger_Diff <> 0 OR ReservedReservation_Diff <> 0;
