export class CSSManager {
    
    public static getBaseStyles(): string {
        return `
                body {
                    font-family: var(--vscode-font-family);
                    color: var(--vscode-foreground);
                    background-color: var(--vscode-editor-background);
                    margin: 0;
                    padding: 10px;
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                }
                
                .mode-section {
                    margin-bottom: 10px;
                    padding: 8px;
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 4px;
                    background-color: var(--vscode-input-background);
                }
                
                .mode-toggle {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 8px;
                }
                
                .mode-indicator {
                    font-size: 12px;
                    font-weight: bold;
                    padding: 2px 6px;
                    border-radius: 3px;
                }
                
                .mode-local { background-color: #2196F3; color: white; }
                .mode-backend { background-color: #4CAF50; color: white; }
                
                .api-key-section {
                    margin-bottom: 10px;
                    padding: 10px;
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 4px;
                }
                
                .api-key-input {
                    width: calc(100% - 80px);
                    padding: 5px;
                    margin-right: 5px;
                    background-color: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border: 1px solid var(--vscode-input-border);
                }
                
                .btn {
                    padding: 5px 10px;
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    cursor: pointer;
                    border-radius: 3px;
                    font-size: 11px;
                }
                
                .btn:hover { background-color: var(--vscode-button-hoverBackground); }
                
                .btn-secondary {
                    background-color: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                }
                
                .btn-secondary:hover { background-color: var(--vscode-button-secondaryHoverBackground); }
                
                .control-buttons { display: flex; gap: 5px; flex-wrap: wrap; }
                
                .chat-container {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                
                .messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 10px;
                    border: 1px solid var(--vscode-input-border);
                    margin-bottom: 10px;
                }
                
                .message {
                    margin-bottom: 10px;
                    padding: 8px;
                    border-radius: 4px;
                    position: relative;
                }
                
                .user-message {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    text-align: right;
                }
                
                .bot-message {
                    background-color: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                }
                
                .message-source {
                    position: absolute;
                    top: 2px;
                    right: 4px;
                    font-size: 9px;
                    color: var(--vscode-descriptionForeground);
                    opacity: 0.7;
                }
                
                .input-container { display: flex; gap: 5px; }
                
                .message-input {
                    flex: 1;
                    padding: 8px;
                    background-color: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border: 1px solid var(--vscode-input-border);
                }
                
                .send-btn {
                    padding: 8px 16px;
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    cursor: pointer;
                }
                
                .send-btn:hover { background-color: var(--vscode-button-hoverBackground); }
                .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
                
                .status { font-size: 12px; margin-bottom: 5px; }
                .status.connected { color: #4CAF50; }
                .status.error { color: #f44336; }
                .status.warning { color: #ff9800; }
                .hidden { display: none; }
                
                .loading-indicator {
                    display: inline-block;
                    animation: pulse 1.5s ease-in-out infinite;
                }
                
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
        `;
    }

    public static getLearningGatesStyles(): string {
        return `
            /* Learning Gates Styles */
            .learning-gates-section {
                margin-bottom: 10px;
                padding: 8px;
                border: 1px solid var(--vscode-input-border);
                border-radius: 4px;
                background: linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(33, 150, 243, 0.1));
            }
            
            .gates-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 8px;
            }
            
            .gates-title {
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: 600;
                color: var(--vscode-foreground);
            }
            
            .gates-toggle {
                font-size: 11px;
                padding: 2px 6px;
                background: var(--vscode-button-secondaryBackground);
                color: var(--vscode-button-secondaryForeground);
                border: none;
                border-radius: 3px;
                cursor: pointer;
            }
            
            .progress-stats {
                display: flex;
                gap: 12px;
                font-size: 11px;
                color: var(--vscode-descriptionForeground);
            }
            
            .progress-item {
                display: flex;
                align-items: center;
                gap: 4px;
            }
            
            .progress-value {
                font-weight: 600;
                color: var(--vscode-foreground);
            }
            
            .unlocked-responses {
                background: linear-gradient(45deg, #4CAF50, #45a049);
                color: white;
                padding: 2px 6px;
                border-radius: 10px;
                font-size: 10px;
                font-weight: bold;
            }
        `;
    }

