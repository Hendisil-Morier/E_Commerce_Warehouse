import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowDownToLine, Eye, Plus, RotateCcw, ShieldAlert } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { MockDataNotice } from "@/components/common/MockDataNotice";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ROUTES } from "@/constants/routes";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import { isSameWarehouseActor, useOperationsStore } from "@/services/operationsStore";
import { useAuthStore } from "@/stores/authStore";
import { RECEIPT_TYPE_LABELS, type ReceiptStatus } from "@/types/operations";
import { formatDate } from "@/utils/formatters";

const RECEIPT_TABS: Array<{ value: "ALL" | ReceiptStatus; label: string }> = [
  { value: "ALL", label: "Tất cả" },
  { value: "Draft", label: "Nháp (Chờ xác nhận)" },
  { value: "Confirmed", label: "Đã xác nhận nhập" },
  { value: "Cancelled", label: "Đã hủy" },
];

export const WarehouseReceiptsPage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const receipts = useOperationsStore((s) => s.receipts);
  const { filters, setFilter, resetFilters } = useUrlFilters({
    defaults: { status: "ALL", q: "" },
  });

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return receipts.filter((r) => {
      if (filters.status !== "ALL" && r.status !== filters.status) return false;
      if (!q) return true;
      return (
        r.receiptCode.toLowerCase().includes(q) ||
        (r.senderSellerName?.toLowerCase().includes(q) ?? false) ||
        r.createdByName.toLowerCase().includes(q) ||
        r.details.some((d) => d.sku.toLowerCase().includes(q))
      );
    });
  }, [receipts, filters.status, filters.q]);

  return (
    <section>
      <PageHeader
        title="Danh sách phiếu nhập kho (W5a)"
        subtitle="Quản lý phiếu nhập hàng từ Người bán vào Kho sàn theo luồng Draft → Confirmed (tách quyền người tạo ≠ người xác nhận)."
        actions={
          <Button
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={() => navigate(ROUTES.WAREHOUSE_RECEIPT_NEW)}
          >
            Tạo phiếu nhập (W5b)
          </Button>
        }
      />

      <MockDataNotice endpointHint="GET /api/v1/receipts · POST /api/v1/receipts/{id}/confirm | /cancel" />

      <div className="ew-tabs-bar" role="tablist" aria-label="Lọc trạng thái phiếu nhập">
        {RECEIPT_TABS.map((tab) => {
          const active = filters.status === tab.value;
          const count =
            tab.value === "ALL"
              ? receipts.length
              : receipts.filter((r) => r.status === tab.value).length;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={active}
              className={`ew-tab-btn ${active ? "ew-tab-btn--active" : ""}`}
              onClick={() => setFilter("status", tab.value)}
            >
              <span>{tab.label}</span>
              <span className="ew-tab-count ks-tabular">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="ew-card ew-toolbar" style={{ marginBottom: "16px" }}>
        <div className="ew-toolbar__search">
          <SearchInput
            value={filters.q}
            onChange={(v) => setFilter("q", v)}
            placeholder="Tìm theo mã phiếu (PN-...), nguồn Seller, SKU hoặc người tạo..."
            ariaLabel="Tìm kiếm phiếu nhập kho"
          />
        </div>
        {(filters.status !== "ALL" || filters.q !== "") && (
          <Button variant="secondary" size="sm" leftIcon={<RotateCcw size={14} />} onClick={resetFilters}>
            Đặt lại
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="ew-card">
          <EmptyState
            icon={<ArrowDownToLine size={28} />}
            title="Chưa có phiếu nhập kho phù hợp"
            description="Tạo phiếu nhập Draft mới để tiếp nhận hàng hóa vào Kho sàn."
            action={
              <Button variant="primary" onClick={() => navigate(ROUTES.WAREHOUSE_RECEIPT_NEW)}>
                Tạo phiếu nhập mới
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
                  <th>Mã phiếu / Loại nhập</th>
                  <th>Kho &amp; Nguồn (Seller)</th>
                  <th className="ew-table__cell--center">Số dòng / Tổng SL</th>
                  <th>Người tạo / Ngày tạo</th>
                  <th>Trạng thái</th>
                  <th className="ew-table__cell--right">Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((rec) => {
                  const totalUnits = rec.details.reduce((s, d) => s + d.quantity, 0);
                  const isOwnDraft =
                    rec.status === "Draft" &&
                    currentUser !== null &&
                    isSameWarehouseActor(
                      rec.createdBy,
                      rec.createdByEmail,
                      currentUser.userId,
                      currentUser.email
                    );

                  return (
                    <tr key={rec.receiptId}>
                      <td>
                        <div className="ks-tabular" style={{ fontWeight: 700, color: "var(--color-dark)" }}>
                          {rec.receiptCode}
                        </div>
                        <div style={{ fontSize: "0.76rem", color: "var(--color-muted)" }}>
                          {RECEIPT_TYPE_LABELS[rec.receiptType]}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{rec.warehouseName}</div>
                        <div style={{ fontSize: "0.78rem", color: "var(--color-muted)" }}>
                          {rec.senderSellerName ?? "—"}
                        </div>
                      </td>
                      <td className="ew-table__cell--center ks-tabular">
                        {rec.details.length} dòng · <strong>{totalUnits} SP</strong>
                      </td>
                      <td>
                        <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{rec.createdByName}</div>
                        <div className="ks-tabular" style={{ fontSize: "0.76rem", color: "var(--color-muted)" }}>
                          {formatDate(rec.createdAt)}
                        </div>
                        {isOwnDraft && (
                          <div style={{ fontSize: "0.72rem", color: "var(--color-warning)", display: "inline-flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                            <ShieldAlert size={12} aria-hidden="true" />
                            <span>Phiếu bạn tạo (cần WM khác duyệt)</span>
                          </div>
                        )}
                      </td>
                      <td>
                        <StatusBadge status={rec.status} domain="receipt" />
                      </td>
                      <td className="ew-table__cell--right">
                        <Button
                          variant="secondary"
                          size="sm"
                          leftIcon={<Eye size={14} />}
                          onClick={() => navigate(`/warehouse/receipts/${rec.receiptId}`)}
                        >
                          Mở phiếu
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};
