import * as vscode from 'vscode';

export interface AI4UConfig {
    backendUrl?: string;
    timeout: number;
}

export class ConfigManager {
    private static readonly CONFIG_SECTION = 'ai4u';
    
    public static getConfig(): AI4UConfig {
        const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
        
        return {
            backendUrl: config.get<string>('backendUrl'),
            timeout: config.get<number>('timeout', 30000)
        };
    }

    public static async updateUseBackend(useBackend: boolean): Promise<void> {
        const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
        await config.update('useBackend', useBackend, vscode.ConfigurationTarget.Global);
    }

    public static async updateBackendUrl(url: string): Promise<void> {
        const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
        await config.update('backendUrl', url, vscode.ConfigurationTarget.Global);
    }

    public static getOpenAIApiKey(): string | undefined {
        // Try environment variable first
        const envKey = process.env.OPENAI_API_KEY;
        if (envKey) {
            return envKey;
        }

        // Could also check VS Code settings if needed
        const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
        return config.get<string>('openaiApiKey');
    }

    public static onConfigurationChanged(callback: (config: AI4UConfig) => void): vscode.Disposable {
        return vscode.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration(this.CONFIG_SECTION)) {
                callback(this.getConfig());
            }
        });
    }

    public static validateConfig(config: AI4UConfig): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!config.backendUrl) {
            errors.push('Backend URL is required when backend mode is enabled');
        }

        if (config.backendUrl && !this.isValidUrl(config.backendUrl)) {
            errors.push('Backend URL is not valid');
        }

        if (config.timeout < 1000) {
            errors.push('Timeout must be at least 1000ms');
        }

        return {
            valid: errors.length === 0,
            errors
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