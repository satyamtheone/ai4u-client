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
        await this.initializeBackendMode(config);
    }

    /**
     * Initialize backend mode - preserving original logic exactly
     */
    private async initializeBackendMode(config: AI4UConfig) {
        if (!config.backendUrl) {
            throw new Error('Backend URL is required');
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
            throw new Error('Backend connection failed');
        }
    }
}