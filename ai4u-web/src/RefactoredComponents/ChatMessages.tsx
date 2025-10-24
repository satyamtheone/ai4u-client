import { Brain } from "lucide-react";
import ErrorMessage from "./ErrorMessage";
import LoadingMessage from "./LoadingMessage";
import { ChatMessage } from "../types";
import ChatLandingScreen from "./ChatComponents/ChatLandingScreen";
import ChatConversations from "./ChatComponents/ChatConversations";

const ChatMessages = ({
  messages,
  isAuthenticated,
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
    <div className="flex-1 md:p-6 p-1 overflow-auto h-full flex flex-col gap-5 pb-6  ">
      {messages.length === 0 ? (
        <ChatLandingScreen
          handleSuggestedTopic={handleSuggestedTopic}
          isAuthenticated={isAuthenticated}
        />
      ) : (
        <>
          <ChatConversations messages={messages} />

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
