# Luật nghiệp vụ (bản dành cho cả nhóm)

Tài liệu này giải thích **vì sao** hệ thống làm như vậy, bằng lời thường. Chi tiết bảng/cột xem `database/documentation/DatabaseDesign.md`; luật kỹ thuật cho agent xem `.agents/rules/30-inventory-order-rules.md`.

## 1. Bức tranh chung

Đây là sàn thương mại điện tử **nhiều người bán (seller)** có **kho tích hợp**. Khách đặt **một đơn** có thể chứa hàng của nhiều seller. Hệ thống tách đơn đó thành các **đơn con** theo seller; mỗi đơn con được soạn, đóng gói, xuất kho riêng, từ kho sàn hoặc kho riêng của seller.

```
Orders (đơn tổng, khách thanh toán một lần)
 └─ SellerOrders (mỗi seller một đơn con)
     └─ OrderItems (dòng hàng, có bản chụp tên/SKU/giá lúc đặt)
```

## 2. Đặt hàng (checkout)

1. Khách bấm đặt hàng. FE chỉ gửi giỏ và địa chỉ; **giá và tổng tiền do server tính**.
2. Server tách đơn theo seller, **phân bổ kho** cho từng đơn con.
3. Server **giữ chỗ tồn kho** trong cùng một giao dịch với việc tạo đơn. Hết hàng thì cả đơn thất bại (`INSUFFICIENT_STOCK`), không tạo đơn dở dang.
4. Đơn lưu **bản chụp** tên, SKU, đơn giá, địa chỉ giao. Sau này seller đổi giá hay khách đổi địa chỉ cũng không làm đổi đơn cũ.
5. Gửi lại cùng `Idempotency-Key` chỉ tạo một đơn.

Công thức luôn đúng: `TotalAmount = Subtotal + ShippingFee − DiscountAmount`.

## 3. Tồn kho

- `Có thể bán = Tồn thực (OnHand) − Đã giữ chỗ (Reserved)`. Giá trị này **tính khi truy vấn, không lưu**.
- Tồn được ghi **theo từng vị trí kệ** và từng biến thể sản phẩm.
- Chỉ vị trí `IsSellable` và đang hoạt động mới tính vào hàng bán được. Các khu **Nhận hàng (Inbound), Hàng trả (Returns), Hàng hỏng (Damaged) không bao giờ bán được**.
- **Giữ chỗ** có vòng đời: `Active` → `Consumed` (đã xuất kho) / `Released` (hủy đơn) / `Expired` (quá hạn thanh toán, job nền xử lý).
- **Sổ cái `StockMovements`** ghi mọi biến động tồn, chỉ thêm, không sửa, không xóa. Muốn đính chính thì ghi bút toán đảo.
- Mọi thay đổi tồn kho đi qua **một service duy nhất**, trong cùng giao dịch với việc ghi sổ cái.

## 4. Trạng thái đơn hàng

| Đối tượng | Luồng chính | Nhánh phụ |
|---|---|---|
| Đơn tổng `Orders` | PendingPayment → Confirmed → Processing → PartiallyShipped/Shipped → Completed | Cancelled, Expired |
| Đơn con `SellerOrders` | Pending → Confirmed → Preparing → ReadyToShip → Shipped → Delivered | DeliveryFailed, Cancelled, Returned |
| Phiếu xuất `InventoryIssues` | Draft → Approved → Picking → Packed → Dispatched | Cancelled |
| Phiếu nhập `InventoryReceipts` | Draft → Confirmed | (Đã Confirmed thì không hủy, chỉ làm phiếu đảo) |
| Yêu cầu trả hàng `ReturnRequests` | Requested → Approved → ItemsReceived → Inspected → Completed | Rejected, Cancelled |

- Trạng thái đơn tổng là **tổng hợp** từ các đơn con.
- Chuyển trạng thái sai thứ tự trả `INVALID_STATUS_TRANSITION`.
- Mỗi lần đổi trạng thái đơn ghi lịch sử: ai, lúc nào, lý do.
- Không cho hủy tự do sau khi đã bàn giao vận chuyển (`Shipped`).

