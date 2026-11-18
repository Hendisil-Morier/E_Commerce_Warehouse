import { useContext } from "react";
import { ToastContext } from "@/hooks/toastContext";
import type { ToastContextValue } from "@/hooks/toastContext";

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast phải được dùng bên trong ToastProvider.");
  }

  return ctx;
}

