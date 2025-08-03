import { LOGGER } from "../../logger";

export class QuizUIComponent {
    
    public static generateQuizHTML(question: any, stats: any): string {
        return `
            <div class="quiz-gate-overlay" id="quizGate">
                <div class="quiz-container">
                    <div class="quiz-header">
                        <div class="lock-icon">🔒</div>
                        <h3>Answer Quiz to Unlock Code</h3>
                        <div class="quiz-stats">
                            <span class="stat">Level ${stats.level}</span>
                            <span class="stat">Streak: ${stats.currentStreak}</span>
                            <span class="stat">Accuracy: ${stats.accuracy}%</span>
                        </div>
                    </div>
                    
                    <div class="quiz-content">
                        <div class="question-text">${question.question}</div>
                        <div class="question-topic">Topic: ${question.topic}</div>
                        <div class="question-difficulty">Difficulty: ${question.difficulty.toUpperCase()}</div>
                        
                        <div class="quiz-options">
                            ${question.options.map((option: string, index: number) => `
                                <button class="quiz-option" onclick="selectAnswer(${index})" data-index="${index}">
                                    <span class="option-letter">${String.fromCharCode(65 + index)}</span>
                                    <span class="option-text">${option}</span>
                                </button>
                            `).join('')}
                        </div>
                        
                        <div class="quiz-actions">
                            <button class="quiz-submit-btn" id="submitBtn" onclick="submitQuizAnswer()" disabled>
                                Submit Answer
                            </button>
                            <button class="quiz-skip-btn" onclick="skipQuiz()">
                                Skip (Limited Response)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    public static generateQuizResultHTML(result: any): string {
        LOGGER(`generateQuizResultHTML: ${JSON.stringify(result)}`);
        const isCorrect = result.correct;
        const icon = isCorrect ? '✅' : '❌';
        const title = isCorrect ? 'Correct!' : 'Incorrect';
        const message = isCorrect 
            ? `Great job! You've unlocked ${result.unlockedResponses} AI responses.`
            : 'Dont worry, you still get 1 response. Keep learning!';

        return `
            <div class="quiz-result-overlay" id="quizResult">
                <div class="quiz-result-container">
                    <div class="quiz-result-header">
                        <div class="result-icon">${icon}</div>
                        <h3>${title}</h3>
                        ${result.levelUp ? '<div class="level-up">🎉 Level Up!</div>' : ''}
                    </div>
                    
                    <div class="quiz-result-content">
                        <p>${message}</p>
                        ${result.explanation ? `
                            <div class="explanation">
                                <strong>Explanation:</strong>
                                <p>${result.explanation}</p>
                            </div>
                        ` : ''}
                        
                        <div class="unlocked-info">
                            <span class="unlock-count">${result.unlockedResponses}</span>
                            <span class="unlock-text">responses unlocked</span>
                        </div>
                    </div>
                    
                    <button class="continue-btn" onclick="closeQuizResult()">
                        Continue Coding
                    </button>
                </div>
            </div>
        `;
    }

