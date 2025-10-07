import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { QuizQuestion, BackendQuizResult } from "../types";
import { BackendService } from "../services/BackendService";

export interface QuizStats {
  level: number;
  streak: number;
  currentStreak?: number; // Added optional currentStreak
  accuracy: number;
  totalQuestions: number;
  unlockedResponses: number;
}

interface QuizState {
  isActive: boolean;
  currentQuestions: QuizQuestion[];
  currentQuestionIndex: number;
  selectedAnswers: Record<string, any>;
  isSubmitting: boolean;
  stats: QuizStats;
  pendingUserMessage?: string;
}

const initialState: QuizState = {
  isActive: false,
  currentQuestions: [],
  currentQuestionIndex: 0,
  selectedAnswers: {},
  isSubmitting: false,
  stats: {
    level: 1,
    streak: 0,
    accuracy: 0,
    totalQuestions: 0,
    unlockedResponses: 0,
  },
};

// Create async thunk for submitting quiz answers
export const submitQuizAnswers = createAsyncThunk<
  any,
  { question_id: string; selected_answer: number; answer_type: string }[],
  { rejectValue: string }
>(
  "quiz/submitAnswers",
  async (
    answers: {
      question_id: string;
      selected_answer: number;
      answer_type: string;
    }[],
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as any;
      const backendService = state.config.backendService as BackendService;

      if (!backendService) {
        throw new Error("Backend service not initialized");
      }

      const response = await backendService.submitQuizAnswers(answers);

      if (!response) {
        throw new Error("Failed to submit quiz answers");
      }

      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Create async thunk for skipping quiz
export const skipQuiz = createAsyncThunk<
  BackendQuizResult,
  void,
  { rejectValue: string }
>("quiz/skip", async (_, { getState, rejectWithValue }) => {
  try {
    const state = getState() as any;
    const backendService = state.config.backendService as BackendService;

    if (!backendService) {
      throw new Error("Backend service not initialized");
    }

    const response = await backendService.skipQuiz();

    if (!response) {
      throw new Error("Failed to skip quiz");
    }

    return response;
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

const quizSlice = createSlice({
  name: "quiz",
  initialState,
  reducers: {
    startQuiz: (
      state,
      action: PayloadAction<{
        questions: QuizQuestion[];
        stats: any;
        pendingMessage?: string;
      }>
    ) => {
      state.isActive = true;
      state.currentQuestions = action.payload.questions;
      state.currentQuestionIndex = 0;
      state.selectedAnswers = {};

      // Fixed: Handle both streak and currentStreak from backend
      const incomingStats = action.payload.stats;
      state.stats = {
        level: incomingStats.level || 1,
        streak: incomingStats.currentStreak || incomingStats.streak || 0,
        currentStreak: incomingStats.currentStreak || incomingStats.streak || 0,
        accuracy: incomingStats.accuracy || 0,
        totalQuestions: incomingStats.totalQuestions || 0,
        unlockedResponses: incomingStats.unlockedResponses || 0,
      };

      state.pendingUserMessage = action.payload.pendingMessage;
    },
    setCurrentQuestionIndex: (state, action: PayloadAction<number>) => {
      state.currentQuestionIndex = action.payload;
    },
    setSelectedAnswer: (
      state,
      action: PayloadAction<{ questionId: string; answer: any }>
    ) => {
      state.selectedAnswers[action.payload.questionId] = action.payload.answer;
    },
    endQuiz: (state) => {
      state.isActive = false;
      state.currentQuestions = [];
      state.currentQuestionIndex = 0;
      state.selectedAnswers = {};
      state.pendingUserMessage = undefined;
    },
    updateStats: (state, action: PayloadAction<any>) => {
      // Fixed: Handle stats update with proper type conversion
      const incomingStats = action.payload;
      state.stats = {
        level: incomingStats.level || state.stats.level,
        streak:
          incomingStats.currentStreak ||
          incomingStats.streak ||
          state.stats.streak,
        currentStreak:
          incomingStats.currentStreak ||
          incomingStats.streak ||
          state.stats.streak,
        accuracy: incomingStats.accuracy || state.stats.accuracy,
        totalQuestions:
          incomingStats.totalQuestions || state.stats.totalQuestions,
        unlockedResponses:
          incomingStats.unlockedResponses || state.stats.unlockedResponses,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitQuizAnswers.pending, (state) => {
        state.isSubmitting = true;
      })
      .addCase(submitQuizAnswers.fulfilled, (state, action) => {
        state.isSubmitting = false;
        if (action.payload && action.payload.updated_stats) {
          // Fixed: Handle stats update in fulfilled case
          const updatedStats = action.payload.updated_stats;
          state.stats = {
            level: updatedStats.level || state.stats.level,
            streak:
              updatedStats.currentStreak ||
              updatedStats.streak ||
              state.stats.streak,
            currentStreak:
              updatedStats.currentStreak ||
              updatedStats.streak ||
              state.stats.streak,
            accuracy: updatedStats.accuracy || state.stats.accuracy,
            totalQuestions:
              updatedStats.totalQuestions || state.stats.totalQuestions,
            unlockedResponses:
              updatedStats.unlockedResponses || state.stats.unlockedResponses,
          };
        }
      })
      .addCase(submitQuizAnswers.rejected, (state) => {
        state.isSubmitting = false;
      })
      .addCase(skipQuiz.fulfilled, (state, action) => {
        if (action.payload && action.payload.updated_stats) {
          // Fixed: Handle stats update in skip case
          const updatedStats = action.payload.updated_stats;
          state.stats = {
            level: updatedStats.level || state.stats.level,
            streak:
              updatedStats.currentStreak ||
              updatedStats.streak ||
              state.stats.streak,
            currentStreak:
              updatedStats.currentStreak ||
              updatedStats.streak ||
              state.stats.streak,
            accuracy: updatedStats.accuracy || state.stats.accuracy,
            totalQuestions:
              updatedStats.totalQuestions || state.stats.totalQuestions,
            unlockedResponses:
              updatedStats.unlockedResponses || state.stats.unlockedResponses,
          };
        }
      });
  },
});

export const {
  startQuiz,
  setCurrentQuestionIndex,
  setSelectedAnswer,
  endQuiz,
  updateStats,
} = quizSlice.actions;
export default quizSlice.reducer;
