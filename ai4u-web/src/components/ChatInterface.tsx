import React, { useState, useRef, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../hooks/redux";
import { sendMessage, addMessage } from "../store/chatSlice";
import { startQuiz } from "../store/quizSlice";
import { addNotification } from "../store/uiSlice";
import { Send, Loader } from "lucide-react";
import MessageList from "../components/MessageList";
import ProgressStats from "./ProgressStats";

const ChatInterface: React.FC = () => {
  const dispatch = useAppDispatch();
  const [inputMessage, setInputMessage] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { messages, isLoading, error } = useAppSelector((state) => state.chat);
  const { isConnected } = useAppSelector((state) => state.config);
  const { stats } = useAppSelector((state) => state.quiz);

  // Get services from Redux store (with proper typing)
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

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <div className="chat-interface">
      <ProgressStats stats={stats} />

      <MessageList messages={messages} isLoading={isLoading} error={error} />

      <div className="input-container">
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
          rows={3}
          className="message-input"
        />
        <button
          onClick={handleSendMessage}
          disabled={!inputMessage.trim() || !isConnected || isLoading}
          className="send-button"
        >
          {isLoading ? (
            <Loader className="spinning" size={20} />
          ) : (
            <Send size={20} />
          )}
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
