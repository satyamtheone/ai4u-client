// src/handlers/UserMessageHandler.ts
import * as vscode from 'vscode';
import { ServiceCoordinator } from '../coordinators/ServiceCoordinator';
import { ConfigurationCoordinator } from '../coordinators/ConfigurationCoordinator';
import { ModeCoordinator } from '../coordinators/ModeCoordinator';
import { LearningGatesHandler } from './LearningGatesHandler';
import { LOGGER } from '../logger';

/**
 * UserMessageHandler processes user messages and determines response flow
 * Preserves all original user message handling logic
 */
export class UserMessageHandler {
    private view?: vscode.WebviewView;

    constructor(
        private services: ServiceCoordinator,
        private configCoordinator: ConfigurationCoordinator,
        private modeCoordinator: ModeCoordinator,
        private learningGatesHandler: LearningGatesHandler
    ) {}

    /**
     * Set the webview for sending messages
     */
    public setView(view: vscode.WebviewView) {
        this.view = view;
    }

    /**
     * Handle user message - preserving original logic exactly
     */
    public async handleUserMessage(message: string) {
        if (!message?.trim()) {
            return;
        }

        // Show loading state
        this.services.uiManager.showBotResponse('Thinking...', true);

        try {
            const config = this.configCoordinator.getCurrentConfig();
            
            if (config.useBackend && this.services.backendService.isReady()) {
                await this.handleUserMessageBackend(message, config);
            } else {
                // Local mode: Check learning gate first, then process
                if (this.learningGatesHandler.shouldShowGate()) {
                    await this.learningGatesHandler.showLearningGate();
                    return;
                }
                await this.handleUserMessageLocal(message);
            }
        } catch (error) {
            LOGGER(`AI4U Error in handleUserMessage: ${error}`, 'ERROR');
            this.services.uiManager.showBotResponse(`Unexpected error: ${error}`, false);
        }
    }

    /**
     * Handle user message in local mode - preserving original logic
     */
    private async handleUserMessageLocal(message: string) {
        const response = await this.services.openaiService.sendMessage(message);
        
        this.services.uiManager.showBotResponse(
            response.message,
            false,
            response.source
        );
    }

    /**
     * Handle user message in backend mode - preserving original logic exactly
     */
    private async handleUserMessageBackend(message: string, config: any) {
        const response = await this.services.backendService.sendMessage(message);
        
        if (response.error) {
            // Fallback to local mode with learning gates
            LOGGER('AI4U Backend failed, attempting fallback to local');
            
            // Check local learning gate first
            if (this.learningGatesHandler.shouldShowGate()) {
                await this.learningGatesHandler.showLearningGate();
                return;
            }
            
            await this.handleUserMessageLocal(message);
            return;
        }

        // Handle learning gate from backend
        if (response.type === 'learning_gate') {
            LOGGER('AI4U Backend triggered learning gate');
            
            // Send quiz to UI
            this.view?.webview.postMessage({
                type: 'showQuiz',
                question: response.question,
                stats: response.stats
            });
            return;
        }

        // Handle normal chat response
        if (response.type === 'chat_response') {
            this.services.uiManager.showBotResponse(
                response.response || 'No response received',
                false,
                'backend',
                response.session_id
            );
        }
    }
}