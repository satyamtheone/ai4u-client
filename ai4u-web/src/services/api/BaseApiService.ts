import { apiConfig } from "../../config/apiConfig";
import { apiClient } from "../auth/apiClient";
import { tokenManager } from "../auth/TokenManager";
import { AxiosRequestConfig } from "axios";

function readTokenFromStorage(): string | null {
  try {
    // mirror your StorageService key
    const tokenKey = process.env.REACT_APP_AUTH_TOKEN_KEY || "authToken";
    const t = localStorage.getItem(tokenKey);
    return t ?? null;
  } catch {
    return null;
  }
}

/**
 * BaseApiService - Unified API service base class
 *
 * Now supports both fetch and axios with automatic token management.
 * Uses axios by default for better interceptor support and automatic token refresh.
 * Falls back to fetch for backward compatibility.
 */
export class BaseApiService {
  protected baseURL: string;
  protected token: string | null = null;
  protected useAxios: boolean = true; // Use axios by default

  constructor(useAxios: boolean = true) {
    this.baseURL = apiConfig.baseURL;
    this.token = readTokenFromStorage();
    this.useAxios = useAxios;
  }

  /**
   * Make API request using axios or fetch
   */
  protected async request<T>(
    endpoint: string,
    options: RequestInit | AxiosRequestConfig = {}
  ): Promise<T> {
    // Use axios if enabled (recommended)
    if (this.useAxios) {
      return this.requestWithAxios<T>(endpoint, options as AxiosRequestConfig);
    }

    // Fallback to fetch for backward compatibility
    return this.requestWithFetch<T>(endpoint, options as RequestInit);
  }

  /**
   * Make request using axios (with automatic token refresh)
   */
  private async requestWithAxios<T>(
    endpoint: string,
    options: AxiosRequestConfig = {}
  ): Promise<T> {
    try {
      const response = await apiClient.request<T>({
        ...options,
        url: endpoint,
        baseURL: this.baseURL,
      });

      return response.data;
    } catch (error: any) {
      // Axios errors are already handled by interceptors
      if (error.response) {
        throw new Error(error.response.data?.message || error.response.data?.error || error.message);
      }
      throw error;
    }
  }

  /**
   * Make request using fetch (legacy support)
   */
  private async requestWithFetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      // Handle empty responses
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        return data.data || data; // Handle both wrapped and unwrapped responses
      }

      return {} as T;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network error occurred");
    }
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    let errorMessage = "Request failed";
    let errorCode: number | null = null;

    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
      errorCode = errorData.code;
    } catch {
      // If JSON parsing fails, use status text
      errorMessage = response.statusText || errorMessage;
    }

    // const apiError: ApiError = {
    //   status: response.status,
    //   message: errorMessage,
    //   code: errorCode,
    // };

    // Handle specific status codes
    switch (response.status) {
      case 401:
        // Unauthorized - token might be expired
        this.handleUnauthorized();
        throw new Error("Authentication required");
      case 403:
        throw new Error("Access forbidden");
      case 404:
        throw new Error("Resource not found");
      case 409:
        throw new Error(errorMessage || "Conflict occurred");
      case 422:
        throw new Error(errorMessage || "Validation failed");
      case 429:
        throw new Error("Too many requests. Please try again later.");
      case 500:
        throw new Error("Internal server error");
      default:
        throw new Error(errorMessage);
    }
  }

  private handleUnauthorized(): void {
    // Clear token using TokenManager for consistency
    tokenManager.clearTokens();
    this.token = null;

    // Dispatch custom event for auth state change
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }
  }

  public setToken(token: string | null): void {
    this.token = token;
    // Sync with TokenManager if using fetch
    if (!this.useAxios) {
      if (token) {
        tokenManager.setToken(token);
      } else {
        tokenManager.clearTokens();
      }
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  // Utility methods for different HTTP methods
  protected async get<T>(
    endpoint: string,
    params?: Record<string, any>
  ): Promise<T> {
    const url = params
      ? `${endpoint}?${new URLSearchParams(params)}`
      : endpoint;
    return this.request<T>(url, { method: "GET" });
  }

  protected async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  protected async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  protected async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  protected async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  // File upload method
  protected async uploadFile<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, any>
  ): Promise<T> {
    const formData = new FormData();
    formData.append("file", file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    return this.request<T>(endpoint, {
      method: "POST",
      body: formData,
      headers: {
        // Don't set Content-Type for FormData, let browser set it with boundary
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
    });
  }
}
