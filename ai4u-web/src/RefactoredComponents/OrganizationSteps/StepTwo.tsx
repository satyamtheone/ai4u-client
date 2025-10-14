import { AlertCircle, ArrowLeft, Mail, User } from "lucide-react";
import { Button } from "../../components/shared/Button";
import { FormInput } from "../../components/shared/FormInput";
import { PasswordInput } from "../../components/shared/PasswordInput";
import { FormData } from "../../commonComponents/Types";
import OrganizationFormCheckBox from "./OrganizationFormCheckBox";
import DynamicButton from "../../commonComponents/DynamicButton";

const StepTwo = ({
  currentStep,
  handleSubmit,
  formData,
  handleInputChange,
  errors,
  isLoading,
  handleBack,
}: {
  currentStep: number;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  formData: FormData;
  handleInputChange: (
    field: keyof FormData
  ) => (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  errors: Partial<
    FormData & {
      submit: string;
    }
  >;
  isLoading: boolean;
  handleBack: () => void;
}) => {
  return (
    <>
      {currentStep === 2 && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-1">
              Admin Account Setup
            </h3>
            <p className="text-sm text-blue-700">
              This account will have full administrative privileges for your
              organization.
            </p>
          </div>

          <FormInput
            data-cy="admin-first-name"
            label="Admin First Name"
            value={formData.adminFirstName}
            onChange={handleInputChange("adminFirstName")}
            placeholder="Enter admin first name"
            error={errors.adminFirstName}
            icon={User}
            autoComplete="first-name"
            required
            errorCyName="admin-first-name-error"
          />
          <FormInput
            data-cy="admin-last-name"
            label="Admin Last Name"
            value={formData.adminLastName}
            onChange={handleInputChange("adminLastName")}
            placeholder="Enter admin last name"
            error={errors.adminLastName}
            icon={User}
            autoComplete="last-name"
            required
            errorCyName="admin-last-name-error"
          />

          <FormInput
            data-cy="admin-email"
            label="Admin Email Address"
            type="email"
            value={formData.adminEmail}
            onChange={handleInputChange("adminEmail")}
            placeholder="Enter admin email address"
            error={errors.adminEmail}
            icon={Mail}
            autoComplete="email"
            required
            errorCyName="admin-email-error"
          />

          <PasswordInput
            data-cy="admin-password"
            label="Password"
            value={formData.adminPassword}
            onChange={handleInputChange("adminPassword")}
            placeholder="Create a strong password"
            error={errors.adminPassword}
            showStrengthIndicator={true}
            autoComplete="new-password"
            required
            errorCyName="admin-password-error"
          />

          <PasswordInput
            data-cy="admin-confirm-password"
            label="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleInputChange("confirmPassword")}
            placeholder="Confirm your password"
            error={errors.confirmPassword}
            autoComplete="new-password"
            required
            errorCyName="admin-confirm-password-error"
          />

          {/* Terms and Newsletter */}
          <OrganizationFormCheckBox
            errors={errors}
            formData={formData}
            handleInputChange={handleInputChange}
          />
          {/* Submit Error */}
          {errors.submit && (
            <div
              data-cy="submit-error"
              className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg"
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{errors.submit}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 max-md:flex-col">
            <DynamicButton
              data-cy="back-to-step-one"
              onClick={handleBack}
              label={"Back"}
              icon={<ArrowLeft className="mr-2 h-4 w-4" />}
              disabled={isLoading}
              variant="secondary"
            />
            <DynamicButton
              data-cy="create-organization"
              type="submit"
              label={isLoading ? "Creating..." : "Create Organization"}
              loading={isLoading}
              disabled={isLoading || !formData.acceptTerms}
              variant="submit"
            />
          </div>
        </form>
      )}
    </>
  );
};

export default StepTwo;
