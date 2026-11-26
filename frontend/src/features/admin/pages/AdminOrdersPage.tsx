import React, { useMemo, useState } from "react";
import { Eye, Lock, RotateCcw, ShoppingBag, Store, Truck } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { InspectionDrawer } from "@/components/common/InspectionDrawer";
import { MockDataNotice } from "@/components/common/MockDataNotice";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusTimeline } from "@/components/common/StatusTimeline";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useOperationsStore } from "@/services/operationsStore";
import { PAYMENT_METHOD_LABELS, type OrderStatus } from "@/types/operations";
import { formatCurrency, formatDate } from "@/utils/formatters";

const ORDER_STATUS_OPTIONS: Array<{ value: "ALL" | OrderStatus; label: string }> = [
  { value: "ALL", label: "Tất cả trạng thái đơn tổng" },
  { value: "PendingPayment", label: "Chờ thanh toán" },
  { value: "Confirmed", label: "Đã xác nhận" },
  { value: "Processing", label: "Đang xử lý" },
  { value: "PartiallyShipped", label: "Giao một phần" },
  { value: "Shipped", label: "Đang giao hàng" },
  { value: "Completed", label: "Hoàn thành" },
  { value: "Cancelled", label: "Đã hủy" },
  { value: "Expired", label: "Hết hạn thanh toán" },
];

