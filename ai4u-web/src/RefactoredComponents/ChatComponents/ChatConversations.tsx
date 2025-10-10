import { Brain, User } from "lucide-react";
import { ChatMessage } from "../../types";

const ChatConversations = ({ messages }: { messages: ChatMessage[] }) => {
  return (
    <>
      {messages.map((message, index) => (
        <div
          key={index}
          className={`flex md:gap-3 gap-1 items-end ${
            message.type === "user" ? "justify-end" : ""
          }`}
        >
          {/* Bot Avatar */}
          {message.type === "bot" && (
            <div className="w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0 bg-gradient-to-br from-blue-600 to-violet-500 text-white">
              <Brain size={16} />
            </div>
          )}

          {/* Message Bubble */}
          <div
            className={`md:max-w-[70%] max-w-[85%] md:px-5 px-2 md:py-4 py-2 rounded-2xl text-sm leading-relaxed ${
              message.type === "user"
                ? "dark:bg-blue-600 bg-blue-500 text-white rounded-br-sm"
                : "dark:bg-[#2a2a2a] bg-gray-300 dark:text-white text-black border border-[#404040] rounded-bl-sm"
            }`}
          >
            <div>{message.message || message.response}</div>

            <div className="flex items-center gap-2 mt-2 text-[11px] opacity-70">
              {message.source && (
                <span className="bg-black/30 px-2 py-[2px] rounded dark:text-white/ text-white">
                  {message.source}
                </span>
              )}
              <span>
                {message.timestamp &&
                  new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* User Avatar */}
          {message.type === "user" && (
            <div className="w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0 dark:bg-[#404040] bg-gray-400 dark:text-gray-400 text-gray-200">
              <User size={16} />
            </div>
          )}
        </div>
      ))}
    </>
  );
};

export default ChatConversations;
