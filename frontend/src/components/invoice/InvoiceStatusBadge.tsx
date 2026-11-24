import React from 'react';
import { InvoiceStatus } from '../../types/invoice';

export const InvoiceStatusBadge: React.FC<{ status: InvoiceStatus | string }> = ({ status }) => {
  switch (status) {
    case 'CONFIRMED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[120px_10px_100px_10px/10px_100px_10px_120px] text-xs font-heading font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border-2 border-blue-600 shadow-[1px_1px_0px_#2563eb]">
          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
          Confirmed ✓
        </span>
      );
    case 'DRAFT':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[120px_10px_100px_10px/10px_100px_10px_120px] text-xs font-heading font-bold uppercase tracking-wider bg-yellow-100 text-yellow-900 border-2 border-slate-900 shadow-[1px_1px_0px_#0f172a]">
          <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
          Draft
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[120px_10px_100px_10px/10px_100px_10px_120px] text-xs font-heading font-bold uppercase tracking-wider bg-red-100 text-red-800 border-2 border-red-600 shadow-[1px_1px_0px_#dc2626]">
          <span className="w-2 h-2 rounded-full bg-red-600"></span>
          Cancelled
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-heading font-bold bg-slate-100 text-slate-800 border-2 border-slate-900">
          {status}
        </span>
      );
  }
};
