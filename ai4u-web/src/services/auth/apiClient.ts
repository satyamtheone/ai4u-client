import axios, { AxiosInstance, AxiosRequestConfig, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { tokenManager } from './TokenManager';
import { apiConfig } from '../../config/apiConfig';

/**
 * API Client Configuration
 * Centralized axios instance with automatic token management
 *
 * Features:
 * - Automatic token injection in requests
 * - Automatic token refresh on 401 errors
 * - Request retry after token refresh
 * - Configurable via environment variables
 * - Request/response interceptors
 */

// Track requests that are waiting for token refresh
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

/**
 * Subscribe to token refresh
 */
function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

/**
 * Notify all subscribers when token is refreshed
 */
function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

/**
 * Create axios instance with base configuration
 */
function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: apiConfig.baseURL,
    timeout: apiConfig.timeout,
    headers: apiConfig.defaultHeaders,
  });

  /**
   * Request Interceptor
   * - Adds authorization header with valid token
   * - Validates token before request
   */
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      // Get valid token (will auto-refresh if needed)
      const token = await tokenManager.getValidToken();

      // Add token to headers if available
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Log request in development
      if (apiConfig.enableLogging && process.env.NODE_ENV === 'development') {
        console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`);
      }

      return config;
    },
    (error: AxiosError) => {
      console.error('Request interceptor error:', error);
      return Promise.reject(error);
    }
  );

  /**
   * Response Interceptor
   * - Handles 401 errors with automatic token refresh
   * - Retries failed request after token refresh
   * - Handles other error responses
   */
  client.interceptors.response.use(
    (response) => {
      // Log response in development
      if (apiConfig.enableLogging && process.env.NODE_ENV === 'development') {
        console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
      }

      // Extract data from wrapped response if needed
      if (response.data?.data) {
        return { ...response, data: response.data.data };
      }

      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      // Log error in development
      if (apiConfig.enableLogging && process.env.NODE_ENV === 'development') {
        console.error(`❌ ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url} - ${error.response?.status}`);
      }

      // Handle 401 Unauthorized - Token expired or invalid
      if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
        if (isRefreshing) {
          // Token refresh is already in progress, queue this request
          return new Promise((resolve) => {
            subscribeTokenRefresh((token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(client(originalRequest));
            });
          });
        }

        // Mark request as retry to prevent infinite loops
        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // Attempt to refresh token
          const newToken = await tokenManager.refreshTokenIfNeeded();

          if (newToken) {
            // Token refreshed successfully
            isRefreshing = false;
            onTokenRefreshed(newToken);

            // Retry original request with new token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return client(originalRequest);
          } else {
            // Token refresh failed, clear tokens and redirect to login
            isRefreshing = false;
            tokenManager.clearTokens();

            // Dispatch auth:unauthorized event for app-level handling
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('auth:unauthorized'));
            }

            return Promise.reject(error);
          }
        } catch (refreshError) {
          // Refresh failed
          isRefreshing = false;
          tokenManager.clearTokens();

          // Dispatch auth:unauthorized event
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('auth:unauthorized'));
          }

          return Promise.reject(refreshError);
        }
      }

      // Handle 403 Forbidden
      if (error.response?.status === 403) {
        console.error('Access forbidden:', error.response.data);
        // Dispatch custom event for app-level handling
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:forbidden', {
            detail: error.response.data
          }));
        }
      }

      // Handle network errors
      if (!error.response) {
        console.error('Network error:', error.message);
      }

      return Promise.reject(error);
    }
  );

  return client;
}

// Create and export singleton axios instance
export const apiClient = createApiClient();

/**
 * Utility function to make API requests with proper typing
 */
export async function apiRequest<T = any>(config: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.request<T>(config);
  return response.data;
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    apiRequest<T>({ ...config, method: 'GET', url }),

  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    apiRequest<T>({ ...config, method: 'POST', url, data }),

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    apiRequest<T>({ ...config, method: 'PUT', url, data }),

  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    apiRequest<T>({ ...config, method: 'PATCH', url, data }),

  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    apiRequest<T>({ ...config, method: 'DELETE', url }),
};

/**
 * Export types for convenience
 */
export type { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
