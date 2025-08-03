// src/coordinators/ModeCoordinator.ts
import * as vscode from 'vscode';
import { AI4UConfig } from '../services/ConfigManager';
import { ServiceCoordinator } from './ServiceCoordinator';
import { LOGGER } from '../logger';

/**
 * ModeCoordinator handles backend/local mode switching
 * Preserves all original mode switching logic
 */
export class ModeCoordinator {
    constructor(private services: ServiceCoordinator) {}

    /**
     * Initialize services based on configuration - preserving original logic
     */
    public async initializeServices(config: AI4UConfig) {
        if (config.useBackend && config.backendUrl) {
            await this.initializeBackendMode(config);
        } else {
            await this.initializeLocalMode();
        }
    }

    /**
     * Initialize local mode - exactly as in original
     */
    private async initializeLocalMode() {
        this.services.uiManager.updateMode('local', 'Local mode active');
        
        // Try to initialize OpenAI with saved API key (preserving original logic)
        const apiKey = this.services.configManager.getOpenAIApiKey();
        if (apiKey) {
            const success = this.services.openaiService.initialize(apiKey);
            const status = this.services.openaiService.getStatus();
            this.services.uiManager.updateApiKeyStatus(
                success ? 'connected' : 'error',
                status.message
            );
        } else {
            this.services.uiManager.updateApiKeyStatus('disconnected', 'API Key not set');
        }
    }

    /**
     * Initialize backend mode - preserving original logic exactly
     */
    private async initializeBackendMode(config: AI4UConfig) {
        if (!config.backendUrl) {
            await this.fallbackToLocalMode('Backend URL not configured');
            return;
        }

        this.services.uiManager.updateMode('backend', 'Testing backend connection...');
        
        const connectionResult = await this.services.backendService.testConnection();
        this.services.uiManager.updateConnectionStatus(
            connectionResult.connected ? 'connected' : 'error',
            connectionResult.message
        );
        
        if (connectionResult.connected) {
            // Check backend capabilities (preserving original logic)
            const capabilities = await this.services.backendService.getCapabilities();
            if (capabilities) {
                const supportsLearningGates = capabilities.features.includes('learning_gates');
                LOGGER(`AI4U Backend capabilities: ${capabilities.features.join(', ')}`);
                
                // Enable backend learning gates if supported and configured
                const useBackendLearningGates = vscode.workspace.getConfiguration('ai4u').get('learningGates.useBackend', false);
                if (supportsLearningGates && useBackendLearningGates) {
                    this.services.backendService.setLearningGatesEnabled(true);
                    LOGGER('AI4U Backend learning gates enabled');
                }
            }
        } else {
            // Fallback to local mode if backend fails
            await this.fallbackToLocalMode('Backend connection failed');
        }
    }

    /**
     * Fallback to local mode - preserving original logic
     */
    private async fallbackToLocalMode(reason: string) {
        LOGGER(`AI4U Falling back to local mode: ${reason}`);
        
        // Update configuration
        await this.services.configManager.updateUseBackend(false);
        
        // Initialize local mode
        await this.initializeLocalMode();
        
        this.services.uiManager.updateMode('local', `Switched to local mode: ${reason}`);
    }

    /**
     * Check if should use backend for learning gates
     */
    public shouldUseBackendLearningGates(config: AI4UConfig): boolean {
        return config.useBackend && 
               this.services.backendService?.isReady() && 
               this.services.backendService?.isLearningGatesEnabled();
    }

    /**
     * Get current mode
     */
    public getCurrentMode(config: AI4UConfig): 'local' | 'backend' {
        return config.useBackend ? 'backend' : 'local';
    }
}