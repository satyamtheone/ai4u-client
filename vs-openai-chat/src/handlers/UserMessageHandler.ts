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
     * Handle user message
     */
    public async handleUserMessage(message: string) {
        if (!message?.trim()) return;

        this.services.uiManager.showBotResponse('Thinking...', true);
        LOGGER(`AI4U User message received: ${message}`);

        try {
            const config = this.configCoordinator.getCurrentConfig();
            if (!this.services.backendService?.isReady()) {
                this.services.uiManager.showBotResponse('Backend service not ready. Please check connection.', false);
                return;
            }

            LOGGER('AI4U Using backend mode');

            const shouldShowGate = this.learningGatesHandler.shouldShowGate();
            LOGGER(`AI4U Should show learning gate: ${shouldShowGate}`);

            if (shouldShowGate) {
                LOGGER('AI4U Showing learning gate');
                await this.learningGatesHandler.showLearningGate(message);
                return;
            }
            await this.handleUserMessageBackend(message, config);
        } catch (error) {
            LOGGER(`AI4U Error in handleUserMessage: ${error}`, 'ERROR');
            this.services.uiManager.showBotResponse(`Unexpected error: ${error}`, false);
        }
    }
    /**
     * Handle user message in backend mode - preserving original logic exactly
     */
    private async handleUserMessageBackend(message: string, config: any) {
        const response = await this.services.backendService.sendMessage(message);
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