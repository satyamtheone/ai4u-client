// src/components/App.tsx - V1 Design with Optional Authentication
import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "../hooks/redux";
import { setLearningGatesEnabled } from "../store/configSlice";
import { addNotification } from "../store/uiSlice";
import { sendMessage, addMessage } from "../store/chatSlice";
import { startQuiz } from "../store/quizSlice";
import QuizOverlay from "./QuizOverlay";
import NotificationContainer from "./NotificationContainer";
import { useAuth } from "./auth/AuthProvider";
import { suggestedTopics } from "./RefactoredComponents/Constants";
import LoadingScreen from "./RefactoredComponents/LoadingScreen";
import LearningProgress from "./RefactoredComponents/LearningProgress";
import ChatMessages from "./RefactoredComponents/ChatMessages";
import ChatInput from "./RefactoredComponents/ChatInput";
import ChatHeader from "./RefactoredComponents/ChatHeader";
import { useNavigate } from "react-router-dom";

const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const { config, isConnected, learningGatesEnabled } = useAppSelector(
    (state) => state.config
  );
  const { messages, isLoading, error } = useAppSelector((state) => state.chat);
  const { isActive: quizActive, stats } = useAppSelector((state) => state.quiz);

  const [inputMessage, setInputMessage] = useState("");
  const [bypassAuth, setBypassAuth] = useState(false);
  const navigate = useNavigate();

  // V2 Authentication - ALL HOOKS MUST BE AT THE TOP
  const { isAuthenticated, user, logout, isLoading: authLoading } = useAuth();

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

    dispatch(
      addMessage({
        type: "user",
        message: userMessage,
        timestamp: new Date().toISOString(),
      })
    );

    try {
      const shouldShowGate = learningGateService.shouldShowGate();

      // Only show learning gates for authenticated users
      if (shouldShowGate) {
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

      const result = await dispatch(sendMessage(userMessage));

      if (sendMessage.fulfilled.match(result)) {
        const response = result.payload;

        if (response.type === "learning_gate") {
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
  };

  // NOW CONDITIONAL RETURNS AFTER ALL HOOKS
  // Show loading screen while initializing
  if (authLoading) {
    return (
      <LoadingScreen icon={"🤖"} message="Initializing AI4U..." title="AI4U" />
    );
  }

  return (
    <div className="app">
      {/* Sidebar */}

      {/* Main Content */}
      <div className="flex-1 flex flex-col dark:bg-[#0a0a0a] bg-slate-200 overflow-hidden">
        {/* Header */}
        <ChatHeader isConnected={isConnected} />

        {/* Learning Progress */}
        <LearningProgress
          handleToggleLearningGates={handleToggleLearningGates}
          learningGatesEnabled={learningGatesEnabled}
        />

        {/* Chat Area */}
        <div className="flex flex-col overflow-hidden relative h-full">
          <ChatMessages
            error={error}
            handleSuggestedTopic={handleSuggestedTopic}
            isAuthenticated={isAuthenticated}
            isLoading={isLoading}
            messages={messages}
            suggestedTopics={suggestedTopics}
          />

          {/* Input Area */}
          <div className="w-full bottom-0">
            <ChatInput
              handleKeyPress={handleKeyPress}
              handleSendMessage={handleSendMessage}
              inputMessage={inputMessage}
              isConnected={isConnected}
              isLoading={isLoading}
              setInputMessage={setInputMessage}
            />
          </div>
        </div>
      </div>
      {/* Only show quiz overlay for authenticated users */}
      {quizActive && (isAuthenticated || bypassAuth) && <QuizOverlay />}
    </div>
  );
};

export default App;
