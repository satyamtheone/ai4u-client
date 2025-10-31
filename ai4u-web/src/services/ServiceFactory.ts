import { AuthService } from './api/AuthService';
import { LearningService } from './api/LearningService';
import { UserService } from './api/UserService';
import { OrganizationService } from './api/OrganizationService';
import { BackendService } from './BackendService';
import { LearningGateService } from './LearningGateService';
import { StorageService } from './utils/StorageService';
import { tokenManager } from './auth/TokenManager';

/**
 * ServiceFactory - Centralized service instance management
 *
 * Features:
 * - Singleton pattern for all services
 * - Ensures consistent token state across services
 * - Lazy initialization
 * - Easy testing and mocking
 * - Prevents service instance desync issues
 *
 * Usage:
 * ```typescript
 * const authService = ServiceFactory.getAuthService();
 * const userService = ServiceFactory.getUserService();
 * ```
 *
 * For testing:
 * ```typescript
 * ServiceFactory.reset(); // Clear all instances
 * ```
 */
export class ServiceFactory {
  // Service instances
  private static authService?: AuthService;
  private static learningService?: LearningService;
  private static userService?: UserService;
  private static organizationService?: OrganizationService;
  private static backendService?: BackendService;
  private static learningGateService?: LearningGateService;
  private static storageService?: StorageService;

  /**
   * Get AuthService singleton
   */
  public static getAuthService(): AuthService {
    if (!this.authService) {
      this.authService = new AuthService();
      this.initializeAuthService(this.authService);
    }
    return this.authService;
  }

  /**
   * Get LearningService singleton
   */
  public static getLearningService(): LearningService {
    if (!this.learningService) {
      this.learningService = new LearningService();
    }
    return this.learningService;
  }

  /**
   * Get UserService singleton
   */
  public static getUserService(): UserService {
    if (!this.userService) {
      this.userService = new UserService();
    }
    return this.userService;
  }

  /**
   * Get OrganizationService singleton
   */
  public static getOrganizationService(): OrganizationService {
    if (!this.organizationService) {
      this.organizationService = new OrganizationService();
    }
    return this.organizationService;
  }

  /**
   * Get BackendService singleton
   */
  public static getBackendService(): BackendService {
    if (!this.backendService) {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      this.backendService = new BackendService(backendUrl);
      this.initializeBackendService(this.backendService);
    }
    return this.backendService;
  }

  /**
   * Get LearningGateService singleton
   */
  public static getLearningGateService(): LearningGateService {
    if (!this.learningGateService) {
      const enabled = process.env.REACT_APP_FEATURE_LEARNING_GATES === 'true';
      // Provide default config values
      this.learningGateService = new LearningGateService({
        enabled,
        questionsPerGate: 3,
        gateFrequency: 5,
        difficulty: 'mixed',
        topics: []
      });
    }
    return this.learningGateService;
  }

  /**
   * Get StorageService singleton
   */
  public static getStorageService(): StorageService {
    if (!this.storageService) {
      this.storageService = new StorageService();
    }
    return this.storageService;
  }

  /**
   * Initialize AuthService with token refresh callback
   */
  private static initializeAuthService(authService: AuthService): void {
    // Set up token refresh callback
    tokenManager.setRefreshCallback(async (refreshToken: string) => {
      const response = await authService.refreshToken(refreshToken);
      return {
        token: response.access_token,
        refreshToken: response.refreshToken,
      };
    });

    // Sync current token with AuthService
    const currentToken = tokenManager.getToken();
    if (currentToken) {
      authService.setToken(currentToken);
    }

    // Listen for token changes and sync with AuthService
    tokenManager.onTokenChange((token) => {
      authService.setToken(token);
    });
  }

  /**
   * Initialize BackendService with current token
   */
  private static initializeBackendService(backendService: BackendService): void {
    const currentToken = tokenManager.getToken();
    if (currentToken) {
      backendService.setToken(currentToken);
    }

    // Listen for token changes and sync with BackendService
    tokenManager.onTokenChange((token) => {
      backendService.setToken(token);
    });
  }

  /**
   * Update configuration for all services
   * Useful when backend URL or other settings change
   */
  public static updateConfig(config: {
    backendUrl?: string;
    learningGatesEnabled?: boolean;
  }): void {
    if (config.backendUrl && this.backendService) {
      this.backendService.setBackendUrl(config.backendUrl);
    }

    if (config.learningGatesEnabled !== undefined) {
      if (this.backendService) {
        this.backendService.setLearningGatesEnabled(config.learningGatesEnabled);
      }
      if (this.learningGateService) {
        // Get current config and update only the enabled flag
        const currentConfig = this.learningGateService.getConfig();
        this.learningGateService.updateConfig({ ...currentConfig, enabled: config.learningGatesEnabled });
      }
    }
  }

  /**
   * Reset all service instances
   * Useful for testing or when you need to reinitialize everything
   */
  public static reset(): void {
    this.authService = undefined;
    this.learningService = undefined;
    this.userService = undefined;
    this.organizationService = undefined;
    this.backendService = undefined;
    this.learningGateService = undefined;
    this.storageService = undefined;
  }

  /**
   * Get all service instances (for debugging)
   */
  public static getAllServices() {
    return {
      authService: this.authService,
      learningService: this.learningService,
      userService: this.userService,
      organizationService: this.organizationService,
      backendService: this.backendService,
      learningGateService: this.learningGateService,
      storageService: this.storageService,
    };
  }

  /**
   * Check if services are initialized
   */
  public static getInitializationStatus() {
    return {
      authService: !!this.authService,
      learningService: !!this.learningService,
      userService: !!this.userService,
      organizationService: !!this.organizationService,
      backendService: !!this.backendService,
      learningGateService: !!this.learningGateService,
      storageService: !!this.storageService,
    };
  }
}

// Export convenience functions for easier access
export const getAuthService = () => ServiceFactory.getAuthService();
export const getLearningService = () => ServiceFactory.getLearningService();
export const getUserService = () => ServiceFactory.getUserService();
export const getOrganizationService = () => ServiceFactory.getOrganizationService();
export const getBackendService = () => ServiceFactory.getBackendService();
export const getLearningGateService = () => ServiceFactory.getLearningGateService();
export const getStorageService = () => ServiceFactory.getStorageService();
