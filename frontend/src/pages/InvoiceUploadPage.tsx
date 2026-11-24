import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  X,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Spinner } from '../components/common/Spinner';
import { uploadInvoice } from '../api/invoices';
import { useTaskSSE } from '../hooks/useTaskSSE';
import { useToast } from '../hooks/useToast';
import { ApiError } from '../api/client';
import { DoodleTape, DoodleSparkle } from '../components/doodle/DoodleAssets';

export const InvoiceUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Upload & Extraction State
  const [isUploading, setIsUploading] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [activeInvoiceId, setActiveInvoiceId] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<{
    existingInvoiceId: string;
    message: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = (file: File) => {
    setValidationError(null);
    setDuplicateWarning(null);

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setValidationError('Only JPG, PNG or WebP image files are allowed.');
      return false;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setValidationError('File size must be less than 10MB.');
      return false;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return true;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setValidationError(null);
    setDuplicateWarning(null);
    setActiveTaskId(null);
    setActiveInvoiceId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // SSE tracking hook
  const { status: taskStatus, errorMessage } = useTaskSSE({
    taskId: activeTaskId,
    onCompleted: (event) => {
      toast.success('Bill extraction successfully completed!');
      const invId = event.invoice_id || activeInvoiceId;
      if (invId) {
        setTimeout(() => {
          navigate(`/app/invoices/${invId}/review`);
        }, 800);
      }
    },
    onFailed: (err) => {
      toast.error(err || 'Bill extraction failed.');
    },
  });

  const handleUpload = async (allowDuplicate = false) => {
    if (!selectedFile) return;

    setIsUploading(true);
    setValidationError(null);
    setDuplicateWarning(null);

    try {
      const response = await uploadInvoice(selectedFile, allowDuplicate);
      setActiveInvoiceId(response.invoice_id);
      setActiveTaskId(response.ai_task_id);
      toast.info('Bill uploaded! AI extraction started in background.');
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 409) {
        setDuplicateWarning({
          existingInvoiceId: err.data.existing_invoice_id,
          message: err.data.message || 'Yeh bill pehle se upload ho chuka hai.',
        });
      } else {
        setValidationError(err.message || 'Invoice upload failed. Please try again.');
        toast.error(err.message || 'Upload failed');
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-slate-900">
            Naya Bill Upload Karein
          </h1>
          <DoodleSparkle className="w-5 h-5 text-blue-600 hidden sm:inline-block" />
        </div>
        <p className="text-sm font-sans text-slate-600 mt-1">
          Upload a photo of your shop receipt or vendor bill. AI will extract line items instantly.
        </p>
      </div>

      {/* Main Upload Card */}
      <Card className="p-6">
        {!selectedFile ? (
          /* Dropzone */
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-blue-600 bg-blue-50/60'
                : 'border-slate-400 hover:border-blue-600 hover:bg-blue-50/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="w-14 h-14 rounded-lg bg-blue-100 border-2 border-slate-900 flex items-center justify-center text-blue-600 mb-4 shadow-[2px_2px_0px_#0f172a]">
              <UploadCloud className="w-7 h-7" />
            </div>
            <h3 className="text-base font-heading font-bold text-slate-900 mb-1">
              Photo drag & drop karein ya browse karein
            </h3>
            <p className="text-xs font-sans text-slate-500 max-w-sm mb-4">
              JPG, PNG, or WebP formats supported (Maximum 10MB per image).
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              Choose from Computer / Phone
            </Button>
          </div>
        ) : (
          /* Preview and Action Zone */
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Image Preview */}
              <div className="md:col-span-5 bg-slate-50 p-2 border-2 border-slate-900 rounded-lg shadow-[2px_2px_0px_#0f172a] relative">
                <DoodleTape variant="blue" className="-top-3 left-1/2 -translate-x-1/2" />
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Invoice Preview"
                    className="w-full h-64 object-contain rounded-md bg-white border border-slate-200"
                  />
                )}
              </div>

              {/* File Info & Status */}
              <div className="md:col-span-7 space-y-4">
                <div className="flex items-start justify-between border-b-2 border-slate-900 border-dashed pb-3">
                  <div>
                    <h3 className="font-heading font-bold text-base text-slate-900 truncate max-w-xs">
                      {selectedFile.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type}
                    </p>
                  </div>
                  {!activeTaskId && (
                    <button
                      onClick={clearFile}
                      className="p-1 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                      title="Remove file"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Validation Error */}
                {validationError && (
                  <div className="p-3 bg-red-50 border-2 border-red-600 rounded-md text-xs font-sans text-red-700 flex items-start gap-2 shadow-[2px_2px_0px_#dc2626]">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                    <span>{validationError}</span>
                  </div>
                )}

                {/* Duplicate Conflict Warning */}
                {duplicateWarning && (
                  <div className="p-4 bg-red-50 border-2 border-red-600 rounded-md text-xs font-sans text-red-900 space-y-3 shadow-[2px_2px_0px_#dc2626]">
                    <div className="flex items-start gap-2 font-heading font-bold">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span>{duplicateWarning.message}</span>
                    </div>
                    <p className="text-slate-800">
                      This exact receipt image already exists in your digital ledger. Would you like to view the existing bill or upload it anyway?
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/app/invoices/${duplicateWarning.existingInvoiceId}`)}
                      >
                        Open Existing Bill
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleUpload(true)}
                        isLoading={isUploading}
                      >
                        Upload Anyway
                      </Button>
                    </div>
                  </div>
                )}

                {/* Live Task Progress (SSE) */}
                {activeTaskId && (
                  <div className="p-4 bg-blue-50/70 border-2 border-slate-900 rounded-md space-y-3 shadow-[2px_2px_0px_#0f172a]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-heading font-bold uppercase tracking-wider text-slate-900">
                          AI Extraction Progress
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-200 text-blue-900 border border-slate-900">
                        {taskStatus}
                      </span>
                    </div>

                    {/* Progress Steps Indicator */}
                    <div className="space-y-2 text-xs font-sans">
                      <div className="flex items-center gap-2 text-slate-800 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        <span>Bill image successfully uploaded to cloud</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {taskStatus === 'PENDING' ? (
                          <Spinner size="sm" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        )}
                        <span className={taskStatus === 'PENDING' ? 'font-bold text-blue-800' : 'text-slate-800'}>
                          Extraction task dispatched to AI worker
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {taskStatus === 'PROCESSING' ? (
                          <Spinner size="sm" />
                        ) : taskStatus === 'COMPLETED' ? (
                          <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-400" />
                        )}
                        <span className={taskStatus === 'PROCESSING' ? 'font-bold text-blue-800' : 'text-slate-800'}>
                          Reading line items, quantities, and totals...
                        </span>
                      </div>

                      {taskStatus === 'COMPLETED' && (
                        <div className="p-2.5 bg-blue-100 border-2 border-blue-600 rounded-md text-blue-900 font-heading font-bold flex items-center justify-between shadow-[2px_2px_0px_#2563eb]">
                          <span>Extraction Complete! Opening review...</span>
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      )}

                      {taskStatus === 'FAILED' && (
                        <div className="p-3 bg-red-50 border-2 border-red-600 rounded-md text-red-700 shadow-[2px_2px_0px_#dc2626]">
                          <p className="font-heading font-bold mb-1">Extraction me dikkat aayi</p>
                          <p className="text-[11px] font-sans">{errorMessage || 'Image quality ya AI worker error.'}</p>
                          {activeInvoiceId && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              onClick={() => navigate(`/app/invoices/${activeInvoiceId}/review`)}
                            >
                              Manually Review Draft Bill
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Primary Upload Button */}
                {!activeTaskId && (
                  <div className="pt-2 flex items-center gap-3">
                    <Button
                      variant="secondary"
                      size="md"
                      className="w-full sm:w-auto font-heading font-bold"
                      isLoading={isUploading}
                      onClick={() => handleUpload(false)}
                    >
                      <UploadCloud className="w-4 h-4 mr-1.5" />
                      <span>Upload & Extract</span>
                    </Button>
                    <Button variant="ghost" size="md" onClick={clearFile} disabled={isUploading}>
                      Choose Another Photo
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Helpful Hint */}
      <div className="bg-yellow-50 border-2 border-slate-900 p-4 rounded-lg text-xs font-sans text-slate-800 flex items-start gap-3 shadow-[2px_2px_0px_#0f172a] relative">
        <DoodleTape variant="yellow" className="-top-3 left-6" />
        <FileText className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-heading font-bold text-slate-900 mb-0.5">Dhyan Dein (Important Note):</p>
          <p>
            Once uploaded, AI extracted items appear on the review screen. You can verify or edit them, and clicking <strong>Confirm Bill</strong> will finalize the record in your ledger.
          </p>
        </div>
      </div>
    </div>
  );
};
