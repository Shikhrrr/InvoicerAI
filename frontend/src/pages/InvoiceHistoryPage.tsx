import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Receipt,
  Search,
  Filter,
  X,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { getInvoices, deleteInvoice } from '../api/invoices';
import { Invoice, InvoiceStatus } from '../types/invoice';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Spinner } from '../components/common/Spinner';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { InvoiceStatusBadge } from '../components/invoice/InvoiceStatusBadge';
import { InvoiceThumbnail } from '../components/invoice/InvoiceThumbnail';
import { useToast } from '../hooks/useToast';
import { DoodleTape } from '../components/doodle/DoodleAssets';

export const InvoiceHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [, setSearchParams] = useSearchParams();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | ''>('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Delete modal state
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getInvoices({
        page,
        page_size: pageSize,
        status: statusFilter ? statusFilter : undefined,
        search: customerSearch.trim() || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        min_amount: minAmount ? parseFloat(minAmount) : undefined,
        max_amount: maxAmount ? parseFloat(maxAmount) : undefined,
      });
      setInvoices(data.items || []);
      setTotal(data.total);
      setPages(data.pages);
    } catch (err: any) {
      setError(err.message || 'Error occurred while loading bills.');
      toast.error(err.message || 'Failed to fetch invoices');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, statusFilter, customerSearch, dateFrom, dateTo, minAmount, maxAmount, toast]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const clearAllFilters = () => {
    setStatusFilter('');
    setCustomerSearch('');
    setDateFrom('');
    setDateTo('');
    setMinAmount('');
    setMaxAmount('');
    setPage(1);
  };

  const hasActiveFilters =
    statusFilter !== '' ||
    customerSearch.trim() !== '' ||
    dateFrom !== '' ||
    dateTo !== '' ||
    minAmount !== '' ||
    maxAmount !== '';

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      await deleteInvoice(deleteTargetId);
      toast.success('Invoice deleted successfully.');
      setDeleteTargetId(null);
      fetchInvoices();
    } catch (err: any) {
      toast.error(err.message || 'Could not delete invoice.');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatCurrency = (val: number | string | null | undefined) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(num || 0);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b-2 border-slate-900 border-dashed">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-slate-900">
            Purane Bills Ka Ledger
          </h1>
          <p className="text-sm font-sans text-slate-600 mt-1">
            Complete digital ledger of your shop's draft and confirmed bills ({total} records).
          </p>
        </div>

        <Button variant="secondary" size="md" onClick={() => navigate('/app/upload')}>
          <PlusCircle className="w-4 h-4 mr-1.5" />
          <span>Upload New Bill</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border-2 border-slate-900 rounded-lg p-4 shadow-[3px_3px_0px_#0f172a] space-y-4 relative">
        <DoodleTape variant="yellow" className="-top-3 right-8" />
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Customer, Invoice #, or ID Search */}
          <div className="w-full md:w-80">
            <Input
              type="text"
              placeholder="Search by customer, invoice #, or ID..."
              value={customerSearch}
              onChange={(e) => {
                setCustomerSearch(e.target.value);
                setPage(1);
              }}
              prefixIcon={<Search className="w-4 h-4" />}
            />
          </div>

          {/* Quick Status Tabs */}
          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {(['', 'CONFIRMED', 'DRAFT', 'CANCELLED'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setStatusFilter(st as InvoiceStatus | '');
                  setPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-heading font-bold rounded-md border-2 border-slate-900 transition-all ${
                  statusFilter === st
                    ? 'bg-blue-600 text-white shadow-[2px_2px_0px_#0f172a]'
                    : 'bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                {st === '' ? 'All Bills' : st === 'CONFIRMED' ? 'Confirmed' : st === 'DRAFT' ? 'Drafts' : 'Cancelled'}
              </button>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="ml-auto md:ml-2 text-xs py-1.5 font-heading font-bold"
            >
              <Filter className="w-3.5 h-3.5 mr-1" />
              <span>{showFilters ? 'Hide Filters' : 'More Filters'}</span>
            </Button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs font-heading font-bold text-red-600 hover:underline flex items-center gap-1 px-2 py-1"
                title="Clear all filters"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Advanced Filters */}
        {showFilters && (
          <div className="pt-3 border-t-2 border-slate-900 border-dashed grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <Input
              label="From Date"
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              prefixIcon={<Calendar className="w-3.5 h-3.5" />}
            />
            <Input
              label="To Date"
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              prefixIcon={<Calendar className="w-3.5 h-3.5" />}
            />
            <Input
              label="Min Amount (₹)"
              type="number"
              min="0"
              placeholder="0"
              value={minAmount}
              onChange={(e) => {
                setMinAmount(e.target.value);
                setPage(1);
              }}
            />
            <Input
              label="Max Amount (₹)"
              type="number"
              min="0"
              placeholder="100000"
              value={maxAmount}
              onChange={(e) => {
                setMaxAmount(e.target.value);
                setPage(1);
              }}
            />
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-2 border-red-600 rounded-lg text-sm font-sans text-red-800 flex items-center gap-2 shadow-[2px_2px_0px_#dc2626]">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Invoices List Table */}
      {isLoading ? (
        <div className="p-16 flex flex-col items-center justify-center bg-white border-2 border-slate-900 rounded-lg shadow-[3px_3px_0px_#0f172a]">
          <Spinner size="lg" />
          <p className="mt-3 text-xs text-slate-500 font-mono">Loading invoices...</p>
        </div>
      ) : invoices.length === 0 ? (
        <EmptyState
          icon={<Receipt className="w-7 h-7" />}
          title={hasActiveFilters ? 'Koi bill nahi mila' : 'Abhi tak koi bill nahi hai'}
          description={
            hasActiveFilters
              ? 'No bills match your active filters. Try resetting your filters.'
              : 'You haven\'t scanned or uploaded any invoices yet. Take a photo of your shop receipt and upload to create your digital ledger.'
          }
          actionLabel={hasActiveFilters ? 'Reset Filters' : 'Upload First Bill'}
          onAction={hasActiveFilters ? clearAllFilters : () => navigate('/app/upload')}
        />
      ) : (
        <div className="bg-white border-2 border-slate-900 rounded-lg overflow-hidden shadow-[3px_3px_0px_#0f172a]">
          <div
            className="overflow-x-auto"
            tabIndex={0}
            role="region"
            aria-label="Invoice history"
          >
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-slate-900 bg-blue-50 text-xs font-heading font-bold uppercase tracking-wider text-slate-900">
                  <th className="py-3 px-4 w-16">Bill</th>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Items</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-right">Actions</th>
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
                      {inv.invoice_number || 'Draft — Unnumbered'}
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
                    <td className="py-3 px-4 text-center text-slate-500">
                      {inv.items?.length || 0}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(inv.total_amount)}
                    </td>
                    <td
                      className="py-3 px-4 text-right font-sans"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs py-1"
                          onClick={() =>
                            navigate(
                              inv.status === 'DRAFT'
                                ? `/app/invoices/${inv.id}/review`
                                : `/app/invoices/${inv.id}`
                            )
                          }
                        >
                          {inv.status === 'DRAFT' ? 'Review & Confirm' : 'View'}
                        </Button>
                        <button
                          type="button"
                          onClick={() => setDeleteTargetId(inv.id)}
                          className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete invoice"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="px-5 py-3.5 bg-slate-50 border-t-2 border-slate-900 border-dashed flex items-center justify-between text-xs font-sans text-slate-600">
            <div>
              Showing page <span className="font-bold text-slate-900">{page}</span> of{' '}
              <span className="font-bold text-slate-900">{pages || 1}</span> ({total} total)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                <span>Prev</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pages}
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        title="Delete Invoice"
        description="This action cannot be undone."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteTargetId(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={confirmDelete}
              isLoading={isDeleting}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm font-sans text-slate-800">
          Are you sure you want to delete this invoice from your ledger records?
        </p>
      </Modal>
    </div>
  );
};
