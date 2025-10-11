import { AlertCircle, ArrowLeft, Mail, User } from "lucide-react";
import { Button } from "../../components/shared/Button";
import { FormInput } from "../../components/shared/FormInput";
import { PasswordInput } from "../../components/shared/PasswordInput";
import { FormData } from "../../commonComponents/Types";

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
            label="Admin Full Name"
            value={formData.adminName}
            onChange={handleInputChange("adminName")}
            placeholder="Enter admin full name"
            error={errors.adminName}
            icon={User}
            autoComplete="name"
            required
          />

          <FormInput
            label="Admin Email Address"
            type="email"
            value={formData.adminEmail}
            onChange={handleInputChange("adminEmail")}
            placeholder="Enter admin email address"
            error={errors.adminEmail}
            icon={Mail}
            autoComplete="email"
            required
          />

          <PasswordInput
            label="Password"
            value={formData.adminPassword}
            onChange={handleInputChange("adminPassword")}
            placeholder="Create a strong password"
            error={errors.adminPassword}
            showStrengthIndicator={true}
            autoComplete="new-password"
            required
          />

          <PasswordInput
            label="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleInputChange("confirmPassword")}
            placeholder="Confirm your password"
            error={errors.confirmPassword}
            autoComplete="new-password"
            required
          />

          {/* Terms and Newsletter */}
          <div className="space-y-3">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={formData.acceptTerms}
                onChange={handleInputChange("acceptTerms")}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                required
              />
              <span className="text-sm text-gray-700">
                I agree to the{" "}
                <a
                  href="/terms"
                  className="text-blue-600 hover:text-blue-500 underline"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="/privacy"
                  className="text-blue-600 hover:text-blue-500 underline"
                >
                  Privacy Policy
                </a>
                <span className="text-red-500 ml-1">*</span>
              </span>
            </label>
            {errors.acceptTerms && (
              <p className="text-sm text-red-600 ml-7">{errors.acceptTerms}</p>
            )}

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={formData.subscribeNewsletter}
                onChange={handleInputChange("subscribeNewsletter")}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Subscribe to our newsletter for organizational learning tips and
                product updates
              </span>
            </label>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{errors.submit}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={handleBack}
              variant="outline"
              size="lg"
              className="flex-1"
              disabled={isLoading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isLoading}
              disabled={isLoading || !formData.acceptTerms}
              className="flex-1"
            >
              {isLoading ? "Creating Organization..." : "Create Organization"}
            </Button>
          </div>
        </form>
      )}
    </>
  );
};

export default StepTwo;