    public static getQuizStyles(): string {
        return `
            /* Quiz Overlay Styles */
            .quiz-gate-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                backdrop-filter: blur(10px);
                animation: fadeInOverlay 0.3s ease;
            }
            
            @keyframes fadeInOverlay {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            .quiz-container {
                background: var(--vscode-editor-background);
                border: 2px solid #4CAF50;
                border-radius: 16px;
                padding: 32px;
                max-width: 600px;
                width: 90%;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
                animation: slideInQuiz 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                position: relative;
                overflow: hidden;
            }
            
            .quiz-container::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: linear-gradient(90deg, #4CAF50, #2196F3, #9C27B0, #FF9800);
                animation: gradientMove 3s ease-in-out infinite;
            }
            
            @keyframes slideInQuiz {
                from { opacity: 0; transform: translateY(-50px) scale(0.9); }
                to { opacity: 1; transform: translateY(0) scale(1); }
            }
            
            @keyframes gradientMove {
                0%, 100% { transform: translateX(-100%); }
                50% { transform: translateX(100%); }
            }
            
            .quiz-header {
                text-align: center;
                margin-bottom: 32px;
            }
            
            .lock-icon {
                font-size: 64px;
                margin-bottom: 16px;
                animation: lockBounce 2s ease-in-out infinite;
            }
            
            @keyframes lockBounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }
            
            .quiz-title {
                color: var(--vscode-foreground);
                margin: 0 0 16px 0;
                font-size: 24px;
                font-weight: 700;
                background: linear-gradient(45deg, #4CAF50, #2196F3);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            
            .quiz-subtitle {
                color: var(--vscode-descriptionForeground);
                font-size: 14px;
                margin-bottom: 20px;
            }
            
            .quiz-stats {
                display: flex;
                justify-content: center;
                gap: 20px;
                margin-top: 16px;
            }
            
            .stat {
                background: var(--vscode-button-secondaryBackground);
                color: var(--vscode-button-secondaryForeground);
                padding: 8px 12px;
                border-radius: 8px;
                font-size: 12px;
                font-weight: 600;
                border: 1px solid var(--vscode-input-border);
            }
            
            .question-text {
                font-size: 18px;
                font-weight: 600;
                color: var(--vscode-foreground);
                margin-bottom: 16px;
                line-height: 1.6;
                text-align: center;
            }
            
            .question-meta {
                display: flex;
                justify-content: space-between;
                margin-bottom: 24px;
                font-size: 12px;
            }
            
            .question-topic {
                color: #4CAF50;
                font-weight: 600;
                background: rgba(76, 175, 80, 0.1);
                padding: 4px 8px;
                border-radius: 4px;
            }
            
            .question-difficulty {
                color: var(--vscode-descriptionForeground);
                text-transform: uppercase;
                font-weight: 600;
            }
            
            .quiz-options {
                margin: 24px 0;
            }
            
            .quiz-option {
                width: 100%;
                display: flex;
                align-items: center;
                padding: 16px 20px;
                margin-bottom: 12px;
                background: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border: 2px solid var(--vscode-input-border);
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                text-align: left;
                position: relative;
                overflow: hidden;
            }
            
            .quiz-option::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
                transition: left 0.5s;
            }
            
            .quiz-option:hover {
                border-color: var(--vscode-button-background);
                background: var(--vscode-button-secondaryBackground);
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
            
            .quiz-option:hover::before {
                left: 100%;
            }
            
            .quiz-option.selected {
                border-color: #4CAF50;
                background: rgba(76, 175, 80, 0.15);
                transform: translateY(-2px);
                box-shadow: 0 4px 16px rgba(76, 175, 80, 0.3);
            }
            
            .option-letter {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 32px;
                height: 32px;
                background: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border-radius: 50%;
                font-size: 14px;
                font-weight: bold;
                margin-right: 16px;
                flex-shrink: 0;
                transition: all 0.3s ease;
            }
            
            .quiz-option.selected .option-letter {
                background: #4CAF50;
                color: white;
                transform: scale(1.1);
            }
            
            .option-text {
                flex: 1;
                font-size: 14px;
                line-height: 1.4;
            }
            
            .quiz-actions {
                display: flex;
                gap: 16px;
                margin-top: 32px;
            }
            
            .quiz-submit-btn {
                flex: 2;
                padding: 16px 32px;
                background: linear-gradient(45deg, #4CAF50, #45a049);
                color: white;
                border: none;
                border-radius: 12px;
                font-size: 16px;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.3s ease;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            .quiz-submit-btn:hover:not(:disabled) {
                background: linear-gradient(45deg, #45a049, #4CAF50);
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(76, 175, 80, 0.4);
            }
            
            .quiz-submit-btn:disabled {
                background: var(--vscode-input-border);
                cursor: not-allowed;
                opacity: 0.5;
                transform: none;
                box-shadow: none;
            }
            
            .quiz-skip-btn {
                flex: 1;
                padding: 16px 24px;
                background: transparent;
                color: var(--vscode-descriptionForeground);
                border: 2px solid var(--vscode-input-border);
                border-radius: 12px;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .quiz-skip-btn:hover {
                color: var(--vscode-foreground);
                border-color: var(--vscode-button-background);
                background: var(--vscode-button-secondaryBackground);
            }
        `;
    }

    public static getAllStyles(): string {
        return this.getBaseStyles() + this.getLearningGatesStyles() + this.getQuizStyles();
    }
}