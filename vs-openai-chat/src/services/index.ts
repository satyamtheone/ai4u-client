// services/index.ts
export { OpenAIService } from './OpenAIService';
export { BackendService } from './BackendService';
export { ConfigManager } from './ConfigManager';
export { UIManager } from './UIManager';
export { HTMLTemplateManager } from './HTMLTemplateManager';
export { MessageHandler } from './MessageHandler';
export { UIStateManager } from './UIStateManager';
export { ThemeManager } from './ThemeManager';

export type { ChatMessage, ChatResponse } from './OpenAIService';
export type { BackendChatMessage, BackendChatResponse, BackendChatRequest } from './BackendService';
export type { AI4UConfig } from './ConfigManager';
export type { WebviewMessage, MessageResponse, UIState, StateChangeListener } from './UIManager';