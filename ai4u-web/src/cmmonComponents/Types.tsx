export interface OrganizationSignupProps {
  onSwitchToLogin: () => void;
  onSwitchToIndividualSignup: () => void;
  className?: string;
}

export interface FormData {
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

export interface IndividualSignupProps {
  onSwitchToLogin: () => void;
  onSwitchToOrgSignup: () => void;
  className?: string;
}

export interface IndividualFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  subscribeNewsletter: boolean;
}
