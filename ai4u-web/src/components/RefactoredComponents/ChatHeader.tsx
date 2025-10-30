import { ArrowBigLeft, ArrowBigRight } from "lucide-react";
import SidebarButton from "../../commonComponents/SidebarButton";
import { AuthMain, useAuth } from "../auth";
import DynamicButton from "../../commonComponents/DynamicButton";
import ModalProvider from "../../commonComponents/Dialog/ModalProvider";
import { useDialog } from "../../commonComponents/Dialog/DialogProvider";

const ChatHeader = ({ isConnected }: { isConnected: boolean }) => {
  const { isAuthenticated } = useAuth();
  const { openDialog, closeDialog } = useDialog();
  const handleLogin = () => {
    openDialog({
      children: (
        <ModalProvider
          onClose={() => closeDialog()}
          children={<AuthMain defaultView="login" redirectTo="/dashboard" />}
        />
      ),
    });
  };
  return (
    <div
      className={`flex max-md:flex-col items-center justify-between   border-b border-darkBackGround-700 dark:bg-darkBackGround-950 ${
        isAuthenticated ? "md:px-6 px-2 md:py-[20px] py-2.5" : "p-4"
      } `}
    >
      {/* Left Section */}
      <div className="flex items-center md:gap-4 gap-2  max-md:justify-around w-full">
        <h1 className="md:text-xl  text-lg font-semibold  m-0">
          🤖 AI4U - Learn While You Code
        </h1>
        <span></span>
      </div>

      {/* Connection Status */}
      <div className="flex items-center gap-2 text-sm pr-7">
        <div
          className={`w-3 h-3 rounded-full ${
            isConnected ? "bg-emerald-500" : "bg-red-500"
          }`}
        ></div>

        <span
          className={`font-medium ${
            isConnected ? "text-emerald-500" : "text-red-500"
          }`}
        >
          {isConnected ? "Connected" : "Disconnected"}
        </span>
      </div>

      {!isAuthenticated && (
        <div>
          <DynamicButton
            label={"Sign Up"}
            className=" min-w-8 text-nowrap"
            variant="primary"
            onClick={handleLogin}
          />
        </div>
      )}
    </div>
  );
};

export default ChatHeader;
