import React, { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { SellerModerationAction } from "@/features/admin/components/SellerModerationConfirmDialog";
import type { SellerProfile } from "@/types/seller";
import { formatDate } from "@/utils/formatters";

export interface SellerDetailDrawerProps {
  seller: SellerProfile | null;
  onClose: () => void;
  onAction: (action: SellerModerationAction, seller: SellerProfile) => void;
  isMutating?: boolean;
  disableEscape?: boolean;
}

interface DetailField {
  label: string;
  value: string;
  full?: boolean;
}

const DetailSection: React.FC<{ title: string; fields: readonly DetailField[] }> = ({
  title,
  fields,
}) => (
  <div className="ew-drawer__section">
    <h3 className="ew-drawer__section-title">{title}</h3>
    <dl className="ew-detail-grid ew-detail-grid--compact">
      {fields.map((field) => (
        <div
          key={field.label}
          className={`ew-detail-item ${field.full ? "ew-detail-item--full" : ""}`.trim()}
        >
          <dt>{field.label}</dt>
          <dd>{field.value}</dd>
        </div>
      ))}
    </dl>
  </div>
);

export const SellerDetailDrawer: React.FC<SellerDetailDrawerProps> = ({
  seller,
  onClose,
  onAction,
  isMutating = false,
  disableEscape = false,
}) => {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!seller) return;
    const rafId = window.requestAnimationFrame(() => panelRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isMutating && !disableEscape) {
        event.preventDefault();
        onCloseRef.current();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(rafId);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [disableEscape, isMutating, seller]);

  if (!seller) return null;

  return (
    <div
      className="ew-drawer-backdrop"
      onMouseDown={(e) => {
        if (!isMutating && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="ew-drawer"
      >
        <div className="ew-drawer__header">
          <div>
            <h2 id={titleId} className="ew-drawer__title">
              Chi tiết hồ sơ #{seller.sellerId}
            </h2>
            <p className="ew-drawer__subtitle">{seller.businessName}</p>
          </div>

          <button
            type="button"
            disabled={isMutating}
            onClick={onClose}
            className="ew-icon-btn"
            aria-label="Đóng ngăn chi tiết"
          >
            <X size={20} />
          </button>
        </div>

        <div className="ew-drawer__body">
          <div className="ew-drawer__section">
            <div className="ew-drawer__status-row">
              <span className="ew-drawer__section-label">Trạng thái hiện tại</span>
              <StatusBadge status={seller.status} domain="seller" size="md" />
            </div>

            {seller.rejectReason && (
              <div className="ew-banner ew-banner--danger" style={{ marginTop: 12 }}>
                <div>
                  <strong>{seller.status === "Suspended" ? "Lý do khóa:" : "Lý do từ chối:"}</strong>
                  <p className="ew-banner__desc">{seller.rejectReason}</p>
                </div>
              </div>
            )}
          </div>

          <DetailSection
            title="Thông tin doanh nghiệp"
            fields={[
              { label: "Tên doanh nghiệp / Hộ KD", value: seller.businessName, full: true },
              { label: "Mã số thuế", value: seller.taxCode || "Chưa cung cấp" },
              { label: "Hoa hồng sàn", value: `${seller.commissionRate}%` },
              { label: "Mô tả", value: seller.description || "Không có mô tả.", full: true },
            ]}
          />

          <DetailSection
            title="Tài khoản đăng ký"
            fields={[
              { label: "Họ tên", value: seller.user?.fullName || "—" },
              { label: "Email", value: seller.user?.email || "—" },
              { label: "Số điện thoại", value: seller.user?.phoneNumber || "—" },
              { label: "Tên đăng nhập", value: seller.user?.username || "—" },
            ]}
          />

          <DetailSection
            title="Mốc thời gian"
            fields={[
              { label: "Ngày đăng ký", value: formatDate(seller.createdAt) },
              { label: "Ngày duyệt", value: seller.approvedAt ? formatDate(seller.approvedAt) : "—" },
              {
                label: "Cập nhật gần nhất",
                value: seller.updatedAt ? formatDate(seller.updatedAt) : "—",
                full: true,
              },
            ]}
          />
        </div>

        <div className="ew-drawer__footer">
          <Button variant="secondary" disabled={isMutating} onClick={onClose}>
            Đóng
          </Button>
          {seller.status === "Pending" && (
            <>
              <Button variant="danger" disabled={isMutating} onClick={() => onAction("reject", seller)}>
                Từ chối
              </Button>
              <Button variant="primary" disabled={isMutating} onClick={() => onAction("approve", seller)}>
                Duyệt hồ sơ
              </Button>
            </>
          )}
          {seller.status === "Approved" && (
            <Button variant="danger" disabled={isMutating} onClick={() => onAction("suspend", seller)}>
              Khóa tài khoản
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
