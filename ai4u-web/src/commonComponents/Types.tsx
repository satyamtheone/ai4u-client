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
  adminFirstName: string;
  adminLastName: string;
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

export interface UserLearningAnalyticsResponse {
  user_id: string;
  progress: {
    level: number;
    total_questions: number;
    correct_answers: number;
    current_streak: number;
    unlocked_responses: number;
  };
  performance: {
    level: number;
    current_streak: number;
    accuracy: number;
    total_questions: number;
    unlocked_responses: number;
    correct_answers: number;
  };
  trends: {
    accuracy_trend: "needs_work" | "improving" | "stable" | string; // in case there are other trend states
    recent_activity: number;
    last_quiz: string; // ISO timestamp
  };
  recent_submissions: {
    question_id: string;
    is_correct: boolean;
    points_earned: number;
    submitted_at: string; // ISO timestamp
  }[];
}
