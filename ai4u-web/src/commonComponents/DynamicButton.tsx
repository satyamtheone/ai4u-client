import { Loader2 } from "lucide-react";
import React from "react";

type ButtonVariant = "submit" | "primary" | "secondary" | "pill";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  label: string | React.ReactNode;
  icon?: React.ReactNode;
  submitColor?: string;
  loading?: boolean;
  iconPosition?: "flex-row" | "flex-row-reverse";
}

const DynamicButton: React.FC<ButtonProps> = ({
  variant = "primary",
  fullWidth = false,
  label,
  icon,
  className = "",
  submitColor,
  loading,
  iconPosition,
  ...props
}) => {
  let base =
    "flex items-center justify-center gap-2  font-semibold cursor-pointer transition-all duration-200 ease-in-out focus:outline-none";

  let variantStyles = "";

  switch (variant) {
    case "submit":
      variantStyles = `w-full px-4 py-1 font-medium text-white transition-colors bg-blue-600 rounded-md ${
        submitColor ? submitColor : "bg-blue-600 hover:bg-blue-700"
      }`;
      break;

    case "primary":
      variantStyles =
        "bg-primary-600 text-white border-none rounded-md text-[14px] font-bold py-1 px-[26px] transition-all duration-200 ease-in-out";
      break;

    case "secondary":
      variantStyles =
        "bg-secondary-500  text-white border-none  rounded-md text-[14px] font-semibold py-1 px-[26px] transition-all duration-200 ease-in-out";
      break;

    case "pill":
      variantStyles =
        "dark:bg-darkBackGround-300 bg-gray-300 rounded-[20px] dark:text-darkBackGround-400  text-black border dark:border-darkBackGround-900 border-gray-400 rounded-full text-[13px] font-medium py-2 px-4 transition-all duration-200 ease-in-out dark:hover:bg-darkBackGround-900 hover:bg-gray-400 hover:text-white hover:border-darkBackGround-100 disabled:opacity-50 disabled:cursor-not-allowed";
      break;

    default:
      variantStyles =
        "bg-primary-600  text-white border-none  rounded-md text-[14px] font-semibold py-1 px-[26px] transition-all duration-200 ease-in-out";
      break;
  }

  const widthStyle = fullWidth ? "w-full" : "";

  return (
    <button
      {...props}
      className={`${base} ${variantStyles} ${widthStyle} ${className}  `}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
      <div className={`flex items-center gap-2 ${iconPosition}`}>
        {icon && <span>{icon}</span>}
        {label}
      </div>
    </button>
  );
};

export default DynamicButton;
