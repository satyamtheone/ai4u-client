// src/components/AppInitializer.tsx
import { useEffect } from "react";
import { useAppDispatch } from "../hooks/redux";
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

export default function AppInitializer() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Get config and initialize backend + services
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
        dispatch(setLearningGatesEnabled(true));

        // Test backend connection once
        const result = await backendService.testConnection();
        dispatch(setConnectionStatus(result));

        // Listen to runtime config changes
        const handleConfigChange = (event: CustomEvent) => {
          const newConfig = event.detail;
          dispatch(setConfig(newConfig));
          backendService.setBackendUrl(newConfig.backendUrl);
          backendService.testConnection().then((result) => {
            dispatch(setConnectionStatus(result));
          });
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
  }, [dispatch]);

  return null;
}
