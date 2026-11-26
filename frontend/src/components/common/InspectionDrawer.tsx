import React, { useEffect } from "react";
import { X } from "lucide-react";

export interface InspectionDrawerProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  headerBadge?: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export const InspectionDrawer: React.FC<InspectionDrawerProps> = ({
  isOpen,
  title,
  subtitle,
  headerBadge,
  onClose,
  footer,
  children,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="ew-inspect-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <aside
        className="ew-inspect-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ew-inspect-drawer__header">
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <h2 className="ew-inspect-drawer__title ks-tabular">{title}</h2>
              {headerBadge}
            </div>
            {subtitle && <p className="ew-inspect-drawer__subtitle ks-tabular">{subtitle}</p>}
          </div>

          <button
            type="button"
            className="ew-icon-btn"
            aria-label="Đóng bảng chi tiết"
            onClick={onClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="ew-inspect-drawer__body">{children}</div>

        {footer && <div className="ew-inspect-drawer__footer">{footer}</div>}
      </aside>
    </div>
  );
};
