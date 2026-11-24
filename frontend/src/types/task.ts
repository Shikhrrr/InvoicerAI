export type AITaskStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type AITaskType = 'INVOICE_EXTRACTION';

export interface TaskStatusResponse {
  task_id: string;
  task_type: AITaskType;
  status: AITaskStatus;
  error_message: string | null;
  created_at?: string;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface TaskStatusSSEEvent {
  task_id: string;
  status: AITaskStatus;
  task_type?: string;
  error_message?: string | null;
  invoice_id?: string;
  is_duplicate?: boolean;
  duplicate_of_invoice_id?: string | null;
  items_count?: number;
  quality_score?: number;
  quality_label?: string;
  validation_warnings_count?: number;
  validation_issues_count?: number;
}
