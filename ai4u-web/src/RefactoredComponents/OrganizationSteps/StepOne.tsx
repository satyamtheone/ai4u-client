import { ArrowRight, Building } from "lucide-react";
import { FormSelect } from "../../commonComponents/FormSelect";
import { FormTextArea } from "../../commonComponents/FormTextArea";
import { Button } from "../../components/shared/Button";
import { FormInput } from "../../components/shared/FormInput";
import { FormData } from "../../commonComponents/Types";
import { companySizeOptions, industryOptions } from "../Constants";

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
            label="Organization Name"
            value={formData.organizationName}
            onChange={handleInputChange("organizationName")}
            placeholder="Enter your organization name"
            error={errors.organizationName}
            icon={Building}
            required
          />

          <FormTextArea
            label="Description"
            required
            onChange={handleInputChange("organizationDescription")}
            placeholder="Describe your organization and what you do"
            error={errors.organizationDescription}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormSelect
              error={errors.industry}
              options={industryOptions}
              label="Industry"
              required
              value={formData.industry}
              onChange={handleInputChange("industry")}
            />

            <FormSelect
              error={errors.companySize}
              options={companySizeOptions}
              label="Company Size "
              required
              value={formData.companySize}
              onChange={handleInputChange("companySize")}
            />
          </div>

          <FormInput
            label="Website (Optional)"
            type="url"
            value={formData.website}
            onChange={handleInputChange("website")}
            placeholder="https://your-company.com"
            error={errors.website}
            hint="Optional: Your company website URL"
          />

          <Button
            onClick={handleNext}
            variant="primary"
            size="lg"
            className="w-full"
          >
            Next: Create Admin Account
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </>
  );
};

export default StepOne;
