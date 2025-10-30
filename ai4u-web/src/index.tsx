import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { store } from "./store";
import { AuthProvider, useAuth } from "./components/auth/AuthProvider";
import "./index.css";
import ErrorBoundary from "./components/RefactoredComponents/ErrorBoundary";
import DialogProvider from "./commonComponents/Dialog/DialogProvider";
import { debugEnvVars } from "./utils/envDebug";
import { testBackendConnection } from "./utils/connectionDebug";
import AppInitializer from "./components/AppInitializer";
import AppRoutes from "./AppRoutes";
import NotificationContainer from "./components/NotificationContainer";

// Debug environment variables on startup
if (process.env.NODE_ENV === "development") {
  debugEnvVars();

  // Add helper function to clear cached config
  (window as any).clearConfig = () => {
    const configKey = process.env.REACT_APP_CONFIG_KEY || "ai4u_config";
    localStorage.removeItem(configKey);
    console.log("✅ Cached config cleared. Reloading...");
    window.location.reload();
  };

  // Add helper function to test backend connection
  (window as any).testBackend = () => {
    const url = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
    testBackendConnection(url);
  };

  console.log("💡 Debug helpers available:");
  console.log("  - clearConfig() - Clear cached backend URL");
  console.log("  - testBackend() - Test backend connection");
}

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: parseInt(process.env.REACT_APP_QUERY_STALE_TIME || String(5 * 60 * 1000)), // 5 minutes
      // cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: parseInt(process.env.REACT_APP_QUERY_RETRY || '1'),
      refetchOnWindowFocus: false,
    },
  },
});

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <DialogProvider>
              <Router>
                <AppInitializer />
                <AppRoutes />
                <NotificationContainer />
              </Router>
            </DialogProvider>
          </AuthProvider>
        </QueryClientProvider>
      </Provider>
    </ErrorBoundary>
  </React.StrictMode>
);
