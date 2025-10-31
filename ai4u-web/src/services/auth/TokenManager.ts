import { jwtDecode } from 'jwt-decode';
import { StorageService } from '../utils/StorageService';

/**
 * TokenManager Configuration Interface
 * All settings can be configured via environment variables
 */
export interface TokenManagerConfig {
  // Enable automatic token refresh
  autoRefresh: boolean;
  // Time before expiry to trigger refresh (milliseconds)
  refreshThreshold: number;
  // Buffer time to consider token expired early (milliseconds)
  expiryBuffer: number;
  // Maximum retry attempts for token refresh
  maxRetryAttempts: number;
  // Enable token validation before use
  enableValidation: boolean;
}

/**
 * Token payload structure (adjust based on your JWT structure)
 */
interface TokenPayload {
  exp?: number; // Expiration time (Unix timestamp)
  iat?: number; // Issued at time
  sub?: string; // Subject (user ID)
  [key: string]: any;
}

/**
 * Token refresh callback type
 */
type TokenRefreshCallback = (refreshToken: string) => Promise<{
  token: string;
  refreshToken?: string;
}>;

/**
 * TokenManager - Centralized, configurable token management service
 *
 * Features:
 * - Singleton pattern for consistent state
 * - Automatic token refresh before expiry
 * - JWT validation
 * - Event-based token change notifications
 * - Configurable via environment variables
 * - Thread-safe refresh with request queuing
 *
 * Usage:
 * ```typescript
 * const tokenManager = TokenManager.getInstance();
 * const token = await tokenManager.getValidToken();
 * ```
 */
export class TokenManager {
  private static instance: TokenManager;
  private storage: StorageService;
  private config: TokenManagerConfig;
  private refreshCallback?: TokenRefreshCallback;
  private refreshPromise?: Promise<string | null>;
  private tokenChangeListeners: Set<(token: string | null) => void> = new Set();

