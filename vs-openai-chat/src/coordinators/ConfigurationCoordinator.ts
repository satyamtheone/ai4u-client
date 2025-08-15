// src/coordinators/ConfigurationCoordinator.ts
import * as vscode from 'vscode';
import { AI4UConfig } from '../services/ConfigManager';
import { ServiceCoordinator } from './ServiceCoordinator';
import { ModeCoordinator } from './ModeCoordinator';
import { LOGGER } from '../logger';

/**
 * ConfigurationCoordinator handles all configuration-related logic
 * Preserves original configuration management functionality
 */
export class ConfigurationCoordinator {
    private configDisposable?: vscode.Disposable;
    private currentConfig!: AI4UConfig; // Use definite assignment assertion

    constructor(
        private services: ServiceCoordinator,
        private modeCoordinator: ModeCoordinator
    ) {
        this.loadConfiguration();
        this.setupConfigurationWatcher();
    }

    /**
     * Load configuration with the same logic as original
     */
    private loadConfiguration() {
        try {
            this.currentConfig = this.services.configManager.getConfig();
            if (!this.currentConfig.backendUrl) {
                this.currentConfig.backendUrl = 'http://localhost:8000';
            }
            this.services.initializeBackendService(this.currentConfig);
            LOGGER(`AI4U ConfigurationCoordinator: Config loaded - Backend URL: ${this.currentConfig.backendUrl}`);
        } catch (error) {
            LOGGER(`AI4U ConfigurationCoordinator: Error loading config: ${error}`, 'ERROR');
            // Fallback configuration
            this.currentConfig = { backendUrl: 'http://localhost:8000', timeout: 300 };
            this.services.initializeBackendService(this.currentConfig);
        }
    }

    /**
     * Setup configuration watcher - preserving original logic exactly
     */
    private setupConfigurationWatcher() {
        try {
            this.configDisposable = this.services.configManager.onConfigurationChanged((config) => {
                LOGGER(`AI4U Configuration changed: ${JSON.stringify(config)}`);
                this.currentConfig = config;
                
                // Update services with new configuration
                this.services.updateServices(config);
                
                // Re-initialize services based on new config
                this.modeCoordinator.initializeServices(this.currentConfig);
            });
        } catch (error) {
            LOGGER(`Failed to setup configuration watcher: ${error}`, 'ERROR');
        }
    }

    /**
     * Get current configuration - preserving original method signature
     */
    public getCurrentConfig(): AI4UConfig {
        return { ...this.currentConfig };
    }

    /**
     * Validate configuration
     */
    public validateConfig(config: AI4UConfig) {
        return this.services.configManager.validateConfig(config);
    }

    /**
     * Get OpenAI API key
     */
    public getOpenAIApiKey(): string | undefined {
        return this.services.configManager.getOpenAIApiKey();
    }

    /**
     * Handle connection test
     */
    public async handleTestConnection() {
        if (!this.currentConfig.backendUrl) {
            this.services.uiManager.updateConnectionStatus('error', 'Backend URL not configured');
            return;
        }

        this.services.uiManager.updateConnectionStatus('disconnected', 'Testing connection...');
        
        const result = await this.services.backendService.testConnection();
        this.services.uiManager.updateConnectionStatus(
            result.connected ? 'connected' : 'error',
            result.message
        );
    }

    /**
     * Cleanup resources
     */
    public dispose() {
        if (this.configDisposable) {
            this.configDisposable.dispose();
        }
        LOGGER('AI4U ConfigurationCoordinator disposed');
    }
}