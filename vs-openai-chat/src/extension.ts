import * as vscode from 'vscode';
import { ChatViewProvider } from './chatViewProvider';
import { LOGGER } from './logger';

export function activate(context: vscode.ExtensionContext) {
    LOGGER('AI4U extension activating...');
    
    try {
        // Create chat view provider
        const chatProvider = new ChatViewProvider(context.extensionUri);
        LOGGER('AI4U ChatViewProvider created successfully');
        
        // Register the webview view provider
        const webviewProviderDisposable = vscode.window.registerWebviewViewProvider(
            ChatViewProvider.viewType,
            chatProvider,
            {
                webviewOptions: {
                    retainContextWhenHidden: true
                }
            }
        );
        
        // Register command to open chat
        const openChatCommand = vscode.commands.registerCommand('ai4u.openChat', () => {
            // Open the AI4U container and focus on the chat view
            vscode.commands.executeCommand('workbench.view.extension.ai4uChatContainer');
            vscode.commands.executeCommand('ai4uChatView.focus');
        });

        // Register command to check status (useful for debugging)
        const statusCommand = vscode.commands.registerCommand('ai4u.checkStatus', () => {
            const status = chatProvider.getServiceStatus();
            const config = chatProvider.getCurrentConfig();
            
            const statusMessage = `AI4U Status:
                Backend: ${status.backend.connected ? '✅' : '❌'} ${status.backend.message}
                Backend URL: ${config.backendUrl || 'Not configured'}
                Learning Gates: ${status.learningGates.enabled ? 'Enabled' : 'Disabled'}`;

            vscode.window.showInformationMessage(statusMessage, { modal: false });
        });
        // Add all disposables to context
        context.subscriptions.push(
            webviewProviderDisposable,
            openChatCommand,
            statusCommand,
            chatProvider // Ensure proper cleanup
        );

        LOGGER('AI4U extension activated successfully');
        
        // Show welcome message on first activation
        const isFirstActivation = context.globalState.get('ai4u.firstActivation', true);
        if (isFirstActivation) {
            context.globalState.update('ai4u.firstActivation', false);
            
            vscode.window.showInformationMessage(
                'AI4U is now active! Open the chat panel to get started.',
                'Open Chat'
            ).then(selection => {
                if (selection === 'Open Chat') {
                    vscode.commands.executeCommand('ai4u.openChat');
                }
            });
        }

    } catch (error) {
        console.error('AI4U Failed to activate extension:', error);
        vscode.window.showErrorMessage(`AI4U activation failed: ${error}`);
    }
}

export function deactivate() {
    LOGGER('AI4U extension deactivated');
}