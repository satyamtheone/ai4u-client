import * as vscode from 'vscode';
import { ChatViewProvider } from './chatViewProvider';

export function activate(context: vscode.ExtensionContext) {
    // Create chat view provider
    const chatProvider = new ChatViewProvider(context.extensionUri);
    console.log('AI4U ChatViewProvider constructor called');
    console.log(chatProvider);
    console.log('AI4U extension activated');
    
    // Register the webview view provider
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            ChatViewProvider.viewType, // Use the static property
            chatProvider,
            {
                webviewOptions: {
                    retainContextWhenHidden: true
                }
            }
        )
    );
    console.log('AI4U Command registered');
    
    // Register command to open chat
    const openChatCommand = vscode.commands.registerCommand('ai4u.openChat', () => {
        // Open the AI4U container and focus on the chat view
        vscode.commands.executeCommand('workbench.view.extension.ai4uChatContainer');
        vscode.commands.executeCommand('ai4uChatView.focus');
    });

    context.subscriptions.push(openChatCommand);

    console.log('AI4U Showing chat view');
}