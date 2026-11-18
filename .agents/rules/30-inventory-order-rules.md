# Quy tắc nghiệp vụ lõi: tồn kho, đơn hàng, đa seller

Đây là các **bất biến (invariants)** không được phá vỡ. Chi tiết bảng/cột: `database/documentation/DatabaseDesign.md`.

## 1. Công thức tồn kho
`Available = QuantityOnHand − QuantityReserved` (tính khi truy vấn, **không lưu**). Tồn là theo **(vị trí kệ, biến thể)** trong bảng `Inventory`. Chỉ vị trí `IsSellable = 1` và `IsActive = 1` được tính vào tồn bán được; khu `Inbound`, `Returns`, `Damaged` không bao giờ bán được.

## 2. Giữ chỗ (reservation)
- Giữ chỗ chạy **cùng transaction với tạo đơn**. Phải phân bổ kho (`SellerOrders.WarehouseId`) **trước** khi giữ chỗ.
- Dùng câu lệnh **nguyên tử**, không đọc rồi ghi:
  `UPDATE Inventory SET QuantityReserved = QuantityReserved + @q WHERE InventoryId = @id AND QuantityOnHand - QuantityReserved >= @q;` rồi kiểm tra số dòng bị ảnh hưởng. Bằng 0 → hết hàng → rollback, trả 409 `INSUFFICIENT_STOCK`.
- Mỗi lần giữ chỗ tạo một dòng `StockReservations` (`Active`). Kết thúc: `Consumed` (xuất kho), `Released` (hủy đơn), `Expired` (job nền khi quá `ExpiresAt`). COD thì `ExpiresAt` có thể NULL.
- `Inventory.QuantityReserved` luôn bằng tổng giữ chỗ `Active` cùng (vị trí, biến thể). View `vw_StockReconciliation` phải không có dòng lệch.

## 3. Sổ cái `StockMovements` (chỉ thêm)
- **Mọi thay đổi `Inventory` đều đi qua MỘT service duy nhất** và ghi một dòng `StockMovements` trong cùng transaction. Không `UPDATE Inventory` rải rác ở nơi khác.
- Không sửa, không xóa dòng sổ cái (trigger chặn). Đính chính bằng bút toán đảo.
- Cách ghi: `Receipt`/`ReturnIn`/`TransferIn` → `OnHandChange +N`; `TransferOut` → `−N`; `Reserve` → `ReservedChange +N`; `ReleaseReserve` → `ReservedChange −N`; `Issue` cho đơn hàng → `OnHandChange −N` **và** `ReservedChange −N`; `Issue` tiêu hủy/trả seller → `OnHandChange −N`. Luôn ghi `OnHandAfter`, `ReservedAfter`, chứng từ gốc (`ReferenceType` + `ReferenceId`), người thực hiện.

## 4. Đa seller
- Một `Orders` tách thành nhiều `SellerOrders` (duy nhất theo `OrderId + SellerId`). Seller của sản phẩm suy ra qua `Variant → Product → Shop → Seller`.
- Dòng hàng chỉ thuộc đơn con của đúng seller sở hữu sản phẩm.
- Kho riêng của seller (`WarehouseType = 'Seller'`) chỉ chứa hàng và xuất đơn của chính seller đó; kho sàn (`Platform`) chứa hàng nhiều seller.
- Thanh toán gắn **đơn tổng**; hoàn tiền có thể gắn đơn con.

## 5. Bản chụp (snapshot)
`OrderItems` lưu tên, SKU, đơn giá lúc đặt; `Orders` lưu địa chỉ giao lúc đặt. Không tính lại từ `ProductVariants.Price` hay `UserAddresses` cho đơn đã tạo. Luôn đúng: `TotalAmount = Subtotal + ShippingFee − DiscountAmount`. **Tính giá ở server**, không tin giá từ client.

## 6. Trạng thái và lịch sử
DB chỉ giới hạn tập giá trị; **service kiểm tra thứ tự chuyển** và ghi `OrderStatusHistory` (ai, lúc nào, vì sao). Chuyển sai → 409 `INVALID_STATUS_TRANSITION`.
- `Orders`: PendingPayment → Confirmed → Processing → PartiallyShipped/Shipped → Completed; nhánh Cancelled, Expired. Là **trạng thái tổng hợp** từ các đơn con, tính lại mỗi khi đơn con đổi.
- `SellerOrders`: Pending → Confirmed → Preparing → ReadyToShip → Shipped → Delivered; nhánh DeliveryFailed, Cancelled, Returned. Không hủy tự do sau `Shipped`.
- `InventoryIssues`: Draft → Approved → Picking → Packed → Dispatched; Cancelled. Chỉ `Dispatched` mới trừ tồn và tiêu thụ giữ chỗ.
- `InventoryReceipts`: Draft → Confirmed (tăng tồn); phiếu Confirmed không hủy, chỉ làm phiếu đảo.
- `ReturnRequests`: Requested → Approved → ItemsReceived → Inspected → Completed; nhánh Rejected, Cancelled.
- Mã trạng thái là chuỗi khớp chính xác `CHECK` trong schema (phân biệt hoa thường).

## 7. Kiểm soát chứng từ
Người tạo phiếu nhập/xuất/điều chuyển/kiểm kê **không được tự duyệt hoặc xác nhận** chính phiếu đó. Loại xuất `Adjustment`, `ReturnToSeller`, `Disposal` bắt buộc có người duyệt trước khi `Dispatched`. Điều chỉnh tồn thủ công bắt buộc có lý do.

## 8. Thanh toán, hoàn tiền, trả hàng
- Callback thanh toán **idempotent** theo `(PaymentMethod, TransactionCode)`; gọi lại không xử lý hai lần. Callback đến sau khi đơn đã `Expired`/`Cancelled` → tạo yêu cầu hoàn tiền, không kích hoạt lại đơn.
- Tổng hoàn tiền của một `Payment` không vượt số đã thanh toán; khóa dòng `Payments` (`SELECT ... FOR UPDATE`) trước khi tạo hoàn tiền.
- Hàng trả về **không tự cộng vào tồn bán được**: nhập vào khu `Returns` → kiểm tra từng dòng (`Good`, `MinorDefect`, `Damaged`) → chuyển sang kệ bán hoặc khu `Damaged` bằng cặp bút toán `Adjustment` (`ReferenceType = 'ReturnRequest'`).
- Chỉ cho yêu cầu trả hàng và đánh giá với đơn con `Delivered`, đúng khách đã mua.

## 9. Trigger trong DB (file `05_TriggersAndViews.sql`)
Các trigger bảo vệ: sổ cái chỉ-thêm, kho seller không chứa hàng seller khác, đơn seller chỉ xuất từ kho hợp lệ, dòng hàng đúng seller, giữ chỗ đúng kho/biến thể/vị trí bán được, hoàn tiền không vượt, trả hàng/đánh giá chỉ khi `Delivered`. **Không viết code né trigger.** Các kiểm tra này có thể bị race khi đồng thời cao, nên service vẫn khóa dòng cha trong transaction.

## 10. Việc phải có test
Giữ chỗ không bán quá tồn khi hai request cùng mua món cuối; hủy/hết hạn nhả đúng giữ chỗ; xuất kho trừ cả `OnHand` và `Reserved`; đối soát `vw_StockReconciliation` không lệch sau mỗi kịch bản; callback thanh toán gọi hai lần.
