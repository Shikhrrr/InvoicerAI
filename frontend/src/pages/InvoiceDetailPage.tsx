import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Receipt,
  FileCheck2,
  ZoomIn,
  MessageSquare,
  ExternalLink,
} from 'lucide-react';
import { getInvoice } from '../api/invoices';
import { Invoice } from '../types/invoice';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Spinner } from '../components/common/Spinner';
import { Modal } from '../components/common/Modal';
import { InvoiceStatusBadge } from '../components/invoice/InvoiceStatusBadge';
import { LineItemTable } from '../components/invoice/LineItemTable';
import { useToast } from '../hooks/useToast';
import { DoodleTape } from '../components/doodle/DoodleAssets';

export const InvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showImageZoom, setShowImageZoom] = useState(false);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    async function fetchInvoice() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getInvoice(id!);
        if (isMounted) setInvoice(data);
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Invoice details load nahi ho paya.');
          toast.error(err.message || 'Invoice not found');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchInvoice();
    return () => {
      isMounted = false;
    };
  }, [id, toast]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <Spinner size="lg" />
        <p className="mt-4 text-sm font-sans text-slate-600 font-medium">Loading invoice details...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
        <div className="p-4 bg-red-50 border-2 border-red-600 rounded-lg text-red-800 text-sm shadow-[2px_2px_0px_#dc2626]">
          {error || 'Invoice not found.'}
        </div>
        <Link to="/app/invoices">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            <span>Return to All Invoices</span>
          </Button>
        </Link>
      </div>
    );
  }

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
          <div className="flex items-center gap-2 mb-1">
            <Link
              to="/app/invoices"
              className="text-xs font-heading font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous Bills</span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold text-slate-700 font-mono">
              {invoice.invoice_number || 'Bill Record'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-heading font-bold tracking-tight text-slate-900">
              {invoice.invoice_number || 'Confirmed Invoice'}
            </h1>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {invoice.status === 'DRAFT' && (
            <Link to={`/app/invoices/${invoice.id}/review`}>
              <Button variant="secondary" size="md">
                <FileCheck2 className="w-4 h-4 mr-1.5" />
                <span>Review & Confirm</span>
              </Button>
            </Link>
          )}

          <Link to={`/app/chat`}>
            <Button variant="primary" size="md">
              <MessageSquare className="w-4 h-4 mr-1.5" />
              <span>Ask AI About This Bill</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Duplicate Warning Indicator if applicable */}
      {invoice.is_duplicate && (
        <div className="p-3 bg-red-50 border-2 border-red-600 rounded-md text-xs font-sans text-red-900 flex items-center justify-between shadow-[2px_2px_0px_#dc2626]">
          <span>This bill is a duplicate copy of an earlier uploaded bill.</span>
          {invoice.duplicate_of_invoice_id && (
            <Link
              to={`/app/invoices/${invoice.duplicate_of_invoice_id}`}
              className="font-bold underline text-blue-600 flex items-center gap-1"
            >
              <span>View Original Bill</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>
      )}

      {/* Main Grid: Details & Photo */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Original Receipt Image */}
        <div className="lg:col-span-5 bg-white border-2 border-slate-900 rounded-lg p-4 shadow-[3px_3px_0px_#0f172a] relative">
          <DoodleTape variant="blue" className="-top-3 left-1/2 -translate-x-1/2" />
          <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-slate-900 border-dashed">
            <span className="text-xs font-heading font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-blue-600" />
              Original Bill Photo
            </span>
            {invoice.image_url && (
              <button
                type="button"
                onClick={() => setShowImageZoom(true)}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-heading font-bold"
              >
                <ZoomIn className="w-3.5 h-3.5" />
                <span>Zoom In</span>
              </button>
            )}
          </div>

          {invoice.image_url ? (
            <div
              className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-md overflow-hidden flex items-center justify-center max-h-[500px] cursor-pointer"
              onClick={() => setShowImageZoom(true)}
            >
              <img
                src={invoice.image_url}
                alt="Confirmed Invoice"
                className="w-full h-full object-contain max-h-[480px]"
              />
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-300 rounded-md bg-slate-50">
              <Receipt className="w-8 h-8 mb-2" />
              <p className="text-xs font-sans">No image available</p>
            </div>
          )}
        </div>

        {/* Right: Metadata & Items */}
        <div className="lg:col-span-7 space-y-6">
          <Card title="Invoice Metadata">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-500 uppercase font-semibold">Bill No:</span>
                <p className="font-bold text-sm text-slate-900 mt-0.5">
                  {invoice.invoice_number || '—'}
                </p>
              </div>

              <div>
                <span className="text-slate-500 uppercase font-semibold">Date:</span>
                <p className="font-bold text-sm text-slate-900 mt-0.5">
                  {invoice.invoice_date || '—'}
                </p>
              </div>

              <div>
                <span className="text-slate-500 uppercase font-semibold">Customer:</span>
                <p className="font-bold text-sm text-slate-900 mt-0.5 font-sans">
                  {invoice.customer_name || 'Walk-in Customer'}
                </p>
              </div>

              {invoice.customer_phone && (
                <div>
                  <span className="text-slate-500 uppercase font-semibold">Phone:</span>
                  <p className="font-bold text-sm text-slate-900 mt-0.5">
                    {invoice.customer_phone}
                  </p>
                </div>
              )}

              <div>
                <span className="text-slate-500 uppercase font-semibold">Currency:</span>
                <p className="font-bold text-sm text-slate-900 mt-0.5">
                  {invoice.currency || 'INR'}
                </p>
              </div>

              <div>
                <span className="text-slate-500 uppercase font-semibold">Saved On:</span>
                <p className="font-medium text-xs text-slate-600 mt-0.5 font-sans">
                  {new Date(invoice.created_at).toLocaleDateString('en-IN')}
                </p>
              </div>
            </div>
          </Card>

          {/* Line Items Table (Read-Only) */}
          <Card>
            <LineItemTable items={invoice.items || []} isEditable={false} />
          </Card>

          {/* Totals Breakdown */}
          <Card title="Bill Totals">
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 text-slate-700">
                <span>Subtotal:</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-700">
                <span>Tax:</span>
                <span>{formatCurrency(invoice.tax)}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-700">
                <span>Discount:</span>
                <span>-{formatCurrency(invoice.discount)}</span>
              </div>
              <div className="pt-3 border-t-2 border-slate-900 border-dashed flex justify-between text-base font-bold text-slate-900">
                <span className="font-heading font-bold text-slate-900">Kul Rakam (Total Billed):</span>
                <span className="text-red-600 font-mono text-xl">
                  {formatCurrency(invoice.total_amount)}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Image Zoom Modal */}
      <Modal
        isOpen={showImageZoom}
        onClose={() => setShowImageZoom(false)}
        title="Original Invoice Photo"
        maxWidth="2xl"
      >
        <div className="p-2 max-h-[80vh] overflow-auto flex justify-center bg-slate-50 rounded-md border border-slate-200">
          {invoice.image_url && (
            <img
              src={invoice.image_url}
              alt="Zoomed Invoice"
              className="max-w-full h-auto object-contain"
            />
          )}
        </div>
      </Modal>
    </div>
  );
};
