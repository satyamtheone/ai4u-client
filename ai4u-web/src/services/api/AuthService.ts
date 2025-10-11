import { BaseApiService } from "./BaseApiService";
import {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  User,
  GoogleAuthResponse,
} from "../../types/auth/Auth";
import { API_ENDPOINTS } from "../../utils/constants/apiEndpoints";

export class AuthService extends BaseApiService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await this.post<AuthResponse>(
        API_ENDPOINTS.AUTH.LOGIN,
        credentials
      );

      if (response.access_token) {
        this.setToken(response.access_token);
      }

      return response;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Login failed");
    }
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await this.post<AuthResponse>(
        API_ENDPOINTS.AUTH.REGISTER,
        userData
      );

      if (response.access_token) {
        this.setToken(response.access_token);
      }

      return response;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Registration failed"
      );
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      return await this.get<User>(API_ENDPOINTS.USERS.ME);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to get user profile"
      );
    }
  }

  async updateProfile(profileData: Partial<User>): Promise<User> {
    try {
      return await this.put<User>(API_ENDPOINTS.USERS.ME, profileData);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to update profile"
      );
    }
  }

  async getGoogleAuthUrl(): Promise<GoogleAuthResponse> {
    try {
      return await this.get<GoogleAuthResponse>(API_ENDPOINTS.AUTH.GOOGLE);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to get Google auth URL"
      );
    }
  }

  async handleGoogleCallback(code: string): Promise<AuthResponse> {
    try {
      const response = await this.post<AuthResponse>(
        API_ENDPOINTS.AUTH.GOOGLE_CALLBACK,
        { code }
      );

      if (response.access_token) {
        this.setToken(response.access_token);
      }

      return response;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Google authentication failed"
      );
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const response = await this.post<AuthResponse>(
        API_ENDPOINTS.AUTH.REFRESH,
        { refreshToken }
      );

      if (response.access_token) {
        this.setToken(response.access_token);
      }

      return response;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Token refresh failed"
      );
    }
  }

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    try {
      return await this.post<{ message: string }>(
        API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
        { email }
      );
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Password reset request failed"
      );
    }
  }

  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<{ message: string }> {
    try {
      return await this.post<{ message: string }>(
        API_ENDPOINTS.AUTH.RESET_PASSWORD,
        { token, password: newPassword }
      );
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Password reset failed"
      );
    }
  }

  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<{ message: string }> {
    try {
      return await this.put<{ message: string }>(
        API_ENDPOINTS.AUTH.CHANGE_PASSWORD,
        { currentPassword, newPassword }
      );
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Password change failed"
      );
    }
  }

  async logout(): Promise<void> {
    try {
      await this.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      // Continue with logout even if server request fails
      console.warn("Server logout failed:", error);
    } finally {
      this.setToken(null);
    }
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    try {
      return await this.post<{ message: string }>(
        API_ENDPOINTS.AUTH.VERIFY_EMAIL,
        { token }
      );
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Email verification failed"
      );
    }
  }

  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    try {
      return await this.post<{ message: string }>(
        API_ENDPOINTS.AUTH.RESEND_VERIFICATION,
        { email }
      );
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to resend verification email"
      );
    }
  }
}
