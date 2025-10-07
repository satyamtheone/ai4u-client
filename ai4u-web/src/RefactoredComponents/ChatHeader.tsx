import { Menu } from "lucide-react";

const ChatHeader = ({
  setShowSidebar,
  showSidebar,
  isConnected,
}: {
  setShowSidebar: (value: React.SetStateAction<boolean>) => void;
  showSidebar: boolean;
  isConnected: boolean;
}) => {
  return (
    <div className="app-header">
      <div className="header-left">
        <button
          className="menu-button"
          onClick={() => setShowSidebar(!showSidebar)}
        >
          <Menu size={20} />
        </button>
        <h1 className="app-title">🤖 AI4U - Learn While You Code</h1>
      </div>
      <div className="connection-status">
        <div
          className={`status-dot ${isConnected ? "connected" : "disconnected"}`}
        ></div>
        <span
          className={`status-text ${
            isConnected ? "connected" : "disconnected"
          }`}
        >
          {isConnected ? "Connected" : "Disconnected"}
        </span>
      </div>
    </div>
  );
};

export default ChatHeader;
