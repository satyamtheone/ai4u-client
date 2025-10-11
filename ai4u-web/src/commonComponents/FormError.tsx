import React, { JSX } from "react";

interface FormErrorProps {
  message?: string;
  icon?: JSX.Element;
  className?: string;
  id?: string;
}
const ErrorIcon = (
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
);
export const FormError: React.FC<FormErrorProps> = ({
  message,
  icon,
  className = "",
  id,
}) => {
  if (!message) return null;

  return (
    <p
      id={id}
      role="alert"
      className={`flex items-center gap-1 text-sm text-red-600 ${className}`}
    >
      {icon || ErrorIcon}
      {message}
    </p>
  );
};
