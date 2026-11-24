export interface Conversation {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationListResponse {
  conversations: Conversation[];
  total: number;
  limit: number;
  offset: number;
}

export type MessageRole = 'USER' | 'ASSISTANT' | 'SYSTEM' | 'TOOL';

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: MessageRole | string;
  content: string;
  metadata?: Record<string, any> | null;
  created_at: string;
}

export interface MessageHistoryResponse {
  messages: ChatMessage[];
  total: number;
  limit: number;
  offset: number;
}

export interface ChatTokenEvent {
  content: string;
}

export interface ChatToolEvent {
  tool: string;
}

export interface ChatStatusEvent {
  node: string;
  status: string;
}

export interface ChatCompleteEvent {
  conversation_id: string;
  response: string;
}
