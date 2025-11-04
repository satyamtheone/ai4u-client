import {
  Brain,
  LogOut,
  Plus,
  SidebarClose,
  SidebarOpen,
  User,
} from "lucide-react";
import { AuthMain, useAuth } from "../auth";
import { useState } from "react";
import DynamicButton from "../../commonComponents/DynamicButton";
import { useNavigate } from "react-router-dom";
import SidebarNavigationButton from "../../commonComponents/SidebarNavigationButton";
import SidebarButton from "../../commonComponents/SidebarButton";
import { useDialog } from "../../commonComponents/Dialog/DialogProvider";
import ModalProvider from "../../commonComponents/Dialog/ModalProvider";
import { SideBarHeaders } from "./Constants";
import ThemeToggleButton from "../../commonComponents/ThemeToggleButton";

const SideBar = () => {
  const { openDialog, closeDialog } = useDialog();
  const { isAuthenticated, user, logout } = useAuth();
  const [showSidebar, setShowSidebar] = useState(false);
  const navigate = useNavigate();
  const userDisplayName = isAuthenticated
    ? user?.first_name || "User"
    : "Guest User";

  const handleLogout = () => {
    openDialog({
      children: (
        <ModalProvider
          onClose={closeDialog}
          headerIcon={<LogOut size={24} />}
          HeadingText="Do you want to Leave?"
          HeadingDescription="After logout you will be redirected to guest mode."
          children={
            <div className="flex justify-between w-full gap-4 p-2 ">
              <div className="w-1/2">
                <DynamicButton
                  label="Close"
                  onClick={closeDialog}
                  variant="primary"
                  className="w-full"
                />
              </div>
              <div className="w-1/2">
                <DynamicButton
                  label="Logout"
                  variant="secondary"
                  onClick={() => {
                    logout();
                    navigate("/", { replace: true });
                    closeDialog();
                  }}
                  className="w-full"
                  submitColor="bg-red-500 hover:bg-red-600"
                />
              </div>
            </div>
          }
        />
      ),
    });
  };

  const handleLogin = () => {
    openDialog({
      children: (
        <ModalProvider
          onClose={() => {
            closeDialog();
            const url = new URL(window.location.href);
            url.searchParams.delete("view");
            window.history.replaceState({}, "", url);
          }}
          headerIcon="🔐"
          HeadingText="Sign in to AI4U"
          HeadingDescription="Access your personalized learning experience"
          children={<AuthMain defaultView="login" redirectTo="/dashboard" />}
        />
      ),
    });
  };

  return (
    <div
      className={` flex flex-col flex-shrink-0 absolute h-full z-50  transition-[width] duration-300 ease-in-out border-r
         dark:bg-darkBackGround-950 dark:border-darkBackGround-700 bg-white border-gray-300 text-black dark:text-white ${
           showSidebar
             ? "w-64 shadow-[10px_0_15px_-3px_rgba(0,0,0,0.3)] ease-linear"
             : "w-16"
         }`}
    >
      <div className="absolute z-50 -right-4 top-3">
        <SidebarButton
          isOpen={showSidebar}
          onToggle={() => setShowSidebar(!showSidebar)}
          closeIcon={<SidebarClose size={20} />}
          openIcon={<SidebarOpen size={20} />}
        />
      </div>
      {/* Logo */}
      <div className=" p-2 px-4 flex flex-nowrap items-center min-w-max gap-3  border-b border-[#333] cursor-pointer">
        <div
          className="w-8 h-8 flex items-center justify-center rounded-lg font-bold text-white
         bg-gradient-to-br from-blue-600 to-violet-500"
        >
          <Brain size={20} />
        </div>
        {showSidebar && (
          <span className="text-lg font-semibold dark:text-white text-gray-800">
            AI4U
          </span>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4 overflow-y-auto">
        {SideBarHeaders.map((item, i) => (
          <SidebarNavigationButton
            item={item}
            showSidebar={showSidebar}
            isActive={window.location.pathname
              .toLocaleLowerCase()
              .endsWith(item.navigateTo.toLocaleLowerCase())}
            key={item.label}
            navigateTo={item.navigateTo && item.navigateTo}
          />
        ))}
        {showSidebar && (
          <div className="mt-8">
            <h3 className="text-xs font-medium text-gray-400 mb-3">Library</h3>
            {/* Replace with a valid item object or remove this component */}
            <SidebarNavigationButton
              item={{ icon: <Plus size={20} />, label: "Create a Thread" }}
              showSidebar={showSidebar}
            />
          </div>
        )}
      </div>

      <div className={`flex justify-end `}>
        <div className="p-3">
          <ThemeToggleButton />
        </div>
      </div>

      {/* User Section */}
      <div className=" md:h-[108px] h-[72px] border-t border-[#333] flex flex-col justify-around ">
        <div className="flex flex-col md:gap-4 gap-2 px-4">
          <div className="flex items-center gap-2 px-4 text-xs text-gray-400">
            {showSidebar && (
              <>
                <User size={16} />
                <span className="capitalize">{userDisplayName}</span>
              </>
            )}
          </div>

          {isAuthenticated ? (
            <DynamicButton
              label={showSidebar ? "Sign Out" : ""}
              variant="submit"
              icon={!showSidebar && <User size={20} />}
              onClick={() => handleLogout()}
              submitColor="bg-red-500 hover:bg-red-600"
            />
          ) : (
            <DynamicButton
              label={showSidebar ? "Sign In" : ""}
              variant="submit"
              icon={!showSidebar && <User size={20} />}
              onClick={() => handleLogin()}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default SideBar;
