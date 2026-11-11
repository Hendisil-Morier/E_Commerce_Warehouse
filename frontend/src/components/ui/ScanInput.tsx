import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { Barcode, CornerDownLeft } from "lucide-react";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";

export interface ScanInputProps {
  onScan: (code: string) => void | Promise<void>;
  label?: string;
  placeholder?: string;
  hint?: string;
  error?: string | null;
  disabled?: boolean;
  loading?: boolean;
  autoFocus?: boolean;
  refocusOnScan?: boolean;
}

export const ScanInput: React.FC<ScanInputProps> = ({
  onScan,
  label = "Quét mã vạch / SKU",
  placeholder = "Đưa máy quét vào hoặc nhập mã rồi nhấn Enter...",
  hint = "Ô quét tự động giữ focus cho máy quét USB bàn phím.",
  error,
  disabled = false,
  loading = false,
  autoFocus = true,
  refocusOnScan = true,
}) => {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const prevLoadingRef = useRef(loading);
  const [code, setCode] = useState("");

  const focusInput = useCallback(() => {
    window.requestAnimationFrame(() => {
      if (inputRef.current && !inputRef.current.disabled) {
        inputRef.current.focus();
      }
    });
  }, []);

  useEffect(() => {
    if (autoFocus && !disabled) {
      focusInput();
    }
  }, [autoFocus, disabled, focusInput]);

  useEffect(() => {
    if (prevLoadingRef.current && !loading && refocusOnScan && !disabled) {
      focusInput();
    }
    prevLoadingRef.current = loading;
  }, [disabled, focusInput, loading, refocusOnScan]);

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;

    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed || disabled || loading) {
      focusInput();
      return;
    }

    setCode("");
    try {
      await onScan(trimmed);
    } finally {
      if (refocusOnScan) {
        focusInput();
      }
    }
  };

  return (
    <FormField label={label} htmlFor={inputId} hint={hint} error={error}>
      <Input
        ref={inputRef}
        id={inputId}
        type="text"
        value={code}
        disabled={disabled || loading}
        hasError={Boolean(error)}
        placeholder={placeholder}
        className="ew-scan-input"
        autoComplete="off"
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={handleKeyDown}
        leftAddon={<Barcode size={18} color="var(--color-primary)" aria-hidden="true" />}
        rightAddon={
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 8px",
              borderRadius: "6px",
              backgroundColor: "var(--color-accent-soft)",
              color: "var(--color-primary)",
              fontSize: "0.74rem",
              fontWeight: 700,
              pointerEvents: "none",
            }}
          >
            <CornerDownLeft size={13} aria-hidden="true" />
            <span>Enter</span>
          </span>
        }
      />
    </FormField>
  );
};

