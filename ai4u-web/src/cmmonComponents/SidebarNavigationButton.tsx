import React from "react";

interface SidebarButtonProps {
  item: {
    icon: React.ReactNode;
    label: string;
  };
  showSidebar?: boolean;
  onClick?: () => void;
  isActive?: boolean;
}

const SidebarNavigationButton: React.FC<SidebarButtonProps> = ({
  item,
  showSidebar,
  onClick,
  isActive,
}) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center w-full gap-3 ${
        showSidebar ? "px-4 py-3  mb-1" : "py-2 px-1 mb-5"
      }  text-sm font-medium text-left transition-all
        rounded-lg cursor-pointer dark:text-white text-gray-800 
        dark:hover:bg-darkBackGround-300 hover:bg-gray-400 hover:text-white
        ${isActive ? "bg-blue-600 text-white" : ""}`}
    >
      <span className={`${!showSidebar && "pl-[1px]"}`}>{item.icon}</span>
      {showSidebar && <span>{item.label}</span>}
    </button>
  );
};

export default SidebarNavigationButton;
