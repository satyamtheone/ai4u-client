import { OpenAI } from 'openai';
import { LOGGER } from '../logger';
export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface ChatResponse {
    message: string;
    source: 'local';
    error?: string;
}

export class OpenAIService {
    private openai?: OpenAI;
    private isInitialized: boolean = false;

    constructor() {
        LOGGER('OpenAI Service initialized');
    }

    public initialize(apiKey: string): boolean {
        try {
            this.openai = new OpenAI({
                apiKey: apiKey
            });
            this.isInitialized = true;
            LOGGER('OpenAI Service: API key set successfully');
            return true;
        } catch (error) {
            console.error('OpenAI Service: Failed to initialize:', error);
            this.isInitialized = false;
            return false;
        }
    }

    public isReady(): boolean {
        return this.isInitialized && !!this.openai;
    }

    public async sendMessage(message: string): Promise<ChatResponse> {
        if (!this.isReady()) {
            return {
                message: 'Please set your OpenAI API key first.',
                source: 'local',
                error: 'API key not set'
            };
        }

        try {
            const completion = await this.openai!.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: message }],
                max_tokens: 500
            });

            const response = completion.choices[0]?.message?.content || 'No response received.';

            return {
                message: response,
                source: 'local'
            };

        } catch (error: any) {
            console.error('OpenAI Service: Chat completion error:', error);
            return {
                message: `Error: ${error.message}`,
                source: 'local',
                error: error.message
            };
        }
    }

    public getStatus(): { connected: boolean; message: string } {
        if (this.isReady()) {
            return { connected: true, message: 'OpenAI API connected' };
        } else {
            return { connected: false, message: 'OpenAI API not configured' };
        }
    }
}