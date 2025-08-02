// src/QuizManager.ts
import * as vscode from 'vscode';

export interface Question {
    text: string;
    options: string[];
    correct: number;
    type: "multiple_choice";
    explanation?: string;
}

export class QuizManager {
    private static instance: QuizManager;

    static getInstance(): QuizManager {
        if (!QuizManager.instance) {
            QuizManager.instance = new QuizManager();
        }
        return QuizManager.instance;
    }

    /**
     * Present a quiz to the user and return whether they passed
     */
    async presentQuiz(code: string, customQuestions?: Question[]): Promise<boolean> {
        const questions = customQuestions || this.generateQuestionsFromCode(code);
        
        if (questions.length === 0) {
            vscode.window.showWarningMessage('No questions available for this code');
            return false;
        }

        return new Promise((resolve) => {
            const panel = vscode.window.createWebviewPanel(
                'codewise-quiz',
                'Knowledge Check',
                vscode.ViewColumn.Beside,
                { 
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );

            panel.webview.html = this.getQuizHtml(questions);

            // Handle messages from the webview
            panel.webview.onDidReceiveMessage((message) => {
                switch (message.type) {
                    case 'quizComplete':
                        const passed = message.score >= 0.7; // 70% threshold
                        this.showResult(message.score, passed);
                        panel.dispose();
                        resolve(passed);
                        break;
                    case 'quizCancelled':
                        panel.dispose();
                        resolve(false);
                        break;
                }
            });

            // Handle panel disposal
            panel.onDidDispose(() => {
                resolve(false);
            });
        });
    }

    /**
     * Generate simple quiz questions based on code content
     */
    private generateQuestionsFromCode(code: string): Question[] {
        const questions: Question[] = [];
        const lowerCode = code.toLowerCase();

        // Function detection
        if (lowerCode.includes('function') || lowerCode.includes('def ')) {
            questions.push({
                text: "What is the primary purpose of functions in programming?",
                options: [
                    "To reuse code and organize logic",
                    "To slow down the program",
                    "To make code harder to read",
                    "To use more memory"
                ],
                correct: 0,
                type: "multiple_choice",
                explanation: "Functions help organize code into reusable blocks and make programs more modular."
            });
        }

        // Loop detection
        if (lowerCode.includes('for') || lowerCode.includes('while')) {
            questions.push({
                text: "What is the main purpose of loops in programming?",
                options: [
                    "To repeat code execution",
                    "To break the program",
                    "To create variables",
                    "To delete files"
                ],
                correct: 0,
                type: "multiple_choice",
                explanation: "Loops allow us to execute code repeatedly based on certain conditions."
            });
        }

        // Variable detection
        if (lowerCode.includes('var ') || lowerCode.includes('let ') || lowerCode.includes('const ')) {
            questions.push({
                text: "What are variables used for in programming?",
                options: [
                    "To store and manipulate data",
                    "To make code colorful",
                    "To slow down execution",
                    "To create errors"
                ],
                correct: 0,
                type: "multiple_choice",
                explanation: "Variables are containers that store data values which can be used and modified throughout the program."
            });
        }

        // Conditional detection
        if (lowerCode.includes('if') || lowerCode.includes('else')) {
            questions.push({
                text: "What do conditional statements (if/else) allow us to do?",
                options: [
                    "Execute different code based on conditions",
                    "Print everything to console",
                    "Delete variables",
                    "Change file names"
                ],
                correct: 0,
                type: "multiple_choice",
                explanation: "Conditional statements allow programs to make decisions and execute different code paths based on specific conditions."
            });
        }

        // If no specific patterns found, add generic questions
        if (questions.length === 0) {
            questions.push({
                text: "What is the purpose of commenting code?",
                options: [
                    "To explain what the code does",
                    "To make code run faster",
                    "To hide code from users",
                    "To increase file size"
                ],
                correct: 0,
                type: "multiple_choice",
                explanation: "Comments help document code, making it easier for developers to understand and maintain."
            });
        }

        return questions.slice(0, 3); // Limit to 3 questions for simplicity
    }

    /**
     * Generate HTML for the quiz interface
     */
    private getQuizHtml(questions: Question[]): string {
        const questionsHtml = questions.map((q, i) => `
            <div class="question" data-question="${i}">
                <h3>Question ${i + 1}</h3>
                <p class="question-text">${q.text}</p>
                <div class="options">
                    ${q.options.map((opt, idx) => `
                        <label class="option">
                            <input type="radio" name="q${i}" value="${idx}">
                            <span class="option-text">${opt}</span>
                        </label>
                    `).join('')}
                </div>
                ${q.explanation ? `<div class="explanation" id="explanation-${i}" style="display: none;">
                    <strong>💡 Explanation:</strong> ${q.explanation}
                </div>` : ''}
            </div>
        `).join('');

        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>CodeWise Quiz</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    padding: 20px;
                    max-width: 800px;
                    margin: 0 auto;
                    background: var(--vscode-editor-background, #ffffff);
                    color: var(--vscode-editor-foreground, #333333);
                }
                
                .quiz-header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding: 20px;
                    background: var(--vscode-textBlockQuote-background, #f5f5f5);
                    border-radius: 8px;
                    border-left: 4px solid var(--vscode-textBlockQuote-border, #007acc);
                }
                
                .question {
                    margin-bottom: 30px;
                    padding: 20px;
                    border: 1px solid var(--vscode-panel-border, #ccc);
                    border-radius: 8px;
                    background: var(--vscode-editor-background, #ffffff);
                }
                
                .question h3 {
                    color: var(--vscode-textLink-foreground, #007acc);
                    margin-top: 0;
                }
                
                .question-text {
                    font-size: 16px;
                    margin-bottom: 15px;
                    font-weight: 500;
                }
                
                .options {
                    margin-left: 10px;
                }
                
                .option {
                    display: block;
                    margin-bottom: 10px;
                    padding: 10px;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: background-color 0.2s;
                }
                
                .option:hover {
                    background: var(--vscode-list-hoverBackground, #f0f0f0);
                }
                
                .option input {
                    margin-right: 10px;
                }
                
                .explanation {
                    margin-top: 15px;
                    padding: 10px;
                    background: var(--vscode-textCodeBlock-background, #f8f8f8);
                    border-radius: 4px;
                    border-left: 3px solid #28a745;
                }
                
                .quiz-actions {
                    text-align: center;
                    margin-top: 30px;
                    padding: 20px;
                }
                
                .btn {
                    padding: 12px 24px;
                    margin: 0 10px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: 500;
                    transition: all 0.3s ease;
                }
                
                .btn-primary {
                    background: var(--vscode-button-background, #007acc);
                    color: var(--vscode-button-foreground, white);
                }
                
                .btn-primary:hover {
                    background: var(--vscode-button-hoverBackground, #005a9e);
                }
                
                .btn-secondary {
                    background: var(--vscode-button-secondaryBackground, #6c757d);
                    color: var(--vscode-button-secondaryForeground, white);
                }
                
                .btn-secondary:hover {
                    background: #545b62;
                }
                
                .progress-bar {
                    width: 100%;
                    height: 6px;
                    background: var(--vscode-progressBar-background, #e0e0e0);
                    border-radius: 3px;
                    margin-bottom: 20px;
                    overflow: hidden;
                }
                
                .progress-fill {
                    height: 100%;
                    background: var(--vscode-progressBar-foreground, #007acc);
                    width: 0%;
                    transition: width 0.3s ease;
                }
                
                .result {
                    padding: 15px;
                    border-radius: 8px;
                    margin: 20px 0;
                    text-align: center;
                    font-weight: bold;
                }
                
                .result.success {
                    background: #d4edda;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                }
                
                .result.failure {
                    background: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                }
            </style>
        </head>
        <body>
            <div class="quiz-header">
                <h1>🧠 CodeWise Knowledge Check</h1>
                <p>Test your understanding of the code concepts</p>
                <div class="progress-bar">
                    <div class="progress-fill" id="progressFill"></div>
                </div>
            </div>

            <form id="quizForm">
                ${questionsHtml}
                
                <div class="quiz-actions">
                    <button type="button" class="btn btn-secondary" onclick="cancelQuiz()">
                        Cancel
                    </button>
                    <button type="submit" class="btn btn-primary">
                        Submit Quiz
                    </button>
                </div>
            </form>

            <script>
                const vscode = acquireVsCodeApi();
                const questions = ${JSON.stringify(questions)};
                let answered = 0;

                // Update progress as questions are answered
                document.querySelectorAll('input[type="radio"]').forEach(input => {
                    input.addEventListener('change', updateProgress);
                });

                function updateProgress() {
                    const totalQuestions = questions.length;
                    answered = 0;
                    
                    for (let i = 0; i < totalQuestions; i++) {
                        if (document.querySelector(\`input[name="q\${i}"]:checked\`)) {
                            answered++;
                        }
                    }
                    
                    const percentage = (answered / totalQuestions) * 100;
                    document.getElementById('progressFill').style.width = percentage + '%';
                }

                function cancelQuiz() {
                    vscode.postMessage({ type: 'quizCancelled' });
                }

                document.getElementById('quizForm').addEventListener('submit', function(event) {
                    event.preventDefault();

                    const totalQuestions = questions.length;
                    let correctAnswers = 0;

                    // Check each question
                    for (let i = 0; i < totalQuestions; i++) {
                        const selectedOption = document.querySelector(\`input[name="q\${i}"]:checked\`);
                        const explanation = document.getElementById(\`explanation-\${i}\`);
                        
                        if (selectedOption) {
                            const selectedValue = parseInt(selectedOption.value);
                            const isCorrect = selectedValue === questions[i].correct;
                            
                            if (isCorrect) {
                                correctAnswers++;
                                selectedOption.parentElement.style.background = '#d4edda';
                            } else {
                                selectedOption.parentElement.style.background = '#f8d7da';
                                // Highlight correct answer
                                const correctOption = document.querySelector(\`input[name="q\${i}"][value="\${questions[i].correct}"]\`);
                                if (correctOption) {
                                    correctOption.parentElement.style.background = '#d4edda';
                                }
                            }
                            
                            // Show explanation if available
                            if (explanation) {
                                explanation.style.display = 'block';
                            }
                        }
                    }

                    const score = correctAnswers / totalQuestions;
                    const passed = score >= 0.7;

                    // Show result
                    const resultDiv = document.createElement('div');
                    resultDiv.className = \`result \${passed ? 'success' : 'failure'}\`;
                    resultDiv.innerHTML = \`
                        <h3>\${passed ? '🎉 Quiz Passed!' : '❌ Quiz Failed'}</h3>
                        <p>Score: \${correctAnswers}/\${totalQuestions} (\${Math.round(score * 100)}%)</p>
                        <p>\${passed ? 'Great job! Code unlocked.' : 'Need 70% to pass. Try again!'}</p>
                    \`;
                    
                    document.querySelector('.quiz-actions').appendChild(resultDiv);

                    // Send result back to extension
                    setTimeout(() => {
                        vscode.postMessage({ 
                            type: 'quizComplete', 
                            score: score,
                            correct: correctAnswers,
                            total: totalQuestions
                        });
                    }, 2000);
                });
            </script>
        </body>
        </html>`;
    }

    /**
     * Show quiz result to user
     */
    private showResult(score: number, passed: boolean): void {
        const percentage = Math.round(score * 100);
        const message = passed 
            ? `🎉 Quiz passed! Score: ${percentage}% - Code unlocked!`
            : `❌ Quiz failed. Score: ${percentage}% - Need 70% to unlock code.`;
        
        if (passed) {
            vscode.window.showInformationMessage(message);
        } else {
            vscode.window.showWarningMessage(message);
        }
    }

    /**
     * Create a simple quiz for testing
     */
    createSampleQuiz(): Question[] {
        return [
            {
                text: "What does 'console.log()' do in JavaScript?",
                options: [
                    "Prints output to the browser console",
                    "Creates a new log file",
                    "Deletes console history",
                    "Opens a new console window"
                ],
                correct: 0,
                type: "multiple_choice",
                explanation: "console.log() is used to output information to the browser's developer console for debugging purposes."
            },
            {
                text: "Which of these is a correct way to declare a variable in JavaScript?",
                options: [
                    "variable myVar = 5;",
                    "let myVar = 5;",
                    "create myVar = 5;",
                    "make myVar = 5;"
                ],
                correct: 1,
                type: "multiple_choice",
                explanation: "'let' is one of the modern ways to declare variables in JavaScript, along with 'const' and 'var'."
            }
        ];
    }
}