export const AdminOrdersPage: React.FC = () => {
  const masterOrders = useOperationsStore((s) => s.masterOrders);
  const sellerOrders = useOperationsStore((s) => s.sellerOrders);

  const [statusFilter, setStatusFilter] = useState<"ALL" | OrderStatus>("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return masterOrders.filter((o) => {
      if (statusFilter !== "ALL" && o.orderStatus !== statusFilter) return false;
      if (fromDate && o.createdAt.slice(0, 10) < fromDate) return false;
      if (toDate && o.createdAt.slice(0, 10) > toDate) return false;
      if (!q) return true;
      return (
        o.orderCode.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.recipientPhone.includes(q)
      );
    });
  }, [masterOrders, statusFilter, fromDate, toDate, query]);

  const selected = masterOrders.find((o) => o.orderId === selectedId) ?? null;
  const selectedSubOrders = useMemo(
    () =>
      selected
        ? sellerOrders.filter((so) => selected.sellerOrderIds.includes(so.sellerOrderId))
        : [],
    [selected, sellerOrders]
  );

  return (
    <section>
      <PageHeader
        title="Đơn hàng toàn sàn (A4)"
        subtitle="Tra cứu toàn bộ đơn tổng (Orders) → các đơn con theo từng shop (SellerOrders) → dòng hàng, thanh toán và vận đơn để đối soát khiếu nại."
        badge={
          <span className="ew-chip">
            <Lock size={12} aria-hidden="true" />
            <span>Chế độ chỉ xem · Đối soát</span>
          </span>
        }
      />

      <MockDataNotice endpointHint="GET /api/v1/admin/orders · GET /api/v1/admin/orders/{id}" />

      <div className="ew-card ew-toolbar" style={{ marginBottom: "16px", flexWrap: "wrap" }}>
        <div className="ew-toolbar__search">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Tìm mã đơn tổng (ORD-...), tên khách hàng hoặc SĐT..."
            ariaLabel="Tìm đơn hàng toàn sàn"
          />
        </div>
        <div className="ew-toolbar__select">
          <Select
            aria-label="Lọc trạng thái đơn tổng"
            value={statusFilter}
            options={ORDER_STATUS_OPTIONS}
            onChange={(e) => setStatusFilter(e.target.value as "ALL" | OrderStatus)}
          />
        </div>
        <div className="ew-date-range">
          <Input
            type="date"
            aria-label="Từ ngày"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            style={{ width: "155px" }}
          />
          <span style={{ color: "var(--color-muted)" }}>→</span>
          <Input
            type="date"
            aria-label="Đến ngày"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            style={{ width: "155px" }}
          />
        </div>
        {(query || statusFilter !== "ALL" || fromDate || toDate) && (
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RotateCcw size={14} />}
            onClick={() => {
              setQuery("");
              setStatusFilter("ALL");
              setFromDate("");
              setToDate("");
            }}
          >
            Đặt lại
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="ew-card">
          <EmptyState
            icon={<ShoppingBag size={28} />}
            title="Không tìm thấy đơn tổng nào"
            description="Thử thay đổi khoảng ngày, trạng thái hoặc từ khóa tìm kiếm."
          />
        </div>
      ) : (
        <div className="ew-card">
          <div className="ew-table-scroll">
            <table className="ew-table">
              <thead>
                <tr>
                  <th>Mã đơn tổng / Ngày đặt</th>
                  <th>Khách hàng</th>
                  <th className="ew-table__cell--center">Số đơn con</th>
                  <th className="ew-table__cell--right">Tổng tiền (TotalAmount)</th>
                  <th>Thanh toán</th>
                  <th>Trạng thái đơn</th>
                  <th className="ew-table__cell--right">Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ord) => (
                  <tr key={ord.orderId}>
                    <td>
                      <div className="ks-tabular" style={{ fontWeight: 800, color: "var(--color-dark)" }}>
                        {ord.orderCode}
                      </div>
                      <div className="ks-tabular" style={{ fontSize: "0.76rem", color: "var(--color-muted)" }}>
                        {formatDate(ord.createdAt)}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{ord.customerName}</div>
                      <div className="ks-tabular" style={{ fontSize: "0.78rem", color: "var(--color-muted)" }}>
                        {ord.recipientPhone} · {ord.shippingProvince}
                      </div>
                    </td>
                    <td className="ew-table__cell--center ks-tabular">
                      {ord.sellerOrderIds.length} shop
                    </td>
                    <td className="ew-table__cell--right ks-tabular" style={{ fontWeight: 800, color: "var(--color-dark)" }}>
                      {formatCurrency(ord.totalAmount)}
                    </td>
                    <td>
                      <div style={{ fontSize: "0.82rem", fontWeight: 600 }}>
                        {PAYMENT_METHOD_LABELS[ord.paymentMethod]}
                      </div>
                      <div style={{ marginTop: "3px" }}>
                        <StatusBadge status={ord.paymentStatus} />
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={ord.orderStatus} domain="order" />
                    </td>
                    <td className="ew-table__cell--right">
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<Eye size={14} />}
                        onClick={() => setSelectedId(ord.orderId)}
                      >
                        Xem đơn
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Drawer đa tầng: Đơn tổng → Đơn con → Dòng hàng + Thanh toán + Vận đơn + Timeline */}
      <InspectionDrawer
        isOpen={Boolean(selected)}
        title={selected ? `Đơn tổng ${selected.orderCode}` : ""}
        subtitle={selected ? `${selected.customerName} · Đặt lúc ${formatDate(selected.createdAt)}` : undefined}
        headerBadge={
          selected ? <StatusBadge status={selected.orderStatus} domain="order" size="md" /> : undefined
        }
        onClose={() => setSelectedId(null)}
      >
        {selected && (
          <>
            <div className="ew-drawer__section">
              <span className="ew-drawer__section-title">Tổng hợp tài chính (Orders · Công thức chuẩn DB)</span>
              <div className="ew-info-list ks-tabular">
                <div className="ew-info-row">
                  <span className="ew-info-key">Tiền hàng (Subtotal)</span>
                  <span className="ew-info-val">{formatCurrency(selected.subtotal)}</span>
                </div>
                <div className="ew-info-row">
                  <span className="ew-info-key">Phí vận chuyển (ShippingFee)</span>
                  <span className="ew-info-val">+{formatCurrency(selected.shippingFee)}</span>
                </div>
                <div className="ew-info-row">
                  <span className="ew-info-key">Giảm giá (DiscountAmount)</span>
                  <span className="ew-info-val">-{formatCurrency(selected.discountAmount)}</span>
                </div>
                <div className="ew-info-row" style={{ borderTop: "1px solid var(--color-border)", paddingTop: "8px" }}>
                  <strong>Tổng thanh toán (TotalAmount)</strong>
                  <strong style={{ color: "var(--color-primary)", fontSize: "1.05rem" }}>
                    {formatCurrency(selected.totalAmount)}
                  </strong>
                </div>
                <div className="ew-info-row">
                  <span className="ew-info-key">Thanh toán</span>
                  <span className="ew-info-val">
                    {PAYMENT_METHOD_LABELS[selected.paymentMethod]}
                    {selected.transactionCode ? ` (${selected.transactionCode})` : ""}
                  </span>
                </div>
              </div>
            </div>

            <div className="ew-drawer__section">
              <span className="ew-drawer__section-title">
                Đơn con tách theo Seller ({selectedSubOrders.length})
              </span>
              {selectedSubOrders.map((so) => (
                <div
                  key={so.sellerOrderId}
                  className="ew-card"
                  style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700 }}>
                      <Store size={14} color="var(--color-primary)" aria-hidden="true" />
                      <span className="ks-tabular">{so.sellerOrderCode}</span>
                      <span>· {so.shopName}</span>
                    </div>
                    <StatusBadge status={so.status} domain="sellerOrder" />
                  </div>

                  {so.items.map((it) => (
                    <div key={it.orderItemId} className="ew-line-item" style={{ padding: "8px 10px" }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.84rem" }}>
                          {it.productNameSnapshot}
                        </div>
                        <div className="ks-tabular" style={{ fontSize: "0.74rem", color: "var(--color-muted)" }}>
                          SKU: {it.skuSnapshot} · x{it.quantity}
                        </div>
                      </div>
                      <strong className="ks-tabular" style={{ fontSize: "0.84rem" }}>
                        {formatCurrency(it.lineTotal)}
                      </strong>
                    </div>
                  ))}

                  {so.shipment && (
                    <div className="ew-notice ew-notice--info" style={{ padding: "8px 10px", fontSize: "0.78rem" }}>
                      <Truck size={13} style={{ display: "inline", marginRight: "5px" }} aria-hidden="true" />
                      <strong>{so.shipment.carrierName}</strong> · {so.shipment.trackingNumber} ({so.shipment.shippingStatus})
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="ew-drawer__section">
              <span className="ew-drawer__section-title">Lịch sử trạng thái đơn tổng</span>
              <StatusTimeline items={selected.statusHistory} domain="order" />
            </div>
          </>
        )}
      </InspectionDrawer>
    </section>
  );
};
