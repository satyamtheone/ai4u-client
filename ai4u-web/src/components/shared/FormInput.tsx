import React, { forwardRef } from "react";
import { LucideIcon } from "lucide-react";
import { FormError } from "../../cmmonComponents/FormError";

export interface FormInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: LucideIcon;
  hint?: string;
  containerClassName?: string;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      label,
      error,
      icon: Icon,
      hint,
      className = "",
      containerClassName = "",
      ...props
    },
    ref
  ) => {
    const inputId =
      props.id || `input-${label.toLowerCase().replace(/\s+/g, "-")}`;

    return (
      <div className={`space-y-2 ${containerClassName}`}>
        {/* Label */}
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-black dark:text-gray-400"
        >
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>

        {/* Input Container */}
        <div className="relative">
          {/* Icon */}
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon className="h-5 w-5 dark:text-gray-400 text-gray-800" />
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            className={`
              block w-full 
              ${Icon ? "pl-10" : "pl-3"} 
              pr-3 py-2 
              border 
              bg-transparent
              ${
                error
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500 "
                  : "dark:border-gray-300 border-gray-800 focus:border-blue-500 focus:ring-blue-500"
              } 
              rounded-md shadow-sm 
              focus:outline-none focus:ring-1
              placeholder-gray-400
              transition-colors duration-200
              disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
              ${className}
            `}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={
              error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
            }
            {...props}
          />
        </div>

        {/* Error Message */}
        {error && <FormError id={`${inputId}-error`} message={error} />}

        {/* Hint Message */}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-sm text-black">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

FormInput.displayName = "FormInput";
