import { BackendChatRequest, ChatResponse, QuizSubmission, BackendQuizResult } from '../types';


export class BackendService {
    private backendUrl?: string;
    private sessionId?: string;
    private isConnected: boolean = false;
    private userId: string = 'web-user';
    private learningGatesEnabled: boolean = false;

    constructor(backendUrl?: string) {
        this.backendUrl = backendUrl;
        console.log('Backend Service initialized with URL:', backendUrl);
    }

    public setBackendUrl(url: string | undefined) {
        this.backendUrl = url;
        this.isConnected = false;
    }

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
            const response = await fetch(`${this.backendUrl}/api/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000)
            });

            if (response.ok) {
                this.isConnected = true;
                const data = await response.json();
                console.log('Backend Service: Connection successful');
                
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

    public async sendMessage(message: string): Promise<ChatResponse> {
        if (!this.backendUrl) {
            return {
                type: 'chat_response',
                error: 'Backend URL not configured',
                source: 'backend'
            };
        }

        try {
            const requestBody: BackendChatRequest = {
                message: message,
                session_id: this.sessionId,
                user_id: this.userId,
                enable_learning_gates: this.learningGatesEnabled
            };

            const url = this.learningGatesEnabled 
                ? `${this.backendUrl}/api/chat?learning_gates=true`
                : `${this.backendUrl}/api/chat`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
                signal: AbortSignal.timeout(30000)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Backend request failed');
            }

            const data = await response.json();
            
            if (data.type) {
                if (data.type === 'learning_gate') {
                    return {
                        type: 'learning_gate',
                        question: data.question,
                        stats: data.stats,
                        message: data.message,
                        source: 'backend'
                    };
                } else {
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

    public async submitQuizAnswer(questionId: string, selectedAnswer: number): Promise<BackendQuizResult | null> {
        if (!this.backendUrl) {
            return null;
        }

        try {
            const submission: QuizSubmission = {
                question_id: questionId,
                selected_answer: selectedAnswer,
                user_id: this.userId
            };

            const response = await fetch(`${this.backendUrl}/api/quiz/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submission),
                signal: AbortSignal.timeout(10000)
            });

            if (response.ok) {
                const data = await response.json();
                return data as BackendQuizResult;
            } else {
                console.error('Backend Service: Quiz submission failed', response.status);
                return null;
            }
        } catch (error) {
            console.error('Backend Service: Quiz submission error:', error);
            return null;
        }
    }

    public async skipQuiz(): Promise<BackendQuizResult | null> {
        if (!this.backendUrl) {
            return null;
        }

        try {
            const response = await fetch(`${this.backendUrl}/api/quiz/skip?user_id=${this.userId}`, {
                method: 'POST',
                signal: AbortSignal.timeout(10000)
            });

            if (response.ok) {
                const data = await response.json();
                return data as BackendQuizResult;
            } else {
                console.error('Backend Service: Quiz skip failed', response.status);
                return null;
            }
        } catch (error) {
            console.error('Backend Service: Quiz skip error:', error);
            return null;
        }
    }

    public async getQuizQuestions(count: number = 3, userId?: string): Promise<any[] | null> {
        if (!this.backendUrl) {
            return null;
        }

        try {
            const url = `${this.backendUrl}/api/quiz/questions?count=${count}&user_id=${userId || this.userId}`;
            
            const response = await fetch(url, {
                method: 'GET',
                signal: AbortSignal.timeout(10000)
            });

            if (response.ok) {
                const data = await response.json();
                return data.questions;
            } else {
                console.error('Backend Service: Get quiz questions failed', response.status);
                return null;
            }
        } catch (error) {
            console.error('Backend Service: Get quiz questions error:', error);
            return null;
        }
    }

    public async submitQuizAnswers(answers: {question_id: string, selected_answer: number, answer_type: string}[], user_id?: string): Promise<any | null> {
        if (!this.backendUrl) {
            return null;
        }

        try {
            const submission = {
                answers: answers,
                user_id: user_id || this.userId
            };

            const response = await fetch(`${this.backendUrl}/api/quiz/submit-batch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submission),
                signal: AbortSignal.timeout(15000)
            });

            if (response.ok) {
                const data = await response.json();
                return data;
            } else {
                console.error('Backend Service: Batch quiz submission failed', response.status);
                return null;
            }
        } catch (error) {
            console.error('Backend Service: Batch quiz submission error:', error);
            return null;
        }
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

    public getSessionId(): string | undefined {
        return this.sessionId;
    }
}