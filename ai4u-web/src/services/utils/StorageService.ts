// Storage Service for managing local/session storage
export class StorageService {
  private tokenKey = 'authToken';
  private refreshTokenKey = 'refreshToken';
  private userKey = 'userData';
  private preferencesKey = 'userPreferences';
  private cachePrefix = 'api_cache_';

  // Token management
  setToken(token: string): void {
    try {
      localStorage.setItem(this.tokenKey, token);
    } catch (error) {
      console.error('Failed to save token:', error);
    }
  }

  getToken(): string | null {
    try {
      return localStorage.getItem(this.tokenKey);
    } catch (error) {
      console.error('Failed to get token:', error);
      return null;
    }
  }

  setRefreshToken(token: string): void {
    try {
      localStorage.setItem(this.refreshTokenKey, token);
    } catch (error) {
      console.error('Failed to save refresh token:', error);
    }
  }

  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(this.refreshTokenKey);
    } catch (error) {
      console.error('Failed to get refresh token:', error);
      return null;
    }
  }

  clearTokens(): void {
    try {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.refreshTokenKey);
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }

  // User data management
  setUser(user: any): void {
    try {
      localStorage.setItem(this.userKey, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to save user data:', error);
    }
  }

  getUser(): any | null {
    try {
      const userData = localStorage.getItem(this.userKey);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Failed to get user data:', error);
      return null;
    }
  }

  clearUser(): void {
    try {
      localStorage.removeItem(this.userKey);
    } catch (error) {
      console.error('Failed to clear user data:', error);
    }
  }

  // User preferences management
  setPreferences(preferences: any): void {
    try {
      localStorage.setItem(this.preferencesKey, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  }

  getPreferences(): any | null {
    try {
      const preferences = localStorage.getItem(this.preferencesKey);
      return preferences ? JSON.parse(preferences) : null;
    } catch (error) {
      console.error('Failed to get preferences:', error);
      return null;
    }
  }

  updatePreferences(updates: any): void {
    try {
      const currentPreferences = this.getPreferences() || {};
      const updatedPreferences = { ...currentPreferences, ...updates };
      this.setPreferences(updatedPreferences);
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  }

  // Session storage methods
  setSessionData(key: string, data: any): void {
    try {
      sessionStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Failed to save session data for key ${key}:`, error);
    }
  }

  getSessionData(key: string): any | null {
    try {
      const data = sessionStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Failed to get session data for key ${key}:`, error);
      return null;
    }
  }

  clearSessionData(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to clear session data for key ${key}:`, error);
    }
  }

  // Cache management
  setCache(key: string, data: any, ttl?: number): void {
    try {
      const cacheKey = this.cachePrefix + key;
      const cacheData = {
        data,
        timestamp: Date.now(),
        ttl: ttl || 300000, // Default 5 minutes
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error(`Failed to save cache for key ${key}:`, error);
    }
  }

  getCache(key: string): any | null {
    try {
      const cacheKey = this.cachePrefix + key;
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      const now = Date.now();
      
      // Check if cache has expired
      if (now - cacheData.timestamp > cacheData.ttl) {
        this.clearCache(key);
        return null;
      }

      return cacheData.data;
    } catch (error) {
      console.error(`Failed to get cache for key ${key}:`, error);
      return null;
    }
  }

  clearCache(key: string): void {
    try {
      const cacheKey = this.cachePrefix + key;
      localStorage.removeItem(cacheKey);
    } catch (error) {
      console.error(`Failed to clear cache for key ${key}:`, error);
    }
  }

  clearAllCache(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.cachePrefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Failed to clear all cache:', error);
    }
  }

  // Generic storage methods
  setItem(key: string, value: any, useSessionStorage = false): void {
    try {
      const storage = useSessionStorage ? sessionStorage : localStorage;
      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
      storage.setItem(key, serializedValue);
    } catch (error) {
      console.error(`Failed to save item for key ${key}:`, error);
    }
  }

  getItem(key: string, useSessionStorage = false): any | null {
    try {
      const storage = useSessionStorage ? sessionStorage : localStorage;
      const value = storage.getItem(key);
      
      if (!value) return null;

      // Try to parse as JSON, fall back to string
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      console.error(`Failed to get item for key ${key}:`, error);
      return null;
    }
  }

  removeItem(key: string, useSessionStorage = false): void {
    try {
      const storage = useSessionStorage ? sessionStorage : localStorage;
      storage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove item for key ${key}:`, error);
    }
  }

  // Clear all data
  clearAll(): void {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (error) {
      console.error('Failed to clear all storage:', error);
    }
  }

  clearAuthData(): void {
    this.clearTokens();
    this.clearUser();
  }

  // Storage utilities
  isStorageAvailable(type: 'localStorage' | 'sessionStorage' = 'localStorage'): boolean {
    try {
      const storage = window[type];
      const testKey = '__storage_test__';
      storage.setItem(testKey, 'test');
      storage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  getStorageSize(type: 'localStorage' | 'sessionStorage' = 'localStorage'): number {
    try {
      const storage = window[type];
      let totalSize = 0;
      
      for (let key in storage) {
        if (storage.hasOwnProperty(key)) {
          totalSize += storage[key].length + key.length;
        }
      }
      
      return totalSize;
    } catch (error) {
      console.error('Failed to calculate storage size:', error);
      return 0;
    }
  }

  // Migration helpers
  migrateData(oldKey: string, newKey: string): void {
    try {
      const data = localStorage.getItem(oldKey);
      if (data) {
        localStorage.setItem(newKey, data);
        localStorage.removeItem(oldKey);
      }
    } catch (error) {
      console.error(`Failed to migrate data from ${oldKey} to ${newKey}:`, error);
    }
  }

  // Backup and restore
  exportData(): string {
    try {
      const data: Record<string, any> = {};
      
      // Export localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          data[key] = localStorage.getItem(key);
        }
      }
      
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Failed to export data:', error);
      return '{}';
    }
  }

  importData(dataString: string, overwrite = false): boolean {
    try {
      const data = JSON.parse(dataString);
      
      Object.entries(data).forEach(([key, value]) => {
        if (overwrite || !localStorage.getItem(key)) {
          localStorage.setItem(key, value as string);
        }
      });
      
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }

  // Event listeners for storage changes
  onStorageChange(callback: (e: StorageEvent) => void): () => void {
    const handleStorageChange = (e: StorageEvent) => {
      callback(e);
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Return cleanup function
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }
}