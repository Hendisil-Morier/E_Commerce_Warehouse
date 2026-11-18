import { createContext } from "react";
import type { ToastInput, ToastItem } from "@/types/common";

export interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (input: ToastInput) => string;
  success: (message: string, title?: string) => string;
  error: (message: string, title?: string) => string;
  warning: (message: string, title?: string) => string;
  info: (message: string, title?: string) => string;
  dismissToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);
