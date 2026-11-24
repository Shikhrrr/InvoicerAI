import React from 'react';
import { Button } from './Button';
import { DoodleStar } from '../doodle/DoodleAssets';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="p-10 flex flex-col items-center justify-center text-center bg-white border-2 border-dashed border-slate-900 rounded-lg shadow-[3px_3px_0px_#0f172a] relative">
      <DoodleStar className="absolute top-4 right-5 w-5 h-5 text-blue-600" />
      <DoodleStar className="absolute bottom-4 left-5 w-4 h-4 text-red-600" />
      {icon && (
        <div className="w-14 h-14 rounded-lg bg-blue-100 border-2 border-slate-900 flex items-center justify-center text-blue-600 mb-3 shadow-[2px_2px_0px_#0f172a]">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-heading font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-600 max-w-sm mb-5 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction} className="font-heading font-bold">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
