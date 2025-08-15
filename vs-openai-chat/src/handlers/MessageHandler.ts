// src/handlers/MessageHandler.ts
import { WebviewMessage } from '../services/ui/UIManager';
import { ServiceCoordinator } from '../coordinators/ServiceCoordinator';
import { ConfigurationCoordinator } from '../coordinators/ConfigurationCoordinator';
import { LearningGatesHandler } from './LearningGatesHandler';
import { UserMessageHandler } from './UserMessageHandler';
import { LOGGER } from '../logger';

/**
 * MessageHandler routes webview messages to appropriate handlers
 * Preserves all original message handling logic
 */
export class MessageHandler {
    constructor(
        private services: ServiceCoordinator,
        private configCoordinator: ConfigurationCoordinator,
        private learningGatesHandler: LearningGatesHandler,
        private userMessageHandler: UserMessageHandler
    ) {}

    /**
     * Handle webview messages - preserving original switch logic exactly
     */
    public async handleWebviewMessage(data: WebviewMessage) {
        try {
            switch (data.type) {
                case 'sendMessage':
                    await this.userMessageHandler.handleUserMessage(data.message);
                    break;
                    
                case 'testConnection':
                    await this.configCoordinator.handleTestConnection();
                    break;
                    
                case 'loadHistory':
                    await this.handleLoadHistory();
                    break;
                    
                case 'clearSession':
                    await this.handleClearSession();
                    break;
                    
                case 'submitQuizAnswer':
                    LOGGER(`AI4U Submit quiz answer: ${data.questionId} - ${data.selectedAnswer}`);
                    await this.learningGatesHandler.handleQuizAnswer(
                        data.questionId, 
                        data.selectedAnswer, 
                        this.configCoordinator.getCurrentConfig()
                    );
                    break;
                    
                case 'skipQuiz':
                    await this.learningGatesHandler.handleSkipQuiz(
                        this.configCoordinator.getCurrentConfig()
                    );
                    break;
                    
                case 'toggleLearningGates':
                    LOGGER(`AI4U Toggle learning gates: ${data.enabled}`);
                    await this.learningGatesHandler.toggleLearningGates(data.enabled);
                    break;

                default:
                    LOGGER(`AI4U Unknown message type: ${data.type}`, 'WARN');
            }
        } catch (error) {
            LOGGER(`AI4U Error handling webview message: ${error}`, 'ERROR');
            this.services.uiManager.showBotResponse(
                `Error handling message: ${error}`,
                false
            );
        }
    }

    /**
     * Handle load history - preserving original logic
     */
    private async handleLoadHistory() {
        const history = await this.services.backendService.loadChatHistory();
        if (history) {
            this.services.uiManager.showChatHistory(history);
        }
    }

    /**
     * Handle clear session - preserving original logic
     */
    private async handleClearSession() {
        await this.services.backendService.clearSession();
        this.services.uiManager.clearSession();
    }
}