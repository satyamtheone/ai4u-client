import React, { useState } from "react";
import { UserPlus, Mail, Phone, Globe, Languages, Lock } from "lucide-react";
import {
  CreateMemberRequest,
  CreateMemberResponse,
} from "../../../services/api/OrganizationService";
import { useAppDispatch, useAppSelector } from "../../../hooks/redux";
import {
  validateEmail,
  validateName,
  validatePassword,
} from "../../../utils/validation/authValidation";
import { FormInput } from "../../shared/FormInput";
import { PasswordInput } from "../../shared/PasswordInput";
import DynamicButton from "../../../commonComponents/DynamicButton";
import { FormCheckBox } from "../../../commonComponents/FormCheckBox";
import { FormSelect } from "../../../commonComponents/FormSelect";
import { FormLabelHeader } from "../../../commonComponents/FormLabelHeader";
import { useDialog } from "../../../commonComponents/Dialog/DialogProvider";
import { addNotification } from "../../../store/uiSlice";

const CreateMemberForm: React.FC<{
  onSuccess?: (res: CreateMemberResponse) => void;
}> = ({ onSuccess }) => {
  // Pull OrganizationService from Redux (like IndividualSignup pulls auth stuff)
  const organizationService = useAppSelector(
    (state) => (state.config as any).organizationService
  );

  // Form state
  const [formData, setFormData] = useState<CreateMemberRequest>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    role: "org_member",
    send_invitation_email: true,
    timezone: "UTC",
    locale: "en",
  });

  const [errors, setErrors] = useState<
    Partial<CreateMemberRequest & { submit: string }>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { closeDialog } = useDialog();
  const dispatch = useAppDispatch();

  // Handlers
  const handleInputChange =
    (field: keyof CreateMemberRequest) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value =
        e.target instanceof HTMLInputElement && e.target.type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : e.target.value;

      setFormData((prev) => ({ ...prev, [field]: value as any }));

      // Clear field error when typing
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
      if (errors.submit) {
        setErrors((prev) => ({ ...prev, submit: undefined }));
      }
    };

  // Basic validation similar to IndividualSignup
  const validateForm = (): boolean => {
    const newErrors: Partial<CreateMemberRequest & { submit: string }> = {};

    const firstNameValidation = validateName(formData.first_name);
    if (!firstNameValidation.isValid) {
      newErrors.first_name = firstNameValidation.error;
    }
    const lastNameValidation = validateName(formData.last_name);
    if (!lastNameValidation.isValid)
      newErrors.last_name = lastNameValidation.error;

    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.error;
    }

    const passwordValidation = validatePassword(formData.password, {
      requireStrong: true,
    });
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.error;
    }

    if (!formData.role) {
      newErrors.role = "Role is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Service not ready fallback note
    if (
      !organizationService ||
      typeof organizationService.createOrganizationMember !== "function"
    ) {
      setErrors({
        submit: "OrganizationService not initialized yet. Please try again.",
      });
      return;
    }

    if (!validateForm()) return;

    try {
      setIsLoading(true);

      const res = await organizationService.createOrganizationMember(formData);

      if (res.success) {
        setIsSuccess(true);
        onSuccess?.(res);
        // setFormData({ ...formData, first_name: "", last_name: "", email: "", phone: "", password: "" });
      } else {
        setErrors({ submit: res.message || "Failed to create member" });
      }
    } catch (error) {
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : "Failed to create member. Please try again.",
      });
    } finally {
      dispatch(
        addNotification({
          type: "success",
          message: `${formData.first_name} ${formData.last_name} is added successfully`,
        })
      );
      setIsLoading(false);
      closeDialog();
    }
  };

  return (
    <div className="w-full p-2  ">
      {/* Header */}

      <FormLabelHeader
        icon={UserPlus}
        className="mb-8"
        iconBg="transparent"
        iconClass=" text-blue-600 dark:text-blue-400"
        title="Add Organization Member"
        subtitle="Invite a new member to your organization"
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormInput
            label="First Name"
            placeholder="Enter first name"
            value={formData.first_name}
            onChange={handleInputChange("first_name")}
            error={errors.first_name}
            icon={UserPlus}
            required
          />
          <FormInput
            label="Last Name"
            placeholder="Enter last name"
            value={formData.last_name}
            onChange={handleInputChange("last_name")}
            error={errors.last_name}
            icon={UserPlus}
          />
        </div>

        {/* Email + Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormInput
            label="Email Address"
            placeholder="steave@example.com"
            value={formData.email}
            onChange={handleInputChange("email")}
            error={errors.email}
            icon={Mail}
            autoComplete="email"
            required
          />
          <FormInput
            label="Phone"
            placeholder="+91 755 000 0000"
            value={formData.phone}
            onChange={handleInputChange("phone")}
            error={errors.phone}
            icon={Phone}
            autoComplete="tel"
          />
        </div>

        {/* Password */}
        <PasswordInput
          label="Password"
          placeholder="Create a strong password"
          value={formData.password}
          onChange={handleInputChange("password") as any}
          error={errors.password}
          autoComplete="new-password"
          required
        />

        {/* Role */}

        <FormSelect
          error={errors.role}
          label="Role"
          value={formData.role}
          onChange={handleInputChange("role")}
          options={[
            { value: "org_member", label: "Organization Member" },
            { value: "org_admin", label: "Admin" },
          ]}
        />

        {/* Send invitation email */}
        <FormCheckBox
          message={<>Send invitation email</>}
          checked={formData.send_invitation_email}
          onChange={handleInputChange("send_invitation_email") as any}
        />

        {/* Submit error */}
        {errors.submit && (
          <p className="text-sm text-red-600">{errors.submit}</p>
        )}

        {/* Submit button */}
        <DynamicButton
          type="submit"
          loading={isLoading}
          className="w-full"
          label={isSuccess ? "Member Created ✅" : "Create Member"}
        />
      </form>
    </div>
  );
};

export default CreateMemberForm;
