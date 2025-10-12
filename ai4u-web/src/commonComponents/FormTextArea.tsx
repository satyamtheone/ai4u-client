import React, { forwardRef } from "react";
import { LucideIcon } from "lucide-react";
import { FormError } from "./FormError";

export interface FormTextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  icon?: LucideIcon;
  hint?: string;
  containerClassName?: string;
  variant?: "primary";
}

// 3. CONSTANTS
const BASE_STYLES =
  "pr-3 py-2 border bg-transparent rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 transition-colors duration-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed resize-y";

const VARIANT_STYLES: Record<string, string> = {
  primary: ``,
};

// 4. HELPER FUNCTIONS
const getVariantStyles = (variant?: string): string => {
  return VARIANT_STYLES[variant ?? ""] || BASE_STYLES;
};

// 5. MAIN COMPONENT

/**
 * FormTextArea Component
 * -----------------------
 * A reusable textarea with label, error handling, optional icon, and hint support.
 * Mirrors the structure and behavior of FormInput for consistent design.
 */
export const FormTextArea = forwardRef<HTMLTextAreaElement, FormTextAreaProps>(
  (
    {
      label,
      error,
      icon: Icon,
      hint,
      className = "",
      variant,
      containerClassName = "",
      ...props
    },
    ref
  ) => {
    // Computed values
    const textAreaId =
      props.id || `textarea-${label.toLowerCase().replace(/\s+/g, "-")}`;
    const variantClasses = getVariantStyles(variant);

    // JSX Return
    return (
      <div className={`space-y-2 ${containerClassName}`}>
        {/* ---------- Label ---------- */}
        <label
          htmlFor={textAreaId}
          className="block text-sm font-medium dark:text-gray-400 text-gray-800"
        >
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>

        {/* ---------- TextArea Container ---------- */}
        <div className="relative">
          {/* Optional Left Icon */}
          {Icon && (
            <div className="absolute top-3 left-3 flex items-start pointer-events-none">
              <Icon className="h-5 w-5 dark:text-gray-400 text-gray-800" />
            </div>
          )}

          {/* TextArea Field */}
          <textarea
            ref={ref}
            id={textAreaId}
            rows={props.rows || 4}
            className={`
              block w-full
              ${Icon ? "pl-10" : "pl-3"}
              ${variantClasses}
              ${
                error
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                  : "dark:border-gray-300 border-gray-800 focus:border-blue-500 focus:ring-blue-500"
              }
              ${className}
            `}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={
              error
                ? `${textAreaId}-error`
                : hint
                ? `${textAreaId}-hint`
                : undefined
            }
            {...props}
          />
        </div>

        {/* ---------- Error Message ---------- */}
        {error && <FormError id={`${textAreaId}-error`} message={error} />}

        {/* ---------- Hint Message ---------- */}
        {hint && !error && (
          <p id={`${textAreaId}-hint`} className="text-sm text-gray-400">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

// 6. EXPORT
FormTextArea.displayName = "FormTextArea";
