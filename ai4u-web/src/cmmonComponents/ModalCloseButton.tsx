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
        bg-[#2a2a2a] text-[#b3b3b3]
        border-none rounded-[8px]
        p-2
        flex items-center justify-center
        cursor-pointer
        transition-all duration-200 ease-in-out
        hover:bg-[#3a3a3a] hover:text-white
        ${className ?? ""}
      `}
    >
      <X size={20} />
    </button>
  );
};

export default ModalCloseButton;
