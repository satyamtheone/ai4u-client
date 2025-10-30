import React, { useState } from "react";
import { Button } from "../shared/Button";
import { AuthService } from "../../services/api/AuthService";
import { GoogleIcon } from "../RefactoredComponents/Constants";

interface GoogleAuthButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  onSuccess,
  onError,
  className = "",
  disabled = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const authService = new AuthService();

  const handleGoogleLogin = async () => {
    setIsLoading(true);

    try {
      const response = await authService.getGoogleAuthUrl();

      if (response.authUrl) {
        // Store callback handlers in sessionStorage to retrieve after redirect
        if (onSuccess || onError) {
          sessionStorage.setItem(
            "googleAuthCallbacks",
            JSON.stringify({
              hasCallbacks: true,
            })
          );
        }

        // Redirect to Google OAuth
        window.location.href = response.authUrl;
      } else {
        throw new Error("Failed to get Google authorization URL");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Google authentication failed";
      console.error("Google auth error:", errorMessage);

      if (onError) {
        onError(errorMessage);
      }

      setIsLoading(false);
    }
  };

  return (
    <Button
      data-cy="google-auth-button"
      variant="outline"
      size="lg"
      onClick={handleGoogleLogin}
      loading={isLoading}
      disabled={disabled || isLoading}
      fullWidth
      leftIcon={!isLoading && <GoogleIcon />}
      className={`
        hover:bg-gray-50 
        focus:ring-blue-500 
        border-gray-300
        ${className}
      `}
    >
      {isLoading ? "Connecting to Google..." : "Continue with Google"}
    </Button>
  );
};
