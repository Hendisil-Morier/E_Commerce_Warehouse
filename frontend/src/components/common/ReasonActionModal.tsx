import React, { useState } from "react";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";

export interface ReasonActionModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "primary" | "danger";
  requireReason?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  requireDoubleConfirm?: boolean;
  doubleConfirmLabel?: string;
  onConfirm: (reason: string) => void | Promise<void>;
  onClose: () => void;
}

export const ReasonActionModal: React.FC<ReasonActionModalProps> = ({
  isOpen,
  title,
  description,
  confirmLabel,
  tone = "primary",
  requireReason = false,
  reasonLabel = "Lý do thực hiện",
  reasonPlaceholder = "Nhập lý do chi tiết (tối thiểu 6 ký tự)...",
  requireDoubleConfirm = false,
  doubleConfirmLabel = "Tôi xác nhận đã đối chiếu đầy đủ chứng từ và chịu trách nhiệm với thao tác giá trị cao này.",
  onConfirm,
  onClose,
}) => {
  const [reason, setReason] = useState("");
  const [doubleConfirmed, setDoubleConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [wasOpen, setWasOpen] = useState(isOpen);

  if (wasOpen !== isOpen) {
    setWasOpen(isOpen);
    if (!isOpen) {
      setReason("");
      setDoubleConfirmed(false);
      setError(null);
      setSubmitting(false);
    }
  }

  const handleConfirm = async () => {
    const trimmed = reason.trim();
    if (requireReason && trimmed.length < 6) {
      setError("Vui lòng nhập lý do rõ ràng (tối thiểu 6 ký tự).");
      return;
    }
    if (requireDoubleConfirm && !doubleConfirmed) {
      setError("Vui lòng tích chọn ô xác nhận kép trước khi tiếp tục.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await onConfirm(trimmed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      closeOnOverlayClick={!submitting}
      closeDisabled={submitting}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Hủy bỏ
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            loading={submitting}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <div
          className={`ew-notice ${tone === "danger" ? "ew-notice--danger" : "ew-notice--info"}`}
        >
          <div className="ew-notice__head">
            {tone === "danger" ? (
              <AlertTriangle size={15} aria-hidden="true" />
            ) : (
              <ShieldAlert size={15} aria-hidden="true" />
            )}
            <span>Xác nhận thao tác nghiệp vụ</span>
          </div>
          <div>{description}</div>
        </div>

        {requireReason && (
          <FormField
            label={reasonLabel}
            required
            error={error && reason.trim().length < 6 ? error : undefined}
          >
            <Textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={reasonPlaceholder}
              disabled={submitting}
            />
          </FormField>
        )}

        {requireDoubleConfirm && (
          <label className="ew-checkbox-row">
            <input
              type="checkbox"
              checked={doubleConfirmed}
              onChange={(e) => setDoubleConfirmed(e.target.checked)}
              disabled={submitting}
            />
            <span>{doubleConfirmLabel}</span>
          </label>
        )}

        {error && !(requireReason && reason.trim().length < 6) && (
          <p className="ew-field__error">{error}</p>
        )}
      </div>
    </Modal>
  );
};
