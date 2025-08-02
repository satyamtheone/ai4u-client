import * as vscode from 'vscode';
import { OpenAI } from 'openai';

export class ChatViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'ai4uChatView';
    private _view?: vscode.WebviewView;
    private openai?: OpenAI;
    private sessionId?: string;
    private backendUrl?: string;
    private useBackend: boolean = false;

    constructor(private readonly _extensionUri: vscode.Uri) {
        console.log('AI4U ChatViewProvider constructor called');
        
        // Check if backend is configured
        const config = vscode.workspace.getConfiguration('ai4u');
        this.backendUrl = config.get('backendUrl');
        this.useBackend = config.get('useBackend', false);
        
        console.log('AI4U Backend mode:', this.useBackend ? 'enabled' : 'disabled');
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
                    if (this.useBackend && this.backendUrl) {
                        await this.handleUserMessageBackend(data.message);
                    } else {
                        await this.handleUserMessageLocal(data.message);
                    }
                    break;
                case 'setApiKey':
                    this.initializeOpenAI(data.apiKey);
                    break;
                case 'toggleBackend':
                    await this.toggleBackendMode();
                    break;
                case 'testConnection':
                    await this.testBackendConnection();
                    break;
                case 'loadHistory':
                    await this.loadChatHistory();
                    break;
                case 'clearSession':
                    await this.clearSession();
                    break;
            }
        });

        // Initialize based on configuration
        this.initializeMode();
    }

    private async initializeMode() {
        if (this.useBackend && this.backendUrl) {
            await this.testBackendConnection();
        } else {
            // Initialize OpenAI with saved API key (original functionality)
            const apiKey = process.env.OPENAI_API_KEY;
            console.log('AI4U API key:', apiKey);
            if (apiKey) {
                this.initializeOpenAI(apiKey);
            }
        }
    }

    private async toggleBackendMode() {
        this.useBackend = !this.useBackend;
        
        // Update configuration
        const config = vscode.workspace.getConfiguration('ai4u');
        await config.update('useBackend', this.useBackend, vscode.ConfigurationTarget.Global);
        
        this._view?.webview.postMessage({
            type: 'modeChanged',
            mode: this.useBackend ? 'backend' : 'local',
            backendUrl: this.backendUrl
        });

        // Re-initialize
        await this.initializeMode();
    }

    // ORIGINAL LOCAL FUNCTIONALITY (PRESERVED)
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

    private async handleUserMessageLocal(message: string) {
        if (!this.openai) {
            this._view?.webview.postMessage({
                type: 'botResponse',
                message: 'Please set your OpenAI API key first.',
                isLoading: false
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
                isLoading: false,
                source: 'local'
            });

        } catch (error: any) {
            this._view?.webview.postMessage({
                type: 'botResponse',
                message: `Error: ${error.message}`,
                isLoading: false
            });
        }
    }

    // NEW BACKEND FUNCTIONALITY
    private async testBackendConnection() {
        if (!this.backendUrl) {
            this._view?.webview.postMessage({
                type: 'connectionStatus',
                status: 'error',
                message: 'Backend URL not configured'
            });
            return;
        }

        try {
            const fetch = await import('node-fetch');
            const response = await fetch.default(`${this.backendUrl}/api/health`, {
                method: 'GET',
                timeout: 5000
            });

            if (response.ok) {
                this._view?.webview.postMessage({
                    type: 'connectionStatus',
                    status: 'connected',
                    message: 'Backend connected successfully'
                });
                console.log('AI4U Backend connected');
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            this._view?.webview.postMessage({
                type: 'connectionStatus',
                status: 'error',
                message: `Backend connection failed: ${error}`
            });
            console.error('AI4U Backend connection failed:', error);
            
            // Fallback to local mode
            this.useBackend = false;
            this._view?.webview.postMessage({
                type: 'modeChanged',
                mode: 'local',
                message: 'Switched to local mode due to backend connection failure'
            });
        }
    }

    private async handleUserMessageBackend(message: string) {
        if (!this.backendUrl) {
            // Fallback to local mode
            await this.handleUserMessageLocal(message);
            return;
        }

        try {
            const fetch = await import('node-fetch');
            
            // Show loading state
            this._view?.webview.postMessage({
                type: 'botResponse',
                message: 'Thinking...',
                isLoading: true
            });

            const requestBody = {
                message: message,
                session_id: this.sessionId,
                user_id: 'vscode-user'
            };

            const response = await fetch.default(`${this.backendUrl}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
                timeout: 30000
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Backend request failed');
            }

            const data = await response.json();
            
            // Store session ID for future requests
            this.sessionId = data.session_id;

            this._view?.webview.postMessage({
                type: 'botResponse',
                message: data.response,
                isLoading: false,
                source: 'backend',
                sessionId: data.session_id,
                messageId: data.message_id
            });

        } catch (error: any) {
            console.error('AI4U Backend error, falling back to local:', error);
            
            // Fallback to local mode for this message
            this._view?.webview.postMessage({
                type: 'botResponse',
                message: 'Backend unavailable, switching to local mode...',
                isLoading: true
            });
            
            await this.handleUserMessageLocal(message);
        }
    }

    private async loadChatHistory() {
        if (!this.useBackend || !this.backendUrl || !this.sessionId) {
            return;
        }

        try {
            const fetch = await import('node-fetch');
            const response = await fetch.default(`${this.backendUrl}/api/chat/history/${this.sessionId}`, {
                method: 'GET',
                timeout: 10000
            });

            if (response.ok) {
                const data = await response.json();
                this._view?.webview.postMessage({
                    type: 'chatHistory',
                    messages: data.messages
                });
            }
        } catch (error) {
            console.error('AI4U Failed to load chat history:', error);
        }
    }

    private async clearSession() {
        if (!this.useBackend || !this.backendUrl || !this.sessionId) {
            // Local clear - just clear the UI
            this._view?.webview.postMessage({
                type: 'sessionCleared'
            });
            return;
        }

        try {
            const fetch = await import('node-fetch');
            const response = await fetch.default(`${this.backendUrl}/api/chat/session/${this.sessionId}`, {
                method: 'DELETE',
                timeout: 10000
            });

            if (response.ok) {
                this.sessionId = undefined;
                this._view?.webview.postMessage({
                    type: 'sessionCleared'
                });
            }
        } catch (error) {
            console.error('AI4U Failed to clear session:', error);
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
                
                .mode-local {
                    background-color: #2196F3;
                    color: white;
                }
                
                .mode-backend {
                    background-color: #4CAF50;
                    color: white;
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
                
                .btn {
                    padding: 5px 10px;
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    cursor: pointer;
                    border-radius: 3px;
                    font-size: 11px;
                }
                
                .btn:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                
                .btn-secondary {
                    background-color: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                }
                
                .btn-secondary:hover {
                    background-color: var(--vscode-button-secondaryHoverBackground);
                }
                
                .control-buttons {
                    display: flex;
                    gap: 5px;
                    flex-wrap: wrap;
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
                    margin-bottom: 5px;
                }
                
                .status.connected {
                    color: #4CAF50;
                }
                
                .status.error {
                    color: #f44336;
                }
                
                .hidden {
                    display: none;
                }
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
                
                function toggleBackend() {
                    vscode.postMessage({ type: 'toggleBackend' });
                }
                
                function testConnection() {
                    vscode.postMessage({ type: 'testConnection' });
                }
                
                function loadHistory() {
                    vscode.postMessage({ type: 'loadHistory' });
                }
                
                function clearSession() {
                    vscode.postMessage({ type: 'clearSession' });
                }
                
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
                                // Remove loading message and add actual response
                                const messages = document.getElementById('messages');
                                const lastMessage = messages.lastElementChild;
                                if (lastMessage && lastMessage.textContent === 'Thinking...') {
                                    messages.removeChild(lastMessage);
                                }
                                
                                addMessage(message.message, 'bot', message.source);
                                document.getElementById('sendBtn').disabled = false;
                                
                                if (message.sessionId) {
                                    currentSessionId = message.sessionId;
                                }
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
                
                // Initialize UI
                updateUI('local');
            </script>
        </body>
        </html>`;
    }
}