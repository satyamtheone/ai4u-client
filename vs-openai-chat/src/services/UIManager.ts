import * as vscode from 'vscode';

export interface WebviewMessage {
    type: string;
    [key: string]: any;
}

export interface UIState {
    mode: 'local' | 'backend';
    connectionStatus: 'connected' | 'disconnected' | 'error';
    apiKeyStatus: 'connected' | 'disconnected' | 'error';
}

export class UIManager {
    private _view?: vscode.WebviewView;
    private currentState: UIState = {
        mode: 'local',
        connectionStatus: 'disconnected',
        apiKeyStatus: 'disconnected'
    };

    constructor(private readonly extensionUri: vscode.Uri) {}

    public setWebviewView(view: vscode.WebviewView) {
        this._view = view;
    }

    public getHtmlContent(): string {
        return this.generateHTML();
    }

    public postMessage(message: WebviewMessage): void {
        if (this._view) {
            this._view.webview.postMessage(message);
        }
    }

    public updateMode(mode: 'local' | 'backend', message?: string): void {
        this.currentState.mode = mode;
        this.postMessage({
            type: 'modeChanged',
            mode: mode,
            message: message || `${mode.toUpperCase()} mode active`
        });
    }

    public updateConnectionStatus(status: 'connected' | 'disconnected' | 'error', message: string): void {
        this.currentState.connectionStatus = status;
        this.postMessage({
            type: 'connectionStatus',
            status: status,
            message: message
        });
    }

    public updateApiKeyStatus(status: 'connected' | 'disconnected' | 'error', message?: string): void {
        this.currentState.apiKeyStatus = status;
        this.postMessage({
            type: 'apiKeyStatus',
            status: status,
            message: message
        });
    }

    public showBotResponse(message: string, isLoading: boolean = false, source?: string, sessionId?: string, messageId?: string): void {
        this.postMessage({
            type: 'botResponse',
            message: message,
            isLoading: isLoading,
            source: source,
            sessionId: sessionId,
            messageId: messageId
        });
    }

    public showChatHistory(messages: any[]): void {
        this.postMessage({
            type: 'chatHistory',
            messages: messages
        });
    }

    public clearSession(): void {
        this.postMessage({
            type: 'sessionCleared'
        });
    }

