import { FormCheckBox } from "../../../commonComponents/FormCheckBox";
import { IndividualFormData } from "../../../commonComponents/Types";

const IndividualFormCheckBox = ({
  formData,
  handleInputChange,
  errors,
}: {
  formData: IndividualFormData;
  handleInputChange: (
    field: keyof IndividualFormData
  ) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  errors: Partial<
    IndividualFormData & {
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
        data-cy="individual-term-checkbox"
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
        data-cy="individual-subscribe-checkbox"
        message={
          <span className="text-sm text-gray-400">
            Subscribe to our newsletter for learning tips and updates
          </span>
        }
        required
        checked={formData.subscribeNewsletter}
        onChange={handleInputChange("subscribeNewsletter")}
      />
    </div>
  );
};

export default IndividualFormCheckBox;