  private constructor() {
    this.storage = new StorageService();
    this.config = this.loadConfig();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  /**
   * Load configuration from environment variables
   */
  private loadConfig(): TokenManagerConfig {
    return {
      autoRefresh: process.env.REACT_APP_AUTH_AUTO_REFRESH !== 'false',
      refreshThreshold: parseInt(
        process.env.REACT_APP_AUTH_REFRESH_THRESHOLD || '300000'
      ),
      expiryBuffer: parseInt(
        process.env.REACT_APP_AUTH_TOKEN_EXPIRY_BUFFER || '60000'
      ),
      maxRetryAttempts: parseInt(
        process.env.REACT_APP_AUTH_MAX_RETRY_ATTEMPTS || '1'
      ),
      enableValidation: process.env.REACT_APP_AUTH_ENABLE_TOKEN_VALIDATION !== 'false',
    };
  }

  /**
   * Update configuration (useful for testing or runtime changes)
   */
  public updateConfig(config: Partial<TokenManagerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  public getConfig(): Readonly<TokenManagerConfig> {
    return { ...this.config };
  }

  /**
   * Set refresh callback function
   * This function will be called when token needs to be refreshed
   */
  public setRefreshCallback(callback: TokenRefreshCallback): void {
    this.refreshCallback = callback;
  }

  /**
   * Register token change listener
   */
  public onTokenChange(callback: (token: string | null) => void): () => void {
    this.tokenChangeListeners.add(callback);
    // Return unsubscribe function
    return () => {
      this.tokenChangeListeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of token change
   */
  private notifyTokenChange(token: string | null): void {
    this.tokenChangeListeners.forEach(listener => {
      try {
        listener(token);
      } catch (error) {
        console.error('Error in token change listener:', error);
      }
    });
  }

  /**
   * Get current access token from storage
   */
  public getToken(): string | null {
    return this.storage.getToken();
  }

  /**
   * Get current refresh token from storage
   */
  public getRefreshToken(): string | null {
    return this.storage.getRefreshToken();
  }

  /**
   * Set access token
   */
  public setToken(token: string | null): void {
    if (token) {
      this.storage.setToken(token);
    } else {
      this.storage.clearTokens();
    }
    this.notifyTokenChange(token);
  }

  /**
   * Set refresh token
   */
  public setRefreshToken(refreshToken: string): void {
    this.storage.setRefreshToken(refreshToken);
  }

  /**
   * Set both tokens
   */
  public setTokens(token: string, refreshToken?: string): void {
    this.storage.setToken(token);
    if (refreshToken) {
      this.storage.setRefreshToken(refreshToken);
    }
    this.notifyTokenChange(token);
  }

  /**
   * Clear all tokens
   */
  public clearTokens(): void {
    this.storage.clearTokens();
    this.notifyTokenChange(null);
  }

  /**
   * Decode JWT token without verification
   */
  public decodeToken(token: string): TokenPayload | null {
    try {
      return jwtDecode<TokenPayload>(token);
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  public isTokenExpired(token: string): boolean {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true;
    }

    const now = Date.now();
    const expiry = decoded.exp * 1000; // Convert to milliseconds
    const expiryWithBuffer = expiry - this.config.expiryBuffer;

    return now >= expiryWithBuffer;
  }

  /**
   * Check if token will expire soon (within refresh threshold)
   */
  public willExpireSoon(token: string): boolean {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true;
    }

    const now = Date.now();
    const expiry = decoded.exp * 1000;
    const timeUntilExpiry = expiry - now;

    return timeUntilExpiry <= this.config.refreshThreshold;
  }

  /**
   * Get token expiry time in milliseconds
   */
  public getTokenExpiry(token: string): number | null {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) {
      return null;
    }
    return decoded.exp * 1000;
  }

  /**
   * Validate token (checks if exists and not expired)
   */
  public validateToken(token: string | null): boolean {
    if (!token) {
      return false;
    }

    if (!this.config.enableValidation) {
      return true; // Skip validation if disabled
    }

    return !this.isTokenExpired(token);
  }

  /**
   * Get valid token (returns null if expired or invalid)
   */
  public async getValidToken(): Promise<string | null> {
    const token = this.getToken();

    if (!token) {
      return null;
    }

    // If validation is disabled, return token as-is
    if (!this.config.enableValidation) {
      return token;
    }

    // Check if token is expired
    if (this.isTokenExpired(token)) {
      // Try to refresh if auto-refresh is enabled
      if (this.config.autoRefresh) {
        return await this.refreshTokenIfNeeded();
      }
      return null;
    }

    // Check if token will expire soon and auto-refresh is enabled
    if (this.config.autoRefresh && this.willExpireSoon(token)) {
      // Refresh in background, but return current token
      this.refreshTokenIfNeeded().catch(error => {
        console.error('Background token refresh failed:', error);
      });
    }

    return token;
  }

  /**
   * Refresh token if needed (with deduplication)
   * Ensures only one refresh is in progress at a time
   */
  public async refreshTokenIfNeeded(): Promise<string | null> {
    // If refresh is already in progress, return the same promise
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const currentToken = this.getToken();

    // If no token or token is still valid and not expiring soon, return it
    if (currentToken && !this.isTokenExpired(currentToken) && !this.willExpireSoon(currentToken)) {
      return currentToken;
    }

    // Check if refresh callback is set
    if (!this.refreshCallback) {
      console.error('Token refresh callback not set');
      return null;
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      console.error('No refresh token available');
      return null;
    }

    // Start refresh process
    this.refreshPromise = this.performTokenRefresh(refreshToken)
      .finally(() => {
        this.refreshPromise = undefined;
      });

    return this.refreshPromise;
  }

  /**
   * Perform actual token refresh
   */
  private async performTokenRefresh(refreshToken: string): Promise<string | null> {
    try {
      const result = await this.refreshCallback!(refreshToken);

      // Update tokens
      this.setTokens(result.token, result.refreshToken);

      console.log('Token refreshed successfully');
      return result.token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Clear tokens on refresh failure
      this.clearTokens();
      return null;
    }
  }

  /**
   * Force token refresh (ignores validation)
   */
  public async forceRefresh(): Promise<string | null> {
    this.refreshPromise = undefined; // Clear any existing refresh promise
    return await this.refreshTokenIfNeeded();
  }

  /**
   * Check if user is authenticated (has valid token)
   */
  public isAuthenticated(): boolean {
    const token = this.getToken();
    return this.validateToken(token);
  }

  /**
   * Get token payload
   */
  public getTokenPayload(): TokenPayload | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }
    return this.decodeToken(token);
  }

  /**
   * Get user ID from token
   */
  public getUserId(): string | null {
    const payload = this.getTokenPayload();
    return payload?.sub || null;
  }

  /**
   * Debug: Get token info
   */
  public getTokenInfo(): {
    hasToken: boolean;
    hasRefreshToken: boolean;
    isExpired: boolean;
    expiresIn: number | null;
    payload: TokenPayload | null;
  } {
    const token = this.getToken();
    const refreshToken = this.getRefreshToken();

    if (!token) {
      return {
        hasToken: false,
        hasRefreshToken: !!refreshToken,
        isExpired: true,
        expiresIn: null,
        payload: null,
      };
    }

    const payload = this.decodeToken(token);
    const isExpired = this.isTokenExpired(token);
    const expiry = this.getTokenExpiry(token);
    const expiresIn = expiry ? expiry - Date.now() : null;

    return {
      hasToken: true,
      hasRefreshToken: !!refreshToken,
      isExpired,
      expiresIn,
      payload,
    };
  }
}

// Export singleton instance for convenience
export const tokenManager = TokenManager.getInstance();
