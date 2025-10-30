import React from "react";
import { Routes, Route } from "react-router-dom";
import LandingPage from "./components/RefactoredComponents/LandingPage";
import ShowcasePage from "./pages/ShowcasePage";
import RequireAuth from "./RequireAuth";
import AppLayout from "./AppLayout";
import App from "./components/App";
import UserDashboard from "./pages/UserDashboard";
import { OrganizationDashboard } from "./pages/OrganizationDashboard";
import NonLoginLayout from "./NonLoginLayout";

function NotFound() {
  return (
    <div className="text-center text-neutral-400 p-10">404 – Not Found</div>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* ---------- Public (non-authenticated) ---------- */}
      <Route element={<NonLoginLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/showcase/:component" element={<ShowcasePage />} />
        <Route path="/nonLoginDashboard" element={<App />} />
      </Route>

      {/* ---------- Authenticated area with persistent sidebar ---------- */}
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/dashboard" element={<App />} />
        <Route path="/userProfile" element={<UserDashboard />} />
        <Route path="/organization" element={<OrganizationDashboard />} />
      </Route>

      {/* ---------- Fallback ---------- */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
