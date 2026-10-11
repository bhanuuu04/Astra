'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', children, disabled, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantClasses = {
      default: 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs',
      outline: 'border border-slate-700 bg-transparent hover:bg-slate-800 text-slate-200',
      secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700',
      ghost: 'bg-transparent hover:bg-slate-800 text-slate-300',
      danger: 'bg-rose-600 hover:bg-rose-500 text-white',
    };

    const sizeClasses = {
      sm: 'px-2.5 py-1 text-xs',
      md: 'px-3.5 py-2 text-xs',
      lg: 'px-4 py-2.5 text-sm',
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
