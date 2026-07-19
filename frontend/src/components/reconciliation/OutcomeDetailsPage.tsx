import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react';
import { useDiscrepancyDetail, useExplainAi } from '../../hooks/useReconciliation';
import { AppShell } from '../layout/AppShell';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ErrorMessage } from '../ui/ErrorMessage';

export function OutcomeDetailsPage() {
  const { id } = useParams();
  const { data: r, isLoading, isError } = useDiscrepancyDetail(id);
  const ai = useExplainAi();

  const getStatusVariant = (classification: string) => {
    if (classification === 'matched') return 'success';
    if (classification.includes('mismatch')) return 'warning';
    return 'critical';
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          <div className="panel h-96 animate-pulse bg-slate-100 dark:bg-slate-800" />
        </div>
      </AppShell>
    );
  }

  if (isError || !r) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          <ErrorMessage 
            title="Record Not Found" 
            message="The requested reconciliation record could not be loaded or does not exist." 
          />
          <div className="mt-4 text-center">
            <Link to="/" className="text-[var(--primary-teal)] font-medium hover:underline">
              Return to Dashboard
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto p-2 md:p-6 space-y-6">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--primary-teal)] transition-colors"
        >
          <ArrowLeft size={16} /> Back to dashboard
        </Link>

        <div className="panel p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <CheckCircle2 size={120} />
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
            <div>
              <p className="text-xs font-bold text-[var(--text-secondary)] tracking-widest uppercase mb-1">
                Order Reference
              </p>
              <h1 className="text-3xl md:text-4xl font-black text-[var(--text-main)] tracking-tight">
                {r.match_key}
              </h1>
            </div>
            <Badge variant={getStatusVariant(r.classification)} className="text-sm px-3 py-1">
              {r.classification.replaceAll('_', ' ')}
            </Badge>
          </div>

          <p className="mt-8 text-lg font-medium text-[var(--text-secondary)] max-w-2xl leading-relaxed">
            {r.reason}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 relative z-10">
            {[
              ['Expected Amount', r.expected_amount],
              ['Actual Captured', r.actual_amount],
              ['Variance', r.difference],
            ].map(([k, v]) => (
              <div key={String(k)} className="rounded-[12px] bg-slate-50 dark:bg-slate-900/50 p-5 border border-[var(--border-color)]">
                <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">{k}</p>
                <p className="text-2xl font-black text-[var(--text-main)]">
                  {v} <span className="text-sm font-medium text-slate-500">{r.currency}</span>
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-[var(--border-color)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--text-main)]">Audit Trail</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Files imported → Deterministic rules evaluated → Result persisted
                </p>
              </div>
              <Button variant="secondary" className="text-xs py-1.5 h-auto">Mark Reviewed</Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            variant="outline"
            className="border-[var(--primary-teal)] text-[var(--primary-teal)] hover:bg-teal-50 dark:hover:bg-teal-900/20"
            isLoading={ai.isPending}
            onClick={() => ai.mutate(Number(id))}
            disabled={!!ai.data}
          >
            <Sparkles size={16} />
            {ai.data ? 'Explanation Generated' : 'Generate Business Context'}
          </Button>
        </div>

        {ai.data && (
          <div className="panel p-6 md:p-8 bg-gradient-to-br from-white to-teal-50/30 dark:from-slate-900 dark:to-teal-900/10 border-teal-100 dark:border-teal-900/30">
            <div className="flex items-center gap-2 mb-6 text-[var(--primary-teal)]">
              <Sparkles size={20} />
              <h2 className="text-lg font-bold text-[var(--text-main)]">Business Context</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-bold text-teal-700/70 dark:text-teal-400/70 uppercase tracking-wider mb-2">Summary</p>
                  <p className="text-sm font-medium text-[var(--text-main)]">{String((ai.data as any).summary)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-teal-700/70 dark:text-teal-400/70 uppercase tracking-wider mb-2">Likely Cause</p>
                  <p className="text-sm text-[var(--text-secondary)]">{String((ai.data as any).likely_cause)}</p>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-bold text-teal-700/70 dark:text-teal-400/70 uppercase tracking-wider mb-2">Business Impact</p>
                  <p className="text-sm font-medium text-[var(--text-main)]">{String((ai.data as any).business_impact)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-teal-700/70 dark:text-teal-400/70 uppercase tracking-wider mb-2">Recommended Action</p>
                  <p className="text-sm text-[var(--text-secondary)]">{String((ai.data as any).recommended_action)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
