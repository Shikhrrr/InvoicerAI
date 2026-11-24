export type InvoiceStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
export type Currency = 'INR' | 'USD' | 'EUR' | 'GBP';

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_name: string;
  quantity: number | string;
  unit_price: number | string;
  total_price: number | string;
  created_at?: string;
  updated_at?: string;
}

export interface InvoiceItemCreate {
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface InvoiceItemUpdate {
  product_name?: string;
  quantity?: number;
  unit_price?: number;
  total_price?: number;
}

export interface Invoice {
  id: string;
  user_id: string;
  invoice_number: string | null;
  invoice_date: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  subtotal: number | string | null;
  tax: number | string | null;
  discount: number | string | null;
  total_amount: number | string | null;
  currency: Currency | null;
  status: InvoiceStatus;
  image_url: string | null;
  image_file_id?: string | null;
  created_at: string;
  updated_at: string;
  items: InvoiceItem[];
  is_duplicate: boolean;
  duplicate_of_invoice_id: string | null;
}

export interface InvoiceListResponse {
  items: Invoice[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface ExtractionValidationIssue {
  code: string;
  message: string;
  severity: string;
}

export interface ExtractionValidationResults {
  is_valid: boolean;
  issues: ExtractionValidationIssue[];
  warnings: ExtractionValidationIssue[];
  quality_score?: number;
  quality_label?: string;
}

export interface ExtractionReview {
  id: string;
  raw_json: Record<string, any>;
  model_name: string | null;
  prompt_version: string | null;
  confidence_score: number | null;
  quality_score: number | null;
  validation_results: ExtractionValidationResults | null;
  created_at: string;
}

export interface InvoiceReviewResponse {
  invoice: Invoice;
  extraction: ExtractionReviewResponse | null;
}

export interface ExtractionReviewResponse extends ExtractionReview {}

export interface InvoiceReviewUpdatePayload {
  invoice_number?: string | null;
  invoice_date?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  subtotal?: number | null;
  tax?: number | null;
  discount?: number | null;
  total_amount?: number | null;
}

export interface UploadInvoiceResponse {
  invoice_id: string;
  ai_task_id: string;
  image_url: string;
  status: InvoiceStatus;
  task_status: string;
  duplicate_detected: boolean;
  duplicate_of_invoice_id: string | null;
  message: string;
}

export interface UploadDuplicateConflictResponse {
  duplicate_detected: boolean;
  duplicate_type: string;
  existing_invoice_id: string;
  message: string;
}
