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
import { useOperationsStore } from "@/services/operationsStore";
import { useAuthStore } from "@/stores/authStore";
import type { ReturnRequestRecordDto, ReturnStatus } from "@/types/operations";
import { formatCurrency, formatDate } from "@/utils/formatters";

const TABS: Array<{ value: "ALL" | ReturnStatus; label: string }> = [
  { value: "ALL", label: "Tất cả" },
  { value: "Requested", label: "Chờ duyệt" },
  { value: "Approved", label: "Đã duyệt" },
  { value: "ItemsReceived", label: "Kho đã nhận" },
  { value: "Inspected", label: "Kho đã kiểm" },
  { value: "Completed", label: "Hoàn tất" },
  { value: "Rejected", label: "Từ chối" },
];

export const AdminReturnsPage: React.FC = () => {
  const toast = useToast();
  const currentUser = useAuthStore((s) => s.user);
  const returns = useOperationsStore((s) => s.returns);
  const approveReturnRequest = useOperationsStore((s) => s.approveReturnRequest);
  const rejectReturnRequest = useOperationsStore((s) => s.rejectReturnRequest);

  const [statusFilter, setStatusFilter] = useState<"ALL" | ReturnStatus>("ALL");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [modalAction, setModalAction] = useState<{
    type: "APPROVE" | "REJECT";
    record: ReturnRequestRecordDto;
  } | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return returns.filter((r) => {
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        r.requestCode.toLowerCase().includes(q) ||
        r.sellerOrderCode.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        r.shopName.toLowerCase().includes(q)
      );
    });
  }, [returns, statusFilter, query]);

  const selected = returns.find((r) => r.returnRequestId === selectedId) ?? null;

  const handleConfirm = async (reason: string) => {
    if (!modalAction) return;
    const actorId = currentUser?.userId ?? 1;
    const actorName = `${currentUser?.fullName ?? "Quản trị viên"} (Admin)`;

    const res =
      modalAction.type === "APPROVE"
        ? approveReturnRequest(modalAction.record.returnRequestId, actorId, actorName)
        : rejectReturnRequest(modalAction.record.returnRequestId, reason, actorId, actorName);

    if (res.ok) {
      toast.success(res.message);
      setModalAction(null);
    } else {
      toast.error(res.message);
    }
  };

  return (
    <section>
      <PageHeader
        title="Quản lý trả hàng toàn sàn (A5)"
        subtitle="Giám sát mọi yêu cầu trả hàng trên toàn sàn (kể cả shop bị khóa hoặc có tranh chấp) và can thiệp Duyệt / Từ chối thay Seller khi cần."
      />

      <MockDataNotice endpointHint="GET /api/v1/returns · POST /api/v1/returns/{id}/approve | /reject" />

      <div className="ew-tabs-bar" role="tablist" aria-label="Lọc trạng thái trả hàng toàn sàn">
        {TABS.map((tab) => {
          const active = statusFilter === tab.value;
          const count =
            tab.value === "ALL"
              ? returns.length
              : returns.filter((r) => r.status === tab.value).length;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={active}
              className={`ew-tab-btn ${active ? "ew-tab-btn--active" : ""}`}
              onClick={() => setStatusFilter(tab.value)}
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
            value={query}
            onChange={setQuery}
            placeholder="Tìm mã RMA, mã đơn con, tên khách hàng hoặc tên shop..."
            ariaLabel="Tìm kiếm yêu cầu trả hàng toàn sàn"
          />
        </div>
        {(statusFilter !== "ALL" || query !== "") && (
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RotateCcw size={14} />}
            onClick={() => {
              setStatusFilter("ALL");
              setQuery("");
            }}
          >
            Đặt lại
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="ew-card">
          <EmptyState
            icon={<RotateCcw size={28} />}
            title="Không có yêu cầu trả hàng phù hợp"
            description="Thử chuyển tab trạng thái khác."
          />
        </div>
      ) : (
        <div className="ew-card">
          <div className="ew-table-scroll">
            <table className="ew-table">
              <thead>
                <tr>
                  <th>Mã yêu cầu / Đơn con</th>
                  <th>Khách hàng &amp; Gian hàng</th>
                  <th>Lý do trả hàng</th>
                  <th>Ngày gửi</th>
                  <th>Trạng thái</th>
                  <th className="ew-table__cell--right">Can thiệp</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.returnRequestId}>
                    <td>
                      <div className="ks-tabular" style={{ fontWeight: 700, color: "var(--color-dark)" }}>
                        {r.requestCode}
                      </div>
                      <div className="ks-tabular" style={{ fontSize: "0.78rem", color: "var(--color-muted)" }}>
                        {r.sellerOrderCode} · {r.orderCode}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{r.customerName}</div>
                      <div style={{ fontSize: "0.78rem", color: "var(--color-muted)" }}>
                        {r.shopName}
                      </div>
                    </td>
                    <td style={{ maxWidth: "300px" }}>{r.reason}</td>
                    <td className="ks-tabular" style={{ fontSize: "0.82rem", whiteSpace: "nowrap" }}>
                      {formatDate(r.createdAt)}
                    </td>
                    <td>
                      <StatusBadge status={r.status} domain="return" />
                    </td>
                    <td className="ew-table__cell--right">
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<Eye size={14} />}
                        onClick={() => setSelectedId(r.returnRequestId)}
                      >
                        Xem hồ sơ
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <InspectionDrawer
        isOpen={Boolean(selected)}
        title={selected ? `Trả hàng ${selected.requestCode}` : ""}
        subtitle={selected ? `${selected.shopName} · Đơn ${selected.sellerOrderCode}` : undefined}
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
                onClick={() => setModalAction({ type: "REJECT", record: selected })}
              >
                Từ chối thay Seller
              </Button>
              <Button
                variant="primary"
                leftIcon={<CheckCircle2 size={15} />}
                onClick={() => setModalAction({ type: "APPROVE", record: selected })}
              >
                Duyệt thay Seller
              </Button>
            </div>
          ) : undefined
        }
      >
        {selected && (
          <>
            <div className="ew-drawer__section">
              <span className="ew-drawer__section-title">Phản ánh từ khách hàng ({selected.customerName})</span>
              <div className="ew-notice ew-notice--warning">{selected.reason}</div>
            </div>

            <div className="ew-drawer__section">
              <span className="ew-drawer__section-title">Dòng hàng trả &amp; Kết quả kiểm kho (W9)</span>
              {selected.items.map((it) => (
                <div key={it.returnItemId} className="ew-line-item">
                  <div>
                    <div className="ew-line-item__title">{it.productName}</div>
                    <div className="ew-line-item__meta ks-tabular">
                      <span>SKU: {it.sku} · x{it.quantity}</span>
                      <span>·</span>
                      <span>{formatCurrency(it.unitPrice * it.quantity)}</span>
                      {it.restockLocationCode && (
                        <>
                          <span>·</span>
                          <span>Kệ đích: {it.restockLocationCode}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={it.inspectionResult} domain="inspection" />
                </div>
              ))}
            </div>

            {selected.evidenceFiles.length > 0 && (
              <div className="ew-drawer__section">
                <span className="ew-drawer__section-title">Chứng cứ đính kèm</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {selected.evidenceFiles.map((f) => (
                    <span key={f} className="ew-chip ks-tabular">
                      <FileText size={13} color="var(--color-primary)" aria-hidden="true" />
                      <span>{f}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selected.reviewedByName && (
              <div className="ew-notice ew-notice--info">
                Người xử lý: <strong>{selected.reviewedByName}</strong> lúc{" "}
                <span className="ks-tabular">{formatDate(selected.reviewedAt)}</span>.
              </div>
            )}

            {selected.rejectReason && (
              <div className="ew-notice ew-notice--danger">
                <div className="ew-notice__head">Lý do từ chối</div>
                <div>{selected.rejectReason}</div>
              </div>
            )}
          </>
        )}
      </InspectionDrawer>

      <ReasonActionModal
        isOpen={Boolean(modalAction)}
        title={
          modalAction?.type === "APPROVE"
            ? "Admin duyệt yêu cầu trả hàng thay Seller"
            : "Admin từ chối yêu cầu trả hàng"
        }
        description={
          modalAction
            ? `Phiếu ${modalAction.record.requestCode} — Gian hàng ${modalAction.record.shopName}.`
            : ""
        }
        confirmLabel={modalAction?.type === "APPROVE" ? "Xác nhận duyệt" : "Xác nhận từ chối"}
        tone={modalAction?.type === "APPROVE" ? "primary" : "danger"}
        requireReason={modalAction?.type === "REJECT"}
        reasonLabel="Lý do Admin từ chối (RejectReason)"
        onConfirm={handleConfirm}
        onClose={() => setModalAction(null)}
      />
    </section>
  );
};
