import React from "react";
import { X } from "lucide-react";

export type ChipVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "error";

export interface ChipProps {
  label: string;
  variant?: ChipVariant;
  icon?: React.ReactNode;
  onRemove?: () => void;
  className?: string;
  containerClassName?: string;
  removable?: boolean;
  randomizeColors?: boolean;
}

/**
 * Chip Component
 * -------------------------
 * A reusable, styled chip component that supports
 * multiple variants, icons, removable option,
 * and randomized color selection.
 */
export const Chip: React.FC<ChipProps> = ({
  label,
  variant = "default",
  icon,
  onRemove,
  className = "",
  containerClassName = "",
  removable = false,
  randomizeColors = false,
}) => {
  const BASE_STYLES =
    "inline-flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-full transition-colors duration-200 border-[0.5px] dark:border-darkBackGround-300 border-gray-300 ";

  const VARIANT_STYLES: Record<ChipVariant, string> = {
    default:
      "bg-gray-200 text-gray-800 dark:bg-darkBackGround-300 dark:text-gray-100",
    primary: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
    success:
      "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
    warning:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",
    error: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  };

  // 🎨 Array of random color styles (you can modify or expand this)
  const RANDOM_COLOR_CLASSES: string[] = [
    "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
    "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  ];

  // 🎲 Helper to get random color
  const getRandomColor = () =>
    RANDOM_COLOR_CLASSES[
      Math.floor(Math.random() * RANDOM_COLOR_CLASSES.length)
    ];

  const chipColorClass = randomizeColors
    ? getRandomColor()
    : VARIANT_STYLES[variant];

  const combinedClasses = `${BASE_STYLES} ${chipColorClass} ${className}`;

  return (
    <div className={containerClassName}>
      <div className={combinedClasses}>
        {icon && <span className="flex items-center">{icon}</span>}
        <span>{label}</span>
        {removable && (
          <button
            type="button"
            onClick={onRemove}
            className="ml-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 p-[2px] transition"
            aria-label="Remove chip"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

export default Chip;
