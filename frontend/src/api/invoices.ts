import { apiClient } from './client';
import {
  Invoice,
  InvoiceItem,
  InvoiceItemCreate,
  InvoiceItemUpdate,
  InvoiceListResponse,
  InvoiceReviewResponse,
  InvoiceReviewUpdatePayload,
  InvoiceStatus,
  UploadInvoiceResponse,
} from '../types/invoice';

export interface GetInvoicesParams {
  page?: number;
  page_size?: number;
  status?: InvoiceStatus;
  customer_name?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  min_amount?: number;
  max_amount?: number;
}

export async function uploadInvoice(
  file: File,
  allowDuplicate: boolean = false
): Promise<UploadInvoiceResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const query = allowDuplicate ? '?allow_duplicate=true' : '';
  return apiClient<UploadInvoiceResponse>(`/invoices/upload${query}`, {
    method: 'POST',
    body: formData,
  });
}

export async function getInvoices(params: GetInvoicesParams = {}): Promise<InvoiceListResponse> {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.page_size) queryParams.set('page_size', params.page_size.toString());
  if (params.status) queryParams.set('status', params.status);
  if (params.customer_name) queryParams.set('customer_name', params.customer_name);
  if (params.search) queryParams.set('search', params.search);
  if (params.date_from) queryParams.set('date_from', params.date_from);
  if (params.date_to) queryParams.set('date_to', params.date_to);
  if (params.min_amount !== undefined) queryParams.set('min_amount', params.min_amount.toString());
  if (params.max_amount !== undefined) queryParams.set('max_amount', params.max_amount.toString());

  const queryString = queryParams.toString();
  return apiClient<InvoiceListResponse>(`/invoices${queryString ? `?${queryString}` : ''}`, {
    method: 'GET',
  });
}

export async function getInvoice(id: string): Promise<Invoice> {
  return apiClient<Invoice>(`/invoices/${id}`, {
    method: 'GET',
  });
}

export async function deleteInvoice(id: string): Promise<void> {
  return apiClient<void>(`/invoices/${id}`, {
    method: 'DELETE',
  });
}

export async function getInvoiceReview(id: string): Promise<InvoiceReviewResponse> {
  return apiClient<InvoiceReviewResponse>(`/invoices/${id}/review`, {
    method: 'GET',
  });
}

export async function updateInvoiceReview(
  id: string,
  payload: InvoiceReviewUpdatePayload
): Promise<Invoice> {
  return apiClient<Invoice>(`/invoices/${id}/review`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function addReviewItem(
  invoiceId: string,
  item: InvoiceItemCreate
): Promise<Invoice> {
  return apiClient<Invoice>(`/invoices/${invoiceId}/review/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
}

export async function updateReviewItem(
  invoiceId: string,
  itemId: string,
  data: InvoiceItemUpdate
): Promise<Invoice> {
  return apiClient<Invoice>(`/invoices/${invoiceId}/review/items/${itemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function deleteReviewItem(
  invoiceId: string,
  itemId: string
): Promise<Invoice> {
  return apiClient<Invoice>(`/invoices/${invoiceId}/review/items/${itemId}`, {
    method: 'DELETE',
  });
}

export async function confirmInvoice(id: string): Promise<Invoice> {
  return apiClient<Invoice>(`/invoices/${id}/confirm`, {
    method: 'POST',
  });
}
