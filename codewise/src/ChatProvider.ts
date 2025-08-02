// src/ChatProvider.ts
import * as vscode from 'vscode';
import { ContextExtractor } from './ContextExtractor';

export class ChatProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;

    constructor(private readonly _extensionUri: vscode.Uri) {
        console.log('📝 ChatProvider constructor called');
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ): void | Thenable<void> {
        console.log('🔧 Resolving webview view...');
        
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async (data) => {
            console.log('📨 Received message:', data.type);
            
            switch (data.type) {
                case 'sendMessage':
                    await this.handleUserMessage(data.message);
                    break;
                case 'getContext':
                    this.sendContextToWebview();
                    break;
                default:
                    console.log('❓ Unknown message type:', data.type);
            }
        });

        console.log('✅ Webview view resolved successfully');
    }

    private async handleUserMessage(message: string): Promise<void> {
        try {
            console.log('💬 Handling user message:', message.substring(0, 50) + '...');
            
            // For now, we'll provide basic responses without external API
            const response = this.generateBasicResponse(message);

            this._view?.webview.postMessage({
                type: 'aiResponse',
                message: response
            });
            
            console.log('✅ Response sent successfully');
        } catch (error) {
            console.error('❌ Error handling message:', error);
            this._view?.webview.postMessage({
                type: 'aiResponse',
                message: 'Sorry, I encountered an error processing your message. Please try again.'
            });
        }
    }

    private generateBasicResponse(message: string): string {
        const lowerMessage = message.toLowerCase().trim();
        
        if (!lowerMessage) {
            return 'Please enter a message to get started!';
        }
        
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
            return 'Hello! 👋 I\'m CodeWise, your coding learning assistant. How can I help you today?';
        }
        
        if (lowerMessage.includes('context') || lowerMessage.includes('file') || lowerMessage.includes('code')) {
            const context = ContextExtractor.getCurrentFileContext();
            if (context.language) {
                return `You're currently working with a ${context.language} file${context.fileName ? ` (${context.fileName.split('/').pop()})` : ''}. I can see you're on line ${(context.cursorLine || 0) + 1}. ${context.selectedText ? 'You have some text selected. ' : ''}What would you like to know about your code?`;
            }
            return 'No active file detected. Open a code file in the editor to get started with code analysis!';
        }
        
        if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
            return `I can help you with:
• 📄 **Code Analysis** - Understand your current file
• 🧠 **Learning Quizzes** - Test your coding knowledge  
• 🔒 **Code Challenges** - Lock code behind learning exercises
• 💡 **Explanations** - Get help understanding programming concepts
• 📊 **Progress Tracking** - Monitor your learning journey

Try asking me about your current code file or type "quiz" to start a learning challenge!`;
        }

        if (lowerMessage.includes('quiz') || lowerMessage.includes('learn') || lowerMessage.includes('test')) {
            return 'Great! I\'d love to create a quiz for you. Use the Command Palette (Ctrl+Shift+P) and run "CodeWise: Quick Quiz" to start a learning session based on your current code file!';
        }

        if (lowerMessage.includes('lock') || lowerMessage.includes('challenge')) {
            return 'Code locking is a fun way to learn! Use "CodeWise: Lock Current Code" from the Command Palette to lock your current code behind a learning challenge. You\'ll need to pass a quiz to unlock it!';
        }

        if (lowerMessage.includes('thanks') || lowerMessage.includes('thank you')) {
            return 'You\'re welcome! 😊 Happy coding and learning!';
        }

        // Default response with helpful suggestions
        return `I received your message: "${message}". 

Here are some things you can try:
• Ask me about your **current code file**
• Request a **quiz** or **learning challenge**  
• Type **"help"** to see all my capabilities
• Use the Command Palette for **CodeWise commands**

What would you like to explore?`;
    }

    private sendContextToWebview(): void {
        try {
            const context = ContextExtractor.getCurrentFileContext();
            this._view?.webview.postMessage({
                type: 'contextUpdate',
                context: context
            });
            console.log('✅ Context sent to webview');
        } catch (error) {
            console.error('❌ Error sending context:', error);
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const nonce = this.getNonce();
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CodeWise Chat</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background: var(--vscode-editor-background);
            margin: 0;
            padding: 10px;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        .header {
            text-align: center;
            padding: 15px 10px;
            background: var(--vscode-textBlockQuote-background);
            border-radius: 6px;
            margin-bottom: 15px;
            border-left: 4px solid var(--vscode-textBlockQuote-border);
        }
        
        .header h2 {
            margin: 0 0 5px 0;
            color: var(--vscode-textLink-foreground);
            font-size: 1.2em;
        }
        
        .header p {
            margin: 0;
            opacity: 0.8;
            font-size: 0.9em;
        }
        
        .chat-container {
            flex: 1;
            overflow-y: auto;
            border: 1px solid var(--vscode-panel-border);
            padding: 15px;
            margin-bottom: 15px;
            background: var(--vscode-editor-background);
            border-radius: 6px;
            min-height: 200px;
        }
        
        .message {
            margin-bottom: 15px;
            padding: 10px;
            border-radius: 6px;
            word-wrap: break-word;
            line-height: 1.4;
        }
        
        .user {
            background: var(--vscode-inputValidation-infoBorder);
            color: var(--vscode-input-foreground);
            margin-left: 20px;
            border-left: 3px solid var(--vscode-textLink-foreground);
        }
        
        .ai {
            background: var(--vscode-editor-selectionBackground);
            color: var(--vscode-editor-foreground);
            margin-right: 20px;
            border-left: 3px solid var(--vscode-textBlockQuote-border);
        }
        
        .input-container {
            display: flex;
            gap: 8px;
            align-items: flex-end;
        }
        
        .input-wrapper {
            flex: 1;
            display: flex;
            flex-direction: column;
        }
        
        textarea {
            flex: 1;
            padding: 10px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            resize: none;
            min-height: 20px;
            max-height: 100px;
        }
        
        textarea:focus {
            outline: 1px solid var(--vscode-focusBorder);
        }
        
        button {
            padding: 10px 16px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: var(--vscode-font-size);
            white-space: nowrap;
        }
        
        button:hover {
            background: var(--vscode-button-hoverBackground);
        }
        
        button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        
        .context-button {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            margin-bottom: 10px;
            width: 100%;
            font-size: 0.9em;
        }
        
        .typing-indicator {
            display: none;
            font-style: italic;
            opacity: 0.7;
            padding: 5px 10px;
        }
        
        .welcome-message {
            background: var(--vscode-textCodeBlock-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 15px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>🧠 CodeWise Assistant</h2>
        <p>Your interactive coding learning companion</p>
    </div>
    
    <button class="context-button" onclick="getContext()">📄 Get Current File Context</button>
    
    <div class="chat-container" id="chat">
        <div class="welcome-message">
            <strong>Welcome to CodeWise! 👋</strong><br>
            I'm here to help you learn and understand code. Ask me about your current file, request a quiz, or just say hello!
        </div>
    </div>
    
    <div class="typing-indicator" id="typing">CodeWise is thinking...</div>
    
    <div class="input-container">
        <div class="input-wrapper">
            <textarea id="messageInput" placeholder="Ask me about your code, request a quiz, or say hello..." rows="1"></textarea>
        </div>
        <button onclick="sendMessage()" id="sendButton">Send</button>
    </div>

    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();

        // Auto-resize textarea
        const textarea = document.getElementById('messageInput');
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 100) + 'px';
        });

        function sendMessage() {
            const input = document.getElementById('messageInput');
            const message = input.value.trim();
            if (!message) return;

            addMessage(message, 'user');
            input.value = '';
            input.style.height = 'auto';
            
            showTyping(true);
            document.getElementById('sendButton').disabled = true;

            vscode.postMessage({ type: 'sendMessage', message: message });
        }

        function getContext() {
            vscode.postMessage({ type: 'getContext' });
            addMessage('Getting current file context...', 'user');
        }

        function addMessage(text, type) {
            const chat = document.getElementById('chat');
            const div = document.createElement('div');
            div.className = 'message ' + type;
            
            // Simple text formatting
            const formattedText = text
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n/g, '<br>');
            
            div.innerHTML = formattedText;
            chat.appendChild(div);
            chat.scrollTop = chat.scrollHeight;
        }

        function showTyping(show) {
            const typing = document.getElementById('typing');
            typing.style.display = show ? 'block' : 'none';
        }

        window.addEventListener('message', event => {
            const message = event.data;
            
            showTyping(false);
            document.getElementById('sendButton').disabled = false;
            
            switch (message.type) {
                case 'aiResponse':
                    addMessage(message.message, 'ai');
                    break;
                case 'contextUpdate':
                    const ctx = message.context;
                    let contextMsg = '📄 **Current File Context:**\\n';
                    if (ctx.language) contextMsg += \`• Language: \${ctx.language}\\n\`;
                    if (ctx.fileName) contextMsg += \`• File: \${ctx.fileName.split('/').pop()}\\n\`;
                    if (ctx.cursorLine !== undefined) contextMsg += \`• Line: \${ctx.cursorLine + 1}\\n\`;
                    if (ctx.selectedText) contextMsg += \`• Selected: \${ctx.selectedText.substring(0, 50)}...\\n\`;
                    if (ctx.fileContent) contextMsg += \`• Size: \${ctx.fileContent.length} characters\`;
                    addMessage(contextMsg, 'ai');
                    break;
            }
        });

        // Enter to send (Shift+Enter for new line)
        textarea.addEventListener('keydown', e => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Focus on input
        textarea.focus();
    </script>
</body>
</html>`;
    }

    private getNonce(): string {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}