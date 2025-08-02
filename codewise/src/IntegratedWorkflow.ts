// src/IntegratedWorkflow.ts - Example of how all components work together

import * as vscode from 'vscode';
import { CodeLocker } from './CodeLocker';
import { QuizManager, Question } from './QuizManager';
import { ContextExtractor } from './ContextExtractor';
import { DatabaseManager } from './DatabaseManager';

/**
 * Integrated workflow that demonstrates how all components work together
 */
export class IntegratedWorkflow {
    private codeLocker: CodeLocker;
    private quizManager: QuizManager;
    private databaseManager: DatabaseManager;

    constructor(extensionContext: vscode.ExtensionContext) {
        this.codeLocker = CodeLocker.getInstance();
        this.quizManager = QuizManager.getInstance();
        this.databaseManager = DatabaseManager.getInstance(extensionContext.extensionPath);
    }

    /**
     * Complete learning workflow for current file
     */
    async startLearningSession(): Promise<void> {
        try {
            // Step 1: Extract context from current file
            const context = ContextExtractor.getCurrentFileContext();
            
            if (!context.fileContent) {
                vscode.window.showInformationMessage('Please open a code file to start learning');
                return;
            }

            vscode.window.showInformationMessage('Starting CodeWise learning session...');

            // Step 2: Analyze code and generate appropriate quiz
            const codeAnalysis = this.analyzeCode(context.fileContent, context.language || 'unknown');
            
            // Step 3: Present quiz based on code content
            const quizPassed = await this.presentContextualQuiz(context.fileContent, codeAnalysis);

            // Step 4: Save results to database
            await this.saveSessionResults(context, quizPassed, codeAnalysis);

            // Step 5: Provide next steps based on performance
            await this.provideNextSteps(quizPassed, codeAnalysis);

        } catch (error) {
            console.error('Error in learning session:', error);
            vscode.window.showErrorMessage('Learning session failed. Please try again.');
        }
    }

    /**
     * Analyze code to understand its complexity and concepts
     */
    private analyzeCode(code: string, language: string): CodeAnalysis {
        const analysis: CodeAnalysis = {
            language,
            concepts: [],
            complexity: 'beginner',
            lineCount: code.split('\n').length,
            hasComments: code.includes('//') || code.includes('/*'),
            patterns: []
        };

        const lowerCode = code.toLowerCase();

        // Detect programming concepts
        if (lowerCode.includes('function') || lowerCode.includes('def ')) {
            analysis.concepts.push('functions');
        }
        if (lowerCode.includes('class ')) {
            analysis.concepts.push('classes');
        }
        if (lowerCode.includes('for') || lowerCode.includes('while')) {
            analysis.concepts.push('loops');
        }
        if (lowerCode.includes('if') || lowerCode.includes('else')) {
            analysis.concepts.push('conditionals');
        }
        if (lowerCode.includes('async') || lowerCode.includes('await') || lowerCode.includes('promise')) {
            analysis.concepts.push('async-programming');
        }

        // Determine complexity
        if (analysis.concepts.length > 3 || analysis.lineCount > 50) {
            analysis.complexity = 'intermediate';
        }
        if (analysis.concepts.length > 5 || analysis.lineCount > 100) {
            analysis.complexity = 'advanced';
        }

        return analysis;
    }

    /**
     * Present a quiz based on the code context
     */
    private async presentContextualQuiz(code: string, analysis: CodeAnalysis): Promise<boolean> {
        // Generate questions based on detected concepts
        const questions = this.generateContextualQuestions(analysis);
        
        if (questions.length === 0) {
            // Fallback to general questions
            const fallbackQuestions = this.quizManager.createSampleQuiz();
            return await this.quizManager.presentQuiz(code, fallbackQuestions);
        }

        return await this.quizManager.presentQuiz(code, questions);
    }

    /**
     * Generate questions based on code analysis
     */
    private generateContextualQuestions(analysis: CodeAnalysis): Question[] {
        const questions: Question[] = [];

        // Function-related questions
        if (analysis.concepts.includes('functions')) {
            questions.push({
                text: "What is the main benefit of using functions in programming?",
                options: [
                    "Code reusability and organization",
                    "Making code run slower",
                    "Using more memory",
                    "Making code harder to debug"
                ],
                correct: 0,
                type: "multiple_choice",
                explanation: "Functions allow you to write code once and reuse it multiple times, making your program more organized and maintainable."
            });
        }

        // Loop-related questions
        if (analysis.concepts.includes('loops')) {
            questions.push({
                text: "When should you use a loop in your code?",
                options: [
                    "When you need to repeat similar operations",
                    "When you want to slow down the program",
                    "When you need to delete variables",
                    "When you want to confuse other developers"
                ],
                correct: 0,
                type: "multiple_choice",
                explanation: "Loops are essential for repeating operations efficiently, especially when working with collections of data."
            });
        }

        // Class-related questions
        if (analysis.concepts.includes('classes')) {
            questions.push({
                text: "What is the primary purpose of classes in object-oriented programming?",
                options: [
                    "To create blueprints for objects",
                    "To make code run faster",
                    "To reduce file size",
                    "To hide code from users"
                ],
                correct: 0,
                type: "multiple_choice",
                explanation: "Classes serve as templates or blueprints that define the structure and behavior of objects."
            });
        }

        // Async programming questions
        if (analysis.concepts.includes('async-programming')) {
            questions.push({
                text: "Why is asynchronous programming important in modern applications?",
                options: [
                    "To handle operations without blocking the main thread",
                    "To make code more complicated",
                    "To use more CPU resources",
                    "To slow down the application"
                ],
                correct: 0,
                type: "multiple_choice",
                explanation: "Asynchronous programming allows applications to remain responsive while performing time-consuming operations like network requests or file I/O."
            });
        }

        return questions.slice(0, 3); // Limit to 3 questions
    }

