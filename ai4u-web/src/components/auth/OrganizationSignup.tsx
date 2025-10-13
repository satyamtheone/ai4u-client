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
    adminFirstName: "",
    adminLastName: "",
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
  const { register, login } = useAuth();

  const validateStep1 = (): boolean => {
    const {
      organizationName,
      organizationDescription,
      industry,
      companySize,
      website,
    } = formData;

    const newErrors: Partial<FormData> = {};

    const validations = [
      {
        field: "organizationName",
        result: validateOrganizationName(organizationName),
      },
      {
        field: "organizationDescription",
        result: validateOrganizationDescription(organizationDescription),
      },
      { field: "industry", result: validateIndustry(industry) },
    ] as const;

    for (const { field, result } of validations) {
      if (!result.isValid) {
        newErrors[field] = result.error;
      }
    }

    if (!companySize) {
      newErrors.companySize = "Please select company size";
    }

    if (website && !isValidUrl(website)) {
      newErrors.website = "Please enter a valid website URL";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const {
      adminFirstName,
      adminLastName,
      adminEmail,
      adminPassword,
      confirmPassword,
      acceptTerms,
    } = formData;

    const newErrors: Partial<FormData> = {};

    const validations = [
      { field: "adminFirstName", result: validateName(adminFirstName) },
      { field: "adminLastName", result: validateName(adminLastName) },
      { field: "adminEmail", result: validateEmail(adminEmail) },
      {
        field: "adminPassword",
        result: validatePassword(adminPassword, { requireStrong: true }),
      },
      {
        field: "confirmPassword",
        result: validateConfirmPassword(adminPassword, confirmPassword),
      },
    ] as const;

    for (const { field, result } of validations) {
      if (!result.isValid) {
        newErrors[field] = result.error;
      }
    }

    if (!acceptTerms) {
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
        first_name: formData.adminFirstName.trim(),
        last_name: formData.adminLastName.trim(),
        description: formData.organizationDescription.trim(),
        industry: formData.industry,
        size: formData.companySize,
        website: formData.website.trim() || undefined,
      };

      const registerData: RegisterData = {
        first_name: formData.adminFirstName.trim(),
        last_name: formData.adminLastName.trim(),
        email: formData.adminEmail.trim().toLowerCase(),
        password: formData.adminPassword,
        userType: "organization_admin",
        organizationData,
        acceptTerms: formData.acceptTerms,
        subscribeNewsletter: formData.subscribeNewsletter,
      };

      await register(registerData);
      //after register we have to login the user
      await login({
        email: formData.adminEmail,
        password: formData.adminPassword,
      });

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

  return (
    <div
      className={`space-y-6 ${className} ${
        isLoading && "pointer-events-none"
      } `}
    >
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
