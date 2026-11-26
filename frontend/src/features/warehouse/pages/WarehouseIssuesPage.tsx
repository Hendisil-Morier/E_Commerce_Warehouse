import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpFromLine, Barcode, Eye, PackageCheck, RotateCcw } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { MockDataNotice } from "@/components/common/MockDataNotice";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import { useOperationsStore } from "@/services/operationsStore";
import { ISSUE_TYPE_LABELS, type IssueStatus } from "@/types/operations";
import { formatDate } from "@/utils/formatters";

const ISSUE_TABS: Array<{ value: "ALL" | IssueStatus; label: string }> = [
  { value: "ALL", label: "Tất cả" },
  { value: "Draft", label: "Nháp (Chờ duyệt)" },
  { value: "Approved", label: "Đã duyệt" },
  { value: "Picking", label: "Đang soạn" },
  { value: "Packed", label: "Đã đóng gói" },
  { value: "Dispatched", label: "Đã xuất kho" },
  { value: "Cancelled", label: "Đã hủy" },
];

export const WarehouseIssuesPage: React.FC = () => {
  const navigate = useNavigate();
  const issues = useOperationsStore((s) => s.issues);
  const { filters, setFilter, resetFilters } = useUrlFilters({
    defaults: { status: "ALL", q: "" },
  });

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return issues.filter((iss) => {
      if (filters.status !== "ALL" && iss.status !== filters.status) return false;
      if (!q) return true;
      return (
        iss.issueCode.toLowerCase().includes(q) ||
        (iss.sellerOrderCode?.toLowerCase().includes(q) ?? false) ||
        (iss.orderCode?.toLowerCase().includes(q) ?? false) ||
        (iss.customerName?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [issues, filters.status, filters.q]);

  return (
    <section>
      <PageHeader
        title="Danh sách phiếu xuất kho (W6)"
        subtitle="Điều phối quy trình xuất kho chuẩn CSDL: Draft → Approved → Picking (W7-Pick) → Packed (W7-Pack) → Dispatched (trừ tồn)."
      />

      <MockDataNotice endpointHint="GET /api/v1/issues?status= · POST /api/v1/issues/{id}/approve|start-picking|pack|dispatch" />

      <div className="ew-tabs-bar" role="tablist" aria-label="Lọc trạng thái phiếu xuất">
        {ISSUE_TABS.map((tab) => {
          const active = filters.status === tab.value;
          const count =
            tab.value === "ALL"
              ? issues.length
              : issues.filter((i) => i.status === tab.value).length;
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
            placeholder="Tìm mã phiếu xuất (PX-...), mã đơn con (SO-...), đơn tổng hoặc tên khách..."
            ariaLabel="Tìm kiếm phiếu xuất kho"
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
            icon={<ArrowUpFromLine size={28} />}
            title="Chưa có phiếu xuất kho phù hợp"
            description="Khi Seller xác nhận đơn con, phiếu xuất OrderFulfillment sẽ xuất hiện tại đây."
          />
        </div>
      ) : (
        <div className="ew-card">
          <div className="ew-table-scroll">
            <table className="ew-table">
              <thead>
                <tr>
                  <th>Mã phiếu xuất / Ngày tạo</th>
                  <th>Đơn con gốc &amp; Khách hàng</th>
                  <th>Loại xuất (IssueType)</th>
                  <th className="ew-table__cell--center">Tiến độ lấy hàng</th>
                  <th>Trạng thái</th>
                  <th className="ew-table__cell--right">Trạm thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((iss) => {
                  const totalUnits = iss.details.reduce((s, d) => s + d.quantity, 0);
                  const pickedUnits = iss.details.reduce((s, d) => s + d.pickedQuantity, 0);
                  const allPicked = pickedUnits >= totalUnits && totalUnits > 0;

                  return (
                    <tr key={iss.issueId}>
                      <td>
                        <div className="ks-tabular" style={{ fontWeight: 700, color: "var(--color-dark)" }}>
                          {iss.issueCode}
                        </div>
                        <div className="ks-tabular" style={{ fontSize: "0.76rem", color: "var(--color-muted)" }}>
                          {formatDate(iss.createdAt)}
                        </div>
                      </td>
                      <td>
                        <div className="ks-tabular" style={{ fontWeight: 600 }}>
                          {iss.sellerOrderCode ?? "Xuất nội bộ / không gắn đơn"}
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "var(--color-muted)" }}>
                          {iss.customerName ? `${iss.customerName} · ${iss.shopName}` : iss.shopName ?? "—"}
                        </div>
                      </td>
                      <td>{ISSUE_TYPE_LABELS[iss.issueType]}</td>
                      <td className="ew-table__cell--center ks-tabular">
                        <strong>{pickedUnits}</strong> / {totalUnits} SP ({iss.details.length} dòng)
                      </td>
                      <td>
                        <StatusBadge status={iss.status} domain="issue" />
                      </td>
                      <td className="ew-table__cell--right">
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          {iss.status === "Picking" && (
                            <Button
                              variant="secondary"
                              size="sm"
                              leftIcon={<Barcode size={14} />}
                              onClick={() => navigate(`/warehouse/issues/${iss.issueId}/pick`)}
                            >
                              Soạn W7
                            </Button>
                          )}
                          {iss.status === "Picking" && allPicked && (
                            <Button
                              variant="primary"
                              size="sm"
                              leftIcon={<PackageCheck size={14} />}
                              onClick={() => navigate(`/warehouse/issues/${iss.issueId}/pack`)}
                            >
                              Đóng gói
                            </Button>
                          )}
                          <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<Eye size={14} />}
                            onClick={() => navigate(`/warehouse/issues/${iss.issueId}`)}
                          >
                            Chi tiết
                          </Button>
                        </div>
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
