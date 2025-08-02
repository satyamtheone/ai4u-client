// src/CodeLocker.ts

export class CodeLocker {
    private lockedCodes: Map<string, string> = new Map();
    private static instance: CodeLocker;

    constructor() {
        // Constructor for CodeLocker - no browser setup needed in VS Code extension
    }

    static getInstance(): CodeLocker {
        if (!CodeLocker.instance) {
            CodeLocker.instance = new CodeLocker();
        }
        return CodeLocker.instance;
    }

    /**
     * Locks a code snippet behind a simple challenge
     */
    lockCode(code: string, difficulty: 'easy' | 'medium' | 'hard' = 'easy'): string {
        const id = this.generateId();
        this.lockedCodes.set(id, code);

        return this.generateLockedCodeHtml(id, code, difficulty);
    }

    /**
     * Unlocks code by ID (basic implementation)
     */
    unlockCode(id: string): string | null {
        return this.lockedCodes.get(id) || null;
    }

    /**
     * Simple challenge-based unlock (can be extended later)
     */
    attemptUnlock(id: string, answer?: string): { success: boolean; code?: string; message: string } {
        const code = this.lockedCodes.get(id);
        if (!code) {
            return { success: false, message: 'Code not found' };
        }

        // For now, any attempt unlocks the code (basic version)
        // This can be extended with actual quiz logic later
        return {
            success: true,
            code: code,
            message: 'Code unlocked successfully!'
        };
    }

    private generateLockedCodeHtml(id: string, code: string, difficulty: string): string {
        const blurredCode = this.blurCode(code);
        const difficultyIcon = this.getDifficultyIcon(difficulty);
        
        return `
        <div class="locked-code-container" data-code-id="${id}">
            <div class="lock-overlay">
                <div class="lock-header">
                    <span class="lock-icon">🔒</span>
                    <h3>Code Locked</h3>
                    <span class="difficulty-badge">${difficultyIcon} ${difficulty.toUpperCase()}</span>
                </div>
                <p>Complete a quick challenge to unlock this code snippet</p>
                <div class="unlock-buttons">
                    <button onclick="startSimpleQuiz('${id}')" class="quiz-button">
                        🧠 Start Quiz
                    </button>
                    <button onclick="unlockCode('${id}')" class="unlock-button">
                        🔓 Quick Unlock
                    </button>
                </div>
            </div>
            <pre class="blurred-code">${blurredCode}</pre>
            <style>
                .locked-code-container {
                    position: relative;
                    margin: 10px 0;
                    border: 2px dashed #ccc;
                    border-radius: 8px;
                    overflow: hidden;
                }
                .lock-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(255, 255, 255, 0.95);
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    z-index: 10;
                    padding: 20px;
                    text-align: center;
                }
                .lock-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 10px;
                }
                .lock-icon {
                    font-size: 24px;
                }
                .difficulty-badge {
                    background: #007acc;
                    color: white;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: bold;
                }
                .unlock-buttons {
                    display: flex;
                    gap: 10px;
                    margin-top: 15px;
                }
                .quiz-button, .unlock-button {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-weight: bold;
                    transition: all 0.3s ease;
                }
                .quiz-button {
                    background: #28a745;
                    color: white;
                }
                .quiz-button:hover {
                    background: #218838;
                }
                .unlock-button {
                    background: #6c757d;
                    color: white;
                }
                .unlock-button:hover {
                    background: #545b62;
                }
                .blurred-code {
                    filter: blur(3px);
                    opacity: 0.6;
                    user-select: none;
                    padding: 15px;
                    background: #f8f9fa;
                    margin: 0;
                    font-family: 'Courier New', monospace;
                }
                .unlocked-code {
                    padding: 15px;
                    background: #f8f9fa;
                    margin: 0;
                    font-family: 'Courier New', monospace;
                    border: 2px solid #28a745;
                    border-radius: 5px;
                }
            </style>
            <script>
                // JavaScript functions for webview interaction
                function unlockCode(id) {
                    const element = document.querySelector('[data-code-id="' + id + '"]');
                    if (element) {
                        // Send message to VS Code extension
                        if (typeof acquireVsCodeApi !== 'undefined') {
                            const vscode = acquireVsCodeApi();
                            vscode.postMessage({ type: 'unlockCode', id: id });
                        } else {
                            // Fallback for testing in browser
                            element.innerHTML = '<pre class="unlocked-code">Code unlocked! (This would show the actual code)</pre>';
                        }
                    }
                }
                
                function startSimpleQuiz(id) {
                    if (typeof acquireVsCodeApi !== 'undefined') {
                        const vscode = acquireVsCodeApi();
                        vscode.postMessage({ type: 'startQuiz', id: id });
                    } else {
                        // Fallback for testing
                        const answer = prompt('What does "console.log()" do?\\nA) Prints to console\\nB) Creates a log file\\nC) Deletes console\\nEnter A, B, or C:');
                        if (answer && answer.toLowerCase() === 'a') {
                            unlockCode(id);
                        } else {
                            alert('Incorrect answer. Try again!');
                        }
                    }
                }
            </script>
        </div>`;
    }
    

    private blurCode(code: string): string {
        // Replace code with blocks but keep structure
        return code
            .replace(/[a-zA-Z]/g, '█')
            .replace(/[0-9]/g, '▓')
            .replace(/[{}()[\]]/g, (match) => match) // Keep structural characters
            .replace(/[;,.]/g, (match) => match); // Keep punctuation
    }

    private getDifficultyIcon(difficulty: string): string {
        switch (difficulty) {
            case 'easy': return '🟢';
            case 'medium': return '🟡';
            case 'hard': return '🔴';
            default: return '⚪';
        }
    }

    private generateId(): string {
        return 'code_' + Math.random().toString(36).substring(2, 10);
    }

    /**
     * Get statistics about locked codes
     */
    getStats(): { total: number; locked: number } {
        return {
            total: this.lockedCodes.size,
            locked: this.lockedCodes.size
        };
    }

    /**
     * Clear all locked codes
     */
    clearAll(): void {
        this.lockedCodes.clear();
    }
}