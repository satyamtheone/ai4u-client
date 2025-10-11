// User types
export type UserType =
  | "individual"
  | "organization_admin"
  | "organization_user";
export type UserStatus = "active" | "pending" | "suspended" | "inactive";

export interface User {
  id: number;
  name: string;
  email: string;
  userType: UserType;
  status: UserStatus;
  emailVerified: boolean;
  avatar?: string;
  organization?: OrganizationMember;
  preferences?: UserPreferences;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface OrganizationMember {
  organizationId: number;
  organizationName: string;
  role: "admin" | "user";
  joinedAt: string;
  permissions?: string[];
}

export interface UserPreferences {
  theme: "light" | "dark" | "system";
  notifications: {
    email: boolean;
    push: boolean;
    marketing: boolean;
  };
  language: string;
  timezone: string;
}

// Authentication request/response types
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  name?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  password: string;
  userType: UserType;
  organizationData?: OrganizationRegistrationData;
  acceptTerms?: boolean;
  subscribeNewsletter?: boolean;
}

export interface OrganizationRegistrationData {
  name: string;
  description: string;
  industry: string;
  size?: string;
  website?: string;
}

export interface AuthResponse {
  access_token: string;
  success: boolean;
  refreshToken?: string;
  user: User;
  expiresIn?: number;
}

export interface GoogleAuthResponse {
  authUrl: string;
  state?: string;
}

// Auth state
export interface AuthState {
  user: User | null;
  access_token: string | null;
  refreshToken?: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Password management
export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetData {
  token: string;
  password: string;
  confirmPassword: string;
}

// Email verification
export interface EmailVerificationRequest {
  email: string;
}

export interface EmailVerificationData {
  token: string;
}

// Profile update
export interface ProfileUpdateData {
  name?: string;
  email?: string;
  avatar?: string;
  preferences?: Partial<UserPreferences>;
}

// Session management
export interface SessionInfo {
  id: string;
  deviceName: string;
  ipAddress: string;
  userAgent: string;
  lastActivity: string;
  current: boolean;
}

// Two-factor authentication
export interface TwoFactorSetupData {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface TwoFactorVerificationData {
  token: string;
  code: string;
}

// Auth hooks return types
export interface UseAuthReturn extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateProfile: (data: ProfileUpdateData) => Promise<void>;
  changePassword: (data: PasswordChangeData) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (data: PasswordResetData) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
}

// Validation types
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  errors?: string[];
}

export interface ValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => ValidationResult;
}

// Form types
export type FormErrors<T extends object> = {
  [K in keyof T]?: string;
};

export interface FormState<T extends object> {
  values: T;
  errors: FormErrors<T>;
  touched: { [K in keyof T]?: boolean };
  isSubmitting: boolean;
  isValid: boolean;
}

// Auth provider props
export interface AuthProviderProps {
  children: React.ReactNode;
}

// Route protection types
export interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserType[];
  requireEmailVerification?: boolean;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

// OAuth provider types
export type OAuthProvider = "google" | "github" | "microsoft";

export interface OAuthConfig {
  clientId: string;
  redirectUri: string;
  scope?: string[];
}

export interface OAuthState {
  provider: OAuthProvider;
  returnUrl?: string;
  organizationInvite?: string;
}
