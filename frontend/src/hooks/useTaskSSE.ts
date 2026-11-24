import { useEffect, useState, useRef, useCallback } from 'react';
import { AITaskStatus, TaskStatusSSEEvent } from '../types/task';
import { getTaskStatus, streamTaskSSE } from '../api/tasks';

interface UseTaskSSEOptions {
  taskId: string | null;
  onStatusChange?: (event: TaskStatusSSEEvent) => void;
  onCompleted?: (event: TaskStatusSSEEvent) => void;
  onFailed?: (error: string) => void;
}

export function useTaskSSE({
  taskId,
  onStatusChange,
  onCompleted,
  onFailed,
}: UseTaskSSEOptions) {
  const [status, setStatus] = useState<AITaskStatus>('PENDING');
  const [eventData, setEventData] = useState<TaskStatusSSEEvent | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const reconnectAttempts = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const terminalEmittedRef = useRef<boolean>(false);

  const onStatusChangeRef = useRef(onStatusChange);
  const onCompletedRef = useRef(onCompleted);
  const onFailedRef = useRef(onFailed);
  onStatusChangeRef.current = onStatusChange;
  onCompletedRef.current = onCompleted;
  onFailedRef.current = onFailed;

  const startStream = useCallback(async (currentTaskId: string) => {
    // 1. Fetch current durable task status first from REST
    try {
      const currentTask = await getTaskStatus(currentTaskId);
      setStatus(currentTask.status);
      setErrorMessage(currentTask.error_message);

      if (currentTask.status === 'COMPLETED') {
        const dummyEvent: TaskStatusSSEEvent = {
          task_id: currentTaskId,
          status: 'COMPLETED',
        };
        setEventData(dummyEvent);
        if (!terminalEmittedRef.current) {
          terminalEmittedRef.current = true;
          onCompletedRef.current?.(dummyEvent);
        }
        return;
      }

      if (currentTask.status === 'FAILED') {
        const msg = currentTask.error_message || 'Extraction failed';
        setErrorMessage(msg);
        if (!terminalEmittedRef.current) {
          terminalEmittedRef.current = true;
          onFailedRef.current?.(msg);
        }
        return;
      }
    } catch (err: any) {
      console.warn('Could not verify task status via REST, trying stream anyway:', err);
    }

    // 2. Open SSE stream
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setIsStreaming(true);

    streamTaskSSE({
      taskId: currentTaskId,
      signal: abortControllerRef.current.signal,
      onEvent: (event) => {
        reconnectAttempts.current = 0;
        setStatus(event.status);
        setEventData(event);
        onStatusChangeRef.current?.(event);

        if (event.status === 'COMPLETED') {
          setIsStreaming(false);
          if (!terminalEmittedRef.current) {
            terminalEmittedRef.current = true;
            onCompletedRef.current?.(event);
          }
        } else if (event.status === 'FAILED') {
          setIsStreaming(false);
          const msg = event.error_message || 'Extraction failed';
          setErrorMessage(msg);
          if (!terminalEmittedRef.current) {
            terminalEmittedRef.current = true;
            onFailedRef.current?.(msg);
          }
        }
      },
      onError: async (error) => {
        console.warn('SSE stream error:', error);
        // On disconnect, re-check task status from REST
        if (reconnectAttempts.current < 3) {
          reconnectAttempts.current += 1;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 5000);
          setTimeout(async () => {
            try {
              const task = await getTaskStatus(currentTaskId);
              setStatus(task.status);
              if (task.status === 'COMPLETED' || task.status === 'FAILED') {
                setIsStreaming(false);
                if (task.status === 'COMPLETED' && !terminalEmittedRef.current) {
                  terminalEmittedRef.current = true;
                  onCompletedRef.current?.({ task_id: currentTaskId, status: 'COMPLETED' });
                }
                if (task.status === 'FAILED' && !terminalEmittedRef.current) {
                  terminalEmittedRef.current = true;
                  onFailedRef.current?.(task.error_message || 'Extraction failed');
                }
                return;
              }
              // Still pending/processing, retry stream
              startStream(currentTaskId);
            } catch {
              setIsStreaming(false);
            }
          }, delay);
        } else {
          setIsStreaming(false);
        }
      },
      onComplete: () => {
        setIsStreaming(false);
      },
    });
  }, []);

  useEffect(() => {
    if (!taskId) return;

    reconnectAttempts.current = 0;
    terminalEmittedRef.current = false;
    startStream(taskId);

    return () => {
      abortControllerRef.current?.abort();
      setIsStreaming(false);
    };
  }, [taskId, startStream]);

  return {
    status,
    eventData,
    errorMessage,
    isStreaming,
  };
}
