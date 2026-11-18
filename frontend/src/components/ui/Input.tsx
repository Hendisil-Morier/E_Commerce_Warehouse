import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ hasError = false, leftAddon, rightAddon, className = "", ...rest }, ref) => {
    const classes = [
      "ew-control",
      hasError ? "ew-control--error" : "",
      leftAddon ? "ew-control--has-left" : "",
      rightAddon ? "ew-control--has-right" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    if (!leftAddon && !rightAddon) {
      return (
        <input
          ref={ref}
          aria-invalid={hasError || undefined}
          className={classes}
          {...rest}
        />
      );
    }

    return (
      <div className="ew-control-wrap">
        {leftAddon && <span className="ew-control__addon-left">{leftAddon}</span>}
        <input
          ref={ref}
          aria-invalid={hasError || undefined}
          className={classes}
          {...rest}
        />
        {rightAddon && <span className="ew-control__addon-right">{rightAddon}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";

