import React from "react";

type ButtonVariant = "submit" | "primary" | "secondary" | "pill";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  label: string;
  icon?: React.ReactNode;
}

const DynamicButton: React.FC<ButtonProps> = ({
  variant = "primary",
  fullWidth = false,
  label,
  icon,
  className = "",
  ...props
}) => {
  let base =
    "flex items-center justify-center gap-2 font-semibold cursor-pointer transition-all duration-200 ease-in-out focus:outline-none";

  let variantStyles = "";

  switch (variant) {
    case "submit":
      variantStyles =
        " bg-primary-600 text-white border-none rounded-2xl text-[16px] font-semibold py-4 px-6 w-full shadow-none";
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
        "bg-[#2a2a2a] text-[#b3b3b3] border border-[#404040] rounded-full text-[13px] font-medium py-2 px-4 transition-all duration-200 ease-in-out hover:bg-[#3a3a3a] hover:text-white hover:border-[#555555]";
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
      className={`${base} ${variantStyles} ${widthStyle} ${className} `}
    >
      {icon && <span>{icon}</span>}
      {label}
    </button>
  );
};

export default DynamicButton;
