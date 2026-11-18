import React from "react";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  disabled = false,
  type = "button",
  className = "",
  children,
  ...rest
}) => {
  const classes = [
    "ew-btn",
    `ew-btn--${variant}`,
    `ew-btn--${size}`,
    fullWidth ? "ew-btn--full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={classes}
      {...rest}
    >
      {loading ? <Loader2 size={16} className="ew-spin" aria-hidden="true" /> : leftIcon}
      {children && <span>{children}</span>}
      {!loading && rightIcon}
    </button>
  );
};

