import React, { useState, forwardRef } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";

export interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  error?: string;
  hint?: string;
  showStrengthIndicator?: boolean;
  containerClassName?: string;
  errorCyName?: string;
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      label,
      error,
      hint,
      showStrengthIndicator = false,
      className = "",
      containerClassName = "",
      value = "",
      onChange,
      errorCyName,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId =
      props.id || `password-${label.toLowerCase().replace(/\s+/g, "-")}`;

    const getPasswordStrength = (password: string): PasswordStrength => {
      if (!password) return { score: 0, label: "", color: "" };

      let score = 0;
      const checks = [
        password.length >= 8,
        /[a-z]/.test(password),
        /[A-Z]/.test(password),
        /\d/.test(password),
        /[!@#$%^&*(),.?":{}|<>]/.test(password),
      ];

      score = checks.filter(Boolean).length;

      if (score <= 2) return { score, label: "Weak", color: "bg-red-500" };
      if (score <= 3) return { score, label: "Fair", color: "bg-yellow-500" };
      if (score <= 4) return { score, label: "Good", color: "bg-blue-500" };
      return { score, label: "Strong", color: "bg-green-500" };
    };

    const strength = showStrengthIndicator
      ? getPasswordStrength(String(value))
      : null;

    return (
      <div className={`space-y-2 ${containerClassName}`}>
        {/* Label */}
        <label
          htmlFor={inputId}
          className="block text-sm font-medium dark:text-gray-400 text-gray-800"
        >
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>

        {/* Input Container */}
        <div className="relative">
          {/* Lock Icon */}
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 dark:text-gray-400 text-gray-800" />
          </div>

          {/* Password Input */}
          <input
            ref={ref}
            id={inputId}
            type={showPassword ? "text" : "password"}
            value={value}
            onChange={onChange}
            className={`
              block w-full pl-10 pr-10 py-2 bg-transparent
              border 
              ${
                error
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500"
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
              error
                ? `${inputId}-error`
                : hint
                ? `${inputId}-hint`
                : showStrengthIndicator
                ? `${inputId}-strength`
                : undefined
            }
            {...props}
          />

          {/* Toggle Password Visibility */}
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5 text-gray-400" />
            ) : (
              <Eye className="h-5 w-5 text-gray-400" />
            )}
          </button>
        </div>

        {/* Password Strength Indicator */}
        {showStrengthIndicator && value && strength && (
          <div id={`${inputId}-strength`} className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${strength.color}`}
                  style={{ width: `${(strength.score / 5) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-600">
                {strength.label}
              </span>
            </div>

            {/* Password Requirements */}
            <div className="text-xs text-gray-500 space-y-1">
              <p>Password must contain:</p>
              <ul className="grid grid-cols-1 gap-1 ml-2">
                <li
                  className={
                    String(value).length >= 8
                      ? "text-green-600"
                      : "text-gray-400"
                  }
                >
                  ✓ At least 8 characters
                </li>
                <li
                  className={
                    /[a-z]/.test(String(value))
                      ? "text-green-600"
                      : "text-gray-400"
                  }
                >
                  ✓ One lowercase letter
                </li>
                <li
                  className={
                    /[A-Z]/.test(String(value))
                      ? "text-green-600"
                      : "text-gray-400"
                  }
                >
                  ✓ One uppercase letter
                </li>
                <li
                  className={
                    /\d/.test(String(value))
                      ? "text-green-600"
                      : "text-gray-400"
                  }
                >
                  ✓ One number
                </li>
                <li
                  className={
                    /[!@#$%^&*(),.?":{}|<>]/.test(String(value))
                      ? "text-green-600"
                      : "text-gray-400"
                  }
                >
                  ✓ One special character
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <p
            id={`${inputId}-error`}
            className="text-sm text-red-600 flex items-center gap-1"
            role="alert"
            data-cy={errorCyName}
          >
            <svg
              className="h-4 w-4 flex-shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}

        {/* Hint Message */}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-sm text-gray-500">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
