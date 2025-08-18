import React, { useState } from 'react';
import { Building, User, Mail, ArrowRight, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { FormInput } from '../shared/FormInput';
import { PasswordInput } from '../shared/PasswordInput';
import { Button } from '../shared/Button';
import { 
  validateEmail, 
  validatePassword, 
  validateName, 
  validateConfirmPassword,
  validateOrganizationName,
  validateOrganizationDescription,
  validateIndustry 
} from '../../utils/validation/authValidation';
import { RegisterData, OrganizationRegistrationData } from '../../types/auth/Auth';

interface OrganizationSignupProps {
  onSwitchToLogin: () => void;
  onSwitchToIndividualSignup: () => void;
  className?: string;
}

interface FormData {
  // Organization details
  organizationName: string;
  organizationDescription: string;
  industry: string;
  companySize: string;
  website: string;
  
  // Admin user details
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  confirmPassword: string;
  acceptTerms: boolean;
  subscribeNewsletter: boolean;
}

const industryOptions = [
  { value: '', label: 'Select Industry' },
  { value: 'technology', label: 'Technology' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'finance', label: 'Finance' },
  { value: 'education', label: 'Education' },
  { value: 'retail', label: 'Retail' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'media', label: 'Media & Entertainment' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'energy', label: 'Energy' },
  { value: 'real-estate', label: 'Real Estate' },
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'construction', label: 'Construction' },
  { value: 'government', label: 'Government' },
  { value: 'non-profit', label: 'Non-Profit' },
  { value: 'other', label: 'Other' },
];

const companySizeOptions = [
  { value: '', label: 'Select Company Size' },
  { value: '1-10', label: '1-10 employees' },
  { value: '11-25', label: '11-25 employees' },
  { value: '26-50', label: '26-50 employees' },
  { value: '51-100', label: '51-100 employees' },
  { value: '101-500', label: '101-500 employees' },
  { value: '501-1000', label: '501-1000 employees' },
  { value: '1000+', label: '1000+ employees' },
];

