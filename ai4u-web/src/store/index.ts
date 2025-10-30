import { configureStore } from "@reduxjs/toolkit";
import chatSlice from "./chatSlice";
import quizSlice from "./quizSlice";
import configSlice from "./configSlice";
import uiSlice from "./uiSlice";

export const store = configureStore({
  reducer: {
    chat: chatSlice,
    quiz: quizSlice,
    config: configSlice,
    ui: uiSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          "config/setBackendService",
          "config/setLearningGateService",
          "quiz/startQuiz",
          "config/setLearningService",
          "config/setOrganizationService",
        ],
        ignoredActionsPaths: [
          "payload.backendService",
          "payload.learningGateService",
          "payload.learningService",
          "payload.organizationService",
        ],
        ignoredPaths: [
          "config.backendService",
          "config.learningGateService",
          "config.learningService",
          "quiz.currentQuestions",
          "config.organizationService",
        ],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
