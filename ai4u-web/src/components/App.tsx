// src/components/App.tsx - V1 Design with Optional Authentication
import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../hooks/redux";
import { ConfigManager } from "../services/ConfigManager";
import { BackendService } from "../services/BackendService";
import { LearningGateService } from "../services/LearningGateService";
import {
  setConfig,
  setBackendService,
  setLearningGateService,
  setConnectionStatus,
  setLearningGatesEnabled,
} from "../store/configSlice";
import { addNotification } from "../store/uiSlice";
import { sendMessage, addMessage } from "../store/chatSlice";
import { startQuiz } from "../store/quizSlice";
import QuizOverlay from "./QuizOverlay";
import NotificationContainer from "./NotificationContainer";
// V2 Authentication Imports
import { useAuth } from "./auth/AuthProvider";
import { suggestedTopics } from "../RefactoredComponents/Constants";
import LoadingScreen from "../RefactoredComponents/LoadingScreen";
import SideBar from "../RefactoredComponents/SideBar";
import LearningProgress from "../RefactoredComponents/LearningProgress";
import ChatMessages from "../RefactoredComponents/ChatMessages";
import ChatInput from "../RefactoredComponents/ChatInput";
import ChatHeader from "../RefactoredComponents/ChatHeader";
import { useNavigate } from "react-router-dom";

const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const { config, isConnected, learningGatesEnabled } = useAppSelector(
    (state) => state.config
  );
  const { messages, isLoading, error } = useAppSelector((state) => state.chat);
  const { isActive: quizActive, stats } = useAppSelector((state) => state.quiz);

  const [showSidebar, setShowSidebar] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
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

  // useEffect MUST BE CALLED UNCONDITIONALLY - BEFORE ANY RETURNS
  useEffect(() => {
    // Initialize app regardless of auth status when bypassed or authenticated
    const shouldInitialize = isAuthenticated || bypassAuth;
    if (!shouldInitialize) return;

    const initializeApp = async () => {
      try {
        const initialConfig = ConfigManager.getConfig();
        dispatch(setConfig(initialConfig));

        const backendService = new BackendService(initialConfig.backendUrl);
        dispatch(setBackendService(backendService));

        const learningGateService = new LearningGateService({
          enabled: true,
          questionsPerGate: 3,
          gateFrequency: 1,
          difficulty: "mixed",
          topics: ["JavaScript", "TypeScript", "Python", "React"],
        });
        dispatch(setLearningGateService(learningGateService));

        await testConnection(backendService);

        const handleConfigChange = (event: CustomEvent) => {
          const newConfig = event.detail;
          dispatch(setConfig(newConfig));
          backendService.setBackendUrl(newConfig.backendUrl);
          testConnection(backendService);
        };

        window.addEventListener(
          "ai4u_config_changed",
          handleConfigChange as EventListener
        );

        return () => {
          window.removeEventListener(
            "ai4u_config_changed",
            handleConfigChange as EventListener
          );
        };
      } catch (error) {
        console.error("Failed to initialize app:", error);
        dispatch(
          addNotification({
            type: "error",
            message: "App initialization failed",
          })
        );
      }
    };

    initializeApp();
  }, [dispatch, isAuthenticated, bypassAuth]);

  // if (!isAuthenticated && !bypassAuth) {
  //   return <NonLoginPage />;
  // }

  // HELPER FUNCTIONS AFTER HOOKS BUT BEFORE RETURNS
  const testConnection = async (service: BackendService) => {
    try {
      const result = await service.testConnection();
      dispatch(setConnectionStatus(result));
    } catch (error) {
      console.error("Connection test failed:", error);
      dispatch(
        setConnectionStatus({
          connected: false,
          message: "Connection test failed",
        })
      );
    }
  };

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

  const handleLogout = () => {
    logout();
    setBypassAuth(false);
    navigate("/", { replace: true });
  };

  const handleBypassAuth = () => {
    setBypassAuth(true);
  };

  const handleShowLogin = () => {
    setShowAuthModal(true);
  };

  // NOW CONDITIONAL RETURNS AFTER ALL HOOKS
  // Show loading screen while initializing
  if (authLoading) {
    return (
      <LoadingScreen icon={"🤖"} message="Initializing AI4U..." title="AI4U" />
    );
  }

  // MAIN APP RENDER - AFTER AUTHENTICATION OR BYPASS
  const userDisplayName = isAuthenticated
    ? user?.email || "User"
    : "Guest User";
  const showLearningProgress = isAuthenticated; // KEY: Only show learning progress for authenticated users

  return (
    <div className="app">
      {/* Sidebar */}
      <SideBar
        handleLogout={handleLogout}
        setShowSidebar={setShowSidebar}
        isAuthenticated={isAuthenticated}
        showSidebar={showSidebar}
        userDisplayName={userDisplayName}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col dark:bg-[#0a0a0a] bg-slate-200 overflow-hidden">
        {/* Header */}
        <ChatHeader
          isConnected={isConnected}
          setShowSidebar={setShowSidebar}
          showSidebar={showSidebar}
        />

        {/* Learning Progress */}
        <LearningProgress
          handleToggleLearningGates={handleToggleLearningGates}
          learningGatesEnabled={learningGatesEnabled}
          stats={stats}
        />

        {/* Chat Area */}
        <div className="flex flex-col overflow-hidden">
          <ChatMessages
            error={error}
            handleSuggestedTopic={handleSuggestedTopic}
            isAuthenticated={isAuthenticated}
            isLoading={isLoading}
            messages={messages}
            suggestedTopics={suggestedTopics}
          />

          {/* Input Area */}
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

      {/* Only show quiz overlay for authenticated users */}
      {quizActive && isAuthenticated && <QuizOverlay />}

      <NotificationContainer />
    </div>
  );
};

export default App;
