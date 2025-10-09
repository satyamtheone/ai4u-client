import { AlertCircle, ArrowRight, Mail, User } from "lucide-react";
import { Button } from "../../components/shared/Button";
import { FormInput } from "../../components/shared/FormInput";
import { PasswordInput } from "../../components/shared/PasswordInput";
import { IndividualFormData } from "../../cmmonComponents/Types";

const IndividualInputs = ({
  formData,
  handleSubmit,
  errors,
  handleInputChange,
  isLoading,
}: {
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  formData: IndividualFormData;
  errors: Partial<
    IndividualFormData & {
      submit: string;
    }
  >;
  handleInputChange: (
    field: keyof IndividualFormData
  ) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading: boolean;
}) => {
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormInput
        label="First Name"
        value={formData.first_name}
        onChange={handleInputChange("first_name")}
        placeholder="Enter your first name"
        error={errors.first_name}
        icon={User}
        autoComplete="first_name"
        required
      />
      <FormInput
        label="Last Name"
        value={formData.last_name}
        onChange={handleInputChange("last_name")}
        placeholder="Enter your last name"
        error={errors.last_name}
        icon={User}
        autoComplete="last_name"
        required
      />

      <FormInput
        label="Email Address"
        type="email"
        value={formData.email}
        onChange={handleInputChange("email")}
        placeholder="Enter your email address"
        error={errors.email}
        icon={Mail}
        autoComplete="email"
        required
      />

      <PasswordInput
        label="Password"
        value={formData.password}
        onChange={handleInputChange("password")}
        placeholder="Create a strong password"
        error={errors.password}
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
          <span className="text-sm text-gray-400">
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
          <span className="text-sm text-gray-400">
            Subscribe to our newsletter for learning tips and updates
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

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={isLoading}
        disabled={isLoading || !formData.acceptTerms}
        className="w-full"
      >
        {isLoading ? "Creating Account..." : "Create Account"}
        {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
      </Button>
    </form>
  );
};

export default IndividualInputs;