    /**
     * Save session results to database
     */
    private async saveSessionResults(context: any, quizPassed: boolean, analysis: CodeAnalysis): Promise<void> {
        const codeHash = this.hashString(context.fileContent);
        
        // Save quiz result
        await this.databaseManager.saveQuizResult({
            codeHash,
            score: quizPassed ? 1.0 : 0.0,
            timestamp: new Date(),
            questionsCount: 3,
            correctAnswers: quizPassed ? 3 : 0
        });

        // Update progress for each concept
        for (const concept of analysis.concepts) {
            await this.databaseManager.updateProgress(concept, quizPassed);
        }
    }

    /**
     * Provide next steps based on quiz performance
     */
    private async provideNextSteps(quizPassed: boolean, analysis: CodeAnalysis): Promise<void> {
        if (quizPassed) {
            const message = `🎉 Great job! You understand the ${analysis.concepts.join(', ')} concepts well. ` +
                          `Ready for more advanced topics?`;
            
            const action = await vscode.window.showInformationMessage(
                message,
                'View Progress',
                'Start New Session'
            );

            if (action === 'View Progress') {
                this.showProgressReport();
            } else if (action === 'Start New Session') {
                this.startLearningSession();
            }
        } else {
            const message = `📚 Don't worry! Learning takes time. Let's review the ${analysis.concepts.join(', ')} concepts.`;
            
            const action = await vscode.window.showWarningMessage(
                message,
                'Try Again',
                'View Resources',
                'Lock Code'
            );

            if (action === 'Try Again') {
                this.startLearningSession();
            } else if (action === 'View Resources') {
                this.showLearningResources(analysis.concepts);
            } else if (action === 'Lock Code') {
                this.lockCurrentCode();
            }
        }
    }

    /**
     * Show progress report to user
     */
    private showProgressReport(): void {
        const stats = this.databaseManager.getQuizStats();
        const progress = this.databaseManager.getUserProgress();

        const report = `
📊 Your Learning Progress:
• Total Quizzes: ${stats.totalQuizzes}
• Average Score: ${Math.round(stats.averageScore * 100)}%
• Pass Rate: ${Math.round(stats.passRate * 100)}%

📚 Concept Mastery:
${progress.map(p => 
    `• ${p.concept}: ${p.correctAnswers}/${p.totalAttempts} (${Math.round((p.correctAnswers/p.totalAttempts)*100)}%)`
).join('\n')}
        `;

        vscode.window.showInformationMessage(report);
    }

    /**
     * Show learning resources for specific concepts
     */
    private showLearningResources(concepts: string[]): void {
        const resources = concepts.map(concept => {
            switch (concept) {
                case 'functions':
                    return '📖 Functions: Learn about function declaration, parameters, and return values';
                case 'loops':
                    return '🔄 Loops: Master for loops, while loops, and iteration patterns';
                case 'classes':
                    return '🏗️ Classes: Understand object-oriented programming and class design';
                case 'conditionals':
                    return '🤔 Conditionals: Practice if/else statements and logical operators';
                case 'async-programming':
                    return '⚡ Async Programming: Learn promises, async/await, and callback patterns';
                default:
                    return `📚 ${concept}: Additional learning resources recommended`;
            }
        }).join('\n');

        vscode.window.showInformationMessage(`Learning Resources:\n${resources}`);
    }

    /**
     * Lock current code until quiz is passed
     */
    private lockCurrentCode(): void {
        const context = ContextExtractor.getCurrentFileContext();
        if (context.fileContent) {
            const lockedHTML = this.codeLocker.lockCode(context.fileContent, 'medium');
            
            // In a real implementation, you'd display this in a webview
            vscode.window.showInformationMessage('Code has been locked. Pass the quiz to unlock!');
            console.log('Locked code HTML:', lockedHTML);
        }
    }

    /**
     * Utility function to hash strings
     */
    private hashString(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }
}

/**
 * Interface for code analysis results
 */
interface CodeAnalysis {
    language: string;
    concepts: string[];
    complexity: 'beginner' | 'intermediate' | 'advanced';
    lineCount: number;
    hasComments: boolean;
    patterns: string[];
}

// Export for use in extension.ts
// export { IntegratedWorkflow, CodeAnalysis };