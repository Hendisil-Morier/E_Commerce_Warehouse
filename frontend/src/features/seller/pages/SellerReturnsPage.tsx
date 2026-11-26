import React, { useMemo, useState } from "react";
import { CheckCircle2, Eye, FileText, RotateCcw, XCircle } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { InspectionDrawer } from "@/components/common/InspectionDrawer";
import { MockDataNotice } from "@/components/common/MockDataNotice";
import { PageHeader } from "@/components/common/PageHeader";
import { ReasonActionModal } from "@/components/common/ReasonActionModal";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/hooks/useToast";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import { useOperationsStore } from "@/services/operationsStore";
import { useAuthStore } from "@/stores/authStore";
import type { ReturnRequestRecordDto, ReturnStatus } from "@/types/operations";
import { formatCurrency, formatDate } from "@/utils/formatters";

const RETURN_TABS: Array<{ value: "ALL" | ReturnStatus; label: string }> = [
  { value: "ALL", label: "Tất cả" },
  { value: "Requested", label: "Chờ duyệt" },
  { value: "Approved", label: "Đã duyệt" },
  { value: "ItemsReceived", label: "Kho đã nhận" },
  { value: "Inspected", label: "Đã kiểm hàng" },
  { value: "Completed", label: "Hoàn tất" },
  { value: "Rejected", label: "Từ chối" },
];

