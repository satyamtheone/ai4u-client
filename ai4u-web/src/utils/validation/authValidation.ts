import { ValidationResult, ValidationRules } from '../../types/auth/Auth';

// Email validation
export const validateEmail = (email: string): ValidationResult => {
  if (!email || email.trim() === '') {
    return { isValid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  if (email.length > 254) {
    return { isValid: false, error: 'Email address is too long' };
  }

  return { isValid: true };
};

// Password validation
export const validatePassword = (
  password: string, 
  options: { required?: boolean; minLength?: number; requireStrong?: boolean } = {}
): ValidationResult => {
  const { required = true, minLength = 8, requireStrong = false } = options;

  if (!password || password.trim() === '') {
    if (required) {
      return { isValid: false, error: 'Password is required' };
    }
    return { isValid: true };
  }

  if (password.length < minLength) {
    return { 
      isValid: false, 
      error: `Password must be at least ${minLength} characters long` 
    };
  }

  if (password.length > 128) {
    return { isValid: false, error: 'Password is too long (max 128 characters)' };
  }

  if (requireStrong) {
    const errors: string[] = [];
    
    if (!/[a-z]/.test(password)) {
      errors.push('one lowercase letter');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('one uppercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('one number');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('one special character');
    }

    if (errors.length > 0) {
      return {
        isValid: false,
        error: `Password must contain ${errors.join(', ')}`,
        errors,
      };
    }
  }

  return { isValid: true };
};

// Confirm password validation
export const validateConfirmPassword = (
  password: string,
  confirmPassword: string
): ValidationResult => {
  if (!confirmPassword || confirmPassword.trim() === '') {
    return { isValid: false, error: 'Please confirm your password' };
  }

  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match' };
  }

  return { isValid: true };
};

// Name validation
export const validateName = (name: string): ValidationResult => {
  if (!name || name.trim() === '') {
    return { isValid: false, error: 'Name is required' };
  }

  const trimmedName = name.trim();
  
  if (trimmedName.length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters long' };
  }

  if (trimmedName.length > 100) {
    return { isValid: false, error: 'Name is too long (max 100 characters)' };
  }

  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  const nameRegex = /^[a-zA-Z\s'-]+$/;
  if (!nameRegex.test(trimmedName)) {
    return { 
      isValid: false, 
      error: 'Name can only contain letters, spaces, hyphens, and apostrophes' 
    };
  }

  return { isValid: true };
};

// Organization name validation
export const validateOrganizationName = (name: string): ValidationResult => {
  if (!name || name.trim() === '') {
    return { isValid: false, error: 'Organization name is required' };
  }

  const trimmedName = name.trim();
  
  if (trimmedName.length < 2) {
    return { isValid: false, error: 'Organization name must be at least 2 characters long' };
  }

  if (trimmedName.length > 100) {
    return { isValid: false, error: 'Organization name is too long (max 100 characters)' };
  }

  // Allow alphanumeric, spaces, and common business characters
  const orgNameRegex = /^[a-zA-Z0-9\s&.,'-]+$/;
  if (!orgNameRegex.test(trimmedName)) {
    return { 
      isValid: false, 
      error: 'Organization name contains invalid characters' 
    };
  }

  return { isValid: true };
};

// Organization description validation
export const validateOrganizationDescription = (description: string): ValidationResult => {
  if (!description || description.trim() === '') {
    return { isValid: false, error: 'Organization description is required' };
  }

  const trimmedDescription = description.trim();
  
  if (trimmedDescription.length < 10) {
    return { 
      isValid: false, 
      error: 'Description must be at least 10 characters long' 
    };
  }

  if (trimmedDescription.length > 500) {
    return { 
      isValid: false, 
      error: 'Description is too long (max 500 characters)' 
    };
  }

  return { isValid: true };
};

// Industry validation
export const validateIndustry = (industry: string): ValidationResult => {
  if (!industry || industry.trim() === '') {
    return { isValid: false, error: 'Please select an industry' };
  }

  const validIndustries = [
    'technology',
    'healthcare',
    'finance',
    'education',
    'retail',
    'manufacturing',
    'consulting',
    'media',
    'transportation',
    'energy',
    'real-estate',
    'hospitality',
    'agriculture',
    'construction',
    'government',
    'non-profit',
    'other'
  ];

  if (!validIndustries.includes(industry.toLowerCase())) {
    return { isValid: false, error: 'Please select a valid industry' };
  }

  return { isValid: true };
};

// Website URL validation
export const validateWebsite = (website: string): ValidationResult => {
  if (!website || website.trim() === '') {
    return { isValid: true }; // Website is optional
  }

  const urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
  
  if (!urlRegex.test(website)) {
    return { isValid: false, error: 'Please enter a valid website URL' };
  }

  return { isValid: true };
};

// Generic field validation based on rules
export const validateField = (
  value: any,
  rules: ValidationRules,
  fieldName: string = 'Field'
): ValidationResult => {
  // Required validation
  if (rules.required && (!value || String(value).trim() === '')) {
    return { isValid: false, error: `${fieldName} is required` };
  }

  // Skip other validations if field is empty and not required
  if (!value || String(value).trim() === '') {
    return { isValid: true };
  }

  const stringValue = String(value);

  // Minimum length validation
  if (rules.minLength && stringValue.length < rules.minLength) {
    return {
      isValid: false,
      error: `${fieldName} must be at least ${rules.minLength} characters long`,
    };
  }

  // Maximum length validation
  if (rules.maxLength && stringValue.length > rules.maxLength) {
    return {
      isValid: false,
      error: `${fieldName} must be no more than ${rules.maxLength} characters long`,
    };
  }

  // Pattern validation
  if (rules.pattern && !rules.pattern.test(stringValue)) {
    return {
      isValid: false,
      error: `${fieldName} format is invalid`,
    };
  }

  // Custom validation
  if (rules.custom) {
    return rules.custom(value);
  }

  return { isValid: true };
};

// Validate entire form
export const validateForm = <T extends Record<string, any>>(
  formData: T,
  validationRules: { [K in keyof T]?: (value: T[K]) => ValidationResult }
): { isValid: boolean; errors: { [K in keyof T]?: string } } => {
  const errors: { [K in keyof T]?: string } = {};
  let isValid = true;

  Object.keys(validationRules).forEach((key) => {
    const fieldKey = key as keyof T;
    const validator = validationRules[fieldKey];
    
    if (validator) {
      const result = validator(formData[fieldKey]);
      if (!result.isValid) {
        errors[fieldKey] = result.error;
        isValid = false;
      }
    }
  });

  return { isValid, errors };
};

// Password strength checker
export const getPasswordStrength = (password: string): {
  score: number;
  label: string;
  suggestions: string[];
} => {
  if (!password) {
    return { score: 0, label: 'Very Weak', suggestions: ['Enter a password'] };
  }

  let score = 0;
  const suggestions: string[] = [];

  // Length check
  if (password.length >= 8) score += 1;
  else suggestions.push('Use at least 8 characters');

  if (password.length >= 12) score += 1;
  else if (password.length >= 8) suggestions.push('Use 12+ characters for better security');

  // Character variety checks
  if (/[a-z]/.test(password)) score += 1;
  else suggestions.push('Add lowercase letters');

  if (/[A-Z]/.test(password)) score += 1;
  else suggestions.push('Add uppercase letters');

  if (/\d/.test(password)) score += 1;
  else suggestions.push('Add numbers');

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
  else suggestions.push('Add special characters');

  // Common pattern checks
  if (!/(.)\1{2,}/.test(password)) score += 1;
  else suggestions.push('Avoid repeated characters');

  if (!/123|abc|qwe|asd|zxc/i.test(password)) score += 1;
  else suggestions.push('Avoid common patterns');

  // Determine label based on score
  let label: string;
  if (score <= 2) label = 'Very Weak';
  else if (score <= 4) label = 'Weak';
  else if (score <= 6) label = 'Fair';
  else if (score <= 7) label = 'Good';
  else label = 'Strong';

  return { score: Math.min(score, 8), label, suggestions };
};