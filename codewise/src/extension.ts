// src/extension.ts - Fixed Production Version
import * as vscode from 'vscode';
import { ChatProvider } from './ChatProvider';
import { ContextExtractor } from './ContextExtractor';

export function activate(context: vscode.ExtensionContext) {
    console.log('🧠 CodeWise extension is activating...');

    try {
        // Initialize and register the chat provider
        console.log('📝 Initializing ChatProvider...');
        const chatProvider = new ChatProvider(context.extensionUri);

        // Register webview view provider with correct view ID matching package.json
        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider('codewise-chat', chatProvider, {
                webviewOptions: {
                    retainContextWhenHidden: true
                }
            })
        );
        console.log('✅ Chat provider registered successfully');

        // Register all your custom commands
        registerCommands(context);

        // Show welcome message for first-time users
        showWelcomeMessage(context);

        // ✅ Add CodeWise status bar item
        const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        statusBarItem.text = '$(rocket) CodeWise';
        statusBarItem.tooltip = 'Open CodeWise Chat';
        statusBarItem.command = 'codewise.openChat';
        statusBarItem.show();
        context.subscriptions.push(statusBarItem);

        // Command to open the CodeWise WebView
        const openChatCommand = vscode.commands.registerCommand('codewise.openChat', () => {
            vscode.commands.executeCommand('workbench.view.extension.codewise-chat');
        });
        context.subscriptions.push(openChatCommand);

        console.log('🎉 CodeWise extension activated successfully');

    } catch (error) {
        console.error('💥 CodeWise activation failed:', error);
        vscode.window.showErrorMessage(`CodeWise failed to activate: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

function registerCommands(context: vscode.ExtensionContext) {
    console.log('📋 Registering commands...');

    // Hello World - Basic test command
    context.subscriptions.push(
        vscode.commands.registerCommand('codewise.helloWorld', () => {
            console.log('👋 Hello World command executed');
            vscode.window.showInformationMessage('Hello from CodeWise! 🧠✨');
        })
    );

    // Open Chat - Multiple fallback methods
    context.subscriptions.push(
        vscode.commands.registerCommand('codewise.openChat', async () => {
            console.log('💬 Opening CodeWise chat...');
            
            try {
                // Method 1: Try to focus the specific view
                await vscode.commands.executeCommand('codewise-chat.focus');
                console.log('✅ Chat opened with view focus');
                return;
            } catch (error1) {
                console.log('⚠️ View focus failed, trying container...');
                
                try {
                    // Method 2: Try to open the container
                    await vscode.commands.executeCommand('workbench.view.extension.codewise-sidebar');
                    console.log('✅ Chat opened with container focus');
                    return;
                } catch (error2) {
                    console.log('⚠️ Container focus failed, trying activity bar...');
                    
                    try {
                        // Method 3: Try to focus activity bar
                        await vscode.commands.executeCommand('workbench.action.focusActivityBar');
                        console.log('✅ Activity bar focused');
                        vscode.window.showInformationMessage('Please click the CodeWise icon (🎓) in the Activity Bar to open chat.');
                        return;
                    } catch (error3) {
                        console.error('❌ All chat opening methods failed:', { error1, error2, error3 });
                        vscode.window.showWarningMessage(
                            'Could not open chat automatically. Please click the CodeWise icon (🎓) in the Activity Bar.'
                        );
                    }
                }
            }
        })
    );

    // Show Context - Enhanced file information
    context.subscriptions.push(
        vscode.commands.registerCommand('codewise.showContext', async () => {
            console.log('📄 Showing file context...');
            
            try {
                const fileContext = ContextExtractor.getCurrentFileContext();
                
                if (Object.keys(fileContext).length === 0) {
                    vscode.window.showWarningMessage('📝 No active editor found. Please open a code file to see context.');
                    return;
                }

                const contextLines = [
                    '📄 **CodeWise File Context**',
                    '',
                    `🔤 **Language:** ${fileContext.language || 'Unknown'}`,
                    `📁 **File:** ${fileContext.fileName?.split('/').pop() || 'Untitled'}`,
                    `📍 **Current Line:** ${(fileContext.cursorLine || 0) + 1}`,
                    `📊 **File Size:** ${fileContext.fileContent?.length || 0} characters`,
                ];

                if (fileContext.selectedText) {
                    const preview = fileContext.selectedText.length > 50 
                        ? fileContext.selectedText.substring(0, 50) + '...' 
                        : fileContext.selectedText;
                    contextLines.push(`✂️ **Selected:** ${preview}`);
                }

                if (fileContext.projectRoot) {
                    contextLines.push(`🗂️ **Project:** ${fileContext.projectRoot.split('/').pop()}`);
                }

                const contextInfo = contextLines.join('\n');
                vscode.window.showInformationMessage(contextInfo);
                console.log('✅ Context displayed successfully');

            } catch (error) {
                console.error('❌ Context extraction failed:', error);
                vscode.window.showErrorMessage('Failed to extract file context. Please try again.');
            }
        })
    );

    // Start Learning Session - Full workflow
    context.subscriptions.push(
        vscode.commands.registerCommand('codewise.startLearning', async () => {
            console.log('🎓 Starting learning session...');
            
            try {
                const fileContext = ContextExtractor.getCurrentFileContext();
                
                if (!fileContext.fileContent) {
                    vscode.window.showWarningMessage('📝 Please open a code file first to start a learning session.');
                    return;
                }

                vscode.window.showInformationMessage('🎓 Learning session started! Check for quiz prompts.');
                
                // For now, show a placeholder message
                // This would integrate with QuizManager and other components
                const response = await vscode.window.showInformationMessage(
                    `🧠 Ready to learn from your ${fileContext.language} code?`,
                    'Start Quiz', 'Get Explanation', 'Cancel'
                );

                switch (response) {
                    case 'Start Quiz':
                        vscode.window.showInformationMessage('🧠 Quiz feature coming soon! Use "CodeWise: Quick Quiz" for now.');
                        break;
                    case 'Get Explanation':
                        vscode.window.showInformationMessage('💡 Code explanation feature coming soon!');
                        break;
                    default:
                        console.log('📚 Learning session cancelled by user');
                }

                console.log('✅ Learning session completed');

            } catch (error) {
                console.error('❌ Learning session failed:', error);
                vscode.window.showErrorMessage('Failed to start learning session. Please try again.');
            }
        })
    );

    // Quick Quiz - Simple quiz functionality
    context.subscriptions.push(
        vscode.commands.registerCommand('codewise.quickQuiz', async () => {
            console.log('🧠 Starting quick quiz...');
            
            try {
                const fileContext = ContextExtractor.getCurrentFileContext();
                
                if (!fileContext.fileContent) {
                    vscode.window.showWarningMessage('📝 Please open a code file first to generate a quiz.');
                    return;
                }

                // Simple quiz simulation (replace with actual QuizManager later)
                const hasFunction = fileContext.fileContent.toLowerCase().includes('function');
                const hasLoop = fileContext.fileContent.toLowerCase().includes('for') || 
                               fileContext.fileContent.toLowerCase().includes('while');

                if (hasFunction) {
                    const answer = await vscode.window.showQuickPick(
                        [
                            'To reuse code and organize logic',
                            'To slow down the program',
                            'To use more memory',
                            'To create errors'
                        ],
                        {
                            placeHolder: '🤔 What is the main purpose of functions in programming?'
                        }
                    );

                    if (answer === 'To reuse code and organize logic') {
                        vscode.window.showInformationMessage('🎉 Correct! Functions help organize and reuse code efficiently.');
                    } else if (answer) {
                        vscode.window.showWarningMessage('❌ Not quite right. Functions are used to organize and reuse code!');
                    }
                } else if (hasLoop) {
                    const answer = await vscode.window.showQuickPick(
                        [
                            'To repeat code execution',
                            'To delete variables',
                            'To slow down programs',
                            'To create syntax errors'
                        ],
                        {
                            placeHolder: '🔄 What do loops allow you to do?'
                        }
                    );

                    if (answer === 'To repeat code execution') {
                        vscode.window.showInformationMessage('🎉 Excellent! Loops enable repetitive execution of code blocks.');
                    } else if (answer) {
                        vscode.window.showWarningMessage('❌ Try again! Loops are used to repeat code execution.');
                    }
                } else {
                    vscode.window.showInformationMessage('📚 No quiz questions available for this code. Try a file with functions or loops!');
                }

                console.log('✅ Quick quiz completed');

            } catch (error) {
                console.error('❌ Quick quiz failed:', error);
                vscode.window.showErrorMessage('Failed to start quiz. Please try again.');
            }
        })
    );

    // Lock Code - Simple code locking demonstration
    context.subscriptions.push(
        vscode.commands.registerCommand('codewise.lockCode', async () => {
            console.log('🔒 Locking current code...');
            
            try {
                const fileContext = ContextExtractor.getCurrentFileContext();
                
                if (!fileContext.fileContent) {
                    vscode.window.showWarningMessage('📝 Please open a code file first to lock it.');
                    return;
                }

                // Simple demonstration of code locking
                const response = await vscode.window.showInformationMessage(
                    `🔒 Lock this ${fileContext.language} code behind a learning challenge?`,
                    'Lock Easy', 'Lock Medium', 'Lock Hard', 'Cancel'
                );

                if (response && response !== 'Cancel') {
                    const difficulty = response.split(' ')[1].toLowerCase();
                    vscode.window.showInformationMessage(
                        `🔒 Code locked with ${difficulty} difficulty! ` +
                        `Complete a quiz to unlock it. (Feature demo - full implementation coming soon!)`
                    );
                    console.log(`✅ Code locked with ${difficulty} difficulty`);
                } else {
                    console.log('🚫 Code locking cancelled');
                }

            } catch (error) {
                console.error('❌ Code locking failed:', error);
                vscode.window.showErrorMessage('Failed to lock code. Please try again.');
            }
        })
    );

    // Debug Views - Troubleshooting command
    context.subscriptions.push(
        vscode.commands.registerCommand('codewise.debugViews', async () => {
            console.log('🔍 Running debug diagnostics...');
            
            try {
                // Collect debug information
                const commands = await vscode.commands.getCommands();
                const codewiseCommands = commands.filter(cmd => cmd.includes('codewise'));
                const viewCommands = commands.filter(cmd => cmd.includes('view') && cmd.includes('workbench'));
                
                const debugInfo = [
                    '🔍 **CodeWise Debug Information**',
                    '',
                    `📋 **Total Commands:** ${commands.length}`,
                    `🧠 **CodeWise Commands:** ${codewiseCommands.length}`,
                    `👁️ **View Commands:** ${viewCommands.length}`,
                    `📱 **VS Code Version:** ${vscode.version}`,
                    '',
                    '**CodeWise Commands Found:**',
                    ...codewiseCommands.map(cmd => `• ${cmd}`)
                ];

                console.log('🔍 Debug Info:', {
                    totalCommands: commands.length,
                    codewiseCommands: codewiseCommands.length,
                    viewCommands: viewCommands.length,
                    vsCodeVersion: vscode.version
                });

                vscode.window.showInformationMessage(debugInfo.join('\n'));
                console.log('✅ Debug diagnostics completed');

            } catch (error) {
                console.error('❌ Debug diagnostics failed:', error);
                vscode.window.showErrorMessage('Debug diagnostics failed. Check the console for details.');
            }
        })
    );

    console.log(`✅ ${context.subscriptions.length} commands registered successfully`);
}

async function showWelcomeMessage(context: vscode.ExtensionContext) {
    try {
        const isFirstRun = context.globalState.get('codewise.firstRun', true);
        
        if (isFirstRun) {
            console.log('👋 Showing welcome message to new user...');
            
            const selection = await vscode.window.showInformationMessage(
                '🧠 Welcome to CodeWise! Your interactive coding learning assistant is ready.',
                'Open Chat', 'Show Help', 'Start Learning', 'Maybe Later'
            );

            switch (selection) {
                case 'Open Chat':
                    await vscode.commands.executeCommand('codewise.openChat');
                    break;
                case 'Show Help':
                    await vscode.commands.executeCommand('codewise.debugViews');
                    break;
                case 'Start Learning':
                    await vscode.commands.executeCommand('codewise.startLearning');
                    break;
                case 'Maybe Later':
                    vscode.window.showInformationMessage('💡 Access CodeWise anytime via the Command Palette or Activity Bar icon!');
                    break;
                default:
                    console.log('👋 User dismissed welcome message');
            }
            
            // Mark as no longer first run
            await context.globalState.update('codewise.firstRun', false);
            console.log('✅ First run setup completed');
        }
    } catch (error) {
        console.error('❌ Welcome message failed:', error);
        // Don't show error to user for welcome message failures
    }
}

export function deactivate() {
    console.log('👋 CodeWise extension is deactivating...');
    
    try {
        // Cleanup code here if needed
        console.log('✅ CodeWise cleanup completed successfully');
    } catch (error) {
        console.error('❌ Error during CodeWise deactivation:', error);
    }
    
    console.log('👋 CodeWise extension deactivated');
}