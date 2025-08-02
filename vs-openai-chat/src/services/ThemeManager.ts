export interface ThemeColors {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    background: string;
    foreground: string;
}

export class ThemeManager {
    private static readonly VS_CODE_THEME_VARIABLES = {
        // VS Code CSS variables that are always available
        background: 'var(--vscode-editor-background)',
        foreground: 'var(--vscode-foreground)',
        inputBackground: 'var(--vscode-input-background)',
        inputForeground: 'var(--vscode-input-foreground)',
        inputBorder: 'var(--vscode-input-border)',
        buttonBackground: 'var(--vscode-button-background)',
        buttonForeground: 'var(--vscode-button-foreground)',
        buttonHoverBackground: 'var(--vscode-button-hoverBackground)',
        buttonSecondaryBackground: 'var(--vscode-button-secondaryBackground)',
        buttonSecondaryForeground: 'var(--vscode-button-secondaryForeground)',
        buttonSecondaryHoverBackground: 'var(--vscode-button-secondaryHoverBackground)',
        descriptionForeground: 'var(--vscode-descriptionForeground)',
        fontFamily: 'var(--vscode-font-family)'
    };

    public static getThemeVariables(): typeof ThemeManager.VS_CODE_THEME_VARIABLES {
        return { ...this.VS_CODE_THEME_VARIABLES };
    }

    public static generateThemeCSS(): string {
        return `
            :root {
                /* Custom theme variables */
                --ai4u-success-color: #4CAF50;
                --ai4u-warning-color: #ff9800;
                --ai4u-error-color: #f44336;
                --ai4u-info-color: #2196F3;
                --ai4u-local-color: #2196F3;
                --ai4u-backend-color: #4CAF50;
                
                /* Animation timings */
                --ai4u-transition-fast: 0.15s ease;
                --ai4u-transition-normal: 0.3s ease;
                --ai4u-transition-slow: 0.5s ease;
                
                /* Spacing */
                --ai4u-spacing-xs: 4px;
                --ai4u-spacing-sm: 8px;
                --ai4u-spacing-md: 10px;
                --ai4u-spacing-lg: 16px;
                --ai4u-spacing-xl: 20px;
                
                /* Border radius */
                --ai4u-border-radius-sm: 3px;
                --ai4u-border-radius-md: 4px;
                --ai4u-border-radius-lg: 6px;
                
                /* Font sizes */
                --ai4u-font-size-xs: 9px;
                --ai4u-font-size-sm: 11px;
                --ai4u-font-size-md: 12px;
                --ai4u-font-size-lg: 14px;
                
                /* Shadows */
                --ai4u-shadow-sm: 0 1px 3px rgba(0,0,0,0.1);
                --ai4u-shadow-md: 0 2px 6px rgba(0,0,0,0.15);
                
                /* Z-index layers */
                --ai4u-z-tooltip: 1000;
                --ai4u-z-modal: 1100;
                --ai4u-z-overlay: 1200;
            }
        `;
    }

    public static getStatusColor(status: 'connected' | 'disconnected' | 'error' | 'warning'): string {
        switch (status) {
            case 'connected':
                return 'var(--ai4u-success-color)';
            case 'error':
                return 'var(--ai4u-error-color)';
            case 'warning':
                return 'var(--ai4u-warning-color)';
            case 'disconnected':
            default:
                return this.VS_CODE_THEME_VARIABLES.descriptionForeground;
        }
    }

    public static getModeColor(mode: 'local' | 'backend'): string {
        switch (mode) {
            case 'local':
                return 'var(--ai4u-local-color)';
            case 'backend':
                return 'var(--ai4u-backend-color)';
            default:
                return this.VS_CODE_THEME_VARIABLES.descriptionForeground;
        }
    }

