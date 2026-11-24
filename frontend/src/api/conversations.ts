import { apiClient } from './client';
import {
  Conversation,
  ConversationListResponse,
  MessageHistoryResponse,
} from '../types/chat';

export async function getConversations(
  limit: number = 20,
  offset: number = 0
): Promise<ConversationListResponse> {
  return apiClient<ConversationListResponse>(
    `/conversations?limit=${limit}&offset=${offset}`,
    { method: 'GET' }
  );
}

export async function getConversation(id: string): Promise<Conversation> {
  return apiClient<Conversation>(`/conversations/${id}`, {
    method: 'GET',
  });
}

export async function createConversation(title?: string): Promise<Conversation> {
  return apiClient<Conversation>('/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: title || null }),
  });
}

export async function updateConversation(
  id: string,
  title: string
): Promise<Conversation> {
  return apiClient<Conversation>(`/conversations/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
}

export async function deleteConversation(id: string): Promise<void> {
  return apiClient<void>(`/conversations/${id}`, {
    method: 'DELETE',
  });
}

export async function getMessageHistory(
  conversationId: string,
  limit: number = 50,
  offset: number = 0
): Promise<MessageHistoryResponse> {
  return apiClient<MessageHistoryResponse>(
    `/conversations/${conversationId}/messages?limit=${limit}&offset=${offset}`,
    { method: 'GET' }
  );
}
