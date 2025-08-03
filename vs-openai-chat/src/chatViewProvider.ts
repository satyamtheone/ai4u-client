import * as vscode from 'vscode';
import { OpenAIService } from './services/OpenAIService';
import { BackendService } from './services/BackendService';
import { ConfigManager, AI4UConfig } from './services/ConfigManager';
import { UIManager, WebviewMessage } from './services/ui/UIManager';
import { LearningGateService, LearningGateConfig } from './services/learning/LearningGateService';
import { LOGGER } from './logger';


export class ChatViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'ai4uChatView';
    private _view?: vscode.WebviewView;
    
    // Service instances
    private openaiService: OpenAIService;
    private backendService: BackendService;
    private uiManager: UIManager;
    private configManager = ConfigManager;
    private learningGateService: LearningGateService;
    
    // Current state
    private currentConfig: AI4UConfig;
    private configDisposable?: vscode.Disposable;

    constructor(private readonly _extensionUri: vscode.Uri) {
    LOGGER('AI4U ChatViewProvider constructor called');
    
    // Initialize services
    this.uiManager = new UIManager(_extensionUri);
    this.openaiService = new OpenAIService();
    
    const gateConfig: LearningGateConfig = {
        enabled: true,
        questionsPerGate: 3,
        gateFrequency: 1,
        difficulty: 'mixed',
        topics: ['JavaScript', 'TypeScript', 'Python']
    };    
    this.learningGateService = new LearningGateService(gateConfig);

    // Load configuration
    this.currentConfig = this.configManager.getConfig();
    this.backendService = new BackendService(this.currentConfig.backendUrl || undefined);
    
    // NEW: Set backend learning gates based on config
    const backendLearningGates = vscode.workspace.getConfiguration('ai4u').get('learningGates.useBackend', false);
    this.backendService.setLearningGatesEnabled(backendLearningGates);
    
    // Listen for configuration changes
    this.setupConfigurationWatcher();
    LOGGER(`AI4U Services initialized - Mode: ${this.currentConfig.useBackend ? 'backend' : 'local'}`);
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;
        LOGGER(`AI4U resolveWebviewView called for view ${!!this._view}`);
        this.uiManager.setWebviewView(webviewView);

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        LOGGER('AI4U Chat view provider created');
        webviewView.webview.html = this.uiManager.getHtmlContent();
        LOGGER('📄 HTML content set')

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(async (data: WebviewMessage) => {
            LOGGER(`AI4U Webview message received: ${JSON.stringify(data)}`);
            await this.handleWebviewMessage(data);
        });

        // Initialize based on current configuration
        this.initializeServices();
    }

    private setupConfigurationWatcher() {
        try {
            this.configDisposable = this.configManager.onConfigurationChanged((config) => {
                LOGGER(`AI4U Configuration changed: ${JSON.stringify(config)}`);
                this.currentConfig = config;
                
                if (config.backendUrl) {
                    this.backendService.setBackendUrl(config.backendUrl);
                }
                
                this.initializeServices();
            });
        } catch (error) {
                LOGGER(`Failed to setup configuration watcher: ${error}`, 'ERROR');
            }
        }

    private async initializeServices() {
        if (this.currentConfig.useBackend && this.currentConfig.backendUrl) {
            await this.initializeBackendMode();
        } else {
            await this.initializeLocalMode();
        }
    }

    private async initializeLocalMode() {
        this.uiManager.updateMode('local', 'Local mode active');
        
        // Try to initialize OpenAI with saved API key
        const apiKey = this.configManager.getOpenAIApiKey();
        if (apiKey) {
            const success = this.openaiService.initialize(apiKey);
            const status = this.openaiService.getStatus();
            this.uiManager.updateApiKeyStatus(
                success ? 'connected' : 'error',
                status.message
            );
        } else {
            this.uiManager.updateApiKeyStatus('disconnected', 'API Key not set');
        }
    }

    private async initializeBackendMode() {
        if (!this.currentConfig.backendUrl) {
            await this.fallbackToLocalMode('Backend URL not configured');
            return;
        }

        this.uiManager.updateMode('backend', 'Testing backend connection...');
        
        const connectionResult = await this.backendService.testConnection();
        this.uiManager.updateConnectionStatus(
            connectionResult.connected ? 'connected' : 'error',
            connectionResult.message
        );
        
        if (connectionResult.connected) {
            // NEW: Check backend capabilities
            const capabilities = await this.backendService.getCapabilities();
            if (capabilities) {
                const supportsLearningGates = capabilities.features.includes('learning_gates');
                LOGGER(`AI4U Backend capabilities: ${capabilities.features.join(', ')}`);
                
                // Enable backend learning gates if supported and configured
                const useBackendLearningGates = vscode.workspace.getConfiguration('ai4u').get('learningGates.useBackend', false);
                if (supportsLearningGates && useBackendLearningGates) {
                    this.backendService.setLearningGatesEnabled(true);
                    LOGGER('AI4U Backend learning gates enabled');
                }
            }
        } else {
            // Fallback to local mode if backend fails
            await this.fallbackToLocalMode('Backend connection failed');
        }
    }

    private async fallbackToLocalMode(reason: string) {
        LOGGER(`AI4U Falling back to local mode: ${reason}`);
        
        // Update configuration
        await this.configManager.updateUseBackend(false);
        
        // Initialize local mode
        await this.initializeLocalMode();
        
        this.uiManager.updateMode('local', `Switched to local mode: ${reason}`);
    }

    private async handleWebviewMessage(data: WebviewMessage) {
        try {
            switch (data.type) {
                case 'sendMessage':
                    await this.handleUserMessage(data.message);
                    break;
                case 'setApiKey':
                    await this.handleSetApiKey(data.apiKey);
                    break;
                case 'toggleBackend':
                    await this.handleToggleBackend();
                    break;
                case 'testConnection':
                    await this.handleTestConnection();
                    break;
                case 'loadHistory':
                    await this.handleLoadHistory();
                    break;
                case 'clearSession':
                    await this.handleClearSession();
                    break;
                case 'submitQuizAnswer':
                    LOGGER(`AI4U Submit quiz answer: ${data.questionId} - ${data.selectedAnswer}`);
                    await this.handleQuizAnswer(data.questionId, data.selectedAnswer);
                    break;
                case 'skipQuiz':
                    await this.handleSkipQuiz();
                    break;
                case 'toggleLearningGates':
                    LOGGER(`AI4U Toggle learning gates: ${data.enabled}`);
                    await this.toggleLearningGates(data.enabled);
                    break;
                case 'toggleBackendLearningGates':
                    await this.handleToggleBackendLearningGates(data.enabled);
                    break;

                default:
                    LOGGER(`AI4U Unknown message type: ${data.type}`, 'WARN');
            }
        } catch (error) {
            LOGGER(`AI4U Error handling webview message: ${error}`, 'ERROR');
            this.uiManager.showBotResponse(
                `Error handling message: ${error}`,
                false
            );
        }
    }

    private async handleToggleBackendLearningGates(enabled: boolean) {
        try {
            // Update backend service
            this.backendService.setLearningGatesEnabled(enabled);
            
            // Save to configuration
            const config = vscode.workspace.getConfiguration('ai4u');
            await config.update('learningGates.useBackend', enabled, vscode.ConfigurationTarget.Global);
            
            LOGGER(`AI4U Backend learning gates toggled: ${enabled}`);
            this.uiManager.showNotification(
                'info', 
                `Backend Learning Gates ${enabled ? 'enabled' : 'disabled'}`
            );
        } catch (error) {
            LOGGER(`AI4U Error toggling backend learning gates: ${error}`, 'ERROR');
            this.uiManager.showErrorMessage('Failed to toggle backend learning gates');
        }
    }
    private async handleQuizAnswer(questionId: string, selectedAnswer: number) {
        try {
            let result;
            let statsUpdateMessage;
            
            // Determine where to process quiz (backend vs local)
            const useBackendLearningGates = this.currentConfig.useBackend && 
                                        this.backendService.isReady() && 
                                        this.backendService.isLearningGatesEnabled();
            
            if (useBackendLearningGates) {
                // Use backend for quiz processing
                LOGGER('AI4U Processing quiz answer on backend');
                const backendResult = await this.backendService.submitQuizAnswer(questionId, selectedAnswer);
                
                if (backendResult) {
                    result = backendResult.result;
                    statsUpdateMessage = {
                        type: 'updateStats',
                        stats: backendResult.updated_stats
                    };
                } else {
                    throw new Error('Backend quiz submission failed, falling back to local');
                }
            } else {
                // Use local learning gate service
                LOGGER('AI4U Processing quiz answer locally');
                result = this.learningGateService.submitAnswer(questionId, selectedAnswer);
                
                const stats = this.learningGateService.getStats();
                statsUpdateMessage = {
                    type: 'updateStats',
                    stats: stats
                };
            }
            
            LOGGER(`AI4U Quiz answer submitted: ${JSON.stringify(result)}`);
            
            // Send result to UI
            this._view?.webview.postMessage({
                type: 'showQuizResult',
                result: result
            });
            
            // Update UI with stats
            if (statsUpdateMessage) {
                this._view?.webview.postMessage(statsUpdateMessage);
            }
            
        } catch (error) {
            LOGGER(`AI4U Error submitting quiz answer: ${error}`, 'ERROR');
            if (error instanceof Error) {
                LOGGER(`AI4U Error submitting quiz answer: ${error.message}`, 'ERROR');
                // Fallback to local processing if backend fails
                if (error.message.includes('falling back to local')) {
                    try {
                        LOGGER('AI4U Falling back to local quiz processing');
                        const result = this.learningGateService.submitAnswer(questionId, selectedAnswer);
                        
                        this._view?.webview.postMessage({
                            type: 'showQuizResult',
                            result: result
                        });
                        
                        const stats = this.learningGateService.getStats();
                        this._view?.webview.postMessage({
                            type: 'updateStats',
                            stats: stats
                        });
                    } catch (localError) {
                        LOGGER(`AI4U Local fallback also failed: ${localError}`, 'ERROR');
                        this.uiManager.showErrorMessage('Failed to submit quiz answer');
                    }
                } else {
                    this.uiManager.showErrorMessage('Failed to submit quiz answer');
                }
            } else {
                // Generic fallback for non-Error types
                LOGGER(`AI4U Error submitting quiz answer: ${JSON.stringify(error)}`, 'ERROR');
                this.uiManager.showErrorMessage('Failed to skip quiz');
            }
        }
    }

    private async handleSkipQuiz() {
        try {
            let result;
            let statsUpdateMessage;
            
            const useBackendLearningGates = this.currentConfig.useBackend && 
                                        this.backendService.isReady() && 
                                        this.backendService.isLearningGatesEnabled();
            
            if (useBackendLearningGates) {
                // Use backend for skip processing
                LOGGER('AI4U Processing quiz skip on backend');
                const backendResult = await this.backendService.skipQuiz();
                
                if (backendResult) {
                    result = backendResult.result;
                    statsUpdateMessage = {
                        type: 'updateStats',
                        stats: backendResult.updated_stats
                    };
                } else {
                    throw new Error('Backend quiz skip failed, falling back to local');
                }
            } else {
                // Local skip logic
                LOGGER('AI4U Processing quiz skip locally');
                result = {
                    correct: false,
                    unlockedResponses: 1,
                    explanation: 'Quiz skipped - you get 1 limited response.',
                    levelUp: false
                };
            }
            
            LOGGER(`AI4U Quiz skipped: ${JSON.stringify(result)}`);
            
            this._view?.webview.postMessage({
                type: 'showQuizResult',
                result: result
            });
            
            // Update UI with stats if available
            if (statsUpdateMessage) {
                this._view?.webview.postMessage(statsUpdateMessage);
            }
            
        } catch (error) {
            LOGGER(`AI4U Error skipping quiz: ${error}`, 'ERROR');
            if (error instanceof Error) {
                LOGGER(`AI4U Error skipping quiz: ${error.message}`, 'ERROR');
                // Fallback to local processing
                if (error.message.includes('falling back to local')) {
                    const result = {
                        correct: false,
                        unlockedResponses: 1,
                        explanation: 'Quiz skipped - you get 1 limited response.',
                        levelUp: false
                    };
                    
                    this._view?.webview.postMessage({
                        type: 'showQuizResult',
                        result: result
                    });
                } else {
                    this.uiManager.showErrorMessage('Failed to skip quiz');
                }
            } else {
                // Generic fallback for non-Error types
                LOGGER(`AI4U Error skipping quiz: ${JSON.stringify(error)}`, 'ERROR');
                this.uiManager.showErrorMessage('Failed to skip quiz');
            }
        }
    }

    // Method to check learning gate status
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
            backend: this.currentConfig.useBackend && this.backendService.isReady(),
            backendLearningGates: this.backendService.isLearningGatesEnabled()
        };
    }
    public async getBackendStats(): Promise<any | null> {
        if (this.currentConfig.useBackend && this.backendService.isReady()) {
            return await this.backendService.getUserStats();
        }
        return null;
    }
    // Method to toggle learning gates
    public async toggleLearningGates(enabled: boolean) {
        this.learningGateService.updateConfig({ enabled });
        
        // Save to configuration
        const config = vscode.workspace.getConfiguration('ai4u');
        await config.update('learningGates.enabled', enabled, vscode.ConfigurationTarget.Global);
        LOGGER(`AI4U Learning gates toggled: {enabled: ${enabled}}`);
        this.uiManager.showNotification(
            'info', 
            `Learning Gates ${enabled ? 'enabled' : 'disabled'}`
        );
    }

    // Method to reset learning progress
    public resetLearningProgress() {
        this.learningGateService.resetProgress();
        this.uiManager.showNotification('info', 'Learning progress reset');
    }

    private async handleUserMessage(message: string) {
        if (!message?.trim()) {
            return;
        }

        // Show loading state
        this.uiManager.showBotResponse('Thinking...', true);

        try {
            if (this.currentConfig.useBackend && this.backendService.isReady()) {
                await this.handleUserMessageBackend(message);
            } else {
                // Local mode: Check learning gate first, then process
                if (this.learningGateService.shouldShowGate()) {
                    await this.showLearningGate();
                    return;
                }
                await this.handleUserMessageLocal(message);
            }
        } catch (error) {
            LOGGER(`AI4U Error in handleUserMessage: ${error}`, 'ERROR');
            this.uiManager.showBotResponse(`Unexpected error: ${error}`, false);
        }
    }

    private async showLearningGate() {
        const question = this.learningGateService.getQuizQuestion();
        if (!question) {
            // No questions available, allow normal response
            return;
        }

        const stats = this.learningGateService.getStats();
        
        // Send quiz to UI
        this._view?.webview.postMessage({
            type: 'showQuiz',
            question: question,
            stats: stats
        });
    }
    private async handleUserMessageLocal(message: string) {
        const response = await this.openaiService.sendMessage(message);
        
        this.uiManager.showBotResponse(
            response.message,
            false,
            response.source
        );
    }

    private async handleUserMessageBackend(message: string) {
        const response = await this.backendService.sendMessage(message);
        
        if (response.error) {
            // Fallback to local mode with learning gates
            LOGGER('AI4U Backend failed, attempting fallback to local');
            
            // Check local learning gate first
            if (this.learningGateService.shouldShowGate()) {
                await this.showLearningGate();
                return;
            }
            
            await this.handleUserMessageLocal(message);
            return;
        }

        // Handle learning gate from backend
        if (response.type === 'learning_gate') {
            LOGGER('AI4U Backend triggered learning gate');
            
            // Send quiz to UI
            this._view?.webview.postMessage({
                type: 'showQuiz',
                question: response.question,
                stats: response.stats
            });
            return;
        }

        // Handle normal chat response
        if (response.type === 'chat_response') {
            this.uiManager.showBotResponse(
                response.response || 'No response received',
                false,
                'backend',
                response.session_id
            );
        }
    }


    private async handleSetApiKey(apiKey: string) {
        if (!apiKey?.trim()) {
            this.uiManager.updateApiKeyStatus('error', 'API key cannot be empty');
            return;
        }

        const success = this.openaiService.initialize(apiKey);
        const status = this.openaiService.getStatus();
        
        this.uiManager.updateApiKeyStatus(
            success ? 'connected' : 'error',
            status.message
        );
    }

    private async handleToggleBackend() {
        const newBackendMode = !this.currentConfig.useBackend;
        
        // Validate configuration before switching
        const newConfig = { ...this.currentConfig, useBackend: newBackendMode };
        const validation = this.configManager.validateConfig(newConfig);
        
        if (!validation.valid) {
            const errorMessage = validation.errors.join(', ');
            this.uiManager.updateConnectionStatus('error', `Configuration error: ${errorMessage}`);
            return;
        }

        // Update configuration
        await this.configManager.updateUseBackend(newBackendMode);
        
        // Configuration watcher will handle the re-initialization
    }

    private async handleTestConnection() {
        if (!this.currentConfig.backendUrl) {
            this.uiManager.updateConnectionStatus('error', 'Backend URL not configured');
            return;
        }

        this.uiManager.updateConnectionStatus('disconnected', 'Testing connection...');
        
        const result = await this.backendService.testConnection();
        this.uiManager.updateConnectionStatus(
            result.connected ? 'connected' : 'error',
            result.message
        );
    }

    private async handleLoadHistory() {
        if (!this.currentConfig.useBackend) {
            return;
        }

        const history = await this.backendService.loadChatHistory();
        if (history) {
            this.uiManager.showChatHistory(history);
        }
    }

    private async handleClearSession() {
        if (this.currentConfig.useBackend) {
            await this.backendService.clearSession();
        }
        
        this.uiManager.clearSession();
    }

    // Public methods for external access
    public getCurrentConfig(): AI4UConfig {
        return { ...this.currentConfig };
    }

    public getServiceStatus(): {
        openai: { connected: boolean; message: string };
        backend: { connected: boolean; message: string };
        mode: 'local' | 'backend';
    } {
        return {
            openai: this.openaiService.getStatus(),
            backend: this.backendService.getStatus(),
            mode: this.currentConfig.useBackend ? 'backend' : 'local'
        };
    }

    public async forceBackendConnection(): Promise<boolean> {
        const result = await this.backendService.testConnection();
        return result.connected;
    }

    // Cleanup
    public dispose() {
        if (this.configDisposable) {
            this.configDisposable.dispose();
        }
        LOGGER('AI4U ChatViewProvider disposed');
    }
}