import React from "react";
import { X } from "lucide-react";

interface CloseButtonProps {
  onClick: () => void;
  className?: string;
}

const ModalCloseButton: React.FC<CloseButtonProps> = ({
  onClick,
  className,
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        absolute top-4 right-4
        dark:bg-darkBackGround-300 dark:text-darkBackGround-400
        bg-gray-200
        shadow-md
        border-none rounded-[8px]
        p-2
        flex items-center justify-center
        cursor-pointer
        transition-all duration-200 ease-in-out
        dark:hover:bg-darkBackGround-200
        hover:bg-gray-100 dark:hover:text-white
        hover:text-gray-700
        ${className ?? ""}
      `}
    >
      <X size={20} />
    </button>
  );
};

export default ModalCloseButton;
