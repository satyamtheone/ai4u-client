import { LOGGER } from '../logger';
export interface BackendChatMessage {
    role: string;
    content: string;
    timestamp?: string;
}

export interface BackendChatResponse {
    response: string;
    session_id: string;
    message_id: string;
    timestamp: string;
}

export interface BackendChatRequest {
    message: string;
    session_id?: string;
    user_id: string;
}

export interface ChatResponse {
    message: string;
    source: 'backend';
    sessionId?: string;
    messageId?: string;
    error?: string;
}

export class BackendService {
    private backendUrl?: string;
    private sessionId?: string;
    private isConnected: boolean = false;

    constructor(backendUrl?: string) {
        this.backendUrl = backendUrl;
        LOGGER(`Backend Service initialized with URL: ${backendUrl}`);
    }

    public setBackendUrl(url: string | undefined) {
        this.backendUrl = url;
        this.isConnected = false; // Reset connection status
        LOGGER(`Backend Service: URL updated to: ${url || 'undefined'}`);
    }

    public getBackendUrl(): string | undefined {
        return this.backendUrl;
    }

    public async testConnection(): Promise<{ connected: boolean; message: string }> {
        if (!this.backendUrl) {
            return { connected: false, message: 'Backend URL not configured' };
        }

        try {
            const fetch = await import('node-fetch');
            const response = await fetch.default(`${this.backendUrl}/api/health`, {
                method: 'GET',
                timeout: 5000
            });

            if (response.ok) {
                this.isConnected = true;
                const data = await response.json();
                LOGGER('Backend Service: Connection successful');
                return { 
                    connected: true, 
                    message: `Backend connected successfully (v${data.version || 'unknown'})` 
                };
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error: any) {
            console.error('Backend Service: Connection failed:', error);
            this.isConnected = false;
            return { 
                connected: false, 
                message: `Backend connection failed: ${error.message}` 
            };
        }
    }

    public isReady(): boolean {
        return this.isConnected && !!this.backendUrl;
    }

    public async sendMessage(message: string): Promise<ChatResponse> {
        if (!this.backendUrl) {
            return {
                message: 'Backend URL not configured',
                source: 'backend',
                error: 'Backend URL not configured'
            };
        }

        try {
            const fetch = await import('node-fetch');
            
            const requestBody: BackendChatRequest = {
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

            const data: BackendChatResponse = await response.json();
            
            // Store session ID for future requests
            this.sessionId = data.session_id;

            return {
                message: data.response,
                source: 'backend',
                sessionId: data.session_id,
                messageId: data.message_id
            };

        } catch (error: any) {
            console.error('Backend Service: Send message error:', error);
            return {
                message: `Backend error: ${error.message}`,
                source: 'backend',
                error: error.message
            };
        }
    }

    public async loadChatHistory(): Promise<BackendChatMessage[] | null> {
        if (!this.backendUrl || !this.sessionId) {
            return null;
        }

        try {
            const fetch = await import('node-fetch');
            const response = await fetch.default(`${this.backendUrl}/api/chat/history/${this.sessionId}`, {
                method: 'GET',
                timeout: 10000
            });

            if (response.ok) {
                const data = await response.json();
                return data.messages;
            }
            return null;
        } catch (error) {
            console.error('Backend Service: Failed to load chat history:', error);
            return null;
        }
    }

    public async clearSession(): Promise<boolean> {
        if (!this.backendUrl || !this.sessionId) {
            return true; // Nothing to clear
        }

        try {
            const fetch = await import('node-fetch');
            const response = await fetch.default(`${this.backendUrl}/api/chat/session/${this.sessionId}`, {
                method: 'DELETE',
                timeout: 10000
            });

            if (response.ok) {
                this.sessionId = undefined;
                return true;
            }
            return false;
        } catch (error) {
            console.error('Backend Service: Failed to clear session:', error);
            return false;
        }
    }

    public getSessionId(): string | undefined {
        return this.sessionId;
    }

    public getStatus(): { connected: boolean; message: string } {
        if (this.isReady()) {
            return { connected: true, message: 'Backend connected' };
        } else if (this.backendUrl) {
            return { connected: false, message: 'Backend configured but not connected' };
        } else {
            return { connected: false, message: 'Backend not configured' };
        }
    }
}