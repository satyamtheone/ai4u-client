import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { ChatMessage, ChatResponse } from "../types";
import { BackendService } from "../services/BackendService";

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  sessionId?: string;
  error?: string;
}

const initialState: ChatState = {
  messages: [],
  isLoading: false,
};

// Create async thunk for sending messages
export const sendMessage = createAsyncThunk<
  ChatResponse,
  string,
  { rejectValue: string }
>(
  "chat/sendMessage",
  async (message: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;

      const backendService = state.config.backendService as BackendService;

      if (!backendService) {
        throw new Error("Backend service not initialized");
      }

      const response = await backendService.sendMessage(message);

      if (response.error) {
        throw new Error(response.error);
      }

      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.messages.push(action.payload);
    },
    clearMessages: (state) => {
      state.messages = [];
    },
    setSessionId: (state, action: PayloadAction<string>) => {
      state.sessionId = action.payload;
    },
    setError: (state, action: PayloadAction<string | undefined>) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendMessage.pending, (state) => {
        state.isLoading = true;
        state.error = undefined;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isLoading = false;

        if (action.payload.session_id) {
          state.sessionId = action.payload.session_id;
        }

        if (
          action.payload.type === "chat_response" &&
          action.payload.response
        ) {
          state.messages.push({
            type: "bot",
            response: action.payload.response,
            timestamp: action.payload.timestamp || new Date().toISOString(),
            source: action.payload.source,
          });
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { addMessage, clearMessages, setSessionId, setError } =
  chatSlice.actions;
export default chatSlice.reducer;
