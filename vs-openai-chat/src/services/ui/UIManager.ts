import * as vscode from 'vscode';
import { HTMLTemplateManager } from './HTMLTemplateManager';
import { MessageHandler, WebviewMessage, MessageResponse } from './MessageHandler';
import { UIStateManager, UIState, StateChangeListener } from './UIStateManager';
import { ThemeManager } from './ThemeManager';
import { QuizUIComponent } from '../learning/QuizUIComponent';
import { LOGGER } from '../../logger';

export class UIManager {
    private messageHandler: MessageHandler;
    private stateManager: UIStateManager;
    private templateManager = HTMLTemplateManager;
    private themeManager = ThemeManager;

    constructor(private readonly extensionUri: vscode.Uri) {
        this.messageHandler = new MessageHandler();
        this.stateManager = new UIStateManager();
        
        // Set up state change listener to automatically update UI
        this.stateManager.addStateChangeListener(this.handleStateChange.bind(this));
        
        LOGGER('Modular UIManager initialized');
    }

    public showQuiz(question: any, stats: any): void {
        LOGGER('UIManager: showQuiz called');
        const quizHTML = QuizUIComponent.generateQuizHTML(question, stats); // ← USE HERE
        this.messageHandler.postMessage({
            type: 'showQuiz',
            html: quizHTML
        });
    }

    public showQuizResult(result: any): void {
        LOGGER('UIManager: showQuizResult called');
        const resultHTML = QuizUIComponent.generateQuizResultHTML(result); // ← USE HERE
        this.messageHandler.postMessage({
            type: 'showQuizResult', 
            html: resultHTML
        });
    }
    
    // === Webview Management ===
    public setWebviewView(view: vscode.WebviewView): void {
        this.messageHandler.setWebviewView(view);
    }

    public getHtmlContent(): string {
        return this.templateManager.generateHTML();
    }

    // === State Management ===
    public getState(): UIState {
        return this.stateManager.getState();
    }

    public updateMode(mode: 'local' | 'backend', message?: string): void {
        this.stateManager.setMode(mode);
        this.messageHandler.sendModeChange(mode, message);
    }

    public updateConnectionStatus(status: 'connected' | 'disconnected' | 'error' | 'warning', message: string): void {
        this.stateManager.setConnectionStatus(status);
        this.messageHandler.sendConnectionStatus(status, message);
    }

    public updateSessionId(sessionId: string | undefined): void {
        this.stateManager.setSessionId(sessionId);
    }

    public setLoading(isLoading: boolean): void {
        this.stateManager.setLoading(isLoading);
    }

    public setBackendUrl(url: string | undefined): void {
        this.stateManager.setBackendUrl(url);
    }

    // === Message Handling ===
    public showBotResponse(message: string, isLoading: boolean = false, source?: string, sessionId?: string, messageId?: string): void {
        if (isLoading) {
            this.setLoading(true);
        } else {
            this.setLoading(false);
            if (sessionId) {
                this.updateSessionId(sessionId);
            }
        }
        LOGGER('UIManager: showBotResponse called');
        this.messageHandler.sendBotResponse(message, isLoading, source, sessionId, messageId);
    }

    public showChatHistory(messages: any[]): void {
        this.messageHandler.sendChatHistory(messages);
    }

    public clearSession(): void {
        this.updateSessionId(undefined);
        this.messageHandler.sendSessionCleared();
    }

    // === Convenience Methods ===
    public showLoadingMessage(message: string = 'Thinking...'): void {
        this.showBotResponse(message, true);
    }

    public showErrorMessage(error: string, source?: string): void {
        this.setLoading(false);
        this.stateManager.setError(error);
        this.messageHandler.sendErrorMessage(error, source);
    }

    public showSuccessMessage(message: string, source?: string): void {
        this.setLoading(false);
        this.stateManager.setError(undefined);
        this.messageHandler.sendSuccessMessage(message, source);
    }

    public showNotification(type: 'info' | 'warning' | 'error', message: string): void {
        this.messageHandler.sendNotification(type, message);
    }

    // === Status and Health ===
    public isReady(): boolean {
        return this.messageHandler.isReady() && this.stateManager.isReady();
    }

    public getStatusSummary(): string {
        return this.stateManager.getStatusSummary();
    }

    public validateState(): { valid: boolean; errors: string[] } {
        return this.stateManager.validateState();
    }

    // === Theme and Styling ===
    public getThemeColors(): any {
        return this.themeManager.getThemeVariables();
    }

    public getStatusColor(status: 'connected' | 'disconnected' | 'error' | 'warning'): string {
        return this.themeManager.getStatusColor(status);
    }

    public getModeColor(mode: 'local' | 'backend'): string {
        return this.themeManager.getModeColor(mode);
    }

    // === Event Handling ===
    public addStateChangeListener(listener: StateChangeListener): void {
        this.stateManager.addStateChangeListener(listener);
    }

    public removeStateChangeListener(listener: StateChangeListener): void {
        this.stateManager.removeStateChangeListener(listener);
    }

    private handleStateChange(currentState: UIState, previousState: UIState): void {
        LOGGER(`UIManager: State changed ${{
            current: currentState,
            previous: previousState
        }}`);

        // Automatically handle certain state changes
        if (currentState.mode !== previousState.mode) {
            LOGGER(`UIManager: Mode changed from ${previousState.mode} to ${currentState.mode}`);
        }

        if (currentState.connectionStatus !== previousState.connectionStatus) {
            LOGGER(`UIManager: Connection status changed from ${previousState.connectionStatus} to ${currentState.connectionStatus}`);
        }

        if (currentState.apiKeyStatus !== previousState.apiKeyStatus) {
            LOGGER(`UIManager: API key status changed from ${previousState.apiKeyStatus} to ${currentState.apiKeyStatus}`);
        }

        // Auto-clear errors after successful operations
        if (previousState.lastError && !currentState.lastError) {
            LOGGER('UIManager: Error cleared');
        }
    }

    // === Advanced Features ===
    public exportState(): string {
        const state = this.stateManager.getState();
        return JSON.stringify(state, null, 2);
    }

    public importState(stateJson: string): boolean {
        try {
            const state = JSON.parse(stateJson) as Partial<UIState>;
            this.stateManager.updateState(state);
            return true;
        } catch (error) {
            console.error('UIManager: Failed to import state:', error);
            return false;
        }
    }

    public reset(): void {
        this.stateManager.reset();
        this.clearSession();
        LOGGER('UIManager: Reset completed');
    }

    // === Debugging and Development ===
    public getDebugInfo(): any {
        return {
            state: this.stateManager.getState(),
            isReady: this.isReady(),
            statusSummary: this.getStatusSummary(),
            validation: this.validateState(),
            timestamp: new Date().toISOString()
        };
    }

    // === Cleanup ===
    public dispose(): void {
        // Clean up listeners and resources
        this.stateManager.reset();
        LOGGER('UIManager: Disposed');
    }
}

// Export all interfaces and types for external use
export { WebviewMessage, MessageResponse, UIState, StateChangeListener };