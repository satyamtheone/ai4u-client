import { useState, ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface DropdownSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  rightElement?: ReactNode;
  className?: string;
}

const DynamicDropDown = ({
  title,
  children,
  defaultOpen = false,
  rightElement,
  className,
}: DropdownSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className={` border border-gray-300 dark:border-darkBackGround-700  bg-white dark:bg-darkBackGround-950 text-black dark:text-white shadow-sm ${className}`}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between md:px-6 px-2 py-4 cursor-pointer select-none"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <div className=" flex items-center gap-2">
          {isOpen ? (
            <ChevronUp size={18} className="opacity-70" />
          ) : (
            <ChevronDown size={18} className="opacity-70" />
          )}
          <h2 className="md:text-lg text-sm font-semibold">{title}</h2>
        </div>

        {rightElement && (
          <div onClick={(e) => e.stopPropagation()}>{rightElement}</div>
        )}
      </div>

      {/* Body */}
      <div
        className={`transition-all duration-300 overflow-hidden ${
          isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="p-6 border-t border-gray-200 dark:border-darkBackGround-700 ">
          {children}
        </div>
      </div>
    </div>
  );
};

export default DynamicDropDown;