## 5. Quy trình kho

1. **Nhập hàng:** nhân viên tạo phiếu nhập (Draft) → quản lý kho xác nhận → tồn tăng, ghi sổ cái.
2. **Xuất hàng cho đơn:** phiếu xuất tự sinh từ đơn con → duyệt → soạn hàng (quét mã vạch) → đóng gói → xuất kho (`Dispatched`). Chỉ lúc `Dispatched` mới trừ tồn thực và tiêu thụ giữ chỗ.
3. **Điều chuyển, kiểm kê:** có phiếu riêng, quản lý kho duyệt.
4. **Tách quyền:** người tạo phiếu **không được tự duyệt/xác nhận** chính phiếu đó (`SELF_APPROVAL_NOT_ALLOWED`).
5. Các loại xuất đặc biệt (điều chỉnh, trả seller, tiêu hủy) bắt buộc có người duyệt; điều chỉnh tồn thủ công bắt buộc có lý do.

## 6. Thanh toán và hoàn tiền

- Thanh toán gắn với **đơn tổng**; hoàn tiền có thể gắn đơn con.
- Callback từ cổng thanh toán **idempotent**: gọi lại không xử lý hai lần.
- Callback đến muộn khi đơn đã hết hạn/hủy → tạo yêu cầu hoàn tiền, không kích hoạt lại đơn.
- Tổng hoàn tiền không vượt số đã thanh toán.

## 7. Trả hàng và đánh giá

- Chỉ tạo yêu cầu trả hàng và đánh giá với đơn con **đã giao (`Delivered`)**, đúng khách đã mua.
- Hàng trả về **không tự cộng lại vào tồn bán được**: nhập vào khu Hàng trả → kiểm tra từng dòng (Tốt / Lỗi nhẹ / Hỏng) → chuyển sang kệ bán hoặc khu Hàng hỏng.

## 8. Seller và sản phẩm

- Khách đăng ký làm seller → `Pending` → Admin duyệt/từ chối/khóa.
- Seller tạo shop và sản phẩm (Draft) → gửi duyệt (PendingReview) → Admin duyệt thì sản phẩm mới hiển thị công khai.
- Mỗi sản phẩm có nhiều **biến thể** (màu, size...), mỗi biến thể có SKU, giá và tồn riêng.
- Seller chỉ thấy và sửa dữ liệu thuộc shop của mình.
- Kho **sàn** chứa hàng nhiều seller; kho **riêng của seller** chỉ chứa và xuất hàng của chính seller đó.

## 9. Việc DB đã chặn, việc code phải làm

| DB đã chặn (CHECK, trigger) | Code (service) phải làm |
|---|---|
| Sổ cái không sửa/xóa được | Ghi sổ cái đúng loại biến động, cùng giao dịch |
| Người tạo ≠ người duyệt phiếu | Kiểm tra sớm và trả `SELF_APPROVAL_NOT_ALLOWED` |
| Tổng tiền đơn đúng công thức | Tính giá ở server |
| Hoàn tiền không vượt số đã thanh toán | Khóa dòng thanh toán trước khi hoàn |
| Giá trị trạng thái hợp lệ | **Kiểm tra thứ tự chuyển trạng thái** |
| Giữ chỗ đúng kho/biến thể | **Giữ chỗ bằng câu lệnh nguyên tử**, kiểm tra số dòng ảnh hưởng |

## 10. Các kịch bản phải có test

- Hai người cùng mua món cuối: chỉ một người thành công, không bán quá tồn.
- Hủy đơn hoặc hết hạn thanh toán nhả đúng giữ chỗ.
- Xuất kho trừ cả tồn thực lẫn giữ chỗ.
- Sau mỗi kịch bản, `vw_StockReconciliation` không có dòng lệch.
- Callback thanh toán gọi hai lần chỉ xử lý một lần.
