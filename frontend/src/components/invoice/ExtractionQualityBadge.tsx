import React from 'react';

export const ExtractionQualityBadge: React.FC<{
  score?: number | null;
  label?: string | null;
}> = ({ score, label }) => {
  if (score === undefined || score === null) return null;

  let colorClasses = 'bg-slate-100 text-slate-800 border-slate-900';
  if (score >= 80) {
    colorClasses = 'bg-blue-50 text-blue-800 border-blue-600 shadow-[1px_1px_0px_#2563eb]';
  } else if (score >= 50) {
    colorClasses = 'bg-yellow-100 text-yellow-900 border-slate-900 shadow-[1px_1px_0px_#0f172a]';
  } else {
    colorClasses = 'bg-red-50 text-red-700 border-red-600 shadow-[1px_1px_0px_#dc2626]';
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-heading font-bold border-2 rounded-[120px_10px_100px_10px/10px_100px_10px_120px] ${colorClasses}`}
    >
      <span>Quality:</span>
      <span className="font-extrabold">{score}/100</span>
      {label && <span className="opacity-80 capitalize">({label})</span>}
    </div>
  );
};
