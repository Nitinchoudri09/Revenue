import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getCoreRowModel, 
  getFilteredRowModel, 
  getPaginationRowModel, 
  getSortedRowModel, 
  useReactTable, 
  ColumnDef 
} from '@tanstack/react-table';
import { Layers, CheckCircle2, AlertTriangle, ShieldAlert, CreditCard } from 'lucide-react';

import { KpiCard } from './KpiCard';
import { OutcomeChart } from './OutcomeChart';
import { ExposureChart } from './ExposureChart';
import { EmptyState } from './EmptyState';
import { UploadCard } from '../reconciliation/UploadCard';
import { ResultsFilters } from '../reconciliation/ResultsFilters';
import { ResultsTable } from '../reconciliation/ResultsTable';
import { Pagination } from '../reconciliation/Pagination';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useDashboardStats, useDiscrepancies, useRunReconciliation } from '../../hooks/useReconciliation';
import { Result } from '../../types';

export function DashboardPage() {
  const nav = useNavigate();
  const [ordersId, setOrdersId] = useState<number>();
  const [paymentsId, setPaymentsId] = useState<number>();
  
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: rows = [], isLoading: rowsLoading } = useDiscrepancies();
  const runMutation = useRunReconciliation();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const outcomes = useMemo(() => Array.from(new Set(rows.map((r) => r.classification))), [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchSearch = r.match_key.toLowerCase().includes(search.toLowerCase()) || r.id.toString() === search;
      const matchStatus = status ? r.classification === status : true;
      return matchSearch && matchStatus;
    });
  }, [rows, search, status]);

  const getStatusVariant = (classification: string) => {
    if (classification === 'matched') return 'success';
    if (classification.includes('mismatch')) return 'warning';
    return 'critical';
  };

  const columns = useMemo<ColumnDef<Result>[]>(
    () => [
      { accessorKey: 'id', header: 'ID' },
      { accessorKey: 'match_key', header: 'Reference' },
      {
        accessorKey: 'classification',
        header: 'Classification',
        cell: (info) => (
          <Badge variant={getStatusVariant(info.getValue() as string)}>
            {(info.getValue() as string).replaceAll('_', ' ')}
          </Badge>
        ),
      },
      {
        accessorKey: 'difference',
        header: 'Variance',
        cell: (info) => {
          const val = info.getValue() as number;
          return (
            <span className={val > 0 ? 'text-[var(--critical-red)] font-semibold' : ''}>
              ${Math.abs(val).toFixed(2)}
            </span>
          );
        },
      },
      { accessorKey: 'currency', header: 'CCY' },
      {
        id: 'actions',
        cell: (info) => (
          <button
            onClick={() => nav(`/discrepancy/${info.row.original.id}`)}
            className="text-sm font-semibold text-[var(--primary-teal)] hover:underline"
          >
            Review
          </button>
        ),
      },
    ],
    [nav]
  );

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  });

  const chartData = useMemo(() => {
    if (!stats?.breakdown) return [];
    return Object.entries(stats.breakdown).map(([k, v]) => ({ name: k.replaceAll('_', ' '), value: v }));
  }, [stats]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* KPI GRID */}
      <section>
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-main)] tracking-tight">Overview</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Financial reconciliation summary</p>
          </div>
        </div>

        {!stats && !statsLoading ? (
          <EmptyState 
            title="No Data Available" 
            description="Upload orders and payments datasets to generate insights." 
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KpiCard title="Total Expected" value={stats?.total_orders || 0} icon={Layers} />
            <KpiCard title="Match Rate" value={stats ? `${stats.reconciliation_percent.toFixed(1)}%` : '0%'} icon={CheckCircle2} />
            <KpiCard title="Money at Risk" value={`$${stats?.money_at_risk?.toLocaleString() || 0}`} icon={AlertTriangle} />
            <KpiCard title="Items to Review" value={stats?.discrepancy_count || 0} icon={ShieldAlert} />
          </div>
        )}
      </section>

      {/* CHARTS */}
      {chartData.length > 0 && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OutcomeChart data={chartData} />
          <ExposureChart data={chartData} />
        </section>
      )}

      {/* INGESTION */}
      <section id="upload">
        <div className="flex items-end justify-between mb-6 mt-12">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-main)] tracking-tight">Upload Data</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Ingest structured CSV exports for processing</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <UploadCard kind="orders" onDone={setOrdersId} />
          <UploadCard kind="payments" onDone={setPaymentsId} />
        </div>
        
        <div className="mt-6 flex justify-end">
          <Button 
            disabled={!ordersId || !paymentsId}
            isLoading={runMutation.isPending}
            onClick={() => {
              if (ordersId && paymentsId) {
                runMutation.mutate({ od: ordersId, pd: paymentsId });
              }
            }}
            className="w-full md:w-auto h-12 px-8 shadow-sm"
          >
            <CreditCard size={18} className="mr-2" />
            Run Reconciliation
          </Button>
        </div>
      </section>

      {/* RESULTS */}
      <section id="reconciliation">
        <div className="flex items-end justify-between mb-6 mt-12">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-main)] tracking-tight">Reconciliation Results</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Review deterministic matching outcomes</p>
          </div>
        </div>
        
        <div className="panel shadow-sm border-[var(--border-color)]">
          <ResultsFilters 
            search={search} setSearch={setSearch} 
            status={status} setStatus={setStatus} 
            outcomes={outcomes} 
          />
          <ResultsTable table={table} isLoading={rowsLoading} />
          <Pagination table={table} />
        </div>
      </section>
      
    </div>
  );
}
