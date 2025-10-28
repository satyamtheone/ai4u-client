import { ArrowBigLeft, ArrowBigRight } from "lucide-react";
import SidebarButton from "../../commonComponents/SidebarButton";

const ChatHeader = ({ isConnected }: { isConnected: boolean }) => {
  return (
    <div className="flex max-md:flex-col items-center justify-between md:px-6 px-2 md:py-5 py-2.5  border-b border-darkBackGround-700 dark:bg-darkBackGround-950 bg-gray-100">
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
    </div>
  );
};

export default ChatHeader;
