import React from "react";
import type { SelectOption } from "@/types/common";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: readonly SelectOption[];
  placeholder?: string;
  hasError?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, placeholder, hasError = false, className = "", ...rest }, ref) => {
    const classes = ["ew-control", hasError ? "ew-control--error" : "", className]
      .filter(Boolean)
      .join(" ");

    return (
      <select
        ref={ref}
        aria-invalid={hasError || undefined}
        className={classes}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }
);

Select.displayName = "Select";

