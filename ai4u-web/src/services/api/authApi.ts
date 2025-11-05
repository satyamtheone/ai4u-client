import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { apiConfig } from "../../config/apiConfig";
import { API_ENDPOINTS } from "../../utils/constants/apiEndpoints";
import type {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  User,
  GoogleAuthResponse,
} from "../../types/auth/Auth";
import type { Organization } from "./OrganizationService";
import { StorageService } from "../utils/StorageService";
const storage = new StorageService();

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

const baseQuery = fetchBaseQuery({
  baseUrl: apiConfig.baseURL,
  prepareHeaders: (headers) => {
    const token = storage.getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (!headers.has("Content-Type"))
      headers.set("Content-Type", "application/json");
    headers.set("Accept", "application/json");
    return headers;
  },
});

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery,
  tagTypes: ["User", "Organizations"],

  endpoints: (builder) => ({
    /**
     * POST /auth/login
     * body: LoginCredentials
     * returns: AuthResponse (unwraps { success, message, data })
     */
    login: builder.mutation<AuthResponse, LoginCredentials>({
      query: (credentials) => ({
        url: API_ENDPOINTS.AUTH.LOGIN,
        method: "POST",
        body: credentials,
      }),
      transformResponse: (resp: ApiResponse<AuthResponse> | AuthResponse) =>
        (resp as any).data ?? (resp as AuthResponse),
      invalidatesTags: ["User"],
    }),

    /**
     * POST /auth/register
     * body: RegisterData
     * returns: AuthResponse
     */
    register: builder.mutation<AuthResponse, RegisterData>({
      query: (userData) => ({
        url: API_ENDPOINTS.AUTH.REGISTER,
        method: "POST",
        body: userData,
      }),
      transformResponse: (resp: ApiResponse<AuthResponse> | AuthResponse) =>
        (resp as any).data ?? (resp as AuthResponse),
      invalidatesTags: ["User"],
    }),

    /**
     * GET /users/me
     * returns: User
     */
    getCurrentUser: builder.query<User, void>({
      query: () => ({
        url: API_ENDPOINTS.USERS.ME,
        method: "GET",
      }),
      transformResponse: (resp: ApiResponse<User> | User) =>
        (resp as any).data ?? (resp as User),
      providesTags: ["User"],
    }),

    /**
     * GET /organizations/my
     * returns: Organization[]
     */
    getMyOrganizations: builder.query<Organization[], void>({
      query: () => ({
        url: API_ENDPOINTS.ORGANIZATIONS.MY,
        method: "GET",
      }),
      transformResponse: (resp: ApiResponse<Organization[]> | Organization[]) =>
        (resp as any).data ?? (resp as Organization[]) ?? [],
      providesTags: ["Organizations"],
    }),

    /**
     * PUT /users/me
     * body: Partial<User>
     * returns: User
     */
    updateProfile: builder.mutation<User, Partial<User>>({
      query: (profileData) => ({
        url: API_ENDPOINTS.USERS.ME,
        method: "PUT",
        body: profileData,
      }),
      transformResponse: (resp: ApiResponse<User> | User) =>
        (resp as any).data ?? (resp as User),
      invalidatesTags: ["User"],
    }),

    /**
     * GET /auth/google
     * returns: GoogleAuthResponse
     */
    getGoogleAuthUrl: builder.query<GoogleAuthResponse, void>({
      query: () => ({
        url: API_ENDPOINTS.AUTH.GOOGLE,
        method: "GET",
      }),
      transformResponse: (
        resp: ApiResponse<GoogleAuthResponse> | GoogleAuthResponse
      ) => (resp as any).data ?? (resp as GoogleAuthResponse),
    }),

    /**
     * POST /auth/google/callback
     * body: { code: string }
     * returns: AuthResponse
     */
    handleGoogleCallback: builder.mutation<AuthResponse, { code: string }>({
      query: ({ code }) => ({
        url: API_ENDPOINTS.AUTH.GOOGLE_CALLBACK,
        method: "POST",
        body: { code },
      }),
      transformResponse: (resp: ApiResponse<AuthResponse> | AuthResponse) =>
        (resp as any).data ?? (resp as AuthResponse),
      invalidatesTags: ["User"],
    }),

    /**
     * POST /auth/refresh
     * body: { refreshToken: string }
     * returns: AuthResponse
     */
    refreshToken: builder.mutation<AuthResponse, { refreshToken: string }>({
      query: ({ refreshToken }) => ({
        url: API_ENDPOINTS.AUTH.REFRESH,
        method: "POST",
        body: { refreshToken },
      }),
      transformResponse: (resp: ApiResponse<AuthResponse> | AuthResponse) =>
        (resp as any).data ?? (resp as AuthResponse),
    }),

    /**
     * POST /auth/forgot-password
     * body: { email: string }
     * returns: { message: string }
     */
    requestPasswordReset: builder.mutation<
      { message: string },
      { email: string }
    >({
      query: ({ email }) => ({
        url: API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
        method: "POST",
        body: { email },
      }),
      transformResponse: (
        resp: ApiResponse<{ message?: string }> | { message?: string }
      ) => ({
        message: (resp as any).message ?? (resp as any)?.data?.message ?? "OK",
      }),
    }),

    /**
     * POST /auth/reset-password
     * body: { token: string, newPassword: string }
     * returns: { message: string }
     */
    resetPassword: builder.mutation<
      { message: string },
      { token: string; newPassword: string }
    >({
      query: ({ token, newPassword }) => ({
        url: API_ENDPOINTS.AUTH.RESET_PASSWORD,
        method: "POST",
        body: { token, newPassword },
      }),
      transformResponse: (
        resp: ApiResponse<{ message?: string }> | { message?: string }
      ) => ({
        message: (resp as any).message ?? (resp as any)?.data?.message ?? "OK",
      }),
    }),

    /**
     * PUT /auth/change-password
     * body: { currentPassword: string, newPassword: string }
     * returns: { message: string }
     */
    changePassword: builder.mutation<
      { message: string },
      { currentPassword: string; newPassword: string }
    >({
      query: ({ currentPassword, newPassword }) => ({
        url: API_ENDPOINTS.AUTH.CHANGE_PASSWORD,
        method: "PUT",
        body: { currentPassword, newPassword },
      }),
      transformResponse: (
        resp: ApiResponse<{ message?: string }> | { message?: string }
      ) => ({
        message: (resp as any).message ?? (resp as any)?.data?.message ?? "OK",
      }),
    }),

    /**
     * POST /auth/logout
     * returns: void
     */
    logout: builder.mutation<void, void>({
      query: () => ({
        url: API_ENDPOINTS.AUTH.LOGOUT,
        method: "POST",
      }),
      invalidatesTags: ["User", "Organizations"],
    }),

    /**
     * POST /auth/verify-email
     * body: { token: string }
     * returns: { message: string }
     */
    verifyEmail: builder.mutation<{ message: string }, { token: string }>({
      query: ({ token }) => ({
        url: API_ENDPOINTS.AUTH.VERIFY_EMAIL,
        method: "POST",
        body: { token },
      }),
      transformResponse: (
        resp: ApiResponse<{ message?: string }> | { message?: string }
      ) => ({
        message: (resp as any).message ?? (resp as any)?.data?.message ?? "OK",
      }),
    }),

    /**
     * POST /auth/resend-verification
     * body: { email: string }
     * returns: { message: string }
     */
    resendVerificationEmail: builder.mutation<
      { message: string },
      { email: string }
    >({
      query: ({ email }) => ({
        url: API_ENDPOINTS.AUTH.RESEND_VERIFICATION,
        method: "POST",
        body: { email },
      }),
      transformResponse: (
        resp: ApiResponse<{ message?: string }> | { message?: string }
      ) => ({
        message: (resp as any).message ?? (resp as any)?.data?.message ?? "OK",
      }),
    }),
  }),
});

export const {
  // queries
  useGetCurrentUserQuery,
  useLazyGetCurrentUserQuery,
  useGetMyOrganizationsQuery,
  useLazyGetMyOrganizationsQuery,
  useGetGoogleAuthUrlQuery,

  // mutations
  useLoginMutation,
  useRegisterMutation,
  useHandleGoogleCallbackMutation,
  useRefreshTokenMutation,
  useRequestPasswordResetMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  useLogoutMutation,
  useVerifyEmailMutation,
  useResendVerificationEmailMutation,
  useUpdateProfileMutation,
} = authApi;
