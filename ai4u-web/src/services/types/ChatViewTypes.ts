// src/types/ChatViewTypes.ts

/**
 * Shared types and interfaces for the modular ChatViewProvider
 */

export interface ServiceStatus {
    openai: { connected: boolean; message: string };
    backend: { connected: boolean; message: string };
    mode: 'local' | 'backend';
    learningGates: {
        enabled: boolean;
        stats: any;
        config: any;
        backendLearningGates: boolean;
    };
}

export interface LearningGateStatus {
    enabled: boolean;
    stats: any;
    config: any;
    backend: boolean;
    backendLearningGates: boolean;
}

export interface QuizResult {
    correct: boolean;
    unlockedResponses: number;
    explanation: string;
    levelUp: boolean;
}

export interface BackendQuizResult {
    result: QuizResult;
    updated_stats: any;
}

export interface ChatMessage {
    type: string;
    message?: string;
    response?: string;
    error?: boolean;
    question?: any;
    stats?: any;
    session_id?: string;
}

export interface ConfigurationValidation {
    valid: boolean;
    errors: string[];
}