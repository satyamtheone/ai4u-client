// API Configuration Helper
// Handles proxy mode vs direct connection mode

const useProxy = process.env.REACT_APP_USE_PROXY === 'true';

/**
 * Get the backend URL based on proxy configuration
 * - If proxy is enabled, returns empty string (uses relative URLs)
 * - If proxy is disabled, returns full backend URL
 */
export const getBackendUrl = (): string => {
  if (useProxy) {
    // When using proxy, requests go to same origin (localhost:3000/api)
    // The proxy middleware forwards them to the actual backend
    return '';
  }
  // Direct connection to backend
  return process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
};

/**
 * Get the API base URL
 */
export const getApiBaseUrl = (): string => {
  if (useProxy) {
    // Proxy mode: use relative path
    return '/api/v1';
  }
  // Direct mode: use full URL
  return process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/v1';
};

/**
 * Get WebSocket URL (proxy doesn't work for WebSockets)
 */
export const getWsUrl = (): string => {
  return process.env.REACT_APP_WS_URL || 'ws://localhost:8000/ws';
};

/**
 * Check if proxy mode is enabled
 */
export const isProxyEnabled = (): boolean => {
  return useProxy;
};

// Log configuration on load
if (process.env.NODE_ENV === 'development') {
  console.log('📡 API Configuration:');
  console.log('  Proxy mode:', useProxy ? '✅ ENABLED (bypassing CORS)' : '❌ DISABLED (direct connection)');
  console.log('  Backend URL:', getBackendUrl() || '(using proxy)');
  console.log('  API Base URL:', getApiBaseUrl());
  console.log('  WebSocket URL:', getWsUrl());
}
