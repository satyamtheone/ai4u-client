// API Configuration
export const apiConfig = {
  // Base URL for API requests
  baseURL: process.env.REACT_APP_API_BASE_URL || '/api/v1',
  
  // Request timeout in milliseconds
  timeout: parseInt(process.env.REACT_APP_API_TIMEOUT || '30000'),

  // Number of retry attempts for failed requests
  retries: parseInt(process.env.REACT_APP_API_RETRIES || '3'),

  // Retry delay in milliseconds
  retryDelay: parseInt(process.env.REACT_APP_RETRY_DELAY || '1000'),
  
  // Enable request/response logging in development
  enableLogging: process.env.NODE_ENV === 'development',
  
  // Default headers for all requests
  defaultHeaders: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  
  // Authentication configuration
  auth: {
    tokenKey: process.env.REACT_APP_AUTH_TOKEN_KEY || 'authToken',
    refreshTokenKey: process.env.REACT_APP_REFRESH_TOKEN_KEY || 'refreshToken',
    tokenPrefix: 'Bearer',
    autoRefresh: true,
    refreshThreshold: 300000, // 5 minutes before expiry
  },
  
  // Google OAuth configuration
  google: {
    clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID || '',
    redirectUri: process.env.REACT_APP_GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/google/callback`,
    scope: [
      'openid',
      'profile',
      'email',
    ].join(' '),
  },
  
  // File upload configuration
  upload: {
    maxFileSize: parseInt(process.env.REACT_APP_MAX_FILE_SIZE || String(10 * 1024 * 1024)), // 10MB
    allowedTypes: (process.env.REACT_APP_ALLOWED_FILE_TYPES ||
      'image/jpeg,image/png,image/gif,image/webp,application/pdf,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ).split(','),
    chunkSize: parseInt(process.env.REACT_APP_UPLOAD_CHUNK_SIZE || String(1024 * 1024)), // 1MB chunks for large files
  },
  
  // Cache configuration
  cache: {
    enabled: process.env.REACT_APP_CACHE_ENABLED !== 'false',
    defaultTTL: parseInt(process.env.REACT_APP_CACHE_TTL || '300000'), // 5 minutes
    maxEntries: parseInt(process.env.REACT_APP_CACHE_MAX_ENTRIES || '100'),
  },
  
  // Error configuration
  errors: {
    showErrorDetails: process.env.NODE_ENV === 'development',
    retryableStatusCodes: (process.env.REACT_APP_RETRYABLE_STATUS_CODES || '408,429,500,502,503,504')
      .split(',')
      .map(code => parseInt(code.trim())),
  },
  
  // Rate limiting configuration
  rateLimit: {
    enabled: process.env.REACT_APP_RATE_LIMIT_ENABLED !== 'false',
    maxRequests: parseInt(process.env.REACT_APP_RATE_LIMIT_MAX_REQUESTS || '100'),
    windowMs: parseInt(process.env.REACT_APP_RATE_LIMIT_WINDOW || '60000'), // 1 minute
  },
  
  // Pagination defaults
  pagination: {
    defaultLimit: parseInt(process.env.REACT_APP_PAGINATION_DEFAULT || '20'),
    maxLimit: parseInt(process.env.REACT_APP_PAGINATION_MAX || '100'),
  },
  
  // WebSocket configuration (for real-time features)
  websocket: {
    url: process.env.REACT_APP_WS_URL || 'ws://localhost:8000/ws',
    reconnectInterval: parseInt(process.env.REACT_APP_WS_RECONNECT_INTERVAL || '5000'),
    maxReconnectAttempts: parseInt(process.env.REACT_APP_WS_MAX_RECONNECT_ATTEMPTS || '5'),
  },
  
  // Environment-specific settings
  environments: {
    development: {
      enableMocking: false,
      mockDelay: 1000,
      logLevel: 'debug',
    },
    production: {
      enableMocking: false,
      logLevel: 'error',
    },
    test: {
      enableMocking: true,
      mockDelay: 0,
      logLevel: 'silent',
    },
  },
};

// Get environment-specific config
export const getEnvironmentConfig = () => {
  const env = process.env.NODE_ENV as keyof typeof apiConfig.environments;
  return apiConfig.environments[env] || apiConfig.environments.development;
};

// Validate required environment variables
export const validateConfig = () => {
  const required = [
    'REACT_APP_API_BASE_URL',
  ];
  
  const optional = [
    'REACT_APP_GOOGLE_CLIENT_ID',
    'REACT_APP_GOOGLE_REDIRECT_URI',
    'REACT_APP_WS_URL',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  const missingOptional = optional.filter(key => !process.env[key]);
  if (missingOptional.length > 0) {
    console.warn('Missing optional environment variables:', missingOptional);
  }
  
  return true;
};

// Initialize config validation
if (process.env.NODE_ENV !== 'test') {
  validateConfig();
}