import React, { useState, useRef, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../hooks/redux";
import { sendMessage, addMessage } from "../store/chatSlice";
import { startQuiz } from "../store/quizSlice";
import { setLearningGatesEnabled } from "../store/configSlice";
import { addNotification } from "../store/uiSlice";
import {
  Search,
  Send,
  Loader,
  Trophy,
  Zap,
  Target,
  Unlock,
} from "lucide-react";
import EnhancedMessageList from "../components/EnhancedMessageList";

const EnhancedChatInterface: React.FC = () => {
  const dispatch = useAppDispatch();
  const [inputMessage, setInputMessage] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { messages, isLoading, error } = useAppSelector((state) => state.chat);
  const { isConnected, learningGatesEnabled } = useAppSelector(
    (state) => state.config
  );
  const { stats } = useAppSelector((state) => state.quiz);

  // Get services from Redux store
  const backendService = useAppSelector(
    (state) => (state.config as any).backendService
  );
  const learningGateService = useAppSelector(
    (state) => (state.config as any).learningGateService
  );

  const handleSendMessage = async () => {
    if (
      !inputMessage.trim() ||
      !isConnected ||
      !backendService ||
      !learningGateService
    ) {
      if (!isConnected) {
        dispatch(
          addNotification({
            type: "warning",
            message: "Please connect to backend first",
          })
        );
      }
      return;
    }

    const userMessage = inputMessage.trim();
    setInputMessage("");

    // Add user message to chat
    dispatch(
      addMessage({
        type: "user",
        message: userMessage,
        timestamp: new Date().toISOString(),
      })
    );

    try {
      // Check if learning gate should be shown
      const shouldShowGate = learningGateService.shouldShowGate();

      if (shouldShowGate) {
        // Get questions from backend
        const questions = await backendService.getQuizQuestions(3);
        if (questions && questions.length > 0) {
          dispatch(
            startQuiz({
              questions,
              stats: learningGateService.getStats(),
              pendingMessage: userMessage,
            })
          );
          return;
        }
      }

      // Send message directly
      const result = await dispatch(sendMessage(userMessage));

      if (sendMessage.fulfilled.match(result)) {
        const response = result.payload;

        if (response.type === "learning_gate") {
          // Backend triggered learning gate
          dispatch(
            startQuiz({
              questions: [response.question],
              stats: response.stats || learningGateService.getStats(),
              pendingMessage: userMessage,
            })
          );
        }
      } else if (sendMessage.rejected.match(result)) {
        dispatch(
          addNotification({
            type: "error",
            message: result.payload || "Failed to send message",
          })
        );
      }
    } catch (error: any) {
      console.error("Failed to send message:", error);
      dispatch(
        addNotification({
          type: "error",
          message: error.message || "Failed to send message",
        })
      );
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleToggleLearningGates = () => {
    dispatch(setLearningGatesEnabled(!learningGatesEnabled));
  };

  const handleSuggestedTopic = (topic: string) => {
    setInputMessage(topic);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Suggested topics for empty state
  const suggestedTopics = [
    "🧠 Explain React hooks",
    "🔧 Debug this JavaScript error",
    "💡 Best practices for TypeScript",
    "❤️ Code review checklist",
    "✅ Optimize this algorithm",
  ];

  return (
    <div className="flex-1 flex flex-col">
      {/* Learning Progress Section */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            🎓 Learning Progress
          </h2>
          <button
            onClick={handleToggleLearningGates}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              learningGatesEnabled
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-gray-600 text-gray-300 hover:bg-gray-700"
            }`}
          >
            {learningGatesEnabled ? "Disable" : "Enable"} Learning Gates
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
            <div className="flex items-center gap-3">
              <Trophy className="text-yellow-500" size={20} />
              <div>
                <div className="text-gray-400 text-sm">Level</div>
                <div className="text-white text-xl font-semibold">
                  {stats.level}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
            <div className="flex items-center gap-3">
              <Zap className="text-blue-500" size={20} />
              <div>
                <div className="text-gray-400 text-sm">Streak</div>
                <div className="text-white text-xl font-semibold">
                  {stats.streak}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
            <div className="flex items-center gap-3">
              <Target className="text-purple-500" size={20} />
              <div>
                <div className="text-gray-400 text-sm">Accuracy</div>
                <div className="text-white text-xl font-semibold">
                  {stats.accuracy}%
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-600 to-green-700 p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <Unlock className="text-white" size={20} />
              <div>
                <div className="text-green-100 text-sm">Responses Left</div>
                <div className="text-white text-xl font-semibold">
                  {stats.unlockedResponses}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="text-6xl mb-4">🤖</div>
            <h2 className="text-2xl font-semibold text-white mb-2">
              Welcome to AI4U
            </h2>
            <p className="text-gray-400 mb-8">
              Ask anything about coding or mention a topic to get started
            </p>

            <div className="flex flex-wrap gap-3 justify-center max-w-2xl">
              {suggestedTopics.map((topic, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedTopic(topic)}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded-full hover:bg-gray-700 transition-colors text-sm"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <EnhancedMessageList
            messages={messages}
            isLoading={isLoading}
            error={error}
          />
        )}
      </div>

      {/* Enhanced Input Area */}
      <div className="p-6 border-t border-gray-700">
        <div className="relative">
          <div className="flex items-center bg-gray-800 rounded-2xl border border-gray-700 p-2 focus-within:border-blue-500 transition-colors">
            <Search size={20} className="text-gray-400 mx-3" />
            <textarea
              ref={inputRef}
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
              className="flex-1 bg-transparent text-white placeholder-gray-400 px-2 py-3 focus:outline-none resize-none"
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
            <div className="flex items-center gap-2 px-2">
              <button className="p-2 text-gray-400 hover:text-white transition-colors">
                📎
              </button>
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || !isConnected || isLoading}
                className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
      </div>
    </div>
  );
};

export default EnhancedChatInterface;
