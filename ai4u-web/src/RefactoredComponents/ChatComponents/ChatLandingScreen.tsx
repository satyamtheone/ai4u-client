import DynamicButton from "../../commonComponents/DynamicButton";
import { suggestedTopics } from "../Constants";

const ChatLandingScreen = ({
  handleSuggestedTopic,
  isAuthenticated,
}: {
  handleSuggestedTopic: (topic: string) => void;
  isAuthenticated: boolean;
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-10">
      <div className="text-[64px] mb-4">🤖</div>

      <h2 className="text-[28px] font-semibold dark:text-white  text-black mb-2">
        Welcome to AI4U
      </h2>

      <p className="text-[16px] dark:text-gray-400 text-gray-700 mb-8">
        Ask anything about coding or mention a topic to get started
        {!isAuthenticated && " (Guest Mode)"}
      </p>

      <div className="flex flex-wrap justify-center gap-3 max-w-[600px]">
        {suggestedTopics.map((topic, index) => (
          <DynamicButton
            label={topic}
            variant="pill"
            key={index}
            onClick={() => handleSuggestedTopic(topic)}
          />
        ))}
      </div>

      {!isAuthenticated && (
        <div className="mt-6 p-4 bg-[rgba(37,99,235,0.1)] border border-blue-600 rounded-xl max-w-[400px]">
          <p className="text-xs text-blue-600 m-0">
            💡 <strong>Sign in</strong> to save your conversations, track
            learning progress, and get personalized recommendations!
          </p>
        </div>
      )}
    </div>
  );
};

export default ChatLandingScreen;
