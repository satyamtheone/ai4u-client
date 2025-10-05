import React, { useState } from "react";
import { Mail, ArrowRight, AlertCircle } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { FormInput } from "../shared/FormInput";
import { PasswordInput } from "../shared/PasswordInput";
import { Button } from "../shared/Button";
import { GoogleAuthButton } from "./GoogleAuthButton";
import {
  validateEmail,
  validatePassword,
} from "../../utils/validation/authValidation";
import { LoginCredentials } from "../../types/auth/Auth";
import { FormLabelHeader } from "../../cmmonComponents/FormLabelHeader";

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
  const { login } = useAuth();

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
      await login(formData);
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
    <div className={`space-y-6 ${className} `}>
      {/* Header */}
      <FormLabelHeader
        icon={Mail}
        title="Welcome Back"
        subtitle="Sign in to your account"
      />

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          label="Email Address"
          type="email"
          value={formData.email}
          onChange={handleInputChange("email")}
          placeholder="Enter your email"
          error={errors.email}
          icon={Mail}
          autoComplete="email"
          required
        />

        <PasswordInput
          label="Password"
          value={formData.password}
          onChange={handleInputChange("password")}
          placeholder="Enter your password"
          error={errors.password}
          autoComplete="current-password"
          required
        />

        {/* Submit Error */}
        {errors.submit && (
          <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">{errors.submit}</span>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isLoading}
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? "Signing in..." : "Sign In"}
          {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>
      </form>

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
      <div className="text-center space-y-3">
        <p className="text-sm text-gray-600">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToIndividualSignup}
            className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
          >
            Sign up as Individual
          </button>
          {" or "}
          <button
            type="button"
            onClick={onSwitchToOrgSignup}
            className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
          >
            Create Organization
          </button>
        </p>

        <button
          type="button"
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          onClick={() => {
            // Handle forgot password
            console.log("Forgot password clicked");
          }}
        >
          Forgot your password?
        </button>
      </div>
    </div>
  );
};
