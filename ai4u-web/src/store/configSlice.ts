import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AI4UConfig } from "../types";
import { BackendService } from "../services/BackendService";
import { LearningGateService } from "../services/LearningGateService";

interface ConfigState {
  config: AI4UConfig;
  backendService?: BackendService;
  learningGateService?: LearningGateService;
  isConnected: boolean;
  connectionMessage: string;
  learningGatesEnabled: boolean;
}

const initialState: ConfigState = {
  config: {
    backendUrl: process.env.REACT_APP_BACKEND_URL || "http://localhost:8000",
    timeout: parseInt(process.env.REACT_APP_API_TIMEOUT || "30000"),
  },
  isConnected: false,
  connectionMessage: "Not connected",
  learningGatesEnabled: process.env.REACT_APP_FEATURE_LEARNING_GATES === "true",
};

const configSlice = createSlice({
  name: "config",
  initialState,
  reducers: {
    setConfig: (state, action: PayloadAction<AI4UConfig>) => {
      state.config = action.payload;
    },
    setBackendService: (state, action: PayloadAction<BackendService>) => {
      // Store reference for access (Redux Toolkit handles this safely)
      (state as any).backendService = action.payload;
    },
    setLearningGateService: (
      state,
      action: PayloadAction<LearningGateService>
    ) => {
      // Store reference for access (Redux Toolkit handles this safely)
      (state as any).learningGateService = action.payload;
    },

    setConnectionStatus: (
      state,
      action: PayloadAction<{ connected: boolean; message: string }>
    ) => {
      state.isConnected = action.payload.connected;
      state.connectionMessage = action.payload.message;
    },
    setLearningGatesEnabled: (state, action: PayloadAction<boolean>) => {
      state.learningGatesEnabled = action.payload;
      // Update services if they exist
      const backendService = (state as any).backendService as BackendService;
      const learningGateService = (state as any)
        .learningGateService as LearningGateService;

      if (backendService) {
        backendService.setLearningGatesEnabled(action.payload);
      }
      if (learningGateService) {
        learningGateService.updateConfig({ enabled: action.payload });
      }
    },
  },
});

export const {
  setConfig,
  setBackendService,
  setLearningGateService,
  setConnectionStatus,
  setLearningGatesEnabled,
} = configSlice.actions;
export default configSlice.reducer;