export const SellerReturnsPage: React.FC = () => {
  const toast = useToast();
  const currentUser = useAuthStore((s) => s.user);
  const returns = useOperationsStore((s) => s.returns);
  const approveReturnRequest = useOperationsStore((s) => s.approveReturnRequest);
  const rejectReturnRequest = useOperationsStore((s) => s.rejectReturnRequest);

  const { filters, setFilter, resetFilters } = useUrlFilters({
    defaults: { status: "ALL", q: "" },
  });

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [actionModal, setActionModal] = useState<{
    type: "APPROVE" | "REJECT";
    record: ReturnRequestRecordDto;
  } | null>(null);

  const myReturns = useMemo(() => returns.filter((r) => r.sellerId === 1), [returns]);

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return myReturns.filter((r) => {
      if (filters.status !== "ALL" && r.status !== filters.status) return false;
      if (!q) return true;
      return (
        r.requestCode.toLowerCase().includes(q) ||
        r.sellerOrderCode.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q)
      );
    });
  }, [myReturns, filters.status, filters.q]);

  const selected = myReturns.find((r) => r.returnRequestId === selectedId) ?? null;

  const handleConfirmModal = async (reason: string) => {
    if (!actionModal) return;
    const actorId = currentUser?.userId ?? 4;
    const actorName = currentUser?.fullName ?? "Người bán";

    const res =
      actionModal.type === "APPROVE"
        ? approveReturnRequest(actionModal.record.returnRequestId, actorId, actorName)
        : rejectReturnRequest(actionModal.record.returnRequestId, reason, actorId, actorName);

    if (res.ok) {
      toast.success(res.message);
      setActionModal(null);
    } else {
      toast.error(res.message);
    }
  };

  return (
    <section>
      <PageHeader
        title="Quản lý trả hàng"
        subtitle="Xem yêu cầu trả hàng từ khách thuộc các đơn của shop, thực hiện Duyệt hoặc Từ chối (nhập lý do) khi ở trạng thái Requested."
      />

      <MockDataNotice endpointHint="GET /api/v1/returns · POST /api/v1/returns/{id}/approve | /reject" />

      <div className="ew-tabs-bar" role="tablist" aria-label="Lọc trạng thái trả hàng">
        {RETURN_TABS.map((tab) => {
          const isActive = filters.status === tab.value;
          const count =
            tab.value === "ALL"
              ? myReturns.length
              : myReturns.filter((r) => r.status === tab.value).length;
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
              <span className="ew-tab-count ks-tabular">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="ew-card ew-toolbar" style={{ marginBottom: "16px" }}>
        <div className="ew-toolbar__search">
          <SearchInput
            value={filters.q}
            onChange={(val) => setFilter("q", val)}
            placeholder="Tìm theo mã RMA, mã đơn con, tên khách hoặc lý do..."
            ariaLabel="Tìm kiếm yêu cầu trả hàng"
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
            icon={<RotateCcw size={28} />}
            title="Chưa có yêu cầu trả hàng phù hợp"
            description="Các yêu cầu hoàn trả từ khách hàng thuộc đơn đã giao của shop sẽ xuất hiện tại đây."
          />
        </div>
      ) : (
        <div className="ew-card">
          <div className="ew-table-scroll">
            <table className="ew-table">
              <thead>
                <tr>
                  <th>Mã yêu cầu / Đơn gốc</th>
                  <th>Khách hàng &amp; Dòng hàng trả</th>
                  <th>Lý do trả hàng</th>
                  <th>Ngày gửi</th>
                  <th>Trạng thái</th>
                  <th className="ew-table__cell--right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.returnRequestId}>
                    <td>
                      <div className="ks-tabular" style={{ fontWeight: 700, color: "var(--color-dark)" }}>
                        {item.requestCode}
                      </div>
                      <div className="ks-tabular" style={{ fontSize: "0.78rem", color: "var(--color-muted)" }}>
                        {item.sellerOrderCode}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--color-dark)" }}>{item.customerName}</div>
                      <div className="ks-tabular" style={{ fontSize: "0.78rem", color: "var(--color-muted)" }}>
                        {item.items.map((it) => `${it.sku} (x${it.quantity})`).join(", ")}
                      </div>
                    </td>
                    <td style={{ maxWidth: "320px" }}>{item.reason}</td>
                    <td className="ks-tabular" style={{ whiteSpace: "nowrap", fontSize: "0.82rem" }}>
                      {formatDate(item.createdAt)}
                    </td>
                    <td>
                      <StatusBadge status={item.status} domain="return" />
                    </td>
                    <td className="ew-table__cell--right">
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<Eye size={14} />}
                        onClick={() => setSelectedId(item.returnRequestId)}
                      >
                        Xem chi tiết
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inspection Drawer 520px */}
      <InspectionDrawer
        isOpen={Boolean(selected)}
        title={selected ? `Yêu cầu trả hàng ${selected.requestCode}` : ""}
        subtitle={
          selected
            ? `Đơn con ${selected.sellerOrderCode} · Gửi lúc ${formatDate(selected.createdAt)}`
            : undefined
        }
        headerBadge={
          selected ? <StatusBadge status={selected.status} domain="return" size="md" /> : undefined
        }
        onClose={() => setSelectedId(null)}
        footer={
          selected && selected.status === "Requested" ? (
            <div className="ew-drawer__actions-grid">
              <Button
                variant="danger"
                leftIcon={<XCircle size={15} />}
                onClick={() => setActionModal({ type: "REJECT", record: selected })}
              >
                Từ chối trả hàng
              </Button>
              <Button
                variant="primary"
                leftIcon={<CheckCircle2 size={15} />}
                onClick={() => setActionModal({ type: "APPROVE", record: selected })}
              >
                Duyệt trả hàng
              </Button>
            </div>
          ) : undefined
        }
      >
        {selected && (
          <>
            <div className="ew-drawer__section">
              <span className="ew-drawer__section-title">Lý do khách hàng yêu cầu trả</span>
              <div className="ew-notice ew-notice--warning">{selected.reason}</div>
            </div>

            <div className="ew-drawer__section">
              <span className="ew-drawer__section-title">
                Dòng hàng trả ({selected.items.length})
              </span>
              {selected.items.map((it) => (
                <div key={it.returnItemId} className="ew-line-item">
                  <div>
                    <div className="ew-line-item__title">{it.productName}</div>
                    <div className="ew-line-item__meta ks-tabular">
                      <span>SKU: {it.sku}</span>
                      <span>·</span>
                      <span>SL trả: x{it.quantity}</span>
                      <span>·</span>
                      <span>{formatCurrency(it.unitPrice * it.quantity)}</span>
                    </div>
                  </div>
                  <StatusBadge status={it.inspectionResult} domain="inspection" />
                </div>
              ))}
            </div>

            {selected.evidenceFiles.length > 0 && (
              <div className="ew-drawer__section">
                <span className="ew-drawer__section-title">
                  Bằng chứng đính kèm ({selected.evidenceFiles.length})
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {selected.evidenceFiles.map((file) => (
                    <span key={file} className="ew-chip ks-tabular">
                      <FileText size={13} color="var(--color-primary)" aria-hidden="true" />
                      <span>{file}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selected.rejectReason && (
              <div className="ew-notice ew-notice--danger">
                <div className="ew-notice__head">Lý do từ chối đã ghi nhận</div>
                <div>{selected.rejectReason}</div>
              </div>
            )}

            <div className="ew-notice ew-notice--info">
              Sau khi bạn duyệt (<code>Approved</code>), khách sẽ gửi hàng về <strong>Kho sàn Hà Nội</strong> để Quản lý kho kiểm định tình trạng tại màn <strong>W9</strong> trước khi Admin xử lý hoàn tiền.
            </div>
          </>
        )}
      </InspectionDrawer>

      <ReasonActionModal
        isOpen={Boolean(actionModal)}
        title={
          actionModal?.type === "APPROVE"
            ? "Duyệt yêu cầu trả hàng"
            : "Từ chối yêu cầu trả hàng"
        }
        description={
          actionModal
            ? `Phiếu ${actionModal.record.requestCode} (Đơn con ${actionModal.record.sellerOrderCode} — Khách ${actionModal.record.customerName}).`
            : ""
        }
        confirmLabel={actionModal?.type === "APPROVE" ? "Xác nhận duyệt" : "Xác nhận từ chối"}
        tone={actionModal?.type === "APPROVE" ? "primary" : "danger"}
        requireReason={actionModal?.type === "REJECT"}
        reasonLabel="Lý do từ chối yêu cầu trả hàng (RejectReason)"
        onConfirm={handleConfirmModal}
        onClose={() => setActionModal(null)}
      />
    </section>
  );
};
