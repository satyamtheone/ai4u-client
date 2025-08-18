// Base API Response Structure
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  meta?: ResponseMeta;
  errors?: ValidationError[];
  timestamp?: string;
}

// Response metadata for pagination, etc.
export interface ResponseMeta {
  pagination?: PaginationMeta;
  filters?: Record<string, any>;
  sorting?: SortingMeta;
  total?: number;
  count?: number;
}

// Pagination metadata
export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage?: number;
  previousPage?: number;
}

// Sorting metadata
export interface SortingMeta {
  field: string;
  direction: 'asc' | 'desc';
}

// Validation error structure
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
  value?: any;
}

// API Error Response
export interface ApiError {
  status: number;
  message: string;
  code?: string;
  details?: ErrorDetails;
  timestamp?: string;
  path?: string;
  method?: string;
}

// Error details
export interface ErrorDetails {
  field?: string;
  value?: any;
  expected?: any;
  actual?: any;
  constraint?: string;
  validation?: ValidationError[];
  stack?: string; // Only in development
}

// HTTP Status Code Enums
export enum HttpStatusCode {
  // Success
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,
  
  // Redirection
  MOVED_PERMANENTLY = 301,
  FOUND = 302,
  NOT_MODIFIED = 304,
  
  // Client Errors
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  
  // Server Errors
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
}

// API Error Types
export enum ApiErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  CONFLICT_ERROR = 'CONFLICT_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// Request/Response interceptor types
export interface RequestInterceptor {
  onRequest?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
  onRequestError?: (error: any) => Promise<any>;
}

export interface ResponseInterceptor {
  onResponse?: <T>(response: ApiResponse<T>) => ApiResponse<T> | Promise<ApiResponse<T>>;
  onResponseError?: (error: ApiError) => Promise<ApiError>;
}

// Request configuration
export interface RequestConfig extends RequestInit {
  url?: string;
  baseURL?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  useCache?: boolean;
  cacheTTL?: number;
  skipAuth?: boolean;
  skipErrorHandling?: boolean;
  onUploadProgress?: (progress: UploadProgress) => void;
  onDownloadProgress?: (progress: DownloadProgress) => void;
}

// Upload/Download progress
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface DownloadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// List response wrapper
export interface ListResponse<T> {
  items: T[];
  meta: ResponseMeta;
}

// Search response
export interface SearchResponse<T> extends ListResponse<T> {
  query: string;
  filters?: Record<string, any>;
  suggestions?: string[];
}

// Bulk operation response
export interface BulkOperationResponse<T = any> {
  success: boolean;
  processed: number;
  failed: number;
  results: BulkOperationResult<T>[];
  errors?: BulkOperationError[];
}

export interface BulkOperationResult<T> {
  id: string | number;
  success: boolean;
  data?: T;
  error?: string;
}

export interface BulkOperationError {
  index: number;
  id?: string | number;
  message: string;
  code?: string;
}

// File upload response
export interface FileUploadResponse {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  metadata?: Record<string, any>;
}

// Health check response
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  services: ServiceHealth[];
}

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  error?: string;
}

// Analytics response
export interface AnalyticsResponse {
  metrics: Record<string, number>;
  trends: TrendData[];
  timeRange: {
    start: string;
    end: string;
  };
}

export interface TrendData {
  date: string;
  value: number;
  change?: number;
  changePercentage?: number;
}

// Notification response
export interface NotificationResponse {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

// Custom error class for API errors
export class ApiErrorClass extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly details?: ErrorDetails;
  public readonly timestamp: string;

  constructor(error: ApiError) {
    super(error.message);
    this.name = 'ApiError';
    this.status = error.status;
    this.code = error.code;
    this.details = error.details;
    this.timestamp = error.timestamp || new Date().toISOString();
  }

  public isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  public isServerError(): boolean {
    return this.status >= 500;
  }

  public isNetworkError(): boolean {
    return this.status === 0;
  }

  public isRetryable(): boolean {
    const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
    return retryableStatusCodes.includes(this.status);
  }
}

// Type guards for response checking
export const isSuccessResponse = <T>(response: any): response is ApiResponse<T> => {
  return response && typeof response === 'object' && response.success === true;
};

export const isErrorResponse = (response: any): response is ApiError => {
  return response && typeof response === 'object' && 
         (response.success === false || response.status >= 400);
};

export const isListResponse = <T>(response: any): response is ListResponse<T> => {
  return response && typeof response === 'object' && 
         Array.isArray(response.items) && response.meta;
};

export const isPaginatedResponse = <T>(response: any): response is ListResponse<T> => {
  return isListResponse(response) && !!response.meta?.pagination;
};