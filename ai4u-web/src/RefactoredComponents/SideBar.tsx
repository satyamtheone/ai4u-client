import { Book, Brain, Code, Home, MessageSquare, User } from "lucide-react";

const SideBar = ({
  showSidebar,
  isAuthenticated,
  handleLogout,
  handleShowLogin,
  userDisplayName,
}: {
  showSidebar: boolean;
  isAuthenticated: boolean;
  handleLogout: () => void;
  handleShowLogin: () => void;
  userDisplayName: string;
}) => {
  return (
    <div className={`sidebar ${showSidebar ? "expanded" : "collapsed"}`}>
      {/* Logo */}
      <div className="logo-section">
        <div className="logo-icon">
          <Brain size={20} />
        </div>
        {showSidebar && <span className="logo-text">AI4U</span>}
      </div>

      {/* Navigation */}
      <div className="nav-section">
        <button className="nav-item active">
          <Home className="nav-icon" size={20} />
          {showSidebar && <span>Home</span>}
        </button>

        <button className="nav-item">
          <Book className="nav-icon" size={20} />
          {showSidebar && <span>Library</span>}
        </button>

        <button className="nav-item">
          <Code className="nav-icon" size={20} />
          {showSidebar && <span>Coding</span>}
        </button>

        <button className="nav-item">
          <MessageSquare className="nav-icon" size={20} />
          {showSidebar && <span>Chats</span>}
        </button>

        {showSidebar && (
          <div style={{ marginTop: "32px" }}>
            <h3
              style={{
                color: "#b3b3b3",
                fontSize: "12px",
                fontWeight: 500,
                marginBottom: "12px",
              }}
            >
              Library
            </h3>
            <button className="nav-item">
              <span style={{ fontSize: "18px" }}>+</span>
              Create a Thread
            </button>
          </div>
        )}
      </div>

      {/* User Section - Updated for Optional Authentication */}
      <div className="user-section">
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {showSidebar && (
            <div
              style={{
                color: "#b3b3b3",
                fontSize: "12px",
                padding: "0 16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <User size={16} />
              <span>{userDisplayName}</span>
            </div>
          )}

          {isAuthenticated ? (
            <button
              className="sign-in-button"
              onClick={handleLogout}
              style={{ background: "#ef4444" }}
            >
              {showSidebar ? "Sign Out" : <User size={20} />}
            </button>
          ) : (
            <button className="sign-in-button" onClick={handleShowLogin}>
              {showSidebar ? "Sign In" : <User size={20} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SideBar;
