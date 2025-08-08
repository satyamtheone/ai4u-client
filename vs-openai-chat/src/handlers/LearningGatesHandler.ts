// src/handlers/LearningGatesHandler.ts
import * as vscode from 'vscode';
import { AI4UConfig } from '../services/ConfigManager';
import { ServiceCoordinator } from '../coordinators/ServiceCoordinator';
import { ModeCoordinator } from '../coordinators/ModeCoordinator';
import { LOGGER } from '../logger';

interface QuizResult {
    correct: boolean;
    explanation?: string;
    unlockedResponses: number;
    levelUp?: boolean;
    level_up?: boolean;
}

interface StatsUpdateMessage {
    type: 'updateStats';
    stats: any;
}

/**
 * LearningGatesHandler manages all learning gates functionality
 * Preserves all original learning gates logic
 */
export class LearningGatesHandler {
    private view?: vscode.WebviewView;
    private pendingUserMessage: string | null = null; // ← FIX: Properly initialize

    constructor(
        private services: ServiceCoordinator,
        private modeCoordinator: ModeCoordinator
    ) {}

    /**
     * Set the webview for sending messages
     */
    public setView(view: vscode.WebviewView) {
        this.view = view;
    }

    /**
     * Handle quiz answer
     */
    public async handleQuizAnswer(questionId: string, selectedAnswer: number, config: AI4UConfig) {
        try {
            let result: QuizResult;
            let statsUpdateMessage: StatsUpdateMessage;
            
            // Process quiz answer (backend or local)
            const useBackendLearningGates = this.modeCoordinator.shouldUseBackendLearningGates(config);
            
            if (useBackendLearningGates) {
                LOGGER('AI4U Processing quiz answer on backend');
                const backendResult = await this.services.backendService.submitQuizAnswer(questionId, selectedAnswer);
                
                if (backendResult) {
                    result = backendResult.result;
                    statsUpdateMessage = {
                        type: 'updateStats',
                        stats: backendResult.updated_stats
                    };
                } else {
                    throw new Error('Backend quiz submission failed, falling back to local');
                }
            } else {
                LOGGER('AI4U Processing quiz answer locally');
                result = this.services.learningGateService.submitAnswer(questionId, selectedAnswer);
                
                const stats = this.services.learningGateService.getStats();
                statsUpdateMessage = {
                    type: 'updateStats',
                    stats: stats
                };
            }
            
            LOGGER(`AI4U Quiz answer submitted: ${JSON.stringify(result)}`);
            
            // Process pending message immediately (before UI updates)
            const unlockedResponses = result.unlockedResponses;
            if (result.correct || unlockedResponses > 0) {
                const pendingMessage = this.pendingUserMessage;
                this.pendingUserMessage = null;
                
                if (pendingMessage) {
                    LOGGER(`AI4U Processing pending message: ${pendingMessage}`);
                    try {
                        const response = await this.services.openaiService.sendMessage(pendingMessage);
                        this.services.uiManager.showBotResponse(
                            response.message,
                            false,
                            response.source
                        );
                        LOGGER(`AI4U Successfully processed pending message`);
                    } catch (error) {
                        LOGGER(`AI4U Error processing pending message: ${error}`, 'ERROR');
                        this.services.uiManager.showBotResponse(
                            `Error processing your message: ${error}`,
                            false
                        );
                    }
                } else {
                    LOGGER('AI4U No pending message to process', 'WARN');
                }
            }
            
            // Update UI (non-blocking)
            setImmediate(() => {
                try {
                    this.view?.webview.postMessage({
                        type: 'showQuizResult',
                        result: result
                    });
                    
                    if (statsUpdateMessage) {
                        this.view?.webview.postMessage(statsUpdateMessage);
                    }
                    
                    LOGGER(`AI4U UI updates sent successfully`);
                } catch (uiError) {
                    LOGGER(`AI4U Error sending UI updates: ${uiError}`, 'ERROR');
                }
            });
            
        } catch (error) {
            LOGGER(`AI4U Error in handleQuizAnswer: ${error}`, 'ERROR');
            this.handleQuizError(error, questionId, selectedAnswer, 'submit');
        }
    }

    /**
     * Handle quiz skip - preserving original logic exactly
     */
    public async handleSkipQuiz(config: AI4UConfig) {
        try {
            let result;
            let statsUpdateMessage;
            
            const useBackendLearningGates = this.modeCoordinator.shouldUseBackendLearningGates(config);
            
            if (useBackendLearningGates) {
                // Use backend for skip processing
                LOGGER('AI4U Processing quiz skip on backend');
                const backendResult = await this.services.backendService.skipQuiz();
                
                if (backendResult) {
                    result = backendResult.result;
                    statsUpdateMessage = {
                        type: 'updateStats',
                        stats: backendResult.updated_stats
                    };
                } else {
                    throw new Error('Backend quiz skip failed, falling back to local');
                }
            } else {
                // Local skip logic (preserving original)
                LOGGER('AI4U Processing quiz skip locally');
                result = {
                    correct: false,
                    unlockedResponses: 1,
                    explanation: 'Quiz skipped - you get 1 limited response.',
                    levelUp: false
                };
            }
            
            LOGGER(`AI4U Quiz skipped: ${JSON.stringify(result)}`);
            
            this.view?.webview.postMessage({
                type: 'showQuizResult',
                result: result
            });
            
            // Update UI with stats if available
            if (statsUpdateMessage) {
                this.view?.webview.postMessage(statsUpdateMessage);
            }

            // ← FIX: Process pending message after skip as well
            const pendingMessage = this.pendingUserMessage;
            this.pendingUserMessage = null;
            
            if (pendingMessage) {
                LOGGER(`AI4U Processing pending message after skip: ${pendingMessage}`);
                try {
                    const response = await this.services.openaiService.sendMessage(pendingMessage);
                    this.services.uiManager.showBotResponse(
                        response.message,
                        false,
                        response.source
                    );
                } catch (error) {
                    LOGGER(`AI4U Error processing pending message after skip: ${error}`, 'ERROR');
                    this.services.uiManager.showBotResponse(
                        `Error processing your message: ${error}`,
                        false
                    );
                }
            }
            
        } catch (error) {
            this.handleQuizError(error, '', 0, 'skip');
        }
    }

