import React, { forwardRef, JSX } from "react";

export interface FormCheckBoxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  required?: boolean;
  containerClassName?: string;
  message: JSX.Element;
}

const BASE_STYLES = "mt-1 rounded-md checkbox checkbox-sm checkbox-primary";

/**
 * FormCheckBox Component
 * -------------------------
 * A reusable checkbox with label, error handling,
 * and links to Terms of Service and Privacy Policy.
 */
export const FormCheckBox = forwardRef<HTMLInputElement, FormCheckBoxProps>(
  (
    {
      checked,
      onChange,
      error,
      required = false,
      containerClassName = "",
      message,
      ...props
    },
    ref
  ) => {
    return (
      <div className={containerClassName}>
        <label className="flex items-start gap-3">
          <input
            ref={ref}
            type="checkbox"
            className={BASE_STYLES}
            required={required}
            checked={checked}
            onChange={onChange}
            {...props}
          />
          {message}
        </label>

        {error && <p className="text-sm text-red-600 ml-7">{error}</p>}
      </div>
    );
  }
);

FormCheckBox.displayName = "FormCheckBox";
