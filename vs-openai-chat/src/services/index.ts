// services/index.ts
export { OpenAIService } from './OpenAIService';
export { BackendService } from './BackendService';
export { ConfigManager } from './ConfigManager';
export { UIManager } from './ui/UIManager';
export { HTMLTemplateManager } from './ui/HTMLTemplateManager';
export { MessageHandler } from './ui/MessageHandler';
export { UIStateManager } from './ui/UIStateManager';
export { ThemeManager } from './ui/ThemeManager';

export type { ChatMessage, ChatResponse } from './OpenAIService';
export type { BackendChatRequest } from './BackendService';
export type { AI4UConfig } from './ConfigManager';
export type { WebviewMessage, MessageResponse, UIState, StateChangeListener } from './ui/UIManager';