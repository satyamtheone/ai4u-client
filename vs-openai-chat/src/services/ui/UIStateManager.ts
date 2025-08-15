import { LOGGER } from '../../logger';
export interface UIState {
    mode: 'local' | 'backend';
    connectionStatus: 'connected' | 'disconnected' | 'error' | 'warning';
    apiKeyStatus: 'connected' | 'disconnected' | 'error';
    sessionId?: string;
    isLoading: boolean;
    lastError?: string;
    backendUrl?: string;
}

export interface StateChangeListener {
    (state: UIState, previousState: UIState): void;
}

export class UIStateManager {
    private currentState: UIState;
    private listeners: StateChangeListener[] = [];

    constructor() {
        this.currentState = {
            mode: 'local',
            connectionStatus: 'disconnected',
            apiKeyStatus: 'disconnected',
            isLoading: false
        };
        LOGGER('UIStateManager initialized with default state');
    }

    public getState(): UIState {
        return { ...this.currentState };
    }

    public updateState(partialState: Partial<UIState>): void {
        const previousState = { ...this.currentState };
        this.currentState = { ...this.currentState, ...partialState };
        
        LOGGER(`UIStateManager: State updated ${{
            previous: previousState,
            current: this.currentState,
            changes: partialState
        }}`);

        // Notify listeners
        this.listeners.forEach(listener => {
            try {
                listener(this.currentState, previousState);
            } catch (error) {
                console.error('UIStateManager: Error in state change listener:', error);
            }
        });
    }

    public setMode(mode: 'local' | 'backend'): void {
        this.updateState({ mode });
    }

    public setConnectionStatus(status: 'connected' | 'disconnected' | 'error' | 'warning'): void {
        this.updateState({ connectionStatus: status });
    }

    public setSessionId(sessionId: string | undefined): void {
        this.updateState({ sessionId });
    }

    public setLoading(isLoading: boolean): void {
        this.updateState({ isLoading });
    }

    public setError(error: string | undefined): void {
        this.updateState({ lastError: error });
    }

    public setBackendUrl(backendUrl: string | undefined): void {
        this.updateState({ backendUrl });
    }

    public isBackendMode(): boolean {
        return this.currentState.mode === 'backend';
    }

    public isConnected(): boolean {
        if (this.currentState.mode === 'backend') {
            return this.currentState.connectionStatus === 'connected';
        } else {
            return this.currentState.apiKeyStatus === 'connected';
        }
    }

    public isReady(): boolean {
        return this.isConnected() && !this.currentState.isLoading;
    }

    public addStateChangeListener(listener: StateChangeListener): void {
        this.listeners.push(listener);
    }

    public removeStateChangeListener(listener: StateChangeListener): void {
        const index = this.listeners.indexOf(listener);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    public getStatusSummary(): string {
        const state = this.currentState;
        const mode = state.mode.toUpperCase();
        
        if (state.isLoading) {
            return `${mode} - Loading...`;
        }
        
        if (state.mode === 'backend') {
            switch (state.connectionStatus) {
                case 'connected':
                    return `${mode} - Connected${state.sessionId ? ` (${state.sessionId.substring(0, 8)}...)` : ''}`;
                case 'disconnected':
                    return `${mode} - Disconnected`;
                case 'error':
                    return `${mode} - Error${state.lastError ? `: ${state.lastError}` : ''}`;
                case 'warning':
                    return `${mode} - Warning`;
                default:
                    return `${mode} - Unknown`;
            }
        } else {
            switch (state.apiKeyStatus) {
                case 'connected':
                    return `${mode} - API Key Set`;
                case 'disconnected':
                    return `${mode} - API Key Not Set`;
                case 'error':
                    return `${mode} - API Key Error${state.lastError ? `: ${state.lastError}` : ''}`;
                default:
                    return `${mode} - Unknown`;
            }
        }
    }

    public reset(): void {
        this.updateState({
            mode: 'local',
            connectionStatus: 'disconnected',
            apiKeyStatus: 'disconnected',
            sessionId: undefined,
            isLoading: false,
            lastError: undefined,
            backendUrl: undefined
        });
    }

    public validateState(): { valid: boolean; errors: string[] } {
        const errors: string[] = [];
        const state = this.currentState;

        if (state.mode === 'backend' && !state.backendUrl) {
            errors.push('Backend mode requires a backend URL');
        }

        if (state.mode === 'local' && state.connectionStatus === 'connected') {
            errors.push('Local mode should not have backend connection status');
        }

        if (state.mode === 'backend' && state.apiKeyStatus === 'connected') {
            errors.push('Backend mode should not require API key status');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}