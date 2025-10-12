import { AlertCircle, ArrowRight, Mail, User } from "lucide-react";
import { FormInput } from "../../components/shared/FormInput";
import { PasswordInput } from "../../components/shared/PasswordInput";
import { IndividualFormData } from "../../commonComponents/Types";
import DynamicButton from "../../commonComponents/DynamicButton";
import IndividualFormCheckBox from "./IndividualFormCheckBox";

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
      <IndividualFormCheckBox
        errors={errors}
        formData={formData}
        handleInputChange={handleInputChange}
      />

      {/* Submit Error */}
      {errors.submit && (
        <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">{errors.submit}</span>
        </div>
      )}

      {/* Submit Button */}

      <DynamicButton
        type="submit"
        data-testid="login-button"
        variant="primary"
        icon={!isLoading ? <ArrowRight className="ml-2 h-4 w-4" /> : <></>}
        disabled={isLoading}
        loading={isLoading}
        label={` ${isLoading ? "Creating Account..." : "Create Account"}`}
        iconPosition="flex-row-reverse"
        className="w-full"
      />
    </form>
  );
};

export default IndividualInputs;
