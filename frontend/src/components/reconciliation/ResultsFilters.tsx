import React from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from '../ui/Input';

export function ResultsFilters({ 
  search, 
  setSearch, 
  status, 
  setStatus, 
  outcomes 
}: { 
  search: string;
  setSearch: (s: string) => void;
  status: string;
  setStatus: (s: string) => void;
  outcomes: string[];
}) {
  return (
    <div className="p-5 flex flex-wrap gap-4 border-b border-[var(--border-color)] bg-white dark:bg-slate-900 rounded-t-[16px]">
      <div className="flex-1 min-w-[280px]">
        <Input
          placeholder="Search by order reference or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search size={18} />}
        />
      </div>
      
      <div className="relative w-full sm:w-auto">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <Filter size={18} />
        </div>
        <select
          className="input pl-10 pr-10 py-2 w-full sm:w-64 capitalize cursor-pointer appearance-none bg-white dark:bg-slate-900"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All outcomes</option>
          {outcomes.map((x) => (
            <option value={x} key={x}>
              {x.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
  );
}
