import * as vscode from 'vscode';
import { ServiceCoordinator } from './coordinators/ServiceCoordinator';
import { ConfigurationCoordinator } from './coordinators/ConfigurationCoordinator';
import { ModeCoordinator } from './coordinators/ModeCoordinator';
import { MessageHandler } from './handlers/MessageHandler';
import { UserMessageHandler } from './handlers/UserMessageHandler';
import { LearningGatesHandler } from './handlers/LearningGatesHandler';
import { WebviewMessage } from './services/ui/UIManager';
import { AI4UConfig, ServiceStatus, LearningGateStatus } from './types/ChatViewTypes';
import { LOGGER } from './logger';


export class ChatViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'ai4uChatView';
    private _view?: vscode.WebviewView;
    
    // Coordinators and Handlers - Initialize with definite assignment assertion
    private serviceCoordinator!: ServiceCoordinator;
    private configurationCoordinator!: ConfigurationCoordinator;
    private modeCoordinator!: ModeCoordinator;
    private messageHandler!: MessageHandler;
    private userMessageHandler!: UserMessageHandler;
    private learningGatesHandler!: LearningGatesHandler;

    constructor(private readonly _extensionUri: vscode.Uri) {
        LOGGER('AI4U ChatViewProvider constructor called');
        this.initializeComponents();
        LOGGER('AI4U ChatViewProvider: All components initialized');
    }

    /**
     * Initialize all modular components
     */
    private initializeComponents() {
        // Initialize coordinators
        this.serviceCoordinator = new ServiceCoordinator(this._extensionUri);
        this.modeCoordinator = new ModeCoordinator(this.serviceCoordinator);
        this.configurationCoordinator = new ConfigurationCoordinator(
            this.serviceCoordinator, 
            this.modeCoordinator
        );

        // Initialize handlers
        this.learningGatesHandler = new LearningGatesHandler(
            this.serviceCoordinator,
            this.modeCoordinator
        );
        
        this.userMessageHandler = new UserMessageHandler(
            this.serviceCoordinator,
            this.configurationCoordinator,
            this.modeCoordinator,
            this.learningGatesHandler
        );

        this.messageHandler = new MessageHandler(
            this.serviceCoordinator,
            this.configurationCoordinator,
            this.learningGatesHandler,
            this.userMessageHandler
        );

        // Initialize services based on current configuration
        const currentConfig = this.configurationCoordinator.getCurrentConfig();
        this.modeCoordinator.initializeServices(currentConfig);
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;
        LOGGER(`AI4U resolveWebviewView called for view ${!!this._view}`);
        
        // Set webview in coordinators and handlers
        this.serviceCoordinator.setWebviewView(webviewView);
        this.learningGatesHandler.setView(webviewView);
        this.userMessageHandler.setView(webviewView);

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        LOGGER('AI4U Chat view provider created');
        webviewView.webview.html = this.serviceCoordinator.uiManager.getHtmlContent();
        LOGGER('📄 HTML content set')

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(async (data: WebviewMessage) => {
            LOGGER(`AI4U Webview message received: ${JSON.stringify(data)}`);
            await this.messageHandler.handleWebviewMessage(data);
        });
    }


    public getCurrentConfig(): AI4UConfig {
        return this.configurationCoordinator.getCurrentConfig();
    }

    
    public getServiceStatus(): ServiceStatus {
        const config = this.configurationCoordinator.getCurrentConfig();
        return {
            openai: this.serviceCoordinator.openaiService.getStatus(),
            backend: this.serviceCoordinator.backendService?.getStatus() || { connected: false, message: 'Not initialized' },
            mode: this.modeCoordinator.getCurrentMode(config),
            learningGates: this.serviceCoordinator.getServiceStatus().learningGates
        };
    }

 
    public getLearningGateStatus(): LearningGateStatus {
        return this.learningGatesHandler.getLearningGateStatus();
    }

    public async getBackendStats(): Promise<any | null> {
        return await this.learningGatesHandler.getBackendStats();
    }

    
    public async toggleLearningGates(enabled: boolean) {
        await this.learningGatesHandler.toggleLearningGates(enabled);
    }

   
    public resetLearningProgress() {
        this.learningGatesHandler.resetLearningProgress();
    }

   
    public async forceBackendConnection(): Promise<boolean> {
        return await this.serviceCoordinator.forceBackendConnection();
    }

    
    public dispose() {
        this.configurationCoordinator.dispose();
        LOGGER('AI4U ChatViewProvider disposed');
    }
}