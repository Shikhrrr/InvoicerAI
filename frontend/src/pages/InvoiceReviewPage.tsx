import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FileCheck2,
  ArrowLeft,
  Save,
  ZoomIn,
  Eye,
  Calendar,
  User,
  Phone,
  FileText,
} from 'lucide-react';
import {
  getInvoiceReview,
  updateInvoiceReview,
  addReviewItem,
  updateReviewItem,
  deleteReviewItem,
  confirmInvoice,
} from '../api/invoices';
import {
  Invoice,
  ExtractionReviewResponse,
  InvoiceItemCreate,
  InvoiceReviewUpdatePayload,
} from '../types/invoice';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Card } from '../components/common/Card';
import { Spinner } from '../components/common/Spinner';
import { Modal } from '../components/common/Modal';
import { InvoiceStatusBadge } from '../components/invoice/InvoiceStatusBadge';
import { ExtractionQualityBadge } from '../components/invoice/ExtractionQualityBadge';
import { LineItemTable } from '../components/invoice/LineItemTable';
import { useToast } from '../hooks/useToast';
import { DoodleTape } from '../components/doodle/DoodleAssets';

export const InvoiceReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [extraction, setExtraction] = useState<ExtractionReviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editable header fields form
  const [headerForm, setHeaderForm] = useState<InvoiceReviewUpdatePayload>({
    invoice_number: '',
    invoice_date: '',
    customer_name: '',
    customer_phone: '',
    subtotal: 0,
    tax: 0,
    discount: 0,
    total_amount: 0,
  });

  const [isDirty, setIsDirty] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showImageZoom, setShowImageZoom] = useState(false);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    async function fetchReviewData() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getInvoiceReview(id!);
        if (!isMounted) return;

        setInvoice(data.invoice);
        setExtraction(data.extraction);

        // Populate form
        setHeaderForm({
          invoice_number: data.invoice.invoice_number || '',
          invoice_date: data.invoice.invoice_date || '',
          customer_name: data.invoice.customer_name || '',
          customer_phone: data.invoice.customer_phone || '',
          subtotal: data.invoice.subtotal ? Number(data.invoice.subtotal) : 0,
          tax: data.invoice.tax ? Number(data.invoice.tax) : 0,
          discount: data.invoice.discount ? Number(data.invoice.discount) : 0,
          total_amount: data.invoice.total_amount ? Number(data.invoice.total_amount) : 0,
        });
      } catch (err: any) {
        if (!isMounted) return;
        setError(err.message || 'Invoice review data load nahi ho paya.');
        toast.error(err.message || 'Invoice not found or already confirmed');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchReviewData();
    return () => {
      isMounted = false;
    };
  }, [id, toast]);

  const handleHeaderChange = (field: keyof InvoiceReviewUpdatePayload, val: any) => {
    setIsDirty(true);
    setHeaderForm((prev) => ({
      ...prev,
      [field]: val,
    }));
  };

  const saveHeaderChanges = async () => {
    if (!id) return;
    setIsSaving(true);
    try {
      const updated = await updateInvoiceReview(id, headerForm);
      setInvoice(updated);
      setIsDirty(false);
      toast.success('Invoice details saved successfully.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddItem = async (item: InvoiceItemCreate) => {
    if (!id) return;
    try {
      const updated = await addReviewItem(id, item);
      setInvoice(updated);
      setHeaderForm((prev) => ({
        ...prev,
        subtotal: Number(updated.subtotal) || 0,
        total_amount: Number(updated.total_amount) || 0,
      }));
      toast.success('Line item added.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add item.');
      throw err;
    }
  };

  const handleUpdateItem = async (itemId: string, data: Partial<InvoiceItemCreate>) => {
    if (!id) return;
    try {
      const updated = await updateReviewItem(id, itemId, data);
      setInvoice(updated);
      setHeaderForm((prev) => ({
        ...prev,
        subtotal: Number(updated.subtotal) || 0,
        total_amount: Number(updated.total_amount) || 0,
      }));
      toast.success('Item updated.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update item.');
      throw err;
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!id) return;
    try {
      const updated = await deleteReviewItem(id, itemId);
      setInvoice(updated);
      setHeaderForm((prev) => ({
        ...prev,
        subtotal: Number(updated.subtotal) || 0,
        total_amount: Number(updated.total_amount) || 0,
      }));
      toast.success('Item removed.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete item.');
    }
  };

  const handleConfirmInvoice = async () => {
    if (!id) return;
    setIsConfirming(true);
    try {
      if (isDirty) {
        await updateInvoiceReview(id, headerForm);
      }
      const confirmed = await confirmInvoice(id);
      setInvoice(confirmed);
      setShowConfirmModal(false);
      toast.success('Invoice explicitly confirmed! It is now recorded in your books.');
      navigate(`/app/invoices/${confirmed.id}`, { replace: true });
    } catch (err: any) {
      toast.error(err.message || 'Failed to confirm invoice.');
    } finally {
      setIsConfirming(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <Spinner size="lg" />
        <p className="mt-4 text-sm font-sans text-slate-600 font-medium">Loading invoice review...</p>
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
      {/* Top Header & Breadcrumb */}
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
            <span className="text-xs font-heading font-bold text-blue-600 uppercase tracking-wider">
              Human Review
            </span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-heading font-bold tracking-tight text-slate-900">
              Draft Bill Check Karein
            </h1>
            <InvoiceStatusBadge status={invoice.status} />
            {extraction && (
              <ExtractionQualityBadge
                score={extraction.quality_score}
                label={extraction.validation_results?.quality_label}
              />
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          {isDirty && (
            <Button
              variant="outline"
              size="md"
              onClick={saveHeaderChanges}
              isLoading={isSaving}
            >
              <Save className="w-4 h-4 mr-1.5" />
              <span>Save Changes</span>
            </Button>
          )}

          <Button
            variant="secondary"
            size="md"
            onClick={() => setShowConfirmModal(true)}
            className="font-heading font-bold"
          >
            <FileCheck2 className="w-4 h-4 mr-1.5" />
            <span>Confirm Bill</span>
          </Button>
        </div>
      </div>

      {/* Side-by-side or stacked layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Original Invoice Receipt Image */}
        <div className="lg:col-span-5 bg-white border-2 border-slate-900 rounded-lg p-4 shadow-[3px_3px_0px_#0f172a] sticky top-6 relative">
          <DoodleTape variant="red" className="-top-3 left-1/2 -translate-x-1/2" />
          <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-slate-900 border-dashed">
            <span className="text-xs font-heading font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-blue-600" />
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
              className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-md overflow-hidden flex items-center justify-center max-h-[580px] cursor-pointer"
              onClick={() => setShowImageZoom(true)}
            >
              <img
                src={invoice.image_url}
                alt="Source Invoice"
                className="w-full h-full object-contain max-h-[560px]"
              />
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-300 rounded-md bg-slate-50">
              <FileText className="w-8 h-8 mb-2" />
              <p className="text-xs">No image preview available</p>
            </div>
          )}

          <div className="mt-3 text-[11px] text-slate-500 text-center font-sans">
            Click image to open full resolution view
          </div>
        </div>

        {/* Right Column: Extracted Metadata & Line Items */}
        <div className="lg:col-span-7 space-y-6">
          {/* Invoice Header Details Form */}
          <Card title="Invoice Information" subtitle="Verify fields extracted by AI">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Invoice Number"
                type="text"
                placeholder="INV-001"
                value={headerForm.invoice_number || ''}
                onChange={(e) => handleHeaderChange('invoice_number', e.target.value)}
              />

              <Input
                label="Invoice Date"
                type="date"
                value={headerForm.invoice_date || ''}
                onChange={(e) => handleHeaderChange('invoice_date', e.target.value)}
                prefixIcon={<Calendar className="w-4 h-4" />}
              />

              <Input
                label="Customer Name"
                type="text"
                placeholder="Walk-in Customer"
                value={headerForm.customer_name || ''}
                onChange={(e) => handleHeaderChange('customer_name', e.target.value)}
                prefixIcon={<User className="w-4 h-4" />}
              />

              <Input
                label="Customer Phone"
                type="tel"
                placeholder="+91 98765 43210"
                value={headerForm.customer_phone || ''}
                onChange={(e) => handleHeaderChange('customer_phone', e.target.value)}
                prefixIcon={<Phone className="w-4 h-4" />}
              />
            </div>
          </Card>

          {/* Line Items Table with Add/Edit/Delete */}
          <Card>
            <LineItemTable
              items={invoice.items || []}
              isEditable={true}
              onAddItem={handleAddItem}
              onUpdateItem={handleUpdateItem}
              onDeleteItem={handleDeleteItem}
            />
          </Card>

          {/* Financial Totals Card */}
          <Card title="Billing Totals" subtitle="Tax, discount and total calculation">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Input
                label="Subtotal (₹)"
                type="number"
                step="any"
                min="0"
                value={headerForm.subtotal ?? 0}
                onChange={(e) => handleHeaderChange('subtotal', parseFloat(e.target.value) || 0)}
              />

              <Input
                label="Tax (₹)"
                type="number"
                step="any"
                min="0"
                value={headerForm.tax ?? 0}
                onChange={(e) => handleHeaderChange('tax', parseFloat(e.target.value) || 0)}
              />

              <Input
                label="Discount (₹)"
                type="number"
                step="any"
                min="0"
                value={headerForm.discount ?? 0}
                onChange={(e) => handleHeaderChange('discount', parseFloat(e.target.value) || 0)}
              />

              <Input
                label="Total Amount (₹)"
                type="number"
                step="any"
                min="0"
                value={headerForm.total_amount ?? 0}
                onChange={(e) => handleHeaderChange('total_amount', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="mt-4 pt-4 border-t-2 border-slate-900 border-dashed flex items-center justify-between">
              <span className="text-sm font-heading font-bold text-slate-800">Kul Rakam (Final Total):</span>
              <span className="text-2xl font-bold font-mono text-red-600">
                {formatCurrency(headerForm.total_amount)}
              </span>
            </div>
          </Card>
        </div>
      </div>

      {/* Explicit Confirmation Dialog */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Invoice Verification"
        description="This action will finalize the bill into your ledger."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfirmModal(false)}
              disabled={isConfirming}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleConfirmInvoice}
              isLoading={isConfirming}
            >
              Yes, Confirm & Save
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm font-sans text-slate-800">
          <p>
            Have you verified all line items and the final total (<strong>{formatCurrency(headerForm.total_amount)}</strong>)?
          </p>
          <div className="p-3 bg-yellow-50 border-2 border-slate-900 rounded-md text-xs text-slate-900">
            Once confirmed, this bill will be included in your shop dashboard and AI assistant records.
          </div>
        </div>
      </Modal>

      {/* Fullscreen Image Zoom Modal */}
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
