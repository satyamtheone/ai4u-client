import { apiConfig } from "../../config/apiConfig";
import { ApiError } from "../../types/api/ApiResponse";

export class BaseApiService {
  protected baseURL: string;
  protected token: string | null = null;

  constructor() {
    this.baseURL = apiConfig.baseURL;
  }

  protected async request<T>(
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
    let errorCode: string | undefined;

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
    // Clear token and redirect to login
    this.setToken(null);

    // Dispatch custom event for auth state change
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }
  }

  public setToken(token: string | null): void {
    this.token = token;
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
