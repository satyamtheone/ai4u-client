import { Menu, X as XIcon } from "lucide-react";

interface SidebarButtonProps {
  isOpen: boolean;
  onToggle: () => void;
  openIcon?: React.ReactNode;
  closeIcon?: React.ReactNode;
  className?: string;
}

const SidebarButton = ({
  isOpen,
  onToggle,
  openIcon,
  closeIcon,
  className = "",
}: SidebarButtonProps) => {
  return (
    <button
      onClick={onToggle}
      className={`p-1 rounded-full transition-all dark:bg-black bg-white  shadow-2xl duration-300 
        text-black hover:text-black dark:text-gray-400 
        hover:bg-gray-100 dark:hover:bg-darkBackGround-300 
        dark:hover:text-white ${className}`}
    >
      {isOpen
        ? closeIcon || <XIcon size={20} />
        : openIcon || <Menu size={20} />}
    </button>
  );
};

export default SidebarButton;
