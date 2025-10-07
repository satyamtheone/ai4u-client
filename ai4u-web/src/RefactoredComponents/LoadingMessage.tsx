import { LucideIcon } from "lucide-react";

const LoadingMessage = ({
  message,
  icon: Icon,
}: {
  message: string;
  icon: LucideIcon;
}) => {
  return (
    <div className="message bot">
      <div className="message-avatar bot">
        <Icon size={16} />
      </div>
      <div className="message-bubble bot">
        <div className="loading-indicator">
          <div className="loading-dots">
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
          </div>
          <span
            style={{
              marginLeft: "8px",
              color: "#b3b3b3",
              fontSize: "14px",
            }}
          >
            {message}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoadingMessage;
