import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Table } from '@tanstack/react-table';

export function Pagination({ table }: { table: Table<any> }) {
  return (
    <div className="p-4 border-t border-[var(--border-color)] bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm rounded-b-[16px]">
      <div className="flex items-center gap-2">
        <button
          className="btn secondary px-3 py-1.5 gap-1 shadow-sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeft size={16} />
          <span className="hidden sm:inline">Previous</span>
        </button>
        <button
          className="btn secondary px-3 py-1.5 gap-1 shadow-sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight size={16} />
        </button>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[var(--text-secondary)]">Rows per page:</span>
          <select
            className="input w-auto py-1 pl-3 pr-8 shadow-sm cursor-pointer"
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
          >
            {[25, 50, 100].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                {pageSize}
              </option>
            ))}
          </select>
        </div>
        <span className="font-medium text-[var(--text-main)]">
          Page {table.getState().pagination.pageIndex + 1} of{' '}
          {table.getPageCount() || 1}
        </span>
      </div>
    </div>
  );
}
