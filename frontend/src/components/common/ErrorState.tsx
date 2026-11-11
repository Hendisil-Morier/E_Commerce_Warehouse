import React from "react";
import { AlertCircle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getErrorMessage } from "@/utils/errorHandler";

export interface ErrorStateProps {
  error?: unknown;
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  title = "Không thể tải dữ liệu",
  message,
  onRetry,
  retryLabel = "Thử lại",
}) => {
  const resolvedMessage =
    message ?? (error !== undefined && error !== null ? getErrorMessage(error) : "Đã xảy ra lỗi, vui lòng thử lại.");

  return (
    <div className="ew-state" role="alert">
      <div className="ew-state__icon ew-state__icon--error" aria-hidden="true">
        <AlertCircle size={26} />
      </div>
      <div className="ew-state__title">{title}</div>
      <p className="ew-state__desc">{resolvedMessage}</p>
      {onRetry && (
        <div style={{ marginTop: "6px" }}>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RotateCw size={15} />}
            onClick={onRetry}
          >
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

