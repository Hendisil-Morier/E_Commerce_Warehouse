import React from "react";

export interface FormFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string | null;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  required = false,
  error,
  hint,
  className = "",
  children,
}) => {
  return (
    <div className={`ew-field ${className}`.trim()}>
      <label htmlFor={htmlFor} className="ew-field__label">
        <span>{label}</span>
        {required && (
          <span className="ew-field__required" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {children}

      {error ? (
        <span className="ew-field__error" role="alert">
          {error}
        </span>
      ) : (
        hint && <span className="ew-field__hint">{hint}</span>
      )}
    </div>
  );
};

