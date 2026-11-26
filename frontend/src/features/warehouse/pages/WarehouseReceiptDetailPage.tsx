import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Lock,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { MockDataNotice } from "@/components/common/MockDataNotice";
import { PageHeader } from "@/components/common/PageHeader";
import { ReasonActionModal } from "@/components/common/ReasonActionModal";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ROUTES } from "@/constants/routes";
import { useToast } from "@/hooks/useToast";
import { isSameWarehouseActor, useOperationsStore } from "@/services/operationsStore";
import { useAuthStore } from "@/stores/authStore";
import { RECEIPT_TYPE_LABELS } from "@/types/operations";
import { formatCurrency, formatDate } from "@/utils/formatters";

export const WarehouseReceiptDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const currentUser = useAuthStore((s) => s.user);

  const receipts = useOperationsStore((s) => s.receipts);
  const confirmReceipt = useOperationsStore((s) => s.confirmReceipt);
  const cancelReceipt = useOperationsStore((s) => s.cancelReceipt);

  const [modalMode, setModalMode] = useState<"CONFIRM" | "CANCEL" | null>(null);

  const receipt = receipts.find((r) => r.receiptId === Number(id));

  if (!receipt) {
    return (
      <div className="ew-card">
        <EmptyState
          icon={<FileText size={28} />}
          title="Không tìm thấy phiếu nhập kho"
          description={`Phiếu nhập #${id ?? ""} không tồn tại.`}
          action={
            <Button variant="primary" onClick={() => navigate(ROUTES.WAREHOUSE_RECEIPTS)}>
              Quay lại danh sách phiếu nhập
            </Button>
          }
        />
      </div>
    );
  }

  const isDraft = receipt.status === "Draft";
  const isSelfCreated =
    currentUser !== null &&
    isSameWarehouseActor(
      receipt.createdBy,
      receipt.createdByEmail,
      currentUser.userId,
      currentUser.email
    );

  const handleAction = async (reason: string) => {
    const actorId = currentUser?.userId ?? 3;
    const actorName = currentUser?.fullName ?? "Quản lý kho";

    const res =
      modalMode === "CONFIRM"
        ? confirmReceipt(receipt.receiptId, actorId, actorName, currentUser?.email ?? null)
        : cancelReceipt(receipt.receiptId, reason, actorName);

    if (res.ok) {
      toast.success(res.message);
      setModalMode(null);
    } else {
      toast.error(res.message);
    }
  };

  return (
    <section>
      <Link to={ROUTES.WAREHOUSE_RECEIPTS} className="ew-back-link">
        <ArrowLeft size={15} aria-hidden="true" />
        <span>Quay lại Danh sách phiếu nhập (W5a)</span>
      </Link>

      <PageHeader
        title={`Phiếu nhập kho #${receipt.receiptCode}`}
        subtitle={`${RECEIPT_TYPE_LABELS[receipt.receiptType]} · ${receipt.warehouseName} · Tạo lúc ${formatDate(receipt.createdAt)}`}
        badge={<StatusBadge status={receipt.status} domain="receipt" size="md" />}
        actions={
          isDraft ? (
            <>
              <Button
                variant="danger"
                leftIcon={<XCircle size={16} />}
                onClick={() => setModalMode("CANCEL")}
              >
                Hủy phiếu Draft
              </Button>
              <Button
                variant="primary"
                leftIcon={isSelfCreated ? <Lock size={16} /> : <CheckCircle2 size={16} />}
                disabled={isSelfCreated}
                title={
                  isSelfCreated
                    ? "Người tạo phiếu không được tự xác nhận (SELF_APPROVAL_NOT_ALLOWED)"
                    : undefined
                }
                onClick={() => setModalMode("CONFIRM")}
              >
                Xác nhận nhập kho
              </Button>
            </>
          ) : undefined
        }
      />

      <MockDataNotice endpointHint={`GET /api/v1/receipts/${receipt.receiptId} · POST .../confirm | /cancel`} />

      {/* Cảnh báo tách quyền SELF_APPROVAL_NOT_ALLOWED */}
      {isDraft && isSelfCreated && (
        <div className="ew-notice ew-notice--warning" style={{ marginBottom: "18px" }}>
          <div className="ew-notice__head">
            <ShieldAlert size={16} aria-hidden="true" />
            <span>Nút Xác nhận bị khóa theo quy tắc tách quyền (SELF_APPROVAL_NOT_ALLOWED)</span>
          </div>
          <div>
            Bạn (<strong>{currentUser?.fullName}</strong>) là người tạo phiếu nhập này. Theo ràng buộc{" "}
            <code>CK_Receipts_Separation</code>, vui lòng đăng nhập bằng tài khoản Quản lý kho thứ 2 (
            <code>manager2@gmail.com</code> hoặc <code>manager1@gmail.com</code>) để xác nhận nhập kho.
          </div>
        </div>
      )}

      {receipt.status === "Confirmed" && (
        <div className="ew-notice ew-notice--success" style={{ marginBottom: "18px" }}>
          <div className="ew-notice__head">
            <CheckCircle2 size={16} aria-hidden="true" />
            <span>Phiếu đã xác nhận nhập kho — Không thể hủy trực tiếp</span>
          </div>
          <div>
            Xác nhận bởi <strong>{receipt.confirmedByName}</strong> lúc{" "}
            <span className="ks-tabular">{formatDate(receipt.confirmedAt)}</span>. Tồn kho đã được cộng và bút toán đã ghi vào{" "}
            <Link to={ROUTES.WAREHOUSE_STOCK_MOVEMENTS} style={{ textDecoration: "underline", fontWeight: 700 }}>
              Thẻ kho (W4)
            </Link>
            .
          </div>
        </div>
      )}

      <div className="ew-split-detail">
        <div className="ew-card">
          <div className="ew-card-head">
            <h2 className="ew-card-title">Chi tiết các dòng hàng nhập ({receipt.details.length})</h2>
          </div>
          <div className="ew-table-scroll">
            <table className="ew-table">
              <thead>
                <tr>
                  <th>Biến thể (SKU / Sản phẩm)</th>
                  <th>Vị trí kệ nhận</th>
                  <th className="ew-table__cell--right">Số lượng nhập</th>
                  <th className="ew-table__cell--right">Đơn giá vốn</th>
                </tr>
              </thead>
              <tbody>
                {receipt.details.map((d) => (
                  <tr key={d.receiptDetailId}>
                    <td>
                      <div style={{ fontWeight: 700, color: "var(--color-dark)" }}>
                        {d.productName}
                      </div>
                      <div className="ks-tabular" style={{ fontSize: "0.78rem", color: "var(--color-muted)" }}>
                        SKU: {d.sku} · Barcode: {d.barcode || "—"}
                      </div>
                    </td>
                    <td className="ks-tabular" style={{ fontWeight: 700 }}>
                      {d.locationCode}
                    </td>
                    <td className="ew-table__cell--right ks-tabular" style={{ fontWeight: 800, color: "var(--color-primary)" }}>
                      +{d.quantity}
                    </td>
                    <td className="ew-table__cell--right ks-tabular">
                      {d.unitCost !== null ? formatCurrency(d.unitCost) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="ew-card">
          <div className="ew-card-head">
            <h2 className="ew-card-title">Thông tin chứng từ &amp; Tách quyền</h2>
          </div>
          <div className="ew-card-body">
            <div className="ew-info-list">
              <div className="ew-info-row">
                <span className="ew-info-key">Kho nhận hàng</span>
                <span className="ew-info-val">{receipt.warehouseName}</span>
              </div>
              <div className="ew-info-row">
                <span className="ew-info-key">Nguồn Seller</span>
                <span className="ew-info-val">{receipt.senderSellerName ?? "Không áp dụng"}</span>
              </div>
              <div className="ew-info-row">
                <span className="ew-info-key">Người tạo (CreatedBy)</span>
                <span className="ew-info-val">{receipt.createdByName}</span>
              </div>
              <div className="ew-info-row">
                <span className="ew-info-key">Người xác nhận (ConfirmedBy)</span>
                <span className="ew-info-val">{receipt.confirmedByName ?? "Chưa xác nhận"}</span>
              </div>
              <div className="ew-info-row">
                <span className="ew-info-key">Ghi chú</span>
                <span className="ew-info-val">{receipt.note || "—"}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <ReasonActionModal
        isOpen={Boolean(modalMode)}
        title={
          modalMode === "CONFIRM"
            ? "Xác nhận nhập kho (Tăng tồn & Ghi sổ cái)"
            : "Hủy phiếu nhập kho Draft"
        }
        description={
          modalMode === "CONFIRM"
            ? `Phiếu ${receipt.receiptCode} sẽ chuyển sang Confirmed, cộng tồn vào bảng Inventory và ghi bút toán Receipt vào StockMovements. Sau khi xác nhận sẽ không thể hủy.`
            : `Phiếu nháp ${receipt.receiptCode} sẽ bị hủy và không làm thay đổi tồn kho.`
        }
        confirmLabel={modalMode === "CONFIRM" ? "Xác nhận nhập kho" : "Xác nhận hủy phiếu"}
        tone={modalMode === "CONFIRM" ? "primary" : "danger"}
        requireReason={modalMode === "CANCEL"}
        reasonLabel="Lý do hủy phiếu nhập Draft"
        onConfirm={handleAction}
        onClose={() => setModalMode(null)}
      />
    </section>
  );
};
