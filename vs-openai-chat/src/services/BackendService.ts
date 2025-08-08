export interface BackendChatRequest {
    message: string;
    session_id?: string;
    user_id: string;
    enable_learning_gates?: boolean; // NEW: Optional learning gates
}

export interface QuizSubmission {
    question_id: string;
    selected_answer: number;
    user_id: string;
}

// NEW: Enhanced response interface
export interface EnhancedChatResponse {
    type: 'chat_response' | 'learning_gate';
    response?: string;
    session_id: string;
    message_id?: string;
    timestamp: string;
    // Learning gate fields
    question?: any;
    stats?: any;
    message?: string;
}

// EXISTING: Original response interface (for backward compatibility)
export interface OriginalChatResponse {
    response: string;
    session_id: string;
    message_id: string;
    timestamp: string;
}

export interface ChatResponse {
    type: 'chat_response' | 'learning_gate';
    response?: string;
    question?: any;
    stats?: any;
    message?: string;
    session_id?: string;
    timestamp?: string;
    error?: string;
    source: 'backend';
}

export interface QuizResult {
    result: {
        correct: boolean;
        explanation?: string;
        unlockedResponses: number;
        level_up: boolean;
        new_level?: number;
    };
    updated_stats: {
        level: number;
        currentStreak: number;
        accuracy: number;
        totalQuestions: number;
        unlockedResponses: number;
    };
}

export class BackendService {
    private backendUrl?: string;
    private sessionId?: string;
    private isConnected: boolean = false;
    private userId: string = 'vscode-user';
    private learningGatesEnabled: boolean = false; // NEW: Track learning gates state

    constructor(backendUrl?: string) {
        this.backendUrl = backendUrl;
        console.log('Backend Service initialized with URL:', backendUrl);
    }

    public setBackendUrl(url: string | undefined) {
        this.backendUrl = url;
        this.isConnected = false;
    }

    public getBackendUrl(): string | undefined {
        return this.backendUrl;
    }

    // NEW: Enable/disable learning gates
    public setLearningGatesEnabled(enabled: boolean) {
        this.learningGatesEnabled = enabled;
        console.log('Backend Service: Learning gates', enabled ? 'enabled' : 'disabled');
    }

