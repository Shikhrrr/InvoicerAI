import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  subtitle,
  action,
  footer,
}) => {
  return (
    <div className={`bg-white border-2 border-slate-900 rounded-lg shadow-[3px_3px_0px_#0f172a] ${className}`}>
      {(title || action) && (
        <div className="px-5 py-4 border-b-2 border-slate-900 border-dashed flex items-center justify-between gap-4">
          <div>
            {typeof title === 'string' ? (
              <h3 className="font-heading font-bold text-slate-900 text-lg">{title}</h3>
            ) : (
              title
            )}
            {subtitle && <p className="text-xs text-slate-600 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
      {footer && (
        <div className="px-5 py-3.5 bg-slate-50 border-t-2 border-slate-900 border-dashed flex items-center justify-between text-xs text-slate-600">
          {footer}
        </div>
      )}
    </div>
  );
};
