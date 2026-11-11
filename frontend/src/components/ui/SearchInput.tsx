import React, { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/Input";

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  disabled?: boolean;
  id?: string;
  ariaLabel?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = "Tìm kiếm...",
  debounceMs = 350,
  disabled = false,
  id,
  ariaLabel = "Tìm kiếm",
}) => {
  const [prevValue, setPrevValue] = useState(value);
  const [localValue, setLocalValue] = useState(value);
  const onChangeRef = useRef(onChange);

  if (value !== prevValue) {
    setPrevValue(value);
    setLocalValue(value);
  }

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (localValue === value) return;

    const timer = window.setTimeout(() => {
      onChangeRef.current(localValue);
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [debounceMs, localValue, value]);

  const handleClear = () => {
    setLocalValue("");
    onChangeRef.current("");
  };

  return (
    <Input
      id={id}
      type="search"
      value={localValue}
      disabled={disabled}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onChange={(e) => setLocalValue(e.target.value)}
      leftAddon={<Search size={16} aria-hidden="true" />}
      rightAddon={
        localValue.length > 0 && !disabled ? (
          <button
            type="button"
            onClick={handleClear}
            className="ew-icon-btn"
            aria-label="Xóa từ khóa tìm kiếm"
          >
            <X size={15} />
          </button>
        ) : undefined
      }
    />
  );
};

