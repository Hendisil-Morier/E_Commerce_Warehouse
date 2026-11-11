import React from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ hasError = false, className = "", rows = 3, ...rest }, ref) => {
    const classes = [
      "ew-control",
      "ew-textarea",
      hasError ? "ew-control--error" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <textarea
        ref={ref}
        rows={rows}
        aria-invalid={hasError || undefined}
        className={classes}
        {...rest}
      />
    );
  }
);

Textarea.displayName = "Textarea";

