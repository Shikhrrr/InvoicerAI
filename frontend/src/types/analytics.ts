export interface RevenueSummary {
  total_revenue: number | string;
  invoice_count: number;
  average_invoice_value: number | string;
}

export interface DailyRevenueItem {
  date: string;
  revenue: number | string;
}

export interface DailyRevenueResponse {
  items: DailyRevenueItem[];
}