    public static generateQuizCSS(): string {
        return `
            .quiz-gate-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                backdrop-filter: blur(5px);
            }
            
            .quiz-container {
                background: var(--vscode-editor-background);
                border: 2px solid var(--vscode-input-border);
                border-radius: 12px;
                padding: 24px;
                max-width: 500px;
                width: 90%;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                animation: slideIn 0.3s ease-out;
            }
            
            @keyframes slideIn {
                from { opacity: 0; transform: translateY(-20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .quiz-header {
                text-align: center;
                margin-bottom: 24px;
            }
            
            .lock-icon {
                font-size: 48px;
                margin-bottom: 12px;
            }
            
            .quiz-header h3 {
                color: var(--vscode-foreground);
                margin: 0 0 16px 0;
                font-size: 20px;
            }
            
            .quiz-stats {
                display: flex;
                justify-content: center;
                gap: 16px;
                margin-top: 12px;
            }
            
            .stat {
                background: var(--vscode-button-secondaryBackground);
                color: var(--vscode-button-secondaryForeground);
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
            }
            
            .question-text {
                font-size: 16px;
                font-weight: 600;
                color: var(--vscode-foreground);
                margin-bottom: 12px;
                line-height: 1.5;
            }
            
            .question-topic {
                color: #4CAF50;
                font-size: 12px;
                font-weight: 500;
                margin-bottom: 4px;
            }
            
            .question-difficulty {
                color: var(--vscode-descriptionForeground);
                font-size: 12px;
                margin-bottom: 20px;
            }
            
            .quiz-options {
                margin: 20px 0;
            }
            
            .quiz-option {
                width: 100%;
                display: flex;
                align-items: center;
                padding: 12px 16px;
                margin-bottom: 8px;
                background: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border: 2px solid var(--vscode-input-border);
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
                text-align: left;
            }
            
            .quiz-option:hover {
                border-color: var(--vscode-button-background);
                background: var(--vscode-button-secondaryBackground);
            }
            
            .quiz-option.selected {
                border-color: #4CAF50;
                background: rgba(76, 175, 80, 0.1);
            }
            
            .option-letter {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 24px;
                height: 24px;
                background: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border-radius: 50%;
                font-size: 12px;
                font-weight: bold;
                margin-right: 12px;
                flex-shrink: 0;
            }
            
            .quiz-option.selected .option-letter {
                background: #4CAF50;
                color: white;
            }
            
            .option-text {
                flex: 1;
            }
            
            .quiz-actions {
                display: flex;
                gap: 12px;
                margin-top: 24px;
            }
            
            .quiz-submit-btn {
                flex: 1;
                padding: 12px 24px;
                background: #4CAF50;
                color: white;
                border: none;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: background 0.2s ease;
            }
            
            .quiz-submit-btn:hover:not(:disabled) {
                background: #45a049;
            }
            
            .quiz-submit-btn:disabled {
                background: var(--vscode-input-border);
                cursor: not-allowed;
                opacity: 0.5;
            }
            
            .quiz-skip-btn {
                padding: 12px 24px;
                background: transparent;
                color: var(--vscode-descriptionForeground);
                border: 1px solid var(--vscode-input-border);
                border-radius: 6px;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .quiz-skip-btn:hover {
                color: var(--vscode-foreground);
                border-color: var(--vscode-button-background);
            }
            
            .quiz-result-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1001;
            }
            
            .quiz-result-container {
                background: var(--vscode-editor-background);
                border: 2px solid var(--vscode-input-border);
                border-radius: 12px;
                padding: 24px;
                max-width: 400px;
                width: 90%;
                text-align: center;
                animation: slideIn 0.3s ease-out;
            }
            
            .result-icon {
                font-size: 64px;
                margin-bottom: 16px;
            }
            
            .level-up {
                background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
                color: white;
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: bold;
                margin-top: 8px;
                display: inline-block;
            }
            
            .explanation {
                background: var(--vscode-input-background);
                border: 1px solid var(--vscode-input-border);
                border-radius: 6px;
                padding: 12px;
                margin: 16px 0;
                text-align: left;
            }
            
            .unlocked-info {
                margin: 20px 0;
            }
            
            .unlock-count {
                font-size: 32px;
                font-weight: bold;
                color: #4CAF50;
                display: block;
            }
            
            .unlock-text {
                color: var(--vscode-descriptionForeground);
                font-size: 14px;
            }
            
            .continue-btn {
                width: 100%;
                padding: 12px 24px;
                background: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: background 0.2s ease;
            }
            
            .continue-btn:hover {
                background: var(--vscode-button-hoverBackground);
            }
        `;
    }

    public static generateQuizJavaScript(): string {
        return `
            let selectedAnswerIndex = -1;
            let currentQuestionId = null;
            
            function selectAnswer(index) {
                selectedAnswerIndex = index;
                
                // Update UI
                document.querySelectorAll('.quiz-option').forEach((option, i) => {
                    option.classList.toggle('selected', i === index);
                });
                
                // Enable submit button
                document.getElementById('submitBtn').disabled = false;
            }
            
            function submitQuizAnswer() {
                if (selectedAnswerIndex === -1) return;
                
                vscode.postMessage({
                    type: 'submitQuizAnswer',
                    questionId: currentQuestionId,
                    selectedAnswer: selectedAnswerIndex
                });
            }
            
            function skipQuiz() {
                vscode.postMessage({
                    type: 'skipQuiz'
                });
            }
            
            function closeQuizResult() {
                const overlay = document.getElementById('quizResult');
                if (overlay) {
                    overlay.remove();
                }
            }
            
            function showQuiz(question, stats) {
                currentQuestionId = question.id;
                selectedAnswerIndex = -1;
                
                const quizHTML = \`${this.generateQuizHTML('${question}', '${stats}')}\`;
                document.body.insertAdjacentHTML('beforeend', quizHTML);
            }
            
            function showQuizResult(result) {
                const resultHTML = \`${this.generateQuizResultHTML('${result}')}\`;
                
                // Remove quiz gate
                const quizGate = document.getElementById('quizGate');
                if (quizGate) {
                    quizGate.remove();
                }
                
                // Show result
                document.body.insertAdjacentHTML('beforeend', resultHTML);
                
                // Auto-close after 5 seconds
                setTimeout(() => {
                    closeQuizResult();
                }, 5000);
            }
        `;
    }
}