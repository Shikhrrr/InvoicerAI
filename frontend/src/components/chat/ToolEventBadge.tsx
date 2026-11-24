import React from 'react';
import { Wrench, CheckCircle2 } from 'lucide-react';

export const ToolEventBadge: React.FC<{ tool: string; isFinished?: boolean }> = ({
  tool,
  isFinished = false,
}) => {
  const toolDisplayNames: Record<string, string> = {
    query_invoice_data: 'Querying invoice database',
    get_available_data: 'Checking store data schema',
    search_invoices: 'Searching invoices',
    get_invoice_details: 'Fetching bill details',
  };

  const displayName = toolDisplayNames[tool] || `Tool: ${tool}`;

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[120px_10px_100px_10px/10px_100px_10px_120px] bg-blue-50 border-2 border-blue-600 font-mono text-xs font-bold text-blue-900 shadow-[1px_1px_0px_#2563eb] animate-in fade-in">
      {isFinished ? (
        <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
      ) : (
        <Wrench className="w-4 h-4 text-red-600 animate-spin shrink-0" />
      )}
      <span>{displayName}</span>
    </div>
  );
};
