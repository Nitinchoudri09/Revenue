import React from 'react';
import { Table, flexRender } from '@tanstack/react-table';
import { Result } from '../../types';

export function ResultsTable({ table, isLoading }: { table: Table<Result>; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="p-12 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-8 w-8 text-[var(--primary-teal)] mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-[var(--text-secondary)] font-medium">Loading records...</span>
        </div>
      </div>
    );
  }

  const rows = table.getRowModel().rows;

  if (rows.length === 0) {
    return (
      <div className="p-16 text-center text-[var(--text-secondary)] bg-white dark:bg-slate-900 border-b border-[var(--border-color)]">
        <p className="text-lg font-medium">No results found.</p>
        <p className="text-sm mt-1">Try adjusting your search or filters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white dark:bg-slate-900 border-b border-[var(--border-color)]">
      <table className="w-full text-sm">
        <thead className="bg-slate-50/80 dark:bg-slate-800/80">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="text-left px-5 py-4 font-semibold text-[var(--text-main)] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors select-none whitespace-nowrap border-b border-[var(--border-color)]"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <div className="flex items-center gap-2">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    <span className="text-slate-400">
                      {{
                        asc: " ↑",
                        desc: " ↓",
                      }[header.column.getIsSorted() as string] ?? null}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-[var(--border-color)]">
          {rows.map((row) => (
            <tr
              key={row.id}
              className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-5 py-3.5 align-middle">
                  {flexRender(
                    cell.column.columnDef.cell,
                    cell.getContext()
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
