import { AlertCircle, ArrowRight, ArrowRightCircle, Mail } from "lucide-react";
import { FormInput } from "../../components/shared/FormInput";
import { PasswordInput } from "../../components/shared/PasswordInput";
import { Button } from "../../components/shared/Button";
import { LoginCredentials } from "../../components/auth";
import DynamicButton from "../../commonComponents/DynamicButton";

const LoginFormInputs = ({
  handleSubmit,
  formData,
  handleInputChange,
  isLoading,
  errors,
}: {
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  formData: LoginCredentials;
  handleInputChange: (
    field: keyof LoginCredentials
  ) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading: boolean;
  errors: Partial<
    LoginCredentials & {
      submit: string;
    }
  >;
}) => {
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormInput
        data-testid="login-form"
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
        data-testid="password-input"
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

      <DynamicButton
        type="submit"
        data-testid="login-button"
        variant="submit"
        icon={!isLoading ? <ArrowRight className="ml-2 h-4 w-4" /> : <></>}
        disabled={isLoading}
        loading={isLoading}
        label={`${isLoading ? "Signing in..." : "Sign In"}`}
        iconPosition="flex-row-reverse"
      />
    </form>
  );
};

export default LoginFormInputs;