    public isLearningGatesEnabled(): boolean {
        return this.learningGatesEnabled;
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
                console.log('Backend Service: Connection successful');
                
                // Check if backend supports learning gates
                const features = data.features || [];
                const supportsLearningGates = features.includes('learning_gates');
                
                return { 
                    connected: true, 
                    message: `Backend connected (v${data.version || 'unknown'})${supportsLearningGates ? ' with Learning Gates' : ''}` 
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

    // ENHANCED: Now supports both old and new API formats
    public async sendMessage(message: string): Promise<ChatResponse> {
        if (!this.backendUrl) {
            return {
                type: 'chat_response',
                error: 'Backend URL not configured',
                source: 'backend'
            };
        }

        try {
            const fetch = await import('node-fetch');
            
            const requestBody: BackendChatRequest = {
                message: message,
                session_id: this.sessionId,
                user_id: this.userId,
                enable_learning_gates: this.learningGatesEnabled // NEW: Send learning gates preference
            };

            // NEW: Use query parameter for learning gates (backward compatible)
            const url = this.learningGatesEnabled 
                ? `${this.backendUrl}/api/chat?learning_gates=true`
                : `${this.backendUrl}/api/chat`;

            const response = await fetch.default(url, {
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
            
            // Handle both new enhanced format and old format
            if (data.type) {
                // NEW: Enhanced format with learning gates
                if (data.type === 'learning_gate') {
                    return {
                        type: 'learning_gate',
                        question: data.question,
                        stats: data.stats,
                        message: data.message,
                        source: 'backend'
                    };
                } else {
                    // Enhanced chat response
                    if (data.session_id) {
                        this.sessionId = data.session_id;
                    }
                    return {
                        type: 'chat_response',
                        response: data.response,
                        session_id: data.session_id,
                        timestamp: data.timestamp,
                        source: 'backend'
                    };
                }
            } else {
                // OLD: Original format (backward compatibility)
                if (data.session_id) {
                    this.sessionId = data.session_id;
                }
                return {
                    type: 'chat_response',
                    response: data.response,
                    session_id: data.session_id,
                    timestamp: data.timestamp,
                    source: 'backend'
                };
            }

        } catch (error: any) {
            console.error('Backend Service: Send message error:', error);
            return {
                type: 'chat_response',
                error: error.message,
                source: 'backend'
            };
        }
    }

    // NEW: Submit quiz answer to backend
    public async submitQuizAnswer(questionId: string, selectedAnswer: number): Promise<QuizResult | null> {
        if (!this.backendUrl) {
            return null;
        }

        try {
            const fetch = await import('node-fetch');
            
            const submission: QuizSubmission = {
                question_id: questionId,
                selected_answer: selectedAnswer,
                user_id: this.userId
            };

            const response = await fetch.default(`${this.backendUrl}/api/quiz/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submission),
                timeout: 10000
            });

            if (response.ok) {
                const data = await response.json();
                return data as QuizResult;
            } else {
                console.error('Backend Service: Quiz submission failed', response.status);
                return null;
            }
        } catch (error) {
            console.error('Backend Service: Quiz submission error:', error);
            return null;
        }
    }

    // NEW: Skip quiz on backend
    public async skipQuiz(): Promise<QuizResult | null> {
        if (!this.backendUrl) {
            return null;
        }

        try {
            const fetch = await import('node-fetch');
            
            const response = await fetch.default(`${this.backendUrl}/api/quiz/skip?user_id=${this.userId}`, {
                method: 'POST',
                timeout: 10000
            });

            if (response.ok) {
                const data = await response.json();
                return data as QuizResult;
            } else {
                console.error('Backend Service: Quiz skip failed', response.status);
                return null;
            }
        } catch (error) {
            console.error('Backend Service: Quiz skip error:', error);
            return null;
        }
    }

    // NEW: Get user stats from backend
    public async getUserStats(): Promise<any | null> {
        if (!this.backendUrl) {
            return null;
        }

        try {
            const fetch = await import('node-fetch');
            
            const response = await fetch.default(`${this.backendUrl}/api/user/stats/${this.userId}`, {
                method: 'GET',
                timeout: 5000
            });

            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('Backend Service: Get stats error:', error);
            return null;
        }
    }

    // NEW: Reset user progress
    public async resetProgress(): Promise<boolean> {
        if (!this.backendUrl) {
            return false;
        }

        try {
            const fetch = await import('node-fetch');
            
            const response = await fetch.default(`${this.backendUrl}/api/user/reset/${this.userId}`, {
                method: 'POST',
                timeout: 5000
            });

            return response.ok;
        } catch (error) {
            console.error('Backend Service: Reset progress error:', error);
            return false;
        }
    }

    // EXISTING METHODS (UNCHANGED for backward compatibility)
    public async loadChatHistory(): Promise<any[] | null> {
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
            this.sessionId = undefined;
            return true;
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
            const gatesStatus = this.learningGatesEnabled ? ' with Learning Gates enabled' : '';
            return { connected: true, message: `Backend connected${gatesStatus}` };
        } else if (this.backendUrl) {
            return { connected: false, message: 'Backend configured but not connected' };
        } else {
            return { connected: false, message: 'Backend not configured' };
        }
    }

    // NEW: Get backend capabilities
    public async getCapabilities(): Promise<{ features: string[], version: string } | null> {
        if (!this.backendUrl) {
            return null;
        }

        try {
            const fetch = await import('node-fetch');
            const response = await fetch.default(`${this.backendUrl}/api/health`, {
                method: 'GET',
                timeout: 5000
            });

            if (response.ok) {
                const data = await response.json();
                return {
                    features: data.features || [],
                    version: data.version || 'unknown'
                };
            }
            return null;
        } catch (error) {
            console.error('Backend Service: Get capabilities error:', error);
            return null;
        }
    }

    // NEW: Admin stats (if needed)
    public async getAdminStats(): Promise<any | null> {
        if (!this.backendUrl) {
            return null;
        }

        try {
            const fetch = await import('node-fetch');
            const response = await fetch.default(`${this.backendUrl}/api/admin/stats`, {
                method: 'GET',
                timeout: 5000
            });

            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('Backend Service: Get admin stats error:', error);
            return null;
        }
    }
}