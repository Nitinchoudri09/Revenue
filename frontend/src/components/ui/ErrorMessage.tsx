import React from 'react';
import { AlertCircle } from 'lucide-react';

export function ErrorMessage({ title = 'An error occurred', message, onRetry }: { title?: string; message?: string; onRetry?: () => void }) {
  return (
    <div className="panel p-6 border-[var(--critical-red)]/20 bg-red-50/50 dark:bg-red-900/10 flex flex-col items-center justify-center text-center">
      <AlertCircle className="text-[var(--critical-red)] mb-4" size={32} />
      <h3 className="font-bold text-[var(--critical-red)]">{title}</h3>
      {message && <p className="text-sm mt-2 text-red-700/80 dark:text-red-300/80">{message}</p>}
      {onRetry && (
        <button onClick={onRetry} className="mt-4 px-4 py-2 bg-white dark:bg-slate-800 border border-[var(--border-color)] rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors">
          Try Again
        </button>
      )}
    </div>
  );
}
