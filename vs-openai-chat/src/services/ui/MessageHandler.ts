import * as vscode from 'vscode';
import { LOGGER } from '../../logger';

export interface WebviewMessage {
    type: string;
    [key: string]: any;
}

export interface MessageResponse {
    type: string;
    message?: string;
    status?: 'connected' | 'disconnected' | 'error' | 'warning';
    mode?: 'local' | 'backend';
    isLoading?: boolean;
    source?: string;
    sessionId?: string;
    messageId?: string;
    messages?: any[];
    [key: string]: any;
}

export class MessageHandler {
    private _view?: vscode.WebviewView;

    constructor() {
        LOGGER('MessageHandler initialized');
    }

    public setWebviewView(view: vscode.WebviewView): void {
        this._view = view;
    }

    public postMessage(message: MessageResponse): void {
        if (this._view) {
            this._view.webview.postMessage(message);
            LOGGER(`MessageHandler: Posted message type:${message.type}`);
        } else {
            console.warn('MessageHandler: No webview available for message:', message.type);
        }
    }

    public sendBotResponse(message: string, isLoading: boolean = false, source?: string, sessionId?: string, messageId?: string): void {
        this.postMessage({
            type: 'botResponse',
            message,
            isLoading,
            source,
            sessionId,
            messageId
        });
    }

    public sendApiKeyStatus(status: 'connected' | 'disconnected' | 'error', message?: string): void {
        this.postMessage({
            type: 'apiKeyStatus',
            status,
            message
        });
    }

    public sendConnectionStatus(status: 'connected' | 'disconnected' | 'error' | 'warning', message: string): void {
        this.postMessage({
            type: 'connectionStatus',
            status,
            message
        });
    }

    public sendModeChange(mode: 'local' | 'backend', message?: string): void {
        this.postMessage({
            type: 'modeChanged',
            mode,
            message
        });
    }

    public sendChatHistory(messages: any[]): void {
        this.postMessage({
            type: 'chatHistory',
            messages
        });
    }

    public sendSessionCleared(): void {
        this.postMessage({
            type: 'sessionCleared'
        });
    }

    public sendLoadingMessage(message: string = 'Thinking...'): void {
        this.sendBotResponse(message, true);
    }

    public sendErrorMessage(error: string, source?: string): void {
        this.sendBotResponse(`Error: ${error}`, false, source);
    }

    public sendSuccessMessage(message: string, source?: string): void {
        this.sendBotResponse(message, false, source);
    }

    public sendNotification(type: 'info' | 'warning' | 'error', message: string): void {
        // This could be extended to show VS Code notifications
        switch (type) {
            case 'info':
                vscode.window.showInformationMessage(`AI4U: ${message}`);
                break;
            case 'warning':
                vscode.window.showWarningMessage(`AI4U: ${message}`);
                break;
            case 'error':
                vscode.window.showErrorMessage(`AI4U: ${message}`);
                break;
        }
    }

    public isReady(): boolean {
        return !!this._view;
    }
}