import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  MessageSquare,
  Receipt,
  ArrowRight,
  TrendingUp,
  FileCheck2,
  Calendar,
  AlertCircle,
  PlusCircle,
  Clock,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Spinner } from '../components/common/Spinner';
import { EmptyState } from '../components/common/EmptyState';
import { InvoiceStatusBadge } from '../components/invoice/InvoiceStatusBadge';
import { InvoiceThumbnail } from '../components/invoice/InvoiceThumbnail';
import { getInvoices } from '../api/invoices';
import { getRevenueSummary, getDailyRevenue } from '../api/analytics';
import { Invoice } from '../types/invoice';
import { RevenueSummary, DailyRevenueItem } from '../types/analytics';
import { DoodleSparkle } from '../components/doodle/DoodleAssets';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [dailyData, setDailyData] = useState<DailyRevenueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadDashboardData() {
      setIsLoading(true);
      setError(null);
      try {
        const [invoicesRes, summaryRes, dailyRes] = await Promise.allSettled([
          getInvoices({ page: 1, page_size: 5 }),
          getRevenueSummary(),
          getDailyRevenue(),
        ]);

        if (!isMounted) return;

        if (invoicesRes.status === 'fulfilled') {
          setInvoices(invoicesRes.value.items || []);
        }
        if (summaryRes.status === 'fulfilled') {
          setSummary(summaryRes.value);
        }
        if (dailyRes.status === 'fulfilled') {
          setDailyData(dailyRes.value.items || []);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Failed to load dashboard data');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  const formatCurrency = (val: number | string | null | undefined) => {
    if (val === null || val === undefined) return '₹0.00';
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(num);
  };

  const today = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b-2 border-slate-900 border-dashed">
        <div>
          <div className="flex items-center gap-2 text-xs font-heading font-bold uppercase tracking-wider text-slate-500 mb-1">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>{today}</span>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-slate-900">
              Namaste, {user?.username || 'Shopkeeper'}!
            </h1>
            <DoodleSparkle className="w-5 h-5 text-red-600 hidden sm:inline-block" />
          </div>
          <p className="text-sm font-sans text-slate-600 mt-0.5">
            Here is your shop's latest ledger and core business actions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/app/upload">
            <Button variant="secondary" size="md">
              <PlusCircle className="w-4 h-4 mr-1.5" />
              <span>Scan New Bill</span>
            </Button>
          </Link>
          <Link to="/app/chat">
            <Button variant="outline" size="md">
              <MessageSquare className="w-4 h-4 mr-1.5" />
              <span>Ask AI</span>
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-2 border-red-600 rounded-lg text-sm font-sans text-red-800 flex items-center gap-2 shadow-[2px_2px_0px_#dc2626]">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* 3 Core Action Launch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link
          to="/app/upload"
          className="group block bg-white p-5 border-2 border-slate-900 rounded-lg shadow-[3px_3px_0px_#0f172a] hover:border-blue-600 hover:shadow-[4px_4px_0px_#2563eb] transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-md bg-blue-100 border-2 border-slate-900 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform">
              <UploadCloud className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="font-heading font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors">
            Bill Upload Karo
          </h3>
          <p className="text-xs font-sans text-slate-500 mt-1 leading-relaxed">
            Snap a photo of the bill. AI extracts line items and prepares a draft for verification.
          </p>
        </Link>

        <Link
          to="/app/chat"
          className="group block bg-white p-5 border-2 border-slate-900 rounded-lg shadow-[3px_3px_0px_#0f172a] hover:border-red-600 hover:shadow-[4px_4px_0px_#dc2626] transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-md bg-red-100 border-2 border-slate-900 flex items-center justify-center text-red-600 group-hover:scale-105 transition-transform">
              <MessageSquare className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="font-heading font-bold text-base text-slate-900 group-hover:text-red-600 transition-colors">
            AI Se Poochho
          </h3>
          <p className="text-xs font-sans text-slate-500 mt-1 leading-relaxed">
            Ask the AI assistant business questions: "What were my total sales this month?"
          </p>
        </Link>

        <Link
          to="/app/invoices"
          className="group block bg-white p-5 border-2 border-slate-900 rounded-lg shadow-[3px_3px_0px_#0f172a] hover:border-blue-600 hover:shadow-[4px_4px_0px_#2563eb] transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-md bg-yellow-100 border-2 border-slate-900 flex items-center justify-center text-slate-900 group-hover:scale-105 transition-transform">
              <Receipt className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="font-heading font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors">
            Purane Bills
          </h3>
          <p className="text-xs font-sans text-slate-500 mt-1 leading-relaxed">
            View all previous invoices, check status, or apply filters.
          </p>
        </Link>
      </div>

      {/* Revenue & Overview Statistics */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-heading font-bold uppercase tracking-wider text-slate-500">
            Dukaan Ki Kul Kamai (Overview)
          </span>
          <span className="text-xs font-sans text-slate-500">Analytics summary</span>
        </div>

        {isLoading ? (
          <div className="p-8 flex justify-center bg-white border-2 border-slate-900 rounded-lg shadow-[3px_3px_0px_#0f172a]">
            <Spinner size="md" />
          </div>
        ) : summary ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4">
              <span className="text-xs font-heading font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                Total Confirmed Revenue
              </span>
              <p className="text-2xl font-bold font-mono text-slate-900 mt-2">
                {formatCurrency(summary.total_revenue)}
              </p>
              <p className="text-[11px] font-sans text-slate-500 mt-1">
                Only confirmed and finalized bills
              </p>
            </Card>

            <Card className="p-4">
              <span className="text-xs font-heading font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5 text-red-600" />
                Total Invoices Recorded
              </span>
              <p className="text-2xl font-bold font-mono text-slate-900 mt-2">
                {summary.invoice_count}
              </p>
              <p className="text-[11px] font-sans text-slate-500 mt-1">
                Total scanned confirmed bills
              </p>
            </Card>

            <Card className="p-4">
              <span className="text-xs font-heading font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                Average Bill Value
              </span>
              <p className="text-2xl font-bold font-mono text-slate-900 mt-2">
                {formatCurrency(summary.average_invoice_value)}
              </p>
              <p className="text-[11px] font-sans text-slate-500 mt-1">
                Average amount per bill
              </p>
            </Card>
          </div>
        ) : (
          <div className="p-6 bg-white border-2 border-slate-900 rounded-lg text-center text-xs font-sans text-slate-500 shadow-[2px_2px_0px_#0f172a]">
            No confirmed bills yet. Scan and confirm bills to view analytics.
          </div>
        )}
      </div>

      {/* Recent Invoices Table / Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-heading font-bold text-slate-900">Recent Invoices</h2>
            <p className="text-xs font-sans text-slate-500">Recently created or scanned bills</p>
          </div>
          <Link
            to="/app/invoices"
            className="text-xs font-heading font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="p-10 flex justify-center bg-white border-2 border-slate-900 rounded-lg shadow-[3px_3px_0px_#0f172a]">
            <Spinner size="md" />
          </div>
        ) : invoices.length === 0 ? (
          <EmptyState
            icon={<Receipt className="w-6 h-6" />}
            title="Pehla Bill Upload Karein"
            description="You haven't scanned or uploaded any invoices yet. Upload a photo to digitize your shop ledger."
            actionLabel="Upload Photo"
            onAction={() => navigate('/app/upload')}
          />
        ) : (
          <div className="bg-white border-2 border-slate-900 rounded-lg overflow-hidden shadow-[3px_3px_0px_#0f172a]">
            <div
              className="overflow-x-auto"
              tabIndex={0}
              role="region"
              aria-label="Recent invoices"
            >
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b-2 border-slate-900 bg-blue-50 text-xs font-heading font-bold uppercase tracking-wider text-slate-900">
                    <th className="py-3 px-4 w-16">Bill</th>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-dashed divide-slate-200 font-mono text-xs text-slate-800">
                  {invoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                      onClick={() =>
                        navigate(
                          inv.status === 'DRAFT'
                            ? `/app/invoices/${inv.id}/review`
                            : `/app/invoices/${inv.id}`
                        )
                      }
                    >
                      <td className="py-2.5 px-4">
                        <InvoiceThumbnail
                          imageUrl={inv.image_url}
                          invoiceNumber={inv.invoice_number}
                        />
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {inv.invoice_number || 'Draft — Unassigned'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-sans">
                        {inv.invoice_date || '—'}
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-900 font-medium">
                        {inv.customer_name || 'Walk-in Customer'}
                      </td>
                      <td className="py-3 px-4">
                        <InvoiceStatusBadge status={inv.status} />
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatCurrency(inv.total_amount)}
                      </td>
                      <td className="py-3 px-4 text-right font-sans">
                        <span className="text-xs font-heading font-bold text-blue-600 hover:underline">
                          {inv.status === 'DRAFT' ? 'Review & Confirm →' : 'Details →'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
