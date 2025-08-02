// src/CodeDisplayProvider.ts
import * as vscode from 'vscode';
import { CodeLocker } from './CodeLocker';
import { QuizManager } from './QuizManager';

/**
 * Webview provider for displaying locked code snippets
 */
export class CodeDisplayProvider {
    private static instance: CodeDisplayProvider;
    private codeLocker: CodeLocker;
    private quizManager: QuizManager;

    constructor() {
        this.codeLocker = CodeLocker.getInstance();
        this.quizManager = QuizManager.getInstance();
    }

    static getInstance(): CodeDisplayProvider {
        if (!CodeDisplayProvider.instance) {
            CodeDisplayProvider.instance = new CodeDisplayProvider();
        }
        return CodeDisplayProvider.instance;
    }

    /**
     * Display locked code in a webview panel
     */
    async displayLockedCode(code: string, difficulty: 'easy' | 'medium' | 'hard' = 'medium'): Promise<void> {
        const panel = vscode.window.createWebviewPanel(
            'codewise-locked-code',
            'Locked Code - CodeWise',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        const lockedHTML = this.codeLocker.lockCode(code, difficulty);
        panel.webview.html = this.getWebviewContent(lockedHTML, code);

        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.type) {
                case 'unlockCode':
                    await this.handleUnlockCode(panel, message.id, code);
                    break;
                case 'startQuiz':
                    await this.handleStartQuiz(panel, message.id, code);
                    break;
            }
        });
    }

    /**
     * Handle unlock code request
     */
    private async handleUnlockCode(panel: vscode.WebviewPanel, id: string, originalCode: string): Promise<void> {
        const result = this.codeLocker.attemptUnlock(id);
        
        if (result.success) {
            // Update the webview to show unlocked code
            panel.webview.postMessage({
                type: 'codeUnlocked',
                id: id,
                code: originalCode
            });
            
            vscode.window.showInformationMessage('🎉 Code unlocked successfully!');
        } else {
            vscode.window.showErrorMessage(result.message);
        }
    }

    /**
     * Handle start quiz request
     */
    private async handleStartQuiz(panel: vscode.WebviewPanel, id: string, code: string): Promise<void> {
        try {
            const passed = await this.quizManager.presentQuiz(code);
            
            if (passed) {
                // Unlock the code after passing quiz
                await this.handleUnlockCode(panel, id, code);
            } else {
                vscode.window.showWarningMessage('📚 Quiz not passed. Try again to unlock the code!');
            }
        } catch (error) {
            console.error('Error starting quiz:', error);
            vscode.window.showErrorMessage('Failed to start quiz. Please try again.');
        }
    }

    /**
     * Generate complete HTML content for the webview
     */
    private getWebviewContent(lockedHTML: string, originalCode: string): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Locked Code - CodeWise</title>
    <style>
        body {
            font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
            background: var(--vscode-editor-background, #ffffff);
            color: var(--vscode-editor-foreground, #333333);
            margin: 0;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: var(--vscode-textBlockQuote-background, #f5f5f5);
            border-radius: 8px;
            border-left: 4px solid var(--vscode-textBlockQuote-border, #007acc);
        }
        
        .header h1 {
            margin: 0 0 10px 0;
            color: var(--vscode-textLink-foreground, #007acc);
        }
        
        .locked-code-wrapper {
            max-width: 800px;
            margin: 0 auto;
        }
        
        .success-message {
            background: #d4edda;
            color: #155724;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
            font-weight: bold;
            display: none;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔒 CodeWise - Locked Code</h1>
        <p>Complete the challenge below to unlock and view the code</p>
    </div>
    
    <div class="success-message" id="successMessage">
        🎉 Code unlocked! Great job!
    </div>
    
    <div class="locked-code-wrapper">
        ${lockedHTML}
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        // Global functions that the locked code HTML expects
        window.unlockCode = function(id) {
            vscode.postMessage({ type: 'unlockCode', id: id });
        };
        
        window.startSimpleQuiz = function(id) {
            vscode.postMessage({ type: 'startQuiz', id: id });
        };
        
        // Listen for messages from the extension
        window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.type) {
                case 'codeUnlocked':
                    const container = document.querySelector('[data-code-id="' + message.id + '"]');
                    if (container) {
                        container.innerHTML = \`
                            <div class="success-message" style="display: block;">
                                🎉 Code Unlocked Successfully!
                            </div>
                            <pre class="unlocked-code" style="
                                padding: 20px;
                                background: var(--vscode-textCodeBlock-background, #f8f8f8);
                                border: 2px solid #28a745;
                                border-radius: 8px;
                                font-family: 'Courier New', monospace;
                                white-space: pre-wrap;
                                overflow-x: auto;
                            ">\${message.code}</pre>
                        \`;
                        
                        // Show success message
                        document.getElementById('successMessage').style.display = 'block';
                        
                        // Scroll to the unlocked code
                        container.scrollIntoView({ behavior: 'smooth' });
                    }
                    break;
            }
        });
    </script>
</body>
</html>`;
    }

    /**
     * Display code snippet in a simple read-only view
     */
    async displayCode(code: string, title: string = 'Code View'): Promise<void> {
        const panel = vscode.window.createWebviewPanel(
            'codewise-code-view',
            title,
            vscode.ViewColumn.Beside,
            { enableScripts: false }
        );

        panel.webview.html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            margin: 0;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 20px;
            color: var(--vscode-textLink-foreground);
        }
        
        pre {
            background: var(--vscode-textCodeBlock-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            padding: 20px;
            font-family: 'Courier New', monospace;
            white-space: pre-wrap;
            overflow-x: auto;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${title}</h1>
    </div>
    <pre>${this.escapeHtml(code)}</pre>
</body>
</html>`;
    }

    /**
     * Escape HTML characters
     */
    private escapeHtml(text: string): string {
        const div = { innerHTML: '' } as any;
        div.textContent = text;
        return div.innerHTML || text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}