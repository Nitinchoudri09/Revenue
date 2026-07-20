import React from 'react';

export function KpiCard({ title, value, icon: Icon, trend }: { title: string, value: string | number, icon: React.ElementType, trend?: string }) {
  return (
    <div className="panel p-5 flex flex-col justify-between h-full">
      <div className="flex items-start justify-between">
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{title}</p>
        <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-[var(--primary-teal)] dark:text-[var(--accent-mint)]">
          <Icon size={20} />
        </div>
      </div>
      <div className="mt-4">
        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{value}</h3>
        {trend && <p className="text-xs text-slate-500 mt-1 font-medium">{trend}</p>}
      </div>
    </div>
  );
}
