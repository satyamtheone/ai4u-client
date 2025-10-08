import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { store } from "./store";
import { AuthProvider } from "./components/auth/AuthProvider";
import "./index.css";
import ShowcasePage from "./cmmonComponents/ShowcasePage";
import ThemeToggleButton from "./cmmonComponents/ThemeToggleButton";
import App from "./components/App";
import ErrorBoundary from "./RefactoredComponents/ErrorBoundary";
import NonLoginPage from "./RefactoredComponents/NonLoginPage";

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
            <Router>
              <ThemeToggleButton />
              <Routes>
                <Route path="/showcase/:component" element={<ShowcasePage />} />
                <Route path="/" element={<NonLoginPage />} />
                <Route path="/nonLogin" element={<App />} />
              </Routes>
            </Router>
          </AuthProvider>
        </QueryClientProvider>
      </Provider>
    </ErrorBoundary>
  </React.StrictMode>
);
