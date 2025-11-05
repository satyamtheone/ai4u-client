import { configureStore } from "@reduxjs/toolkit";
import chatSlice from "./chatSlice";
import quizSlice from "./quizSlice";
import configSlice from "./configSlice";
import uiSlice from "./uiSlice";
import { authApi } from "../services/api/authApi";
import { setupListeners } from "@reduxjs/toolkit/query";
import { learningApi } from "../services/api/learningApi";
import { organizationApi } from "../services/api/organizationApi";

export const store = configureStore({
  reducer: {
    chat: chatSlice,
    quiz: quizSlice,
    config: configSlice,
    ui: uiSlice,
    [authApi.reducerPath]: authApi.reducer,
    [learningApi.reducerPath]: learningApi.reducer,
    [organizationApi.reducerPath]: organizationApi.reducer,
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
    })
      .concat(authApi.middleware)
      .concat(learningApi.middleware)
      .concat(organizationApi.middleware),
});
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
