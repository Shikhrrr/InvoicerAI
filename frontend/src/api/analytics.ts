import { apiClient } from './client';
import { DailyRevenueResponse, RevenueSummary } from '../types/analytics';

export interface AnalyticsDateParams {
  start_date?: string;
  end_date?: string;
}

export async function getRevenueSummary(
  params: AnalyticsDateParams = {}
): Promise<RevenueSummary> {
  const query = new URLSearchParams();
  if (params.start_date) query.set('start_date', params.start_date);
  if (params.end_date) query.set('end_date', params.end_date);

  const qs = query.toString();
  return apiClient<RevenueSummary>(`/analytics/summary${qs ? `?${qs}` : ''}`, {
    method: 'GET',
  });
}

export async function getDailyRevenue(
  params: AnalyticsDateParams = {}
): Promise<DailyRevenueResponse> {
  const query = new URLSearchParams();
  if (params.start_date) query.set('start_date', params.start_date);
  if (params.end_date) query.set('end_date', params.end_date);

  const qs = query.toString();
  return apiClient<DailyRevenueResponse>(`/analytics/daily-revenue${qs ? `?${qs}` : ''}`, {
    method: 'GET',
  });
}
