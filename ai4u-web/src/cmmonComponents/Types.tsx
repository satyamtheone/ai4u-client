import { JSX } from "react";

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
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  subscribeNewsletter: boolean;
}

export interface StatsBoxProps {
  title: string;
  icon: JSX.Element;
}
