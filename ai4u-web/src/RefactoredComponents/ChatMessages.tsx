import { Brain, User } from "lucide-react";
import ErrorMessage from "./ErrorMessage";
import LoadingMessage from "./LoadingMessage";
import { ChatMessage } from "../types";

const ChatMessages = ({
  messages,
  isAuthenticated,
  suggestedTopics,
  handleSuggestedTopic,
  error,
  isLoading,
}: {
  messages: ChatMessage[];
  isAuthenticated: boolean;
  suggestedTopics: string[];
  handleSuggestedTopic: (topic: string) => void;
  error: string | undefined;
  isLoading: boolean;
}) => {
  return (
    <div className="messages-container">
      {messages.length === 0 ? (
        <div className="welcome-state">
          <div className="welcome-icon">🤖</div>
          <h2 className="welcome-title">Welcome to AI4U</h2>
          <p className="welcome-subtitle">
            Ask anything about coding or mention a topic to get started
            {!isAuthenticated && " (Guest Mode)"}
          </p>

          <div className="topic-pills">
            {suggestedTopics.map((topic, index) => (
              <button
                key={index}
                className="topic-pill"
                onClick={() => handleSuggestedTopic(topic)}
              >
                {topic}
              </button>
            ))}
          </div>

          {!isAuthenticated && (
            <div
              style={{
                marginTop: "24px",
                padding: "16px",
                background: "rgba(37, 99, 235, 0.1)",
                border: "1px solid #2563eb",
                borderRadius: "12px",
                maxWidth: "400px",
              }}
            >
              <p style={{ fontSize: "12px", color: "#2563eb", margin: 0 }}>
                💡 <strong>Sign in</strong> to save your conversations, track
                learning progress, and get personalized recommendations!
              </p>
            </div>
          )}
        </div>
      ) : (
        <>
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.type}`}>
              {message.type === "bot" && (
                <div className="message-avatar bot">
                  <Brain size={16} />
                </div>
              )}

              <div className={`message-bubble ${message.type}`}>
                <div>{message.message || message.response}</div>
                <div className="message-info">
                  {message.source && (
                    <span className="message-source">{message.source}</span>
                  )}
                  <span>
                    {message.timestamp &&
                      new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {message.type === "user" && (
                <div className="message-avatar user">
                  <User size={16} />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <LoadingMessage message="AI is thinking..." icon={Brain} />
          )}

          {error && <ErrorMessage error={error} />}
        </>
      )}
    </div>
  );
};

export default ChatMessages;
