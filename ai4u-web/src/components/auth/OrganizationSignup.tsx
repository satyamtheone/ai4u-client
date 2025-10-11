import React, { useState } from "react";
import { Building } from "lucide-react";
import { useAuth } from "./AuthProvider";

import {
  validateEmail,
  validatePassword,
  validateName,
  validateConfirmPassword,
  validateOrganizationName,
  validateOrganizationDescription,
  validateIndustry,
} from "../../utils/validation/authValidation";
import {
  RegisterData,
  OrganizationRegistrationData,
} from "../../types/auth/Auth";
import { FormLabelHeader } from "../../commonComponents/FormLabelHeader";
import { StepProgressBar } from "../../commonComponents/StepProgressBar";

import StepOne from "../../RefactoredComponents/OrganizationSteps/StepOne";
import StepTwo from "../../RefactoredComponents/OrganizationSteps/StepTwo";
import {
  FormData,
  OrganizationSignupProps,
} from "../../commonComponents/Types";
import SuccessStep from "../../RefactoredComponents/OrganizationSteps/SuccessStep";
import FormFooter from "../../RefactoredComponents/OrganizationSteps/FormFooter";

export const OrganizationSignup: React.FC<OrganizationSignupProps> = ({
  onSwitchToLogin,
  onSwitchToIndividualSignup,
  className = "",
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    organizationName: "",
    organizationDescription: "",
    industry: "",
    companySize: "",
    website: "",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
    confirmPassword: "",
    acceptTerms: false,
    subscribeNewsletter: false,
  });

  const [errors, setErrors] = useState<Partial<FormData & { submit: string }>>(
    {}
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { register } = useAuth();

  const validateStep1 = (): boolean => {
    const newErrors: Partial<FormData> = {};

    const orgNameValidation = validateOrganizationName(
      formData.organizationName
    );
    if (!orgNameValidation.isValid) {
      newErrors.organizationName = orgNameValidation.error;
    }

    const descValidation = validateOrganizationDescription(
      formData.organizationDescription
    );
    if (!descValidation.isValid) {
      newErrors.organizationDescription = descValidation.error;
    }

    const industryValidation = validateIndustry(formData.industry);
    if (!industryValidation.isValid) {
      newErrors.industry = industryValidation.error;
    }

    if (!formData.companySize) {
      newErrors.companySize = "Please select company size";
    }

    // Website is optional, but validate if provided
    if (formData.website && !isValidUrl(formData.website)) {
      newErrors.website = "Please enter a valid website URL";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Partial<FormData> = {};

    const nameValidation = validateName(formData.adminName);
    if (!nameValidation.isValid) {
      newErrors.adminName = nameValidation.error;
    }

    const emailValidation = validateEmail(formData.adminEmail);
    if (!emailValidation.isValid) {
      newErrors.adminEmail = emailValidation.error;
    }

    const passwordValidation = validatePassword(formData.adminPassword, {
      requireStrong: true,
    });
    if (!passwordValidation.isValid) {
      newErrors.adminPassword = passwordValidation.error;
    }

    const confirmPasswordValidation = validateConfirmPassword(
      formData.adminPassword,
      formData.confirmPassword
    );
    if (!confirmPasswordValidation.isValid) {
      newErrors.confirmPassword = confirmPasswordValidation.error;
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = true;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  };

  const handleNext = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep2()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const organizationData: OrganizationRegistrationData = {
        name: formData.organizationName.trim(),
        description: formData.organizationDescription.trim(),
        industry: formData.industry,
        size: formData.companySize,
        website: formData.website.trim() || undefined,
      };

      const registerData: RegisterData = {
        name: formData.adminName.trim(),
        email: formData.adminEmail.trim().toLowerCase(),
        password: formData.adminPassword,
        userType: "organization_admin",
        organizationData,
        acceptTerms: formData.acceptTerms,
        subscribeNewsletter: formData.subscribeNewsletter,
      };

      await register(registerData);
      setIsSuccess(true);

      // Track successful registration
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "sign_up", {
          method: "email",
          user_type: "organization_admin",
          organization_industry: formData.industry,
          organization_size: formData.companySize,
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
    (field: keyof FormData) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => {
      const value =
        e.target.type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : e.target.value;

      setFormData((prev) => ({ ...prev, [field]: value }));

      // Clear field error when user starts typing/changing
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };

  // Success state
  if (isSuccess) {
    return <SuccessStep className={className} />;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <FormLabelHeader
        icon={Building}
        title=" Create Organization"
        subtitle={` Step ${currentStep} of 2:${" "}
          ${currentStep === 1 ? "Organization Details" : "Admin Account"}`}
      />

      {/* Progress Bar */}
      <StepProgressBar currentStep={currentStep} totalSteps={2} />

      {/* Step 1: Organization Details */}
      <StepOne
        currentStep={currentStep}
        errors={errors}
        formData={formData}
        handleInputChange={handleInputChange}
        handleNext={handleNext}
      />

      {/* Step 2: Admin Account */}
      <StepTwo
        currentStep={currentStep}
        errors={errors}
        formData={formData}
        handleBack={handleBack}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
      />

      {/* Footer Links */}
      <FormFooter
        onSwitchToIndividualSignup={onSwitchToIndividualSignup}
        onSwitchToLogin={onSwitchToLogin}
      />
    </div>
  );
};
