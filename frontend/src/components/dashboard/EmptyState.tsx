import React from 'react';
import { FileSearch } from 'lucide-react';

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-16 text-center border-2 border-dashed border-[var(--border-color)] rounded-[16px] bg-slate-50/50 dark:bg-slate-900/50">
      <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-slate-400">
        <FileSearch size={32} />
      </div>
      <h3 className="text-lg font-bold text-[var(--text-main)]">{title}</h3>
      <p className="text-[var(--text-secondary)] mt-2 max-w-sm">{description}</p>
    </div>
  );
}
