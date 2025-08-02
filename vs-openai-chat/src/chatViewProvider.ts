import * as vscode from 'vscode';
import { OpenAIService } from './services/OpenAIService';
import { BackendService } from './services/BackendService';
import { ConfigManager, AI4UConfig } from './services/ConfigManager';
import { UIManager, WebviewMessage } from './services/UIManager';

export class ChatViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'ai4uChatView';
    private _view?: vscode.WebviewView;
    
    // Service instances
    private openaiService: OpenAIService;
    private backendService: BackendService;
    private uiManager: UIManager;
    private configManager = ConfigManager;
    
    // Current state
    private currentConfig: AI4UConfig;
    private configDisposable?: vscode.Disposable;

    constructor(private readonly _extensionUri: vscode.Uri) {
        console.log('AI4U ChatViewProvider constructor called');
        
        // Initialize services
        this.uiManager = new UIManager(_extensionUri);
        this.openaiService = new OpenAIService();
        
        // Load configuration
        this.currentConfig = this.configManager.getConfig();
        this.backendService = new BackendService(this.currentConfig.backendUrl || undefined);
        
        // Listen for configuration changes
        this.setupConfigurationWatcher();
        
        console.log('AI4U Services initialized - Mode:', this.currentConfig.useBackend ? 'backend' : 'local');
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;
        this.uiManager.setWebviewView(webviewView);

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        console.log('AI4U Chat view provider created');
        webviewView.webview.html = this.uiManager.getHtmlContent();

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(async (data: WebviewMessage) => {
            await this.handleWebviewMessage(data);
        });

        // Initialize based on current configuration
        this.initializeServices();
    }

    private setupConfigurationWatcher() {
        this.configDisposable = this.configManager.onConfigurationChanged((config) => {
            console.log('AI4U Configuration changed:', config);
            this.currentConfig = config;
            
            // Update backend service with new URL (only if provided)
            if (config.backendUrl) {
                this.backendService.setBackendUrl(config.backendUrl);
            }
            
            // Re-initialize services
            this.initializeServices();
        });
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
        
        if (!connectionResult.connected) {
            // Fallback to local mode if backend fails
            await this.fallbackToLocalMode('Backend connection failed');
        }
    }

    private async fallbackToLocalMode(reason: string) {
        console.log('AI4U Falling back to local mode:', reason);
        
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
                default:
                    console.warn('AI4U Unknown message type:', data.type);
            }
        } catch (error) {
            console.error('AI4U Error handling webview message:', error);
            this.uiManager.showBotResponse(
                `Error handling message: ${error}`,
                false
            );
        }
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
                await this.handleUserMessageLocal(message);
            }
        } catch (error) {
            console.error('AI4U Error in handleUserMessage:', error);
            this.uiManager.showBotResponse(
                `Unexpected error: ${error}`,
                false
            );
        }
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
            // If backend fails, try fallback to local
            console.log('AI4U Backend failed, attempting fallback to local');
            await this.handleUserMessageLocal(message);
        } else {
            this.uiManager.showBotResponse(
                response.message,
                false,
                response.source,
                response.sessionId,
                response.messageId
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
        console.log('AI4U ChatViewProvider disposed');
    }
}