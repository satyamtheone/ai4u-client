import { JSX } from "react";

const LoadingScreen: React.FC<{
  message?: string;
  title?: string;
  icon?: JSX.Element | string;
}> = ({ message, title, icon }) => (
  <div className="app">
    <div className="main-content">
      <div className="welcome-state">
        <div className="welcome-icon">{icon}</div>
        <h2 className="welcome-title">{title}</h2>
        <div className="loading-indicator">
          <div className="loading-dots">
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
          </div>
          <span
            style={{ marginLeft: "8px", color: "#b3b3b3", fontSize: "14px" }}
          >
            {message}
          </span>
        </div>
      </div>
    </div>
  </div>
);

export default LoadingScreen;
