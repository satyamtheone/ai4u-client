import { Loader, Search, Send } from "lucide-react";

const ChatInput = ({
  inputMessage,
  setInputMessage,
  isConnected,
  isLoading,
  handleKeyPress,
  handleSendMessage,
}: {
  inputMessage: string;
  setInputMessage: (value: React.SetStateAction<string>) => void;
  handleKeyPress: (e: React.KeyboardEvent) => void;
  isConnected: boolean;
  isLoading: boolean;
  handleSendMessage: () => Promise<void>;
}) => {
  return (
    <div className="input-area">
      <div className="input-container">
        <Search className="search-icon" size={20} />
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={
            isConnected
              ? "Ask me anything about coding..."
              : "Please connect to backend first"
          }
          disabled={!isConnected || isLoading}
          rows={1}
          className="message-input"
          style={{
            minHeight: "24px",
            maxHeight: "120px",
            overflow: "auto",
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "auto";
            target.style.height = target.scrollHeight + "px";
          }}
        />
        <div className="input-actions">
          <button className="attach-button">📎</button>
          <button
            className="send-button"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || !isConnected || isLoading}
          >
            {isLoading ? (
              <Loader className="animate-spin" size={16} />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
