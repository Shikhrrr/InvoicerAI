import React, { useState } from 'react';
import { Receipt } from 'lucide-react';

interface InvoiceThumbnailProps {
  imageUrl: string | null;
  invoiceNumber?: string | null;
}

export const InvoiceThumbnail: React.FC<InvoiceThumbnailProps> = ({
  imageUrl,
  invoiceNumber,
}) => {
  const [hasError, setHasError] = useState(false);

  if (!imageUrl || hasError) {
    return (
      <div
        className="w-10 h-10 rounded-md border-2 border-slate-900 bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 shadow-[1px_1px_0px_#0f172a]"
        aria-label="No invoice image"
      >
        <Receipt className="w-4 h-4" />
      </div>
    );
  }

  return (
    <div className="w-10 h-10 rounded-md border-2 border-slate-900 bg-slate-50 overflow-hidden shrink-0 shadow-[1px_1px_0px_#0f172a]">
      <img
        src={imageUrl}
        alt={invoiceNumber ? `Invoice ${invoiceNumber} thumbnail` : 'Invoice thumbnail'}
        width={40}
        height={40}
        loading="lazy"
        decoding="async"
        onError={() => setHasError(true)}
        className="w-full h-full object-cover"
      />
    </div>
  );
};
