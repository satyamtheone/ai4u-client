// src/ContextExtractor.ts
import * as vscode from 'vscode';

export interface FileContext {
    language?: string;
    fileName?: string;
    selectedText?: string;
    cursorLine?: number;
    projectRoot?: string;
    fileContent?: string;
}

export class ContextExtractor {
    /**
     * Extracts context from the currently active VS Code editor
     */
    static getCurrentFileContext(): FileContext {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            return {};
        }

        const document = activeEditor.document;
        const selection = activeEditor.selection;
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

        return {
            language: document.languageId,
            fileName: document.fileName,
            selectedText: selection.isEmpty ? undefined : document.getText(selection),
            cursorLine: selection.active.line,
            projectRoot: workspaceFolder?.uri.fsPath,
            fileContent: document.getText()
        };
    }

    /**
     * Gets the current line content
     */
    static getCurrentLine(): string | undefined {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) return undefined;

        const line = activeEditor.selection.active.line;
        return activeEditor.document.lineAt(line).text;
    }

    /**
     * Gets surrounding context (lines before and after current position)
     */
    static getSurroundingContext(linesBefore: number = 5, linesAfter: number = 5): string | undefined {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) return undefined;

        const document = activeEditor.document;
        const currentLine = activeEditor.selection.active.line;
        
        const startLine = Math.max(0, currentLine - linesBefore);
        const endLine = Math.min(document.lineCount - 1, currentLine + linesAfter);
        
        const range = new vscode.Range(startLine, 0, endLine, document.lineAt(endLine).text.length);
        return document.getText(range);
    }
}