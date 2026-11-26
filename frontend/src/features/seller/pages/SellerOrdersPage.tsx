import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, RotateCcw, ShoppingBag, Truck } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { MockDataNotice } from "@/components/common/MockDataNotice";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import { useOperationsStore } from "@/services/operationsStore";
import type { SellerOrderStatus } from "@/types/operations";
import { formatCurrency, formatDate } from "@/utils/formatters";

type TabValue = "ALL" | SellerOrderStatus | "CANCELLED_RETURNED";

const STATUS_TABS: Array<{ value: TabValue; label: string }> = [
  { value: "ALL", label: "Tất cả" },
  { value: "Pending", label: "Chờ xác nhận" },
  { value: "Confirmed", label: "Đã xác nhận" },
  { value: "Preparing", label: "Đang chuẩn bị" },
  { value: "ReadyToShip", label: "Sẵn sàng giao" },
  { value: "Shipped", label: "Đang giao" },
  { value: "Delivered", label: "Đã giao" },
  { value: "CANCELLED_RETURNED", label: "Hủy / Trả" },
];

const DEFAULT_FILTERS = { status: "ALL", q: "" };

export const SellerOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const sellerOrders = useOperationsStore((s) => s.sellerOrders);
  const { filters, setFilter, resetFilters } = useUrlFilters({ defaults: DEFAULT_FILTERS });

  const myOrders = useMemo(
    () => sellerOrders.filter((o) => o.sellerId === 1),
    [sellerOrders]
  );

  const countByTab = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: myOrders.length,
      CANCELLED_RETURNED: myOrders.filter(
        (o) => o.status === "Cancelled" || o.status === "Returned" || o.status === "DeliveryFailed"
      ).length,
    };
    for (const tab of STATUS_TABS) {
      if (tab.value !== "ALL" && tab.value !== "CANCELLED_RETURNED") {
        counts[tab.value] = myOrders.filter((o) => o.status === tab.value).length;
      }
    }
    return counts;
  }, [myOrders]);

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return myOrders.filter((o) => {
      if (filters.status === "CANCELLED_RETURNED") {
        if (!["Cancelled", "Returned", "DeliveryFailed"].includes(o.status)) return false;
      } else if (filters.status !== "ALL" && o.status !== filters.status) {
        return false;
      }

      if (!q) return true;
      return (
        o.sellerOrderCode.toLowerCase().includes(q) ||
        o.orderCode.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        (o.shipment?.trackingNumber.toLowerCase().includes(q) ?? false)
      );
    });
  }, [myOrders, filters.status, filters.q]);

  return (
    <section>
      <PageHeader
        title="Đơn hàng của shop"
        subtitle="Danh sách đơn con tách theo người bán, xử lý xuất kho từ Kho sàn Hà Nội."
      />

      <MockDataNotice endpointHint="GET /api/v1/seller/orders?status=" />

      {/* Status Tabs matching DB SellerOrders.Status */}
      <div className="ew-tabs-bar" role="tablist" aria-label="Lọc đơn con theo trạng thái">
        {STATUS_TABS.map((tab) => {
          const isActive = filters.status === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`ew-tab-btn ${isActive ? "ew-tab-btn--active" : ""}`}
              onClick={() => setFilter("status", tab.value)}
            >
              <span>{tab.label}</span>
              <span className="ew-tab-count ks-tabular">{countByTab[tab.value] ?? 0}</span>
            </button>
          );
        })}
      </div>

      {/* Search Toolbar */}
      <div className="ew-card ew-toolbar" style={{ marginBottom: "16px" }}>
        <div className="ew-toolbar__search">
          <SearchInput
            value={filters.q}
            onChange={(val) => setFilter("q", val)}
            placeholder="Tìm theo mã đơn con (SO-...), mã đơn tổng, khách hàng hoặc mã vận đơn..."
            ariaLabel="Tìm kiếm đơn hàng của shop"
          />
        </div>
        {(filters.status !== "ALL" || filters.q !== "") && (
          <Button variant="secondary" size="sm" leftIcon={<RotateCcw size={14} />} onClick={resetFilters}>
            Đặt lại bộ lọc
          </Button>
        )}
      </div>

      {/* Data Table */}
      {filtered.length === 0 ? (
        <div className="ew-card">
          <EmptyState
            icon={<ShoppingBag size={28} />}
            title="Không có đơn con nào khớp bộ lọc"
            description="Thử chuyển sang tab trạng thái khác hoặc xóa từ khóa tìm kiếm."
            action={
              <Button variant="secondary" onClick={resetFilters}>
                Xem tất cả đơn hàng
              </Button>
            }
          />
        </div>
      ) : (
        <div className="ew-card">
          <div className="ew-table-scroll">
            <table className="ew-table">
              <thead>
                <tr>
                  <th>Mã đơn con / Đơn tổng</th>
                  <th>Ngày đặt</th>
                  <th>Khách hàng</th>
                  <th className="ew-table__cell--center">Số dòng hàng</th>
                  <th className="ew-table__cell--right">Tổng tiền</th>
                  <th>Hãng vận chuyển</th>
                  <th>Trạng thái</th>
                  <th className="ew-table__cell--right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ord) => (
                  <tr key={ord.sellerOrderId}>
                    <td>
                      <div className="ks-tabular" style={{ fontWeight: 700, color: "var(--color-dark)" }}>
                        {ord.sellerOrderCode}
                      </div>
                      <div className="ks-tabular" style={{ fontSize: "0.78rem", color: "var(--color-muted)" }}>
                        Đơn tổng: {ord.orderCode}
                      </div>
                    </td>
                    <td className="ks-tabular" style={{ whiteSpace: "nowrap", fontSize: "0.84rem" }}>
                      {formatDate(ord.createdAt)}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--color-dark)" }}>{ord.customerName}</div>
                      <div className="ks-tabular" style={{ fontSize: "0.78rem", color: "var(--color-muted)" }}>
                        {ord.recipientPhone}
                      </div>
                    </td>
                    <td className="ew-table__cell--center ks-tabular">
                      {ord.items.length} dòng ({ord.items.reduce((acc, i) => acc + i.quantity, 0)} SP)
                    </td>
                    <td className="ew-table__cell--right ks-tabular" style={{ fontWeight: 700, color: "var(--color-dark)" }}>
                      {formatCurrency(ord.subtotal)}
                    </td>
                    <td>
                      {ord.shipment ? (
                        <div>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontWeight: 600 }}>
                            <Truck size={13} color="var(--color-primary)" aria-hidden="true" />
                            <span>{ord.shipment.carrierCode}</span>
                          </div>
                          <div className="ks-tabular" style={{ fontSize: "0.76rem", color: "var(--color-muted)" }}>
                            {ord.shipment.trackingNumber}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: "0.82rem", color: "var(--color-muted)" }}>Chưa tạo vận đơn</span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={ord.status} domain="sellerOrder" />
                    </td>
                    <td className="ew-table__cell--right">
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<Eye size={14} />}
                        onClick={() => navigate(`/seller/orders/${ord.sellerOrderId}`)}
                      >
                        Chi tiết
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};
