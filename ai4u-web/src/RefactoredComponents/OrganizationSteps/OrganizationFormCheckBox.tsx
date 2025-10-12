import { FormCheckBox } from "../../commonComponents/FormCheckBox";
import { FormData } from "../../commonComponents/Types";

const OrganizationFormCheckBox = ({
  formData,
  handleInputChange,
  errors,
}: {
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
}) => {
  const termsCheckMessage = (
    <span className="text-sm text-gray-400">
      I agree to the{" "}
      <a href="/terms" className="text-blue-600 hover:text-blue-500 underline">
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
  );
  return (
    <div className="space-y-3">
      <FormCheckBox
        message={termsCheckMessage}
        required
        checked={formData.acceptTerms}
        onChange={handleInputChange("acceptTerms")}
        error={
          typeof errors.acceptTerms === "string"
            ? errors.acceptTerms
            : undefined
        }
      />
      <FormCheckBox
        message={
          <span className="text-sm text-gray-400">
            Subscribe to our newsletter for organizational learning tips and
            product updates
          </span>
        }
        required
        checked={formData.subscribeNewsletter}
        onChange={handleInputChange("subscribeNewsletter")}
      />
    </div>
  );
};

export default OrganizationFormCheckBox;
