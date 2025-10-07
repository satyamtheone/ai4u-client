import React, { useState } from "react";
import { User } from "lucide-react";
import { useAuth } from "./AuthProvider";
import {
  validateEmail,
  validatePassword,
  validateName,
  validateConfirmPassword,
} from "../../utils/validation/authValidation";
import { RegisterData } from "../../types/auth/Auth";
import { FormLabelHeader } from "../../cmmonComponents/FormLabelHeader";
import {
  IndividualFormData,
  IndividualSignupProps,
} from "../../cmmonComponents/Types";
import IndividualInputs from "../../RefactoredComponents/IndividualFormComponents/IndividualInputs";
import IndividualSuccess from "../../RefactoredComponents/IndividualFormComponents/IndividualSuccess";
import IndividualFormFooter from "../../RefactoredComponents/IndividualFormComponents/IndividualFormFooter";

export const IndividualSignup: React.FC<IndividualSignupProps> = ({
  onSwitchToLogin,
  onSwitchToOrgSignup,
  className = "",
}) => {
  const [formData, setFormData] = useState<IndividualFormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
    subscribeNewsletter: false,
  });

  const [errors, setErrors] = useState<
    Partial<IndividualFormData & { submit: string }>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { register } = useAuth();

  const validateForm = (): boolean => {
    const newErrors: Partial<IndividualFormData> = {};

    // Name validation
    const nameValidation = validateName(formData.name);
    if (!nameValidation.isValid) {
      newErrors.name = nameValidation.error;
    }

    // Email validation
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.error;
    }

    // Password validation
    const passwordValidation = validatePassword(formData.password, {
      requireStrong: true,
    });
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.error;
    }

    // Confirm password validation
    const confirmPasswordValidation = validateConfirmPassword(
      formData.password,
      formData.confirmPassword
    );
    if (!confirmPasswordValidation.isValid) {
      newErrors.confirmPassword = confirmPasswordValidation.error;
    }

    // Terms acceptance validation
    if (!formData.acceptTerms) {
      //   newErrors.acceptTerms = 'You must accept the terms and conditions';
      newErrors.acceptTerms = true;
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
      const registerData: RegisterData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        userType: "individual",
        acceptTerms: formData.acceptTerms,
        subscribeNewsletter: formData.subscribeNewsletter,
      };

      await register(registerData);
      setIsSuccess(true);

      // Track successful registration
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "sign_up", {
          method: "email",
          user_type: "individual",
        });
      }
    } catch (error) {
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : "Registration failed. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange =
    (field: keyof IndividualFormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value =
        e.target.type === "checkbox" ? e.target.checked : e.target.value;
      setFormData((prev) => ({ ...prev, [field]: value }));

      // Clear field error when user starts typing/changing
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };

  // Success state
  if (isSuccess) {
    return <IndividualSuccess className={className} />;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <FormLabelHeader
        icon={User}
        title="Create Your Account"
        subtitle=" Start your personal AI learning journey"
      />

      {/* Registration Form */}
      <IndividualInputs
        errors={errors}
        formData={formData}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
      />

      {/* Footer Links */}
      <IndividualFormFooter
        onSwitchToLogin={onSwitchToLogin}
        onSwitchToOrgSignup={onSwitchToOrgSignup}
      />
    </div>
  );
};
