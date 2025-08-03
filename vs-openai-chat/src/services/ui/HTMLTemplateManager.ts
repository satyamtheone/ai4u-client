import { CSSManager } from './CSSManager';
import { HTMLGenerator } from './HTMLGenerator';
import { BaseJavaScriptManager } from './BaseJavaScriptManager';
import { QuizJavaScriptManager } from './QuizJavaScriptManager';

export class HTMLTemplateManager {
    
    public static generateHTML(): string {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>AI4U Chat with Learning Gates</title>
            <style>
                ${CSSManager.getAllStyles()}
            </style>
        </head>
        <body>
            ${HTMLGenerator.getCompleteBodyHTML()}
            <script>
                ${this.getCompleteJavaScript()}
            </script>
        </body>
        </html>`;
    }

    private static getCompleteJavaScript(): string {
        return `
                ${BaseJavaScriptManager.getCoreVariables()}
                ${QuizJavaScriptManager.getQuizVariables()}

                ${BaseJavaScriptManager.getBaseFunctions()}
                ${QuizJavaScriptManager.getQuizFunctions()}

                // MAIN MESSAGE HANDLER
                window.addEventListener('message', function(event) {
                    const message = event.data;
                    console.log('📨 Received message:', message.type, message);
                    
                    switch (message.type) {
                        ${BaseJavaScriptManager.getBaseMessageHandlers()}
                        ${QuizJavaScriptManager.getQuizMessageHandlers()}
                    }
                });

                ${BaseJavaScriptManager.getInitialization()}
        `;
    }

    // Keep these methods for backward compatibility
    public static getStyles(): string {
        return CSSManager.getAllStyles();
    }

    public static getBodyHTML(): string {
        return HTMLGenerator.getCompleteBodyHTML();
    }

    public static getJavaScript(): string {
        return this.getCompleteJavaScript();
    }
}