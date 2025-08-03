export class BaseJavaScriptManager {
    
    public static getCoreVariables(): string {
        return `
                const vscode = acquireVsCodeApi();
                let currentMode = 'local';
                let currentSessionId = null;
        `;
    }

    public static getBaseFunctions(): string {
        return `
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
        `;
    }

    public static getBaseMessageHandlers(): string {
        return `
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
                                message.message || (message.mode.toUpperCase() + ' mode active');
                            break;
                            
                        case 'chatHistory':
                            const messagesContainer = document.getElementById('messages');
                            messagesContainer.innerHTML = '';
                            message.messages.forEach(function(msg) {
                                addMessage(msg.content, msg.role === 'user' ? 'user' : 'bot', 'backend');
                            });
                            break;
                            
                        case 'sessionCleared':
                            document.getElementById('messages').innerHTML = '';
                            currentSessionId = null;
                            break;
        `;
    }

    public static getInitialization(): string {
        return `
                // Initialize UI
                updateUI('local');
        `;
    }
}