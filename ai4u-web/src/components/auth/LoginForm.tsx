import React, { useState } from "react";
import { Mail } from "lucide-react";
import { useAuth } from "./AuthProvider";

import { GoogleAuthButton } from "./GoogleAuthButton";
import {
  validateEmail,
  validatePassword,
} from "../../utils/validation/authValidation";
import { LoginCredentials } from "../../types/auth/Auth";
import { FormLabelHeader } from "../../commonComponents/FormLabelHeader";
import LoginFormInputs from "../RefactoredComponents/LoginFormComponents/LoginFormInputs";
import LoginFormFooter from "../RefactoredComponents/LoginFormComponents/LoginFormFooter";
import { useLoginMutation } from "../../services/api/authApi";

interface LoginFormProps {
  onSwitchToIndividualSignup: () => void;
  onSwitchToOrgSignup: () => void;
  className?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSwitchToIndividualSignup,
  onSwitchToOrgSignup,
  className = "",
}) => {
  const [formData, setFormData] = useState<LoginCredentials>({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<
    Partial<LoginCredentials & { submit: string }>
  >({});
  const [isLoading, setIsLoading] = useState(false);

  const { userLogin } = useAuth();

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginCredentials> = {};

    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.error;
    }

    const passwordValidation = validatePassword(formData.password, {
      required: true,
    });
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.error;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      await userLogin(formData);

      // Successful login - user will be redirected by AuthGuard
    } catch (error) {
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : "Login failed. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange =
    (field: keyof LoginCredentials) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));

      // Clear field error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };

  return (
    <div className={`space-y-6 ${className} `} data-testid="login-form">
      {/* Header */}
      <FormLabelHeader
        icon={Mail}
        title="Welcome Back"
        subtitle="Sign in to your account"
      />

      {/* Login Form */}
      <LoginFormInputs
        errors={errors}
        formData={formData}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
      />

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-black">Or continue with</span>
        </div>
      </div>

      {/* Google Auth */}
      <GoogleAuthButton />

      {/* Footer Links */}
      <LoginFormFooter
        onSwitchToIndividualSignup={onSwitchToIndividualSignup}
        onSwitchToOrgSignup={onSwitchToOrgSignup}
      />
    </div>
  );
};
