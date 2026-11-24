import React, { ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'doodle-blue' | 'doodle-red';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  className = '',
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-heading font-bold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-[180px_10px_160px_10px/10px_160px_10px_180px] border-2';

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4.5 py-2 gap-2',
    lg: 'text-base px-6 py-2.5 gap-2.5',
  };

  const variantClasses = {
    primary:
      'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white border-slate-900 shadow-[3px_3px_0px_#0f172a] hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5',
    secondary:
      'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white border-slate-900 shadow-[3px_3px_0px_#0f172a] hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5',
    outline:
      'bg-white hover:bg-blue-50 text-slate-900 border-slate-900 shadow-[2px_2px_0px_#0f172a] active:translate-x-0.5 active:translate-y-0.5',
    ghost:
      'bg-transparent hover:bg-yellow-100/70 text-slate-800 border-transparent hover:border-slate-900',
    danger:
      'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white border-slate-900 shadow-[3px_3px_0px_#0f172a] hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5',
    'doodle-blue':
      'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white border-slate-900 shadow-[3px_3px_0px_#0f172a] hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5',
    'doodle-red':
      'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white border-slate-900 shadow-[3px_3px_0px_#0f172a] hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5',
  };

  const mergedClasses = twMerge(
    clsx(baseClasses, sizeClasses[size], variantClasses[variant], className)
  );

  return (
    <button
      className={mergedClasses}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {children}
    </button>
  );
};
