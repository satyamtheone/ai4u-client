import React from "react";

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  shadow?: "none" | "sm" | "md" | "lg";
  border?: boolean;
  hover?: boolean;
  onClick?: () => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

const paddingClasses = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

const shadowClasses = {
  none: "",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
};

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  padding = "md",
  shadow = "sm",
  border = true,
  hover = false,
  onClick,
  header,
  footer,
}) => {
  const isClickable = Boolean(onClick);

  const cardClasses = `
    dark:bg-darkBackGround-950 rounded-lg dark:text-text-gray-300
    transition-all duration-100
    ${shadowClasses[shadow]}
    ${border ? "border border-gray-200" : ""}
    ${hover ? "hover:shadow-md transition-shadow duration-200" : ""}
    ${isClickable ? "cursor-pointer hover:bg-gray-50" : ""}
    ${className}
  `;

  const CardElement = isClickable ? "button" : "div";

  return (
    <CardElement
      className={cardClasses}
      onClick={onClick}
      {...(isClickable && { type: "button" })}
    >
      {header && (
        <div className="px-6 py-4  border-b border-gray-200">{header}</div>
      )}

      <div className={paddingClasses[padding]}>{children}</div>

      {footer && (
        <div className="px-6 py-4 border-t border-gray-200  rounded-b-lg">
          {footer}
        </div>
      )}
    </CardElement>
  );
};
