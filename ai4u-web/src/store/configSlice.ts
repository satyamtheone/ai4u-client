import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AI4UConfig } from "../types";
import { BackendService } from "../services/BackendService";
import { LearningGateService } from "../services/LearningGateService";
import { LearningService } from "../services/api/LearningService";
import { OrganizationService } from "../services/api/OrganizationService";

interface ConfigState {
  config: AI4UConfig;
  backendService?: BackendService;
  learningGateService?: LearningGateService;
  isConnected: boolean;
  connectionMessage: string;
  learningGatesEnabled: boolean;
  learningService?: LearningService;
  organizationService?: OrganizationService;
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
      const learningService = (state as any).learningService as
        | LearningService
        | undefined;
      if (learningService && (learningService as any).setBaseURL) {
        (learningService as any).setBaseURL(action.payload.backendUrl);
      }
      const organizationService = (state as any).organizationService as
        | OrganizationService
        | undefined;
      if (organizationService && (organizationService as any).setBaseURL) {
        (organizationService as any).setBaseURL(action.payload.backendUrl);
      }
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

    setOrganizationService: (
      state,
      action: PayloadAction<OrganizationService>
    ) => {
      (state as any).organizationService = action.payload;
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

      const learningService = (state as any).learningService as
        | LearningService
        | undefined;

      if (backendService) {
        backendService.setLearningGatesEnabled(action.payload);
      }
      if (learningGateService) {
        learningGateService.updateConfig({ enabled: action.payload });
      }
      if (learningService && (learningService as any).setEnabled) {
        (learningService as any).setEnabled(action.payload);
      }
    },
    setLearningService: (state, action: PayloadAction<LearningService>) => {
      // Store reference for access (Redux Toolkit handles this safely)
      (state as any).learningService = action.payload;

      // Immediately sync with current config/flags if supported by the service
      const cfg = state.config;
      if ((action.payload as any).setBaseURL) {
        (action.payload as any).setBaseURL(cfg.backendUrl);
      }
      if ((action.payload as any).setEnabled) {
        (action.payload as any).setEnabled(state.learningGatesEnabled);
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
  setLearningService,
  setOrganizationService,
} = configSlice.actions;
export default configSlice.reducer;
