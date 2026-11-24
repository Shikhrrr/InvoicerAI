import { apiClient, getAccessToken } from './client';
import { TaskStatusResponse, TaskStatusSSEEvent } from '../types/task';

export async function getTaskStatus(taskId: string): Promise<TaskStatusResponse> {
  return apiClient<TaskStatusResponse>(`/tasks/${taskId}`, {
    method: 'GET',
  });
}

export interface StreamTaskSSEOptions {
  taskId: string;
  onEvent: (event: TaskStatusSSEEvent) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
  signal?: AbortSignal;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Fetch-based SSE reader supporting Bearer auth headers, multi-line data chunks,
 * resilient framing, and automatic disconnection when reaching terminal state.
 */
export async function streamTaskSSE({
  taskId,
  onEvent,
  onError,
  onComplete,
  signal,
}: StreamTaskSSEOptions): Promise<void> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    Accept: 'text/event-stream',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/tasks/${taskId}/stream`, {
      method: 'GET',
      headers,
      credentials: 'include',
      signal,
    });
  } catch (err: any) {
    if (signal?.aborted) return;
    onError?.(err);
    return;
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    onError?.(new Error(`Failed to stream task status: ${response.status} ${errorText}`));
    return;
  }

  if (!response.body) {
    onError?.(new Error('ReadableStream not supported by browser.'));
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

      // Split SSE frames on double-newline
      const frames = buffer.split('\n\n');
      buffer = frames.pop() || ''; // Keep the remaining incomplete chunk in buffer

      for (const frame of frames) {
        if (!frame.trim()) continue;

        let eventType = 'message';
        let dataStr = '';

        const lines = frame.split('\n');
        for (const line of lines) {
          if (line.startsWith(':')) {
            // SSE comment / keepalive
            continue;
          }
          if (line.startsWith('event:')) {
            eventType = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            dataStr += (dataStr ? '\n' : '') + line.slice(5).trim();
          }
        }

        if (dataStr) {
          try {
            const parsed = JSON.parse(dataStr);
            onEvent(parsed);
            if (parsed.status === 'COMPLETED' || parsed.status === 'FAILED') {
              onComplete?.();
              return;
            }
          } catch (e) {
            console.warn('Failed to parse SSE task data:', dataStr, e);
          }
        }
      }
    }
  } catch (err: any) {
    if (!signal?.aborted) {
      onError?.(err);
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {}
    onComplete?.();
  }
}
