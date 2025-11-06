import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { apiConfig } from "../../config/apiConfig";
import { API_ENDPOINTS } from "../../utils/constants/apiEndpoints";

import type {
  Quiz,
  QuizAttempt,
  UserProgress,
  ChatRequest,
  ChatMessage,
  QuizQuestion,
  UserLearningAnalyticsResponse,
} from "../../commonComponents/Types";

// Keep using your existing StorageService for Authorization so nothing breaks
import { StorageService } from "../utils/StorageService";
import { QuizStats } from "../../store/quizSlice";
const storage = new StorageService();

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

const baseQuery = fetchBaseQuery({
  baseUrl: apiConfig.baseURL,
  prepareHeaders: (headers) => {
    const token = storage.getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    headers.set("Accept", "application/json");
    return headers;
  },
});

export const learningApi = createApi({
  reducerPath: "learningApi",
  baseQuery,
  tagTypes: [
    "Quiz",
    "QuizAttempts",
    "Progress",
    "Stats",
    "Analytics",
    "Chat",
    "Questions",
  ],

  endpoints: (builder) => ({
    /** ---------------------- QUIZ ---------------------- */

    getQuiz: builder.query<Quiz, number>({
      query: (quizId) => ({
        url: `${API_ENDPOINTS.LEARNING.QUIZ.QUESTIONS}/${quizId}`,
        method: "GET",
      }),
      transformResponse: (resp: ApiResponse<Quiz> | Quiz) =>
        (resp as any).data ?? (resp as Quiz),
      providesTags: (r, e, quizId) => [{ type: "Quiz", id: quizId }],
    }),

    submitQuiz: builder.mutation<QuizAttempt, Parameters<typeof Object>[0]>({
      query: (data: any) => ({
        url: API_ENDPOINTS.LEARNING.QUIZ.SUBMIT,
        method: "POST",
        body: data,
        headers: { "Content-Type": "application/json" },
      }),
      transformResponse: (resp: ApiResponse<QuizAttempt> | QuizAttempt) =>
        (resp as any).data ?? (resp as QuizAttempt),
      invalidatesTags: ["QuizAttempts", "Progress"],
    }),

    submitBatchQuiz: builder.mutation<QuizAttempt[], { answers: any[] }>({
      query: ({ answers }) => ({
        url: API_ENDPOINTS.LEARNING.QUIZ.SUBMIT_BATCH,
        method: "POST",
        body: { answers },
        headers: { "Content-Type": "application/json" },
      }),
      transformResponse: (resp: ApiResponse<QuizAttempt[]> | QuizAttempt[]) =>
        (resp as any).data ?? (resp as QuizAttempt[]),
      invalidatesTags: ["QuizAttempts", "Progress"],
    }),

    skipQuiz: builder.mutation<{ skipped: boolean }, number>({
      query: (quizId) => ({
        url: API_ENDPOINTS.LEARNING.QUIZ.SKIP,
        method: "POST",
        body: { quizId },
        headers: { "Content-Type": "application/json" },
      }),
      transformResponse: (
        resp: ApiResponse<{ skipped: boolean }> | { skipped: boolean }
      ) => (resp as any).data ?? (resp as { skipped: boolean }),
      invalidatesTags: ["Quiz", "Progress"],
    }),

    getQuizAttempts: builder.query<QuizAttempt[], number>({
      query: (quizId) => ({
        url: `${API_ENDPOINTS.LEARNING.QUIZ.QUESTIONS}/${quizId}/attempts`,
        method: "GET",
      }),
      transformResponse: (resp: ApiResponse<QuizAttempt[]> | QuizAttempt[]) =>
        (resp as any).data ?? (resp as QuizAttempt[]),
      providesTags: (r, e, quizId) => [{ type: "QuizAttempts", id: quizId }],
    }),

    /** ---------------------- PROGRESS ---------------------- */

    getUserProgress: builder.query<
      UserProgress[],
      { courseId?: number; type?: "course" | "lesson" | "quiz" } | void
    >({
      query: (params) => {
        const qs = new URLSearchParams();
        if (params?.courseId != null)
          qs.set("courseId", String(params.courseId));
        if (params?.type) qs.set("type", params.type);
        return {
          url: qs.toString()
            ? `${API_ENDPOINTS.LEARNING.PROGRESS.GET}?${qs.toString()}`
            : API_ENDPOINTS.LEARNING.PROGRESS.GET,
          method: "GET",
        };
      },
      transformResponse: (resp: ApiResponse<UserProgress[]> | UserProgress[]) =>
        (resp as any).data ?? (resp as UserProgress[]),
      providesTags: ["Progress"],
    }),

    updateProgress: builder.mutation<
      UserProgress,
      {
        courseId?: number;
        lessonId?: number;
        quizId?: number;
        timeSpent: number;
        completed?: boolean;
      }
    >({
      query: (data) => ({
        url: API_ENDPOINTS.LEARNING.PROGRESS.UPDATE,
        method: "POST",
        body: data,
        headers: { "Content-Type": "application/json" },
      }),
      transformResponse: (resp: ApiResponse<UserProgress> | UserProgress) =>
        (resp as any).data ?? (resp as UserProgress),
      invalidatesTags: ["Progress"],
    }),

    resetProgress: builder.mutation<{ reset: boolean }, number>({
      query: (courseId) => ({
        url: API_ENDPOINTS.LEARNING.PROGRESS.RESET,
        method: "POST",
        body: { courseId },
        headers: { "Content-Type": "application/json" },
      }),
      transformResponse: (
        resp: ApiResponse<{ reset: boolean }> | { reset: boolean }
      ) => (resp as any).data ?? (resp as { reset: boolean }),
      invalidatesTags: ["Progress"],
    }),

    /** ---------------------- STATS & ANALYTICS ---------------------- */

    getLearningStats: builder.query<QuizStats, void>({
      query: () => ({
        url: API_ENDPOINTS.LEARNING.STATS,
        method: "GET",
      }),
      transformResponse: (resp: ApiResponse<QuizStats> | QuizStats) =>
        (resp as any).data ?? (resp as QuizStats),
      providesTags: ["Stats"],
    }),

    getCurrentUserAnalytics: builder.query<
      UserLearningAnalyticsResponse,
      string
    >({
      query: (id: string) => ({
        url: API_ENDPOINTS.LEARNING.ANALYTICS.BY_ID(id),
        method: "GET",
      }),
      transformResponse: (
        resp:
          | ApiResponse<UserLearningAnalyticsResponse>
          | UserLearningAnalyticsResponse
      ) => (resp as any).data ?? (resp as UserLearningAnalyticsResponse),
      providesTags: ["Analytics"],
    }),

    /** ---------------------- CHAT ---------------------- */

    sendChatMessage: builder.mutation<ChatMessage, ChatRequest>({
      query: (data) => ({
        url: API_ENDPOINTS.LEARNING.CHAT,
        method: "POST",
        body: data,
        headers: { "Content-Type": "application/json" },
      }),
      transformResponse: (resp: ApiResponse<ChatMessage> | ChatMessage) =>
        (resp as any).data ?? (resp as ChatMessage),
      invalidatesTags: ["Chat"],
    }),

    getChatHistory: builder.query<
      { messages: ChatMessage[]; total: number; page: number; limit: number },
      { page?: number; limit?: number; conversationId?: string } | void
    >({
      query: (params) => {
        const qs = new URLSearchParams();
        if (params?.page != null) qs.set("page", String(params.page));
        if (params?.limit != null) qs.set("limit", String(params.limit));
        if (params?.conversationId)
          qs.set("conversationId", params.conversationId);
        return {
          url: qs.toString()
            ? `${API_ENDPOINTS.LEARNING.CHAT}/history?${qs.toString()}`
            : `${API_ENDPOINTS.LEARNING.CHAT}/history`,
          method: "GET",
        };
      },
      transformResponse: (
        resp:
          | ApiResponse<{
              messages: ChatMessage[];
              total: number;
              page: number;
              limit: number;
            }>
          | {
              messages: ChatMessage[];
              total: number;
              page: number;
              limit: number;
            }
      ) => (resp as any).data ?? (resp as any),
      providesTags: ["Chat"],
    }),

    /** ---------------------- ADMIN QUESTIONS ---------------------- */

    createQuizQuestion: builder.mutation<
      QuizQuestion,
      Omit<QuizQuestion, "id">
    >({
      query: (data) => ({
        url: API_ENDPOINTS.LEARNING.ADMIN.CREATE_QUESTION,
        method: "POST",
        body: data,
        headers: { "Content-Type": "application/json" },
      }),
      transformResponse: (resp: ApiResponse<QuizQuestion> | QuizQuestion) =>
        (resp as any).data ?? (resp as QuizQuestion),
      invalidatesTags: ["Questions"],
    }),

    updateQuizQuestion: builder.mutation<
      QuizQuestion,
      { questionId: number; data: Partial<QuizQuestion> }
    >({
      query: ({ questionId, data }) => ({
        url: API_ENDPOINTS.LEARNING.ADMIN.UPDATE_QUESTION(questionId),
        method: "PUT",
        body: data,
        headers: { "Content-Type": "application/json" },
      }),
      transformResponse: (resp: ApiResponse<QuizQuestion> | QuizQuestion) =>
        (resp as any).data ?? (resp as QuizQuestion),
      invalidatesTags: ["Questions"],
    }),

    // DELETE /learning/admin/questions/:id
    deleteQuizQuestion: builder.mutation<void, number>({
      query: (questionId) => ({
        url: API_ENDPOINTS.LEARNING.ADMIN.DELETE_QUESTION(questionId),
        method: "DELETE",
      }),
      invalidatesTags: ["Questions"],
    }),

    bulkImportQuestions: builder.mutation<
      { message: string },
      { file: File; additionalData?: Record<string, string | number | boolean> }
    >({
      query: ({ file, additionalData }) => {
        const formData = new FormData();
        formData.append("file", file);
        if (additionalData) {
          Object.entries(additionalData).forEach(([k, v]) =>
            formData.append(k, String(v))
          );
        }
        return {
          url: API_ENDPOINTS.LEARNING.ADMIN.BULK_IMPORT,
          method: "POST",
          body: formData,
        };
      },
      transformResponse: (resp: ApiResponse<{ message?: string }> | any) => ({
        message: (resp as any)?.message ?? (resp as any)?.data?.message ?? "OK",
      }),
      invalidatesTags: ["Questions"],
    }),
  }),
});

export const {
  // QUIZ
  useGetQuizQuery,
  useSubmitQuizMutation,
  useSubmitBatchQuizMutation,
  useSkipQuizMutation,
  useGetQuizAttemptsQuery,

  // PROGRESS
  useGetUserProgressQuery,
  useUpdateProgressMutation,
  useResetProgressMutation,

  // STATS & ANALYTICS
  useGetLearningStatsQuery,
  useLazyGetLearningStatsQuery,
  useGetCurrentUserAnalyticsQuery,
  useLazyGetCurrentUserAnalyticsQuery,

  // CHAT
  useSendChatMessageMutation,
  useGetChatHistoryQuery,

  // ADMIN QUESTIONS
  useCreateQuizQuestionMutation,
  useUpdateQuizQuestionMutation,
  useDeleteQuizQuestionMutation,
  useBulkImportQuestionsMutation,
} = learningApi;