    /**
     * Handle quiz errors with fallback - preserving original error handling
     */
    private handleQuizError(error: any, questionId: string, selectedAnswer: number, action: 'submit' | 'skip') {
        LOGGER(`AI4U Error ${action}ting quiz: ${error}`, 'ERROR');
        
        if (error instanceof Error) {
            LOGGER(`AI4U Error ${action}ting quiz: ${error.message}`, 'ERROR');
            // Fallback to local processing if backend fails
            if (error.message.includes('falling back to local')) {
                try {
                    LOGGER(`AI4U Falling back to local quiz ${action}ing`);
                    
                    let result;
                    if (action === 'submit') {
                        result = this.services.learningGateService.submitAnswer(questionId, selectedAnswer);
                        
                        const stats = this.services.learningGateService.getStats();
                        this.view?.webview.postMessage({
                            type: 'updateStats',
                            stats: stats
                        });
                    } else {
                        result = {
                            correct: false,
                            unlockedResponses: 1,
                            explanation: 'Quiz skipped - you get 1 limited response.',
                            levelUp: false
                        };
                    }
                    
                    this.view?.webview.postMessage({
                        type: 'showQuizResult',
                        result: result
                    });

                    // ← FIX: Process pending message in error fallback too
                    const pendingMessage = this.pendingUserMessage;
                    this.pendingUserMessage = null;
                    
                    if (pendingMessage) {
                        LOGGER(`AI4U Processing pending message in fallback: ${pendingMessage}`);
                        this.services.openaiService.sendMessage(pendingMessage).then(response => {
                            this.services.uiManager.showBotResponse(
                                response.message,
                                false,
                                response.source
                            );
                        }).catch(err => {
                            LOGGER(`AI4U Error in fallback message processing: ${err}`, 'ERROR');
                        });
                    }
                } catch (localError) {
                    LOGGER(`AI4U Local fallback also failed: ${localError}`, 'ERROR');
                    this.services.uiManager.showErrorMessage(`Failed to ${action} quiz answer`);
                }
            } else {
                this.services.uiManager.showErrorMessage(`Failed to ${action} quiz`);
            }
        } else {
            // Generic fallback for non-Error types (preserving original logic)
            LOGGER(`AI4U Error ${action}ting quiz: ${JSON.stringify(error)}`, 'ERROR');
            this.services.uiManager.showErrorMessage(`Failed to ${action} quiz`);
        }
    }

    /**
     * Toggle learning gates - preserving original method signature and logic
     */
    public async toggleLearningGates(enabled: boolean) {
        this.services.learningGateService.updateConfig({ enabled });
        
        // Save to configuration
        const config = vscode.workspace.getConfiguration('ai4u');
        await config.update('learningGates.enabled', enabled, vscode.ConfigurationTarget.Global);
        LOGGER(`AI4U Learning gates toggled: {enabled: ${enabled}}`);
        this.services.uiManager.showNotification(
            'info', 
            `Learning Gates ${enabled ? 'enabled' : 'disabled'}`
        );

        // Send confirmation back to UI (fixing the toggle button issue)
        this.view?.webview.postMessage({
            type: 'learningGatesToggled',
            enabled: enabled
        });
    }

    /**
     * Show learning gate - preserving original logic
     * ← FIX: Make sure to properly store the pending message
     */
    public async showLearningGate(userMessage?: string): Promise<boolean> {
        const question = this.services.learningGateService.getQuizQuestion();
        if (!question) {
            return false;
        }

        // Store the user message to process after gate completion
        if (userMessage) {
            this.pendingUserMessage = userMessage;
            LOGGER(`AI4U Storing pending message: ${userMessage}`);
        }

        const stats = this.services.learningGateService.getStats();
        
        this.view?.webview.postMessage({
            type: 'showQuiz',
            question: question,
            stats: stats
        });

        return true;
    }

    /**
     * Check if should show gate
     */
    public shouldShowGate(): boolean {
        return this.services.learningGateService.shouldShowGate();
    }

    /**
     * Get learning gate status - preserving original method signature
     */
    public getLearningGateStatus(): {
        enabled: boolean;
        stats: any;
        config: any;
        backend: boolean;
        backendLearningGates: boolean;
    } {
        return this.services.getLearningGateStatus();
    }

    /**
     * Get backend stats
     */
    public async getBackendStats(): Promise<any | null> {
        return await this.services.getBackendStats();
    }

    /**
     * Reset learning progress
     */
    public resetLearningProgress() {
        this.services.resetLearningProgress();
        this.pendingUserMessage = null; // ← FIX: Clear pending message on reset
    }
}