    private generateHTML(): string {
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
                
                .mode-section {
                    margin-bottom: 10px;
                    padding: 8px;
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 4px;
                    background-color: var(--vscode-input-background);
                }
                
                .mode-toggle {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 8px;
                }
                
                .mode-indicator {
                    font-size: 12px;
                    font-weight: bold;
                    padding: 2px 6px;
                    border-radius: 3px;
                }
                
                .mode-local { background-color: #2196F3; color: white; }
                .mode-backend { background-color: #4CAF50; color: white; }
                
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
                
                .btn {
                    padding: 5px 10px;
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    cursor: pointer;
                    border-radius: 3px;
                    font-size: 11px;
                }
                
                .btn:hover { background-color: var(--vscode-button-hoverBackground); }
                
                .btn-secondary {
                    background-color: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                }
                
                .btn-secondary:hover { background-color: var(--vscode-button-secondaryHoverBackground); }
                
                .control-buttons { display: flex; gap: 5px; flex-wrap: wrap; }
                
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
                    position: relative;
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
                
                .message-source {
                    position: absolute;
                    top: 2px;
                    right: 4px;
                    font-size: 9px;
                    color: var(--vscode-descriptionForeground);
                    opacity: 0.7;
                }
                
                .input-container { display: flex; gap: 5px; }
                
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
                
                .send-btn:hover { background-color: var(--vscode-button-hoverBackground); }
                .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
                
                .status { font-size: 12px; margin-bottom: 5px; }
                .status.connected { color: #4CAF50; }
                .status.error { color: #f44336; }
                .hidden { display: none; }
            </style>
        </head>
        <body>
            <div class="mode-section">
                <div class="mode-toggle">
                    <span class="mode-indicator" id="modeIndicator">LOCAL</span>
                    <button class="btn btn-secondary" onclick="toggleBackend()">Toggle Mode</button>
                    <button class="btn btn-secondary" onclick="testConnection()" id="testBtn">Test Backend</button>
                </div>
                <div class="status" id="connectionStatus">Local mode active</div>
                <div class="control-buttons">
                    <button class="btn btn-secondary" onclick="loadHistory()" id="historyBtn" class="hidden">Load History</button>
                    <button class="btn btn-secondary" onclick="clearSession()">Clear Session</button>
                </div>
            </div>
            
            <div class="api-key-section" id="apiKeySection">
                <div class="status" id="apiStatus">API Key not set</div>
                <input type="password" class="api-key-input" id="apiKeyInput" placeholder="Enter OpenAI API Key">
                <button class="btn" onclick="setApiKey()">Set Key</button>
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
                let currentMode = 'local';
                let currentSessionId = null;
                
                function toggleBackend() { vscode.postMessage({ type: 'toggleBackend' }); }
                function testConnection() { vscode.postMessage({ type: 'testConnection' }); }
                function loadHistory() { vscode.postMessage({ type: 'loadHistory' }); }
                function clearSession() { vscode.postMessage({ type: 'clearSession' }); }
                
                function setApiKey() {
                    const apiKey = document.getElementById('apiKeyInput').value;
                    if (apiKey) {
                        vscode.postMessage({ type: 'setApiKey', apiKey: apiKey });
                    }
                }
                
                function sendMessage() {
                    const input = document.getElementById('messageInput');
                    const message = input.value.trim();
                    
                    if (message) {
                        addMessage(message, 'user');
                        input.value = '';
                        vscode.postMessage({ type: 'sendMessage', message: message });
                        document.getElementById('sendBtn').disabled = true;
                    }
                }
                
                function handleKeyPress(event) {
                    if (event.key === 'Enter') { sendMessage(); }
                }
                
                function addMessage(text, sender, source = null) {
                    const messages = document.getElementById('messages');
                    const messageDiv = document.createElement('div');
                    messageDiv.className = 'message ' + (sender === 'user' ? 'user-message' : 'bot-message');
                    messageDiv.textContent = text;
                    
                    if (source && sender === 'bot') {
                        const sourceDiv = document.createElement('div');
                        sourceDiv.className = 'message-source';
                        sourceDiv.textContent = source.toUpperCase();
                        messageDiv.appendChild(sourceDiv);
                    }
                    
                    messages.appendChild(messageDiv);
                    messages.scrollTop = messages.scrollHeight;
                }
                
                function updateUI(mode) {
                    const modeIndicator = document.getElementById('modeIndicator');
                    const apiKeySection = document.getElementById('apiKeySection');
                    const historyBtn = document.getElementById('historyBtn');
                    const testBtn = document.getElementById('testBtn');
                    
                    if (mode === 'backend') {
                        modeIndicator.textContent = 'BACKEND';
                        modeIndicator.className = 'mode-indicator mode-backend';
                        apiKeySection.style.display = 'none';
                        historyBtn.style.display = 'inline-block';
                        testBtn.style.display = 'inline-block';
                    } else {
                        modeIndicator.textContent = 'LOCAL';
                        modeIndicator.className = 'mode-indicator mode-local';
                        apiKeySection.style.display = 'block';
                        historyBtn.style.display = 'none';
                        testBtn.style.display = 'none';
                    }
                    currentMode = mode;
                }
                
                // Handle messages from the extension
                window.addEventListener('message', event => {
                    const message = event.data;
                    
                    switch (message.type) {
                        case 'botResponse':
                            if (message.isLoading) {
                                addMessage(message.message, 'bot');
                            } else {
                                const messages = document.getElementById('messages');
                                const lastMessage = messages.lastElementChild;
                                if (lastMessage && lastMessage.textContent === 'Thinking...') {
                                    messages.removeChild(lastMessage);
                                }
                                addMessage(message.message, 'bot', message.source);
                                document.getElementById('sendBtn').disabled = false;
                                if (message.sessionId) { currentSessionId = message.sessionId; }
                            }
                            break;
                            
                        case 'apiKeyStatus':
                            const apiStatus = document.getElementById('apiStatus');
                            if (message.status === 'connected') {
                                apiStatus.textContent = 'API Key connected';
                                apiStatus.style.color = 'green';
                            } else {
                                apiStatus.textContent = message.message || 'API Key error';
                                apiStatus.style.color = 'red';
                            }
                            break;
                            
                        case 'connectionStatus':
                            const status = document.getElementById('connectionStatus');
                            status.textContent = message.message;
                            status.className = 'status ' + message.status;
                            break;
                            
                        case 'modeChanged':
                            updateUI(message.mode);
                            document.getElementById('connectionStatus').textContent = 
                                message.message || \`\${message.mode.toUpperCase()} mode active\`;
                            break;
                            
                        case 'chatHistory':
                            const messagesContainer = document.getElementById('messages');
                            messagesContainer.innerHTML = '';
                            message.messages.forEach(msg => {
                                addMessage(msg.content, msg.role === 'user' ? 'user' : 'bot', 'backend');
                            });
                            break;
                            
                        case 'sessionCleared':
                            document.getElementById('messages').innerHTML = '';
                            currentSessionId = null;
                            break;
                    }
                });
                
                updateUI('local');
            </script>
        </body>
        </html>`;
    }
}