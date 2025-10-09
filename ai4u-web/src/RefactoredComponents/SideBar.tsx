import {
  ArrowBigLeft,
  ArrowBigRight,
  Book,
  Brain,
  Code,
  Home,
  MessageSquare,
  Plus,
  User,
} from "lucide-react";
import DynamicModal from "../cmmonComponents/DynamicModal";
import { AuthMain } from "../components/auth";
import { useState } from "react";
import DynamicButton from "../cmmonComponents/DynamicButton";
import { useNavigate } from "react-router-dom";
import SidebarNavigationButton from "../cmmonComponents/SidebarNavigationButton";
import SidebarButton from "../cmmonComponents/SidebarButton";
import { log } from "console";

const SideBar = ({
  showSidebar,
  isAuthenticated,
  handleLogout,
  setShowSidebar,
  userDisplayName,
}: {
  showSidebar: boolean;
  isAuthenticated: boolean;
  handleLogout: () => void;
  setShowSidebar: (value: React.SetStateAction<boolean>) => void;
  userDisplayName: string;
}) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const navigate = useNavigate();

  const SideBarHeaders = [
    { icon: <Home size={20} />, label: "Home", isActive: true },
    { icon: <Book size={20} />, label: "Library" },
    { icon: <Code size={20} />, label: "Coding" },
    { icon: <MessageSquare size={20} />, label: "Chats" },
  ];

  const handleNavigateToHome = () => {
    navigate("/");
  };

  console.log("====================================");
  console.log(showSidebar);
  console.log("====================================");
  return (
    <div
      className={` flex flex-col flex-shrink-0 transition-[width] duration-200 ease-in-out border-r
         dark:bg-darkBackGround-950 dark:border-darkBackGround-700 bg-gray-100 border-gray-300 text-black dark:text-white ${
           showSidebar ? "w-64 max-md:absolute h-full z-50" : "w-16"
         }`}
    >
      {showSidebar && (
        <div className={` md:hidden  absolute top-3 right-2`}>
          <SidebarButton
            isOpen={showSidebar}
            onToggle={() => setShowSidebar(!showSidebar)}
            closeIcon={<ArrowBigLeft size={20} />}
            openIcon={<ArrowBigRight size={20} />}
          />
        </div>
      )}
      {/* Logo */}
      <div
        className="flex items-center gap-3 p-4 pb-7 border-b border-[#333] cursor-pointer"
        onClick={handleNavigateToHome}
      >
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
            key={item.label}
            isActive={i == 0}
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

      {/* User Section */}
      <div className=" h-28 border-t border-[#333] flex flex-col justify-around">
        <div className="flex flex-col gap-4 px-4">
          {showSidebar && (
            <div className="flex items-center gap-2 px-4 text-xs text-gray-400">
              <User size={16} />
              <span>{userDisplayName}</span>
            </div>
          )}

          {isAuthenticated ? (
            <DynamicButton
              label={showSidebar ? "Sign Out" : ""}
              variant="submit"
              icon={!showSidebar && <User size={20} />}
              onClick={() => handleLogout}
              submitColor="bg-red-500 hover:bg-red-600"
            />
          ) : (
            <DynamicButton
              label={showSidebar ? "Sign In" : ""}
              variant="submit"
              icon={!showSidebar && <User size={20} />}
              onClick={() => setShowAuthModal(true)}
            />
          )}
        </div>

        <DynamicModal
          isOpen={showAuthModal}
          onClose={() => {
            setShowAuthModal(false);
            const url = new URL(window.location.href);
            url.searchParams.delete("view");
            window.history.replaceState({}, "", url);
          }}
          headerIcon="🔐"
          HeadingText="Sign in to AI4U"
          HeadingDescription="Access your personalized learning experience"
          child={<AuthMain defaultView="login" redirectTo="/nonLogin" />}
        />
      </div>
    </div>
  );
};

export default SideBar;
