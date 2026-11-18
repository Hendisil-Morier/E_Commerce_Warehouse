import React, { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export type ModalSize = "sm" | "md" | "lg";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  size?: ModalSize;
  closeOnOverlayClick?: boolean;
  closeDisabled?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  size = "md",
  closeOnOverlayClick = true,
  closeDisabled = false,
  children,
  footer,
}) => {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const previousActive =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const rafId = window.requestAnimationFrame(() => {
      const panel = dialogRef.current;
      if (!panel) return;
      const bodyControl = panel.querySelector<HTMLElement>(
        ".ew-modal__body input:not([disabled]), .ew-modal__body select:not([disabled]), .ew-modal__body textarea:not([disabled])"
      );
      if (bodyControl) {
        bodyControl.focus();
      } else {
        panel.focus();
      }
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (!closeDisabled) {
          event.preventDefault();
          onCloseRef.current();
        }
        return;
      }

      if (event.key === "Tab" && dialogRef.current) {
        const focusables = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        );
        if (focusables.length === 0) {
          event.preventDefault();
          dialogRef.current.focus();
          return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(rafId);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousActive?.focus?.();
    };
  }, [closeDisabled, open]);

  if (!open) return null;

  return createPortal(
    <div
      className="ew-modal-backdrop"
      onMouseDown={(e) => {
        if (closeOnOverlayClick && !closeDisabled && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`ew-modal ew-modal--${size}`}
      >
        <div className="ew-modal__header">
          <h2 id={titleId} className="ew-modal__title">
            {title}
          </h2>
          <button
            type="button"
            className="ew-icon-btn"
            disabled={closeDisabled}
            onClick={onClose}
            aria-label="Đóng hộp thoại"
          >
            <X size={18} />
          </button>
        </div>

        <div className="ew-modal__body">{children}</div>

        {footer && <div className="ew-modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
};

