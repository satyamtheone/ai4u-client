// src/coordinators/ServiceCoordinator.ts
import * as vscode from 'vscode';
import { OpenAIService } from '../services/OpenAIService';
import { BackendService } from '../services/BackendService';
import { ConfigManager, AI4UConfig } from '../services/ConfigManager';
import { UIManager } from '../services/ui/UIManager';
import { UserMessageHandler } from '../handlers/UserMessageHandler';
import { LearningGateService, LearningGateConfig } from '../services/learning/LearningGateService';
import { LOGGER } from '../logger';

/**
 * ServiceCoordinator manages all service instances and their lifecycle
 * Keeps existing functionality intact while providing centralized service management
 */
export class ServiceCoordinator {
    public openaiService!: OpenAIService;
    public backendService!: BackendService; // Use definite assignment assertion
    public uiManager!: UIManager;
    public configManager = ConfigManager; // Keep as-is to maintain compatibility
    public learningGateService!: LearningGateService;
    public userMessageHandler = UserMessageHandler;

    constructor(extensionUri: vscode.Uri) {
        this.initializeServices(extensionUri);
    }

    /**
     * Initialize all services with the same logic as original ChatViewProvider
     */
    private initializeServices(extensionUri: vscode.Uri) {
        LOGGER('AI4U ServiceCoordinator: Initializing services');
        
        // Initialize UI Manager
        this.uiManager = new UIManager(extensionUri);
        
        // Initialize OpenAI Service
        this.openaiService = new OpenAIService();
        
        // Initialize Learning Gate Service with hardcoded config (preserving original logic)
        const gateConfig: LearningGateConfig = {
            enabled: true,
            questionsPerGate: 3,
            gateFrequency: 1,
            difficulty: 'mixed',
            topics: ['JavaScript', 'TypeScript', 'Python']
        };
        this.learningGateService = new LearningGateService(gateConfig);
        
        LOGGER('AI4U ServiceCoordinator: Core services initialized');
    }

    /**
     * Initialize backend service with configuration
     * Called when configuration is loaded
     */
    public initializeBackendService(config: AI4UConfig) {
        this.backendService = new BackendService(config.backendUrl || undefined);
        
        // Set backend learning gates based on config (preserving original logic)
        const backendLearningGates = vscode.workspace.getConfiguration('ai4u').get('learningGates.useBackend', false);
        this.backendService.setLearningGatesEnabled(backendLearningGates);
        
        LOGGER('AI4U ServiceCoordinator: Backend service initialized');
    }

    /**
     * Get status of all services - preserving original functionality
     */
    public getServiceStatus() {
        return {
            openai: { connected: false, message: 'Not used in backend mode' },
            backend: this.backendService?.getStatus() || { connected: false, message: 'Not initialized' },
            mode: 'backend',
            learningGates: {
                enabled: this.learningGateService.getConfig().enabled,
                stats: this.learningGateService.getStats(),
                config: this.learningGateService.getConfig(),
                backendLearningGates: this.backendService?.isLearningGatesEnabled() || false
            }
        };
    }

    /**
     * Update service configurations
     */
    public updateServices(config: AI4UConfig) {
        if (config.backendUrl && this.backendService) {
            this.backendService.setBackendUrl(config.backendUrl);
        }
    }

    /**
     * Set webview for UI manager
     */
    public setWebviewView(webviewView: vscode.WebviewView) {
        this.uiManager.setWebviewView(webviewView);
    }

    /**
     * Get learning gate status - preserving original method signature
     */
    public getLearningGateStatus(): {
        enabled: boolean;
        stats: any;
        config: any;
        backend: boolean;
        backendLearningGates: boolean;
    } {
        return {
            enabled: this.learningGateService.getConfig().enabled,
            stats: this.learningGateService.getStats(),
            config: this.learningGateService.getConfig(),
            backend: this.backendService?.isReady() || false,
            backendLearningGates: this.backendService?.isLearningGatesEnabled() || false
        };
    }

    /**
     * Get backend stats if available
     */
    public async getBackendStats(): Promise<any | null> {
        if (this.backendService?.isReady()) {
            return await this.backendService.getUserStats();
        }
        return null;
    }

    /**
     * Force backend connection test
     */
    public async forceBackendConnection(): Promise<boolean> {
        if (!this.backendService) {
            return false;
        }
        const result = await this.backendService.testConnection();
        return result.connected;
    }

    public async disconnectBackend() {
        if (this.backendService) {
            await this.backendService.testConnection();
        }
    }

    public initializeBackendServices(config: AI4UConfig): void {
        LOGGER('ServiceCoordinator: Initializing backend services only');
        
        if (config.backendUrl) {
            this.backendService = new BackendService(config.backendUrl);
            LOGGER(`Backend service initialized with URL: ${config.backendUrl}`);
        } else {
            LOGGER('Backend URL not configured');
        }
    }
    /**
     * Reset learning progress
     */
    public resetLearningProgress() {
        this.learningGateService.resetProgress();
        this.uiManager.showNotification('info', 'Learning progress reset');
    }
}