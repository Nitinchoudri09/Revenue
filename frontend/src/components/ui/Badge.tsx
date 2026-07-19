import React from 'react';

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: 'success' | 'warning' | 'critical' | 'neutral' | 'info';
  children: React.ReactNode;
};

export function Badge({ variant = 'neutral', children, className = '', ...props }: BadgeProps) {
  const getColors = () => {
    switch (variant) {
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'warning':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'info':
        return 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400';
      case 'neutral':
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  return (
    <span className={`badge ${getColors()} ${className}`} {...props}>
      {children}
    </span>
  );
}
