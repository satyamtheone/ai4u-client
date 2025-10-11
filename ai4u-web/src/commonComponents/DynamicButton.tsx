import React from "react";

type ButtonVariant = "submit" | "primary" | "secondary" | "pill";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  label: string;
  icon?: React.ReactNode;
  submitColor?: string;
}

const DynamicButton: React.FC<ButtonProps> = ({
  variant = "primary",
  fullWidth = false,
  label,
  icon,
  className = "",
  submitColor,
  ...props
}) => {
  let base =
    "flex items-center justify-center gap-2 font-semibold cursor-pointer transition-all duration-200 ease-in-out focus:outline-none";

  let variantStyles = "";

  switch (variant) {
    case "submit":
      variantStyles = `w-full px-4 py-3 font-medium text-white transition-colors bg-blue-600 rounded-lg ${
        submitColor ? submitColor : "bg-blue-600 hover:bg-blue-700"
      }`;
      break;

    case "primary":
      variantStyles =
        "bg-primary-600 text-white border-none rounded-[20px] text-[14px] font-bold py-[14px] px-[26px] transition-all duration-200 ease-in-out";
      break;

    case "secondary":
      variantStyles =
        "bg-secondary-500  text-white border-none rounded-[20px] text-[14px] font-semibold py-[14px] px-[26px] transition-all duration-200 ease-in-out";
      break;

    case "pill":
      variantStyles =
        "dark:bg-darkBackGround-300 bg-gray-300 dark:text-darkBackGround-400 text-black border border-darkBackGround-900 rounded-full text-[13px] font-medium py-2 px-4 transition-all duration-200 ease-in-out dark:hover:bg-darkBackGround-900 hover:bg-gray-400 hover:text-white hover:border-darkBackGround-100";
      break;

    default:
      variantStyles =
        "bg-primary-600  text-white border-none rounded-[20px] text-[14px] font-semibold py-[14px] px-[26px] transition-all duration-200 ease-in-out";
      break;
  }

  const widthStyle = fullWidth ? "w-full" : "";

  return (
    <button
      {...props}
      className={`${base} ${variantStyles} ${widthStyle} ${className}  `}
    >
      {icon && <span>{icon}</span>}
      {label}
    </button>
  );
};

export default DynamicButton;
