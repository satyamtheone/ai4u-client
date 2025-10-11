import React, { forwardRef } from "react";
import { LucideIcon } from "lucide-react";
import { FormError } from "./FormError";

export interface Option {
  value: string;
  label: string;
}

export interface FormSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Option[];
  error?: string;
  hint?: string;
  icon?: LucideIcon;
  containerClassName?: string;
}

/**
 * FormSelect Component
 * ---------------------
 * A reusable select dropdown matching the style of FormInput.
 * Supports label, error, hint, icon, and accessibility attributes.
 */
export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  (
    {
      label,
      options,
      error,
      hint,
      icon: Icon,
      className = "",
      containerClassName = "",
      ...props
    },
    ref
  ) => {
    const selectId =
      props.id || `select-${label.toLowerCase().replace(/\s+/g, "-")}`;

    return (
      <div className={`space-y-1 ${containerClassName}`}>
        <label
          htmlFor={selectId}
          className="block text-sm font-medium dark:text-gray-400 text-gray-800"
        >
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>

        <div className="relative">
          {/* Optional Left Icon */}
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon className="h-5 w-5 dark:text-gray-400 text-gray-800" />
            </div>
          )}

          <select
            ref={ref}
            id={selectId}
            className={`
              block w-full
              ${Icon ? "pl-10" : "pl-3"}
              pr-10 py-2
              border
              bg-transparent
              rounded-md shadow-sm
              appearance-none
              focus:outline-none focus:ring-1
              placeholder-gray-400
              transition-colors duration-200
              disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
              ${
                error
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                  : "dark:border-gray-300 border-gray-800 focus:border-blue-500 focus:ring-blue-500"
              }
              ${className}
            `}
            aria-invalid={!!error}
            aria-describedby={
              error
                ? `${selectId}-error`
                : hint
                ? `${selectId}-hint`
                : undefined
            }
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <svg
              className="h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M10 12a.75.75 0 01-.53-.22l-4-4a.75.75 0 111.06-1.06L10 10.19l3.47-3.47a.75.75 0 111.06 1.06l-4 4A.75.75 0 0110 12z"
              />
            </svg>
          </div>
        </div>

        {error && <FormError id={`${selectId}-error`} message={error} />}
        {hint && !error && (
          <p id={`${selectId}-hint`} className="text-sm text-gray-400">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

FormSelect.displayName = "FormSelect";
