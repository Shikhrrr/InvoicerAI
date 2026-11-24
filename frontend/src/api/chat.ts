import { getAccessToken } from './client';

export interface ChatSSEHandlers {
  onConversation?: (data: { conversation_id: string }) => void;
  onToken?: (data: { content: string }) => void;
  onToolStart?: (data: { tool: string }) => void;
  onToolEnd?: (data: { tool: string }) => void;
  onStatus?: (data: { node: string; status: string }) => void;
  onComplete?: (data: { conversation_id: string; response: string }) => void;
  onError?: (error: Error | { message: string }) => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Streams AI chat responses over fetch-based SSE for POST /chat.
 * Emits incremental tokens, tool execution indicators, status updates, and completion.
 */
export async function streamChatSSE(
  message: string,
  conversationId: string | null,
  handlers: ChatSSEHandlers,
  signal?: AbortSignal
): Promise<void> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message,
        conversation_id: conversationId || null,
      }),
      credentials: 'include',
      signal,
    });
  } catch (err: any) {
    if (signal?.aborted) return;
    handlers.onError?.(err);
    return;
  }

  if (!response.ok) {
    let errorDetail = `Chat request failed: ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.detail) errorDetail = errJson.detail;
    } catch {}
    handlers.onError?.(new Error(errorDetail));
    return;
  }

  if (!response.body) {
    handlers.onError?.(new Error('ReadableStream not supported by browser.'));
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const frames = buffer.split('\n\n');
      buffer = frames.pop() || '';

      for (const frame of frames) {
        if (!frame.trim()) continue;

        let eventType = '';
        let dataStr = '';

        const lines = frame.split('\n');
        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventType = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            dataStr += (dataStr ? '\n' : '') + line.slice(5).trim();
          }
        }

        if (eventType && dataStr) {
          try {
            const parsed = JSON.parse(dataStr);
            switch (eventType) {
              case 'conversation':
                handlers.onConversation?.(parsed);
                break;
              case 'token':
                handlers.onToken?.(parsed);
                break;
              case 'tool_start':
                handlers.onToolStart?.(parsed);
                break;
              case 'tool_end':
                handlers.onToolEnd?.(parsed);
                break;
              case 'status':
                handlers.onStatus?.(parsed);
                break;
              case 'complete':
                handlers.onComplete?.(parsed);
                break;
              case 'error':
                handlers.onError?.(parsed);
                break;
            }
          } catch (e) {
            console.warn('Failed to parse chat SSE event payload:', dataStr, e);
          }
        }
      }
    }
  } catch (err: any) {
    if (!signal?.aborted) {
      handlers.onError?.(err);
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {}
  }
}