export const OrganizationSignup: React.FC<OrganizationSignupProps> = ({
  onSwitchToLogin,
  onSwitchToIndividualSignup,
  className = '',
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    organizationName: '',
    organizationDescription: '',
    industry: '',
    companySize: '',
    website: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
    acceptTerms: false,
    subscribeNewsletter: false,
  });

  const [errors, setErrors] = useState<Partial<FormData & { submit: string }>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { register } = useAuth();

  const validateStep1 = (): boolean => {
    const newErrors: Partial<FormData> = {};

    const orgNameValidation = validateOrganizationName(formData.organizationName);
    if (!orgNameValidation.isValid) {
      newErrors.organizationName = orgNameValidation.error;
    }

    const descValidation = validateOrganizationDescription(formData.organizationDescription);
    if (!descValidation.isValid) {
      newErrors.organizationDescription = descValidation.error;
    }

    const industryValidation = validateIndustry(formData.industry);
    if (!industryValidation.isValid) {
      newErrors.industry = industryValidation.error;
    }

    if (!formData.companySize) {
      newErrors.companySize = 'Please select company size';
    }

    // Website is optional, but validate if provided
    if (formData.website && !isValidUrl(formData.website)) {
      newErrors.website = 'Please enter a valid website URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Partial<FormData> = {};

    const nameValidation = validateName(formData.adminName);
    if (!nameValidation.isValid) {
      newErrors.adminName = nameValidation.error;
    }

    const emailValidation = validateEmail(formData.adminEmail);
    if (!emailValidation.isValid) {
      newErrors.adminEmail = emailValidation.error;
    }

    const passwordValidation = validatePassword(formData.adminPassword, { requireStrong: true });
    if (!passwordValidation.isValid) {
      newErrors.adminPassword = passwordValidation.error;
    }

    const confirmPasswordValidation = validateConfirmPassword(
      formData.adminPassword,
      formData.confirmPassword
    );
    if (!confirmPasswordValidation.isValid) {
      newErrors.confirmPassword = confirmPasswordValidation.error;
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = true;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  };

  const handleNext = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep2()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const organizationData: OrganizationRegistrationData = {
        name: formData.organizationName.trim(),
        description: formData.organizationDescription.trim(),
        industry: formData.industry,
        size: formData.companySize,
        website: formData.website.trim() || undefined,
      };

      const registerData: RegisterData = {
        name: formData.adminName.trim(),
        email: formData.adminEmail.trim().toLowerCase(),
        password: formData.adminPassword,
        userType: 'organization_admin',
        organizationData,
        acceptTerms: formData.acceptTerms,
        subscribeNewsletter: formData.subscribeNewsletter,
      };

      await register(registerData);
      setIsSuccess(true);

      // Track successful registration
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'sign_up', {
          method: 'email',
          user_type: 'organization_admin',
          organization_industry: formData.industry,
          organization_size: formData.companySize,
        });
      }
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : 'Registration failed. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const value = e.target.type === 'checkbox' 
      ? (e.target as HTMLInputElement).checked 
      : e.target.value;
    
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing/changing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Success state
  if (isSuccess) {
    return (
      <div className={`text-center space-y-6 ${className}`}>
        <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">
            Organization Created Successfully!
          </h2>
          <p className="text-gray-600">
            Welcome to AI4U! You can now manage your team and start learning together.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
          <p className="text-sm text-blue-800 font-medium">
            📧 Please check your email to verify your account
          </p>
          <p className="text-sm text-blue-700">
            👥 You can start inviting team members once your email is verified
          </p>
        </div>

        <Button
          onClick={() => window.location.href = '/dashboard'}
          variant="primary"
          size="lg"
          className="w-full"
        >
          Go to Organization Dashboard
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
          <Building className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Create Organization</h2>
        <p className="mt-2 text-sm text-gray-600">
          Step {currentStep} of 2: {currentStep === 1 ? 'Organization Details' : 'Admin Account'}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center">
        <div className="flex-1 flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
            currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            1
          </div>
          <div className={`flex-1 h-1 mx-2 transition-colors ${
            currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'
          }`} />
        </div>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
          currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
        }`}>
          2
        </div>
      </div>

      {/* Step 1: Organization Details */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <FormInput
            label="Organization Name"
            value={formData.organizationName}
            onChange={handleInputChange('organizationName')}
            placeholder="Enter your organization name"
            error={errors.organizationName}
            icon={Building}
            required
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.organizationDescription}
              onChange={handleInputChange('organizationDescription')}
              placeholder="Describe your organization and what you do"
              rows={3}
              className={`block w-full px-3 py-2 border ${
                errors.organizationDescription ? 'border-red-300' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400`}
              required
            />
            {errors.organizationDescription && (
              <p className="text-sm text-red-600">{errors.organizationDescription}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Industry <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.industry}
                onChange={handleInputChange('industry')}
                className={`block w-full px-3 py-2 border ${
                  errors.industry ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                required
              >
                {industryOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.industry && (
                <p className="text-sm text-red-600">{errors.industry}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Company Size <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.companySize}
                onChange={handleInputChange('companySize')}
                className={`block w-full px-3 py-2 border ${
                  errors.companySize ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                required
              >
                {companySizeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.companySize && (
                <p className="text-sm text-red-600">{errors.companySize}</p>
              )}
            </div>
          </div>

          <FormInput
            label="Website (Optional)"
            type="url"
            value={formData.website}
            onChange={handleInputChange('website')}
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

      {/* Step 2: Admin Account */}
      {currentStep === 2 && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-1">Admin Account Setup</h3>
            <p className="text-sm text-blue-700">
              This account will have full administrative privileges for your organization.
            </p>
          </div>

          <FormInput
            label="Admin Full Name"
            value={formData.adminName}
            onChange={handleInputChange('adminName')}
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
            onChange={handleInputChange('adminEmail')}
            placeholder="Enter admin email address"
            error={errors.adminEmail}
            icon={Mail}
            autoComplete="email"
            required
          />

          <PasswordInput
            label="Password"
            value={formData.adminPassword}
            onChange={handleInputChange('adminPassword')}
            placeholder="Create a strong password"
            error={errors.adminPassword}
            showStrengthIndicator={true}
            autoComplete="new-password"
            required
          />

          <PasswordInput
            label="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleInputChange('confirmPassword')}
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
                onChange={handleInputChange('acceptTerms')}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                required
              />
              <span className="text-sm text-gray-700">
                I agree to the{' '}
                <a href="/terms" className="text-blue-600 hover:text-blue-500 underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" className="text-blue-600 hover:text-blue-500 underline">
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
                onChange={handleInputChange('subscribeNewsletter')}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Subscribe to our newsletter for organizational learning tips and product updates
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
              {isLoading ? 'Creating Organization...' : 'Create Organization'}
            </Button>
          </div>
        </form>
      )}

      {/* Footer Links */}
      <div className="text-center space-y-3">
        <p className="text-sm text-gray-600">
          Want to create an individual account?{' '}
          <button
            type="button"
            onClick={onSwitchToIndividualSignup}
            className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
          >
            Sign up as Individual
          </button>
        </p>
        
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};