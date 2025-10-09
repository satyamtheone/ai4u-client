import { AI4UConfig } from "../types";
export class ConfigManager {
  private static readonly CONFIG_KEY = "ai4u_config";

  public static getConfig(): AI4UConfig {
    const stored = localStorage.getItem(this.CONFIG_KEY);
    const defaultConfig: AI4UConfig = {
      backendUrl: "http://localhost:8000",
      timeout: 30000,
    };

    if (stored) {
      try {
        return { ...defaultConfig, ...JSON.parse(stored) };
      } catch (error) {
        console.error("Failed to parse stored config:", error);
        return defaultConfig;
      }
    }

    return defaultConfig;
  }

  public static async updateBackendUrl(url: string): Promise<void> {
    const config = this.getConfig();
    config.backendUrl = url;
    localStorage.setItem(this.CONFIG_KEY, JSON.stringify(config));

    // Dispatch custom event for config changes
    window.dispatchEvent(
      new CustomEvent("ai4u_config_changed", { detail: config })
    );
  }

  public static updateConfig(newConfig: Partial<AI4UConfig>): void {
    const config = { ...this.getConfig(), ...newConfig };
    localStorage.setItem(this.CONFIG_KEY, JSON.stringify(config));
    window.dispatchEvent(
      new CustomEvent("ai4u_config_changed", { detail: config })
    );
  }

  public static validateConfig(config: AI4UConfig): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!config.backendUrl) {
      errors.push("Backend URL is required");
    }

    if (config.backendUrl && !this.isValidUrl(config.backendUrl)) {
      errors.push("Backend URL is not valid");
    }

    if (config.timeout < 1000) {
      errors.push("Timeout must be at least 1000ms");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}
