// services/index.ts
export { OpenAIService } from './OpenAIService';
export { BackendService } from './BackendService';
export { ConfigManager } from './ConfigManager';
export { UIManager } from './UIManager';

export type { ChatMessage, ChatResponse } from './OpenAIService';
export type { BackendChatMessage, BackendChatResponse, BackendChatRequest } from './BackendService';
export type { AI4UConfig } from './ConfigManager';
export type { WebviewMessage, UIState } from './UIManager';