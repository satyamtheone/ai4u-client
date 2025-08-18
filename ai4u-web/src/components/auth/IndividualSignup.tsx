import React, { useState } from 'react';
import { User, Mail, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { FormInput } from '../shared/FormInput';
import { PasswordInput } from '../shared/PasswordInput';
import { Button } from '../shared/Button';
import { 
  validateEmail, 
  validatePassword, 
  validateName, 
  validateConfirmPassword 
} from '../../utils/validation/authValidation';
import { RegisterData } from '../../types/auth/Auth';

interface IndividualSignupProps {
  onSwitchToLogin: () => void;
  onSwitchToOrgSignup: () => void;
  className?: string;
}

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  subscribeNewsletter: boolean;
}

export const IndividualSignup: React.FC<IndividualSignupProps> = ({
  onSwitchToLogin,
  onSwitchToOrgSignup,
  className = '',
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    subscribeNewsletter: false,
  });

  const [errors, setErrors] = useState<Partial<FormData & { submit: string }>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { register } = useAuth();

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    // Name validation
    const nameValidation = validateName(formData.name);
    if (!nameValidation.isValid) {
      newErrors.name = nameValidation.error;
    }

    // Email validation
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.error;
    }

    // Password validation
    const passwordValidation = validatePassword(formData.password, { requireStrong: true });
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.error;
    }

    // Confirm password validation
    const confirmPasswordValidation = validateConfirmPassword(
      formData.password, 
      formData.confirmPassword
    );
    if (!confirmPasswordValidation.isValid) {
      newErrors.confirmPassword = confirmPasswordValidation.error;
    }

    // Terms acceptance validation
    if (!formData.acceptTerms) {
    //   newErrors.acceptTerms = 'You must accept the terms and conditions';
      newErrors.acceptTerms = true;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const registerData: RegisterData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        userType: 'individual',
        acceptTerms: formData.acceptTerms,
        subscribeNewsletter: formData.subscribeNewsletter,
      };

      await register(registerData);
      setIsSuccess(true);

      // Track successful registration
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'sign_up', {
          method: 'email',
          user_type: 'individual',
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
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
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
            Welcome to AI4U!
          </h2>
          <p className="text-gray-600">
            Your account has been created successfully. Start your personal learning journey.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            📧 Please check your email to verify your account and unlock all features.
          </p>
        </div>

        <Button
          onClick={() => window.location.href = '/dashboard'}
          variant="primary"
          size="lg"
          className="w-full"
        >
          Go to Dashboard
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
          <User className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Create Your Account</h2>
        <p className="mt-2 text-sm text-gray-600">
          Start your personal AI learning journey
        </p>
      </div>

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          label="Full Name"
          value={formData.name}
          onChange={handleInputChange('name')}
          placeholder="Enter your full name"
          error={errors.name}
          icon={User}
          autoComplete="name"
          required
        />

        <FormInput
          label="Email Address"
          type="email"
          value={formData.email}
          onChange={handleInputChange('email')}
          placeholder="Enter your email address"
          error={errors.email}
          icon={Mail}
          autoComplete="email"
          required
        />

        <PasswordInput
          label="Password"
          value={formData.password}
          onChange={handleInputChange('password')}
          placeholder="Create a strong password"
          error={errors.password}
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
          {isLoading ? 'Creating Account...' : 'Create Account'}
          {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>
      </form>

      {/* Footer Links */}
      <div className="text-center space-y-3">
        <p className="text-sm text-gray-600">
          Want to create an organization?{' '}
          <button
            type="button"
            onClick={onSwitchToOrgSignup}
            className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
          >
            Sign up as Organization Admin
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