import React, { useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void | Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "primary" | "danger";
  requireReason?: boolean;
  showReason?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  variant = "primary",
  requireReason = false,
  showReason = false,
  reasonLabel = "Lý do thực hiện",
  reasonPlaceholder = "Nhập lý do chi tiết...",
  loading = false,
}) => {
  const hasReasonInput = requireReason || showReason;
  const reasonId = useId();
  const [wasOpen, setWasOpen] = useState(open);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setReason("");
      setReasonError(null);
    }
  }

  const handleConfirm = async () => {
    const trimmed = reason.trim();
    if (requireReason && trimmed.length === 0) {
      setReasonError("Vui lòng nhập lý do trước khi xác nhận.");
      return;
    }

    setReasonError(null);
    await onConfirm(hasReasonInput && trimmed.length > 0 ? trimmed : undefined);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      closeDisabled={loading}
      closeOnOverlayClick={!loading}
      footer={
        <>
          <Button variant="secondary" disabled={loading} onClick={onClose}>
            {cancelText}
          </Button>
          <Button variant={variant} loading={loading} onClick={handleConfirm}>
            {confirmText}
          </Button>
        </>
      }
    >
      <p style={{ fontSize: "0.94rem", color: "var(--color-text)", lineHeight: 1.6 }}>
        {description}
      </p>

      {hasReasonInput && (
        <div style={{ marginTop: "16px" }}>
          <FormField
            label={reasonLabel}
            htmlFor={reasonId}
            required={requireReason}
            error={reasonError}
          >
            <Textarea
              id={reasonId}
              value={reason}
              disabled={loading}
              hasError={Boolean(reasonError)}
              placeholder={reasonPlaceholder}
              onChange={(e) => {
                setReason(e.target.value);
                if (reasonError) setReasonError(null);
              }}
            />
          </FormField>
        </div>
      )}
    </Modal>
  );
};

