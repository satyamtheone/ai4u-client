export class BaseJavaScriptManager {
    
    public static getCoreVariables(): string {
        return `
                const vscode = acquireVsCodeApi();
                let currentMode = 'backend';
                let currentSessionId = null;
        `;
    }

    public static getBaseFunctions(): string {
        return `
                function testConnection() { vscode.postMessage({ type: 'testConnection' }); }
                function loadHistory() { vscode.postMessage({ type: 'loadHistory' }); }
                function clearSession() { vscode.postMessage({ type: 'clearSession' }); }
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
                            
                        case 'connectionStatus':
                            const status = document.getElementById('connectionStatus');
                            status.textContent = message.message;
                            status.className = 'status ' + message.status;
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
                updateUI('backend');
        `;
    }
}