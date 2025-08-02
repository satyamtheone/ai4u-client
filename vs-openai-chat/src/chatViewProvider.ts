import * as vscode from 'vscode';
import { OpenAI } from 'openai';

export class ChatViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'ai4uChatView';
    private _view?: vscode.WebviewView;
    private openai?: OpenAI;
    constructor(private readonly _extensionUri: vscode.Uri) {
        console.log('AI4U ChatViewProvider constructor called');
    }
    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };
        console.log('AI4U Chat view provider created');
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'sendMessage':
                    await this.handleUserMessage(data.message);
                    break;
                case 'setApiKey':
                    this.initializeOpenAI(data.apiKey);
                    break;
            }
        });

        // Initialize OpenAI with saved API key
        const apiKey = process.env.OPENAI_API_KEY;
        console.log('AI4U API key:', apiKey);
        if (apiKey) {
            this.initializeOpenAI(apiKey);
        }
    }

    private initializeOpenAI(apiKey: string) {
        try {
            this.openai = new OpenAI({
                apiKey: apiKey
            });
            this._view?.webview.postMessage({
                type: 'apiKeyStatus',
                status: 'connected'
            });
            console.log('AI4U OpenAI initialized');
        } catch (error) {
            this._view?.webview.postMessage({
                type: 'apiKeyStatus',
                status: 'error',
                message: 'Failed to initialize OpenAI'
            });
            console.error('AI4U Failed to initialize OpenAI:', error);
        }
    }

    private async handleUserMessage(message: string) {
        if (!this.openai) {
            this._view?.webview.postMessage({
                type: 'botResponse',
                message: 'Please set your OpenAI API key first.'
            });
            return;
        }

        try {
            // Show loading state
            this._view?.webview.postMessage({
                type: 'botResponse',
                message: 'Thinking...',
                isLoading: true
            });

            const completion = await this.openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: message }],
                max_tokens: 500
            });

            const response = completion.choices[0]?.message?.content || 'No response received.';

            this._view?.webview.postMessage({
                type: 'botResponse',
                message: response,
                isLoading: false
            });

        } catch (error: any) {
            this._view?.webview.postMessage({
                type: 'botResponse',
                message: `Error: ${error.message}`,
                isLoading: false
            });
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>AI4U Chat</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    color: var(--vscode-foreground);
                    background-color: var(--vscode-editor-background);
                    margin: 0;
                    padding: 10px;
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                }
                
                .api-key-section {
                    margin-bottom: 10px;
                    padding: 10px;
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 4px;
                }
                
                .api-key-input {
                    width: calc(100% - 80px);
                    padding: 5px;
                    margin-right: 5px;
                    background-color: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border: 1px solid var(--vscode-input-border);
                }
                
                .set-key-btn {
                    padding: 5px 10px;
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    cursor: pointer;
                }
                
                .chat-container {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                
                .messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 10px;
                    border: 1px solid var(--vscode-input-border);
                    margin-bottom: 10px;
                }
                
                .message {
                    margin-bottom: 10px;
                    padding: 8px;
                    border-radius: 4px;
                }
                
                .user-message {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    text-align: right;
                }
                
                .bot-message {
                    background-color: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                }
                
                .input-container {
                    display: flex;
                    gap: 5px;
                }
                
                .message-input {
                    flex: 1;
                    padding: 8px;
                    background-color: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border: 1px solid var(--vscode-input-border);
                }
                
                .send-btn {
                    padding: 8px 16px;
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    cursor: pointer;
                }
                
                .send-btn:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                
                .send-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                .status {
                    font-size: 12px;
                    color: var(--vscode-descriptionForeground);
                    margin-bottom: 5px;
                }
            </style>
        </head>
        <body>
            <div class="api-key-section">
                <div class="status" id="apiStatus">API Key not set</div>
                <input type="password" class="api-key-input" id="apiKeyInput" placeholder="Enter OpenAI API Key">
                <button class="set-key-btn" onclick="setApiKey()">Set Key</button>
            </div>
            
            <div class="chat-container">
                <div class="messages" id="messages"></div>
                <div class="input-container">
                    <input type="text" class="message-input" id="messageInput" placeholder="Type your message..." onkeypress="handleKeyPress(event)">
                    <button class="send-btn" id="sendBtn" onclick="sendMessage()">Send</button>
                </div>
            </div>

            <script>
                const vscode = acquireVsCodeApi();
                
                function setApiKey() {
                    const apiKey = document.getElementById('apiKeyInput').value;
                    if (apiKey) {
                        vscode.postMessage({
                            type: 'setApiKey',
                            apiKey: apiKey
                        });
                    }
                }
                
                function sendMessage() {
                    const input = document.getElementById('messageInput');
                    const message = input.value.trim();
                    
                    if (message) {
                        addMessage(message, 'user');
                        input.value = '';
                        
                        vscode.postMessage({
                            type: 'sendMessage',
                            message: message
                        });
                        
                        document.getElementById('sendBtn').disabled = true;
                    }
                }
                
                function handleKeyPress(event) {
                    if (event.key === 'Enter') {
                        sendMessage();
                    }
                }
                
                function addMessage(text, sender) {
                    const messages = document.getElementById('messages');
                    const messageDiv = document.createElement('div');
                    messageDiv.className = 'message ' + (sender === 'user' ? 'user-message' : 'bot-message');
                    messageDiv.textContent = text;
                    messages.appendChild(messageDiv);
                    messages.scrollTop = messages.scrollHeight;
                }
                
                // Handle messages from the extension
                window.addEventListener('message', event => {
                    const message = event.data;
                    
                    switch (message.type) {
                        case 'botResponse':
                            if (message.isLoading) {
                                addMessage(message.message, 'bot');
                            } else {
                                // Remove loading message and add actual response
                                const messages = document.getElementById('messages');
                                const lastMessage = messages.lastElementChild;
                                if (lastMessage && lastMessage.textContent === 'Thinking...') {
                                    messages.removeChild(lastMessage);
                                }
                                addMessage(message.message, 'bot');
                                document.getElementById('sendBtn').disabled = false;
                            }
                            break;
                        case 'apiKeyStatus':
                            const status = document.getElementById('apiStatus');
                            if (message.status === 'connected') {
                                status.textContent = 'API Key connected';
                                status.style.color = 'green';
                            } else {
                                status.textContent = message.message || 'API Key error';
                                status.style.color = 'red';
                            }
                            break;
                    }
                });
            </script>
        </body>
        </html>`;
    }
}