import React, { forwardRef, JSX } from "react";

export type CheckBoxVariant = "basic" | "card";

export interface FormCheckBoxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  required?: boolean;
  containerClassName?: string;
  message?: JSX.Element;
  variant?: CheckBoxVariant;
  badgeLabel?: string;
  optionText?: string;
}

const BASE_STYLES = "mt-1 rounded-md checkbox checkbox-sm checkbox-primary";
const CARD_LABEL_STYLES = `
  flex items-center p-3 rounded-xl cursor-pointer border-2 transition-all duration-300
  /* Light Theme */
  bg-gray-50 border-gray-200 hover:bg-gray-100 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)]
  /* Dark Theme */
  dark:bg-[#2a2a2a] dark:border-[#404040] dark:hover:bg-[#3a3a3a] 
  dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)] dark:has-[input:checked]:border-emerald-500 
  has-[input:checked]:bg-emerald-500/15 has-[input:checked]:shadow-[0_4px_16px_rgba(16,185,129,0.3)]
`;
const CARD_BADGE_LABEL_STYLES = ` w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold dark:bg-[#404040] bg-gray-400 dark:text-[#b3b3b3] text-white transition-all      peer-checked:bg-emerald-500 peer-checked:text-white peer-checked:scale-110`;

/**
 * FormCheckBox Component
 * -------------------------
 * A reusable checkbox with label, error handling,
 * and links to Terms of Service and Privacy Policy.
 * message?: JSX.Element;          // used by "basic" (and can be used by "card" too)
  variant?: CheckBoxVariant;      // "basic" | "card"
  badgeLabel?: string;            // used by "card" (e.g., "A", "B", "C")
  optionText?: string;            // used by "card" (text on the right)
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
      variant = "basic",
      badgeLabel,
      optionText,
      className = "",
      ...props
    },
    ref
  ) => {
    if (variant === "card") {
      return (
        <div className={containerClassName}>
          <label className={`${CARD_LABEL_STYLES}`}>
            <input
              ref={ref}
              type="checkbox"
              className={`peer mr-3 scale-110 cursor-pointer checkbox checkbox-sm checkbox-primary  ${className}`}
              required={required}
              checked={checked}
              onChange={onChange}
              {...props}
            />
            <div className="flex items-center gap-3 flex-1">
              {badgeLabel && (
                <span className={CARD_BADGE_LABEL_STYLES}>{badgeLabel}</span>
              )}

              {optionText ? (
                <span className="text-sm leading-snug">{optionText}</span>
              ) : (
                message && (
                  <span className="text-sm leading-snug ">{message}</span>
                )
              )}
            </div>
          </label>

          {error && <p className="text-sm text-red-600 ml-7">{error}</p>}
        </div>
      );
    }

    // variant === "basic"
    return (
      <div className={containerClassName}>
        <label className="flex items-start gap-3">
          <input
            ref={ref}
            type="checkbox"
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

FormCheckBox.displayName = "FormCheckBox";
