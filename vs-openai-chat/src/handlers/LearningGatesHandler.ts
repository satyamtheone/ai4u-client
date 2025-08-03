// src/handlers/LearningGatesHandler.ts
import * as vscode from 'vscode';
import { AI4UConfig } from '../services/ConfigManager';
import { ServiceCoordinator } from '../coordinators/ServiceCoordinator';
import { ModeCoordinator } from '../coordinators/ModeCoordinator';
import { LOGGER } from '../logger';

/**
 * LearningGatesHandler manages all learning gates functionality
 * Preserves all original learning gates logic
 */
export class LearningGatesHandler {
    private view?: vscode.WebviewView;

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
     * Handle quiz answer submission - preserving original logic exactly
     */
    public async handleQuizAnswer(questionId: string, selectedAnswer: number, config: AI4UConfig) {
        try {
            let result;
            let statsUpdateMessage;
            
            // Determine where to process quiz (backend vs local) - original logic
            const useBackendLearningGates = this.modeCoordinator.shouldUseBackendLearningGates(config);
            
            if (useBackendLearningGates) {
                // Use backend for quiz processing
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
                // Use local learning gate service
                LOGGER('AI4U Processing quiz answer locally');
                result = this.services.learningGateService.submitAnswer(questionId, selectedAnswer);
                
                const stats = this.services.learningGateService.getStats();
                statsUpdateMessage = {
                    type: 'updateStats',
                    stats: stats
                };
            }
            
            LOGGER(`AI4U Quiz answer submitted: ${JSON.stringify(result)}`);
            
            // Send result to UI
            this.view?.webview.postMessage({
                type: 'showQuizResult',
                result: result
            });
            
            // Update UI with stats
            if (statsUpdateMessage) {
                this.view?.webview.postMessage(statsUpdateMessage);
            }
            
        } catch (error) {
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
     */
    public async showLearningGate(): Promise<boolean> {
        const question = this.services.learningGateService.getQuizQuestion();
        if (!question) {
            // No questions available, allow normal response
            return false;
        }

        const stats = this.services.learningGateService.getStats();
        
        // Send quiz to UI
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
    }
}