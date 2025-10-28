import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./components/auth";

export default function RequireAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return null; // or a spinner
  if (!isAuthenticated) {
    // send them to landing (or /login) and remember where they were trying to go
    return <Navigate to="/" replace state={{ from: location }} />;
  }
  return <>{children}</>;
}
