import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { ToastContext } from "@/hooks/toastContext";
import type { ToastInput, ToastItem, ToastType } from "@/types/common";

const TOAST_ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={18} color="var(--color-success)" />,
  error: <AlertCircle size={18} color="var(--color-danger)" />,
  warning: <AlertTriangle size={18} color="var(--color-warning)" />,
  info: <Info size={18} color="var(--color-info)" />,
};

export interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());
  const counterRef = useRef(0);

  const dismissToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type = "info", title, message, durationMs = 4000 }: ToastInput): string => {
      counterRef.current += 1;
      const id = `toast-${Date.now()}-${counterRef.current}`;

      setToasts((prev) => [...prev, { id, type, title, message, durationMs }]);

      if (durationMs > 0) {
        const timer = window.setTimeout(() => {
          dismissToast(id);
        }, durationMs);
        timersRef.current.set(id, timer);
      }

      return id;
    },
    [dismissToast]
  );

  useEffect(() => {
    const activeTimers = timersRef.current;
    return () => {
      for (const timer of activeTimers.values()) {
        window.clearTimeout(timer);
      }
      activeTimers.clear();
    };
  }, []);

  const value = useMemo(
    () => ({
      toasts,
      showToast,
      dismissToast,
      success: (message: string, title?: string) =>
        showToast({ type: "success", message, title }),
      error: (message: string, title?: string) =>
        showToast({ type: "error", message, title }),
      warning: (message: string, title?: string) =>
        showToast({ type: "warning", message, title }),
      info: (message: string, title?: string) =>
        showToast({ type: "info", message, title }),
    }),
    [dismissToast, showToast, toasts]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      {toasts.length > 0 && (
        <div className="ew-toast-stack" role="region" aria-label="Thông báo hệ thống" aria-live="polite">
          {toasts.map((toast) => (
            <div key={toast.id} className={`ew-toast ew-toast--${toast.type}`} role="status">
              <span style={{ marginTop: "2px", flexShrink: 0 }} aria-hidden="true">
                {TOAST_ICONS[toast.type]}
              </span>

              <div style={{ flex: 1, minWidth: 0 }}>
                {toast.title && (
                  <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--color-dark)" }}>
                    {toast.title}
                  </div>
                )}
                <div style={{ fontSize: "0.86rem", color: "var(--color-text)", wordBreak: "break-word" }}>
                  {toast.message}
                </div>
              </div>

              <button
                type="button"
                className="ew-icon-btn"
                onClick={() => dismissToast(toast.id)}
                aria-label="Đóng thông báo"
              >
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
};

