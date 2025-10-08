import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { LoginForm } from "./LoginForm";
import { IndividualSignup } from "./IndividualSignup";
import { OrganizationSignup } from "./OrganizationSignup";
import { LoadingSpinner } from "../shared/LoadingSpinner";

type AuthView = "login" | "individual-signup" | "organization-signup";

interface AuthMainProps {
  defaultView?: AuthView;
  onAuthSuccess?: () => void;
  redirectTo?: string;
  className?: string;
}

export const AuthMain: React.FC<AuthMainProps> = ({
  defaultView = "login",
  onAuthSuccess,
  redirectTo = "/dashboard",
  className = "",
}) => {
  const [currentView, setCurrentView] = useState<AuthView>(defaultView);
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated && user) {
      if (onAuthSuccess) {
        onAuthSuccess();
      } else {
        window.location.href = redirectTo;
      }
    }
  }, [isAuthenticated, user, onAuthSuccess, redirectTo]);

  // Handle URL parameters for auth flows
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const view = urlParams.get("view") as AuthView;
    const invite = urlParams.get("invite");

    if (
      view &&
      ["login", "individual-signup", "organization-signup"].includes(view)
    ) {
      setCurrentView(view);
    }

    // If there's an organization invite, default to individual signup
    if (invite) {
      setCurrentView("individual-signup");
      // Store invite token for later use
      sessionStorage.setItem("organizationInvite", invite);
    }
  }, [defaultView]);

  const handleViewChange = (view: AuthView) => {
    setCurrentView(view);

    // Update URL without page reload
    const url = new URL(window.location.href);
    url.searchParams.set("view", view);
    window.history.replaceState({}, "", url.toString());
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  // Don't render if already authenticated (will redirect)
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Redirecting..." />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="dark:bg-darkBackGround-1150 bg-zinc-100 rounded-3xl shadow-lg p-8">
        {currentView === "login" && (
          <LoginForm
            onSwitchToIndividualSignup={() =>
              handleViewChange("individual-signup")
            }
            onSwitchToOrgSignup={() => handleViewChange("organization-signup")}
          />
        )}

        {currentView === "individual-signup" && (
          <IndividualSignup
            onSwitchToLogin={() => handleViewChange("login")}
            onSwitchToOrgSignup={() => handleViewChange("organization-signup")}
          />
        )}

        {currentView === "organization-signup" && (
          <OrganizationSignup
            onSwitchToLogin={() => handleViewChange("login")}
            onSwitchToIndividualSignup={() =>
              handleViewChange("individual-signup")
            }
          />
        )}
      </div>

      {/* Footer */}
      <div className="pt-8 text-center">
        <p className="text-sm text-gray-600">
          © 2024 AI4U. All rights reserved.
        </p>
      </div>
    </div>
  );
};

// Hook for managing auth state in other components
export const useAuthNavigation = () => {
  const [currentView, setCurrentView] = useState<AuthView>("login");

  const goToLogin = () => setCurrentView("login");
  const goToIndividualSignup = () => setCurrentView("individual-signup");
  const goToOrganizationSignup = () => setCurrentView("organization-signup");

  return {
    currentView,
    goToLogin,
    goToIndividualSignup,
    goToOrganizationSignup,
  };
};
