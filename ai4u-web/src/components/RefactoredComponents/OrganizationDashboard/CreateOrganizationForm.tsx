import React, { useState } from "react";
import {
  Building2,
  Globe,
  Briefcase,
  FileText,
  Link as LinkIcon,
  Hash,
} from "lucide-react";
import { useAppDispatch } from "../../../hooks/redux";
import { CreateOrganizationRequest } from "../../../services/api/OrganizationService";
import { addNotification } from "../../../store/uiSlice";
import { FormInput } from "../../shared/FormInput";
import DynamicButton from "../../../commonComponents/DynamicButton";
import { useDialog } from "../../../commonComponents/Dialog/DialogProvider";
import { FormSelect } from "../../../commonComponents/FormSelect";
import { companySizeOptions, industryOptions } from "../Constants";
import { FormTextArea } from "../../../commonComponents/FormTextArea";
import { FormLabelHeader } from "../../../commonComponents/FormLabelHeader";
import {
  organizationApi,
  useCreateOrganizationMutation,
} from "../../../services/api/organizationApi";

const CreateOrganizationForm: React.FC = () => {
  const { closeDialog } = useDialog();
  const dispatch = useAppDispatch();

  const [createOrganization, { isLoading: isCreating }] =
    useCreateOrganizationMutation();

  const [formData, setFormData] = useState<CreateOrganizationRequest>({
    name: "",
    description: "",
    website: "",
    industry: "",
    slug: "",
    company_size: "",
  });

  const [errors, setErrors] = useState<
    Partial<CreateOrganizationRequest & { submit: string }>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleInputChange =
    (field: keyof CreateOrganizationRequest) =>
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

      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateOrganizationRequest & { submit: string }> =
      {};

    if (!formData.name.trim()) {
      newErrors.name = "Organization name is required";
    }

    if (!formData.industry.trim()) {
      newErrors.industry = "Industry is required";
    }

    if (!formData.slug.trim()) {
      newErrors.slug = "Slug is required";
    }

    if (!formData.company_size.trim()) {
      newErrors.company_size = "Company size is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setIsLoading(true);

      const org = await createOrganization(formData).unwrap(); // org: Organization
      if (!org) {
        setErrors({ submit: "Failed to create organization" });
        return;
      }

      setIsSuccess(true);

      dispatch(
        addNotification({
          type: "success",
          message: `${formData.name} organization created successfully`,
        })
      );

      closeDialog();
    } catch (error: any) {
      setErrors({
        submit:
          error?.data?.message ||
          error?.message ||
          "Failed to create organization. Please try again.",
      });
    } finally {
      setIsLoading(false);
      dispatch(
        organizationApi.util.invalidateTags([{ type: "Organizations" }])
      );
    }
  };

  return (
    <div className="w-full px-2">
      <FormLabelHeader
        icon={Building2}
        className="mb-8"
        iconBg="transparent"
        iconClass=" text-blue-600 dark:text-blue-400"
        title="Create Organization "
        subtitle="you can add more members to this organization later"
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          label="Organization Name"
          placeholder="Enter organization name"
          value={formData.name}
          onChange={handleInputChange("name")}
          error={errors.name}
          icon={Building2}
          required
        />

        <FormTextArea
          data-cy="organization-description"
          label="Description"
          required
          onChange={handleInputChange("description")}
          placeholder="Describe your organization and what you do"
          error={errors.description}
          errorCyName="organization-description-error"
        />

        <FormInput
          label="Slug"
          placeholder="unique-org-slug"
          value={formData.slug}
          onChange={handleInputChange("slug")}
          error={errors.slug}
          icon={Hash}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormSelect
            label="Industry k"
            value={formData.industry}
            options={industryOptions}
            onChange={handleInputChange("industry")}
            error={errors.industry}
            icon={Briefcase}
            required
          />

          <FormSelect
            label="Company Size"
            options={companySizeOptions}
            value={formData.company_size}
            onChange={handleInputChange("company_size")}
            error={errors.company_size}
            icon={FileText}
            required
          />
        </div>

        <FormInput
          label="Website"
          placeholder="https://example.com"
          value={formData.website}
          onChange={handleInputChange("website")}
          error={errors.website}
          icon={Globe}
        />

        {errors.submit && (
          <p className="text-sm text-red-600">{errors.submit}</p>
        )}

        <div className="pt-4">
          <DynamicButton
            type="submit"
            loading={isLoading}
            className="w-full"
            label={
              isSuccess ? "Organization Created ✅" : "Create Organization"
            }
          />
        </div>
      </form>
    </div>
  );
};

export default CreateOrganizationForm;