    public static generateButtonCSS(variant: 'primary' | 'secondary' = 'primary'): string {
        if (variant === 'secondary') {
            return `
                background-color: ${this.VS_CODE_THEME_VARIABLES.buttonSecondaryBackground};
                color: ${this.VS_CODE_THEME_VARIABLES.buttonSecondaryForeground};
                border: none;
                cursor: pointer;
                border-radius: var(--ai4u-border-radius-sm);
                font-size: var(--ai4u-font-size-sm);
                padding: var(--ai4u-spacing-xs) var(--ai4u-spacing-md);
                transition: background-color var(--ai4u-transition-fast);
            `;
        }
        
        return `
            background-color: ${this.VS_CODE_THEME_VARIABLES.buttonBackground};
            color: ${this.VS_CODE_THEME_VARIABLES.buttonForeground};
            border: none;
            cursor: pointer;
            border-radius: var(--ai4u-border-radius-sm);
            font-size: var(--ai4u-font-size-sm);
            padding: var(--ai4u-spacing-xs) var(--ai4u-spacing-md);
            transition: background-color var(--ai4u-transition-fast);
        `;
    }

    public static generateInputCSS(): string {
        return `
            background-color: ${this.VS_CODE_THEME_VARIABLES.inputBackground};
            color: ${this.VS_CODE_THEME_VARIABLES.inputForeground};
            border: 1px solid ${this.VS_CODE_THEME_VARIABLES.inputBorder};
            border-radius: var(--ai4u-border-radius-sm);
            padding: var(--ai4u-spacing-xs);
            font-family: ${this.VS_CODE_THEME_VARIABLES.fontFamily};
            transition: border-color var(--ai4u-transition-fast);
        `;
    }

    public static generateMessageCSS(type: 'user' | 'bot'): string {
        const baseCSS = `
            margin-bottom: var(--ai4u-spacing-md);
            padding: var(--ai4u-spacing-sm);
            border-radius: var(--ai4u-border-radius-md);
            position: relative;
            max-width: 90%;
            word-wrap: break-word;
            line-height: 1.4;
        `;

        if (type === 'user') {
            return baseCSS + `
                background-color: ${this.VS_CODE_THEME_VARIABLES.buttonBackground};
                color: ${this.VS_CODE_THEME_VARIABLES.buttonForeground};
                text-align: right;
                margin-left: auto;
            `;
        } else {
            return baseCSS + `
                background-color: ${this.VS_CODE_THEME_VARIABLES.inputBackground};
                color: ${this.VS_CODE_THEME_VARIABLES.inputForeground};
                border: 1px solid ${this.VS_CODE_THEME_VARIABLES.inputBorder};
                margin-right: auto;
            `;
        }
    }

    public static generateAnimationCSS(): string {
        return `
            .loading-indicator {
                display: inline-block;
                animation: pulse 1.5s ease-in-out infinite;
            }
            
            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
            }
            
            .fade-in {
                animation: fadeIn 0.3s ease-in;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .slide-down {
                animation: slideDown 0.2s ease-out;
            }
            
            @keyframes slideDown {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .button-press {
                transform: scale(0.98);
                transition: transform 0.1s ease;
            }
            
            .success-flash {
                animation: successFlash 0.5s ease;
            }
            
            @keyframes successFlash {
                0% { background-color: var(--ai4u-success-color); }
                100% { background-color: transparent; }
            }
        `;
    }

    public static isDarkTheme(): boolean {
        // This is a heuristic - in a real implementation, you might want to detect the theme
        // VS Code doesn't provide a direct way to detect theme in webviews
        return true; // Assume dark theme for now
    }

    public static getContrastColor(backgroundColor: string): string {
        // Simple contrast calculation - in production, use a proper contrast ratio calculation
        return this.isDarkTheme() ? '#ffffff' : '#000000';
    }

    public static generateResponsiveCSS(): string {
        return `
            @media (max-width: 300px) {
                .control-buttons {
                    flex-direction: column;
                }
                
                .mode-toggle {
                    flex-direction: column;
                    align-items: stretch;
                    gap: var(--ai4u-spacing-xs);
                }
                
                .btn {
                    width: 100%;
                    margin-bottom: var(--ai4u-spacing-xs);
                }
            }
            
            @media (max-height: 400px) {
                .messages {
                    max-height: 200px;
                }
                
                .mode-section,
                .api-key-section {
                    padding: var(--ai4u-spacing-xs);
                    margin-bottom: var(--ai4u-spacing-xs);
                }
            }
        `;
    }
}