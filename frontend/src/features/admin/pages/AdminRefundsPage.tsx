import React, { useMemo, useState } from "react";
import {
  BadgeDollarSign,
  CheckCircle2,
  Eye,
  Send,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { InspectionDrawer } from "@/components/common/InspectionDrawer";
import { MockDataNotice } from "@/components/common/MockDataNotice";
import { PageHeader } from "@/components/common/PageHeader";
import { ReasonActionModal } from "@/components/common/ReasonActionModal";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/hooks/useToast";
import { useOperationsStore } from "@/services/operationsStore";
import { useAuthStore } from "@/stores/authStore";
import {
  PAYMENT_METHOD_LABELS,
  type RefundRecordDto,
  type RefundStatus,
} from "@/types/operations";
import { formatCurrency, formatDate } from "@/utils/formatters";

const HIGH_VALUE_THRESHOLD_VND = 5_000_000;

const REFUND_TABS: Array<{ value: "ALL" | RefundStatus; label: string }> = [
  { value: "Pending", label: "Chờ xử lý (Pending)" },
  { value: "Approved", label: "Đã duyệt chờ chuyển" },
  { value: "Completed", label: "Đã hoàn tiền" },
  { value: "Rejected", label: "Từ chối" },
  { value: "ALL", label: "Tất cả" },
];

export const AdminRefundsPage: React.FC = () => {
  const toast = useToast();
  const currentUser = useAuthStore((s) => s.user);
  const refunds = useOperationsStore((s) => s.refunds);
  const approveRefund = useOperationsStore((s) => s.approveRefund);
  const rejectRefund = useOperationsStore((s) => s.rejectRefund);
  const completeRefund = useOperationsStore((s) => s.completeRefund);

  // Mặc định lọc Pending theo đặc tả A6
  const [statusFilter, setStatusFilter] = useState<"ALL" | RefundStatus>("Pending");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [actionModal, setActionModal] = useState<{
    type: "APPROVE" | "REJECT" | "COMPLETE";
    record: RefundRecordDto;
  } | null>(null);

  const filtered = useMemo(
    () =>
      statusFilter === "ALL"
        ? refunds
        : refunds.filter((r) => r.refundStatus === statusFilter),
    [refunds, statusFilter]
  );

  const selected = refunds.find((r) => r.refundId === selectedId) ?? null;

  const handleConfirmAction = async (reason: string) => {
    if (!actionModal) return;
    const actorId = currentUser?.userId ?? 1;
    const actorName = currentUser?.fullName ?? "Quản trị viên";

    const res =
      actionModal.type === "APPROVE"
        ? approveRefund(actionModal.record.refundId, actorId, actorName)
        : actionModal.type === "REJECT"
          ? rejectRefund(actionModal.record.refundId, reason, actorId, actorName)
          : completeRefund(actionModal.record.refundId, actorName);

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
        title="Quản lý hoàn tiền (A6)"
        subtitle="Đối soát số đã thanh toán, số đã hoàn và hạn mức còn được hoàn (chống REFUND_EXCEEDS_PAID). Xác nhận kép cho giao dịch ≥ 5.000.000₫."
      />

      <MockDataNotice endpointHint="GET /api/v1/admin/refunds?status=Pending · POST .../approve | /reject | /complete" />

      <div className="ew-tabs-bar" role="tablist" aria-label="Lọc trạng thái hoàn tiền">
        {REFUND_TABS.map((tab) => {
          const active = statusFilter === tab.value;
          const count =
            tab.value === "ALL"
              ? refunds.length
              : refunds.filter((r) => r.refundStatus === tab.value).length;
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

      {filtered.length === 0 ? (
        <div className="ew-card">
          <EmptyState
            icon={<BadgeDollarSign size={28} />}
            title="Không có yêu cầu hoàn tiền nào ở trạng thái này"
            description="Chuyển tab trạng thái khác để xem các lệnh hoàn tiền đã xử lý."
          />
        </div>
      ) : (
        <div className="ew-card">
          <div className="ew-table-scroll">
            <table className="ew-table">
              <thead>
                <tr>
                  <th>Mã hoàn tiền / Đơn gốc</th>
                  <th>Khách hàng &amp; Gian hàng</th>
                  <th>Lý do hoàn tiền</th>
                  <th className="ew-table__cell--right">Số tiền hoàn</th>
                  <th>Ngày yêu cầu</th>
                  <th>Trạng thái</th>
                  <th className="ew-table__cell--right">Xử lý</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((rf) => {
                  const highValue = rf.amount >= HIGH_VALUE_THRESHOLD_VND;
                  return (
                    <tr key={rf.refundId}>
                      <td>
                        <div className="ks-tabular" style={{ fontWeight: 800, color: "var(--color-dark)" }}>
                          {rf.refundCode}
                        </div>
                        <div className="ks-tabular" style={{ fontSize: "0.76rem", color: "var(--color-muted)" }}>
                          {rf.orderCode}
                          {rf.returnRequestCode ? ` · ${rf.returnRequestCode}` : ""}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{rf.customerName}</div>
                        <div style={{ fontSize: "0.78rem", color: "var(--color-muted)" }}>
                          {rf.shopName}
                        </div>
                      </td>
                      <td style={{ maxWidth: "280px" }}>{rf.reason}</td>
                      <td className="ew-table__cell--right ks-tabular">
                        <div style={{ fontWeight: 800, color: "var(--color-danger)" }}>
                          {formatCurrency(rf.amount)}
                        </div>
                        {highValue && (
                          <div style={{ fontSize: "0.72rem", color: "var(--color-warning)", fontWeight: 600 }}>
                            Xác nhận kép
                          </div>
                        )}
                      </td>
                      <td className="ks-tabular" style={{ fontSize: "0.82rem", whiteSpace: "nowrap" }}>
                        {formatDate(rf.createdAt)}
                      </td>
                      <td>
                        <StatusBadge status={rf.refundStatus} domain="refund" />
                      </td>
                      <td className="ew-table__cell--right">
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          {rf.refundStatus === "Approved" && (
                            <Button
                              variant="primary"
                              size="sm"
                              leftIcon={<Send size={13} />}
                              onClick={() => setActionModal({ type: "COMPLETE", record: rf })}
                            >
                              Hoàn thành
                            </Button>
                          )}
                          <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<Eye size={14} />}
                            onClick={() => setSelectedId(rf.refundId)}
                          >
                            Đối soát
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

      {/* Inspection Drawer với Khối đối soát REFUND_EXCEEDS_PAID */}
      <InspectionDrawer
        isOpen={Boolean(selected)}
        title={selected ? `Đối soát hoàn tiền ${selected.refundCode}` : ""}
        subtitle={
          selected
            ? `Đơn ${selected.orderCode} · ${PAYMENT_METHOD_LABELS[selected.paymentMethod]}`
            : undefined
        }
        headerBadge={
          selected ? (
            <StatusBadge status={selected.refundStatus} domain="refund" size="md" />
          ) : undefined
        }
        onClose={() => setSelectedId(null)}
        footer={
          selected && selected.refundStatus === "Pending" ? (() => {
            const exceedsPaid =
              selected.amount > selected.paidAmount - selected.previouslyRefundedAmount;
            return (
              <div className="ew-drawer__actions-grid">
                <Button
                  variant="danger"
                  leftIcon={<XCircle size={15} />}
                  onClick={() => setActionModal({ type: "REJECT", record: selected })}
                >
                  Từ chối hoàn tiền
                </Button>
                <Button
                  variant="primary"
                  disabled={exceedsPaid}
                  title={
                    exceedsPaid
                      ? "Số tiền hoàn vượt hạn mức còn lại (REFUND_EXCEEDS_PAID)"
                      : undefined
                  }
                  leftIcon={<CheckCircle2 size={15} />}
                  onClick={() => setActionModal({ type: "APPROVE", record: selected })}
                >
                  Duyệt hoàn tiền
                </Button>
              </div>
            );
          })() : selected && selected.refundStatus === "Approved" ? (
            <Button
              variant="primary"
              fullWidth
              leftIcon={<Send size={15} />}
              onClick={() => setActionModal({ type: "COMPLETE", record: selected })}
            >
              Xác nhận Đã chuyển tiền (Complete)
            </Button>
          ) : undefined
        }
      >
        {selected && (() => {
          const remainingRefundable =
            selected.paidAmount - selected.previouslyRefundedAmount;
          const exceeds = selected.amount > remainingRefundable;
          return (
            <>
              <div className="ew-drawer__section">
                <span className="ew-drawer__section-title">
                  Đối soát hạn mức thanh toán (Chống REFUND_EXCEEDS_PAID)
                </span>
                <div className="ew-stat-pair ew-stat-pair--3 ks-tabular">
                  <div className="ew-stat-tile">
                    <div className="ew-stat-tile__value" style={{ fontSize: "1rem" }}>
                      {formatCurrency(selected.paidAmount)}
                    </div>
                    <div className="ew-stat-tile__label">Đã thanh toán</div>
                  </div>
                  <div className="ew-stat-tile">
                    <div className="ew-stat-tile__value" style={{ fontSize: "1rem" }}>
                      {formatCurrency(selected.previouslyRefundedAmount)}
                    </div>
                    <div className="ew-stat-tile__label">Đã hoàn trước đó</div>
                  </div>
                  <div className="ew-stat-tile">
                    <div
                      className="ew-stat-tile__value"
                      style={{ fontSize: "1rem", color: "var(--color-primary)" }}
                    >
                      {formatCurrency(remainingRefundable)}
                    </div>
                    <div className="ew-stat-tile__label">Còn được hoàn tối đa</div>
                  </div>
                </div>

                <div
                  className={`ew-notice ${exceeds ? "ew-notice--danger" : "ew-notice--info"}`}
                >
                  <div className="ew-notice__head">
                    <ShieldAlert size={15} aria-hidden="true" />
                    <span>
                      Số tiền yêu cầu hoàn lần này: {formatCurrency(selected.amount)}
                    </span>
                  </div>
                  {exceeds
                    ? "Cảnh báo: Vượt quá số tiền còn được hoàn (REFUND_EXCEEDS_PAID)!"
                    : "Hợp lệ — nằm trong hạn mức đã thanh toán của giao dịch."}
                </div>
              </div>

              <div className="ew-drawer__section">
                <span className="ew-drawer__section-title">Chi tiết yêu cầu</span>
                <div className="ew-info-list">
                  <div className="ew-info-row">
                    <span className="ew-info-key">Khách hàng</span>
                    <span className="ew-info-val">{selected.customerName}</span>
                  </div>
                  <div className="ew-info-row">
                    <span className="ew-info-key">Gian hàng</span>
                    <span className="ew-info-val">{selected.shopName}</span>
                  </div>
                  <div className="ew-info-row">
                    <span className="ew-info-key">Lý do hoàn</span>
                    <span className="ew-info-val">{selected.reason}</span>
                  </div>
                  <div className="ew-info-row">
                    <span className="ew-info-key">Người duyệt (ApprovedBy)</span>
                    <span className="ew-info-val">{selected.approvedByName ?? "Chưa duyệt"}</span>
                  </div>
                  <div className="ew-info-row">
                    <span className="ew-info-key">Ngày hoàn thành (ProcessedAt)</span>
                    <span className="ew-info-val ks-tabular">
                      {selected.processedAt ? formatDate(selected.processedAt) : "Chưa chuyển tiền"}
                    </span>
                  </div>
                </div>
              </div>

              {selected.rejectReason && (
                <div className="ew-notice ew-notice--danger">
                  <div className="ew-notice__head">Lý do từ chối</div>
                  <div>{selected.rejectReason}</div>
                </div>
              )}
            </>
          );
        })()}
      </InspectionDrawer>

      <ReasonActionModal
        isOpen={Boolean(actionModal)}
        title={
          actionModal?.type === "APPROVE"
            ? "Phê duyệt yêu cầu hoàn tiền"
            : actionModal?.type === "COMPLETE"
              ? "Xác nhận đã hoàn tất chuyển tiền (Complete)"
              : "Từ chối yêu cầu hoàn tiền"
        }
        description={
          actionModal
            ? `Lệnh ${actionModal.record.refundCode} (${actionModal.record.customerName}) — Số tiền ${formatCurrency(actionModal.record.amount)}.`
            : ""
        }
        confirmLabel={
          actionModal?.type === "APPROVE"
            ? "Duyệt hoàn tiền"
            : actionModal?.type === "COMPLETE"
              ? "Đánh dấu Hoàn thành"
              : "Xác nhận từ chối"
        }
        tone={actionModal?.type === "REJECT" ? "danger" : "primary"}
        requireReason={actionModal?.type === "REJECT"}
        reasonLabel="Lý do từ chối hoàn tiền"
        requireDoubleConfirm={
          actionModal?.type === "APPROVE" &&
          actionModal.record.amount >= HIGH_VALUE_THRESHOLD_VND
        }
        doubleConfirmLabel="Xác nhận kép: Khoản hoàn tiền ≥ 5.000.000₫ đã được đối soát đủ giao dịch Payments và biên bản trả hàng."
        onConfirm={handleConfirmAction}
        onClose={() => setActionModal(null)}
      />
    </section>
  );
};
