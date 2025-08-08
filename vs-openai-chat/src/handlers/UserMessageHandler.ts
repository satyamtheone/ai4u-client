// src/handlers/UserMessageHandler.ts - Debug version
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
        LOGGER(`AI4U User message received: ${message}`);
        
        try {
            const config = this.configCoordinator.getCurrentConfig();
            
            // ← DEBUG: Add detailed logging
            LOGGER(`AI4U Config: useBackend=${config.useBackend}, backend ready=${this.services.backendService?.isReady()}`);
            
            if (config.useBackend && this.services.backendService.isReady()) {
                LOGGER('AI4U Using backend mode');
                await this.handleUserMessageBackend(message, config);
            } else {
                LOGGER('AI4U Using local mode');
                // Local mode: Check learning gate first, then process
                const shouldShowGate = this.learningGatesHandler.shouldShowGate();
                LOGGER(`AI4U Should show gate: ${shouldShowGate}`);
                
                if (shouldShowGate) {
                    LOGGER('AI4U Showing learning gate');
                    await this.learningGatesHandler.showLearningGate(message);
                    return;
                }
                
                LOGGER('AI4U Processing message directly (no gate)');
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
        LOGGER(`AI4U Processing local message: ${message}`);
        
        try {
            const response = await this.services.openaiService.sendMessage(message);
            LOGGER(`AI4U Got OpenAI response, showing to user`);
            
            this.services.uiManager.showBotResponse(
                response.message,
                false,
                response.source
            );
        } catch (error) {
            LOGGER(`AI4U Error in local processing: ${error}`, 'ERROR');
            this.services.uiManager.showBotResponse(
                `Error processing message: ${error}`,
                false
            );
        }
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
                await this.learningGatesHandler.showLearningGate(message);
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