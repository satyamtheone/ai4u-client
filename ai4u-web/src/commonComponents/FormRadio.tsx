import React, { forwardRef, JSX } from "react";

export type RadioVariant = "basic" | "card";

export interface FormRadioProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  required?: boolean;
  containerClassName?: string;
  message?: JSX.Element;
  variant?: RadioVariant;
  badgeLabel?: string;
  optionText?: string;
}

const BASE_STYLES = `mt-1 rounded-full radio radio-primary`;
const CARD_LABEL_STYLES = `
  flex items-center p-4 rounded-xl cursor-pointer border-2 transition-all duration-300
  /* Light Theme */
  bg-gray-50 border-gray-200 hover:bg-gray-100 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)]
  /* Dark Theme */
  dark:bg-[#2a2a2a] dark:border-[#404040] dark:hover:bg-[#3a3a3a] 
  dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)] dark:has-[input:checked]:border-emerald-500 
  has-[input:checked]:bg-emerald-500/15 has-[input:checked]:shadow-[0_4px_16px_rgba(16,185,129,0.3)]
`;
/**
 * FormRadio Component
 * -------------------------
 * A reusable radio button with support for
 * "basic" and "card" variants, optional label,
 * and error handling.
 */
export const FormRadio = forwardRef<HTMLInputElement, FormRadioProps>(
  (
    {
      checked,
      onChange,
      error,
      required = false,
      containerClassName = "",
      message,
      variant = "basic",
      badgeLabel,
      optionText,
      className = "",
      ...props
    },
    ref
  ) => {
    // "Card" variant (option card style)
    if (variant === "card") {
      return (
        <div className={containerClassName}>
          <label className={`${CARD_LABEL_STYLES}}`}>
            <input
              ref={ref}
              type="radio"
              className={`peer mr-3 scale-110 cursor-pointer radio radio-xs  ${className}`}
              required={required}
              checked={checked}
              onChange={onChange}
              {...props}
            />
            <div className="flex items-center gap-3 flex-1">
              {badgeLabel && (
                <span
                  className="
                    w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold
                    dark:bg-[#404040] bg-gray-400 dark:text-[#b3b3b3] text-white transition-all
                    peer-checked:bg-emerald-500 peer-checked:text-white peer-checked:scale-110
                  "
                >
                  {badgeLabel}
                </span>
              )}
              {optionText ? (
                <span className="text-sm leading-snug ">{optionText}</span>
              ) : (
                message && (
                  <span className="text-sm leading-snug">{message}</span>
                )
              )}
            </div>
          </label>

          {error && <p className="text-sm text-red-600 ml-7">{error}</p>}
        </div>
      );
    }

    // "Basic" variant (regular radio with message)
    return (
      <div className={containerClassName}>
        <label className="flex items-start gap-3">
          <input
            ref={ref}
            type="radio"
            className={`${BASE_STYLES} ${className}`}
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

FormRadio.displayName = "FormRadio";
