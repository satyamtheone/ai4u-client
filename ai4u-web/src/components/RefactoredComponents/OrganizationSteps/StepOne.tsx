import { ArrowRight, Building } from "lucide-react";
import { FormSelect } from "../../../commonComponents/FormSelect";
import { FormTextArea } from "../../../commonComponents/FormTextArea";
import { FormInput } from "../../shared/FormInput";
import { FormData } from "../../../commonComponents/Types";
import { companySizeOptions, industryOptions } from "../Constants";
import DynamicButton from "../../../commonComponents/DynamicButton";

const StepOne = ({
  currentStep,
  formData,
  handleInputChange,
  errors,
  handleNext,
}: {
  currentStep: number;
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
  handleNext: () => void;
}) => {
  return (
    <>
      {currentStep === 1 && (
        <div className="space-y-4">
          <FormInput
            data-cy="organization-name"
            label="Organization Name"
            value={formData.organizationName}
            onChange={handleInputChange("organizationName")}
            placeholder="Enter your organization name"
            error={errors.organizationName}
            icon={Building}
            required
            errorCyName="organization-name-error"
          />

          <FormTextArea
            data-cy="organization-description"
            label="Description"
            required
            onChange={handleInputChange("organizationDescription")}
            placeholder="Describe your organization and what you do"
            error={errors.organizationDescription}
            errorCyName="organization-description-error"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormSelect
              data-cy="organization-industry"
              error={errors.industry}
              options={industryOptions}
              label="Industry"
              required
              value={formData.industry}
              onChange={handleInputChange("industry")}
              errorCyName="organization-industry-error"
            />

            <FormSelect
              data-cy="organization-size"
              error={errors.companySize}
              options={companySizeOptions}
              label="Company Size "
              required
              value={formData.companySize}
              onChange={handleInputChange("companySize")}
              errorCyName="organization-size-error"
            />
          </div>

          <FormInput
            data-cy="organization-website"
            label="Website (Optional)"
            type="url"
            value={formData.website}
            onChange={handleInputChange("website")}
            placeholder="https://your-company.com"
            error={errors.website}
            hint="Optional: Your company website URL"
            errorCyName="organization-website-error"
          />

          <DynamicButton
            data-cy="to-step-two"
            onClick={handleNext}
            label={" Next: Create Admin Account"}
            icon={<ArrowRight className="ml-2 h-4 w-4" />}
            variant="primary"
            iconPosition="flex-row-reverse"
            className="w-full "
          />
        </div>
      )}
    </>
  );
};

export default StepOne;
