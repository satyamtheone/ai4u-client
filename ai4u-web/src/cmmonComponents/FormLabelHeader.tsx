import React from "react";
import { LucideIcon } from "lucide-react";

interface FormLabelHeaderProps {
  icon: LucideIcon;
  iconBg?: string;
  title: string;
  subtitle?: string;
  className?: string;
}

export const FormLabelHeader: React.FC<FormLabelHeaderProps> = ({
  icon: Icon,
  iconBg = "bg-blue-600",
  title,
  subtitle,
  className = "",
}) => {
  return (
    <div className={`text-center dark:text-white text-white ${className}`}>
      <div
        className={`mx-auto h-12 w-12 ${iconBg} rounded-lg flex items-center justify-center mb-4`}
      >
        <Icon className="h-6 w-6 ark:text-white dtext-black " />
      </div>
      <h2 className="text-2xl font-bold text-black dark:text-white ">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2 text-sm dark:text-gray-300 text-black ">
          {subtitle}
        </p>
      )}
    </div>
  );
};
