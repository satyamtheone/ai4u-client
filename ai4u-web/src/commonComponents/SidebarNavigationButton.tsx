import React from "react";
import { useNavigate } from "react-router-dom";

interface SidebarButtonProps {
  item: {
    icon: React.ReactNode;
    label: string;
  };
  showSidebar?: boolean;
  onClick?: () => void;
  isActive?: boolean;
  navigateTo?: string;
}

const SidebarNavigationButton: React.FC<SidebarButtonProps> = ({
  item,
  showSidebar,
  onClick,
  isActive,
  navigateTo,
}) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() =>
        onClick ? onClick() : navigate(navigateTo ? navigateTo : "")
      }
      className={`flex items-center w-full gap-3 py-2 mb-5 ${
        showSidebar ? "px-4 " : " px-1 "
      }  text-sm font-medium text-left 
        rounded-lg cursor-pointer dark:text-white text-gray-800 
        dark:hover:bg-darkBackGround-300 hover:bg-gray-400 hover:text-white
        ${isActive ? "bg-blue-600 text-white" : ""}`}
    >
      <span className={`${!showSidebar && "pl-[1px]"}`}>{item.icon}</span>
      {showSidebar && <span className="text-nowrap">{item.label}</span>}
    </button>
  );
};

export default SidebarNavigationButton;
