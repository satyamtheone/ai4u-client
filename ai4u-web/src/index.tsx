import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { store } from "./store";
import { AuthProvider } from "./components/auth/AuthProvider";
import "./index.css";
import ShowcasePage from "./pages/ShowcasePage";
import ThemeToggleButton from "./commonComponents/ThemeToggleButton";
import App from "./components/App";
import ErrorBoundary from "./RefactoredComponents/ErrorBoundary";
import LandingPage from "./RefactoredComponents/LandingPage";
import DialogProvider from "./commonComponents/Dialog/DialogProvider";

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      // cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
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
                <ThemeToggleButton />
                <Routes>
                  <Route
                    path="/showcase/:component"
                    element={<ShowcasePage />}
                  />
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/dashboard" element={<App />} />
                </Routes>
              </Router>
            </DialogProvider>
          </AuthProvider>
        </QueryClientProvider>
      </Provider>
    </ErrorBoundary>
  </React.StrictMode>
);
