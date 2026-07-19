import React from 'react';
import { ShieldCheck } from 'lucide-react';
import workspaceImg from '../../assets/reconciliation-workspace.webp';

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex flex-col lg:flex-row bg-[var(--bg-primary)]">
      {/* Left Section - 52% on Desktop */}
      <section className="hidden lg:flex w-[52%] relative bg-[var(--sidebar-navy)] overflow-hidden flex-col justify-between p-16">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${workspaceImg})` }}
        />
        <div className="absolute inset-0 bg-[var(--sidebar-navy)]/80 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--sidebar-navy)]/90 via-[var(--sidebar-navy)]/60 to-[var(--sidebar-navy)]/90" />
        
        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-[var(--accent-mint)]" size={32} />
            <span className="text-white font-bold text-xl tracking-wide">LedgerView</span>
          </div>
        </div>

        <div className="relative z-10 mt-20">
          <p className="text-[var(--accent-mint)] font-bold tracking-widest text-sm mb-4">
            REVENUE CONTROL
          </p>
          <h1 className="text-5xl lg:text-6xl font-semibold leading-[1.1] text-white">
            Every transaction.<br />Accounted for.
          </h1>
          <p className="text-slate-300 text-lg max-w-md mt-6 leading-relaxed">
            Deterministic revenue reconciliation with clear, auditable outcomes.
          </p>
          
          <div className="flex flex-col gap-4 mt-12">
            {[
              "Secure uploads",
              "Deterministic matching",
              "Auditable results"
            ].map(point => (
              <div key={point} className="flex items-center gap-3 text-slate-200">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-mint)]" />
                <span className="font-medium">{point}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative visual for verified transaction connection */}
        <div className="relative z-10 mt-auto pt-20">
          <div className="flex items-center gap-4 text-xs font-mono text-slate-400 bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10 w-max">
            <div className="px-2 py-1 bg-white/10 rounded">ORD-1048</div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--accent-mint)] to-transparent w-16" />
            <div className="w-5 h-5 rounded-full bg-[var(--accent-mint)] flex items-center justify-center text-[var(--sidebar-navy)]">✓</div>
            <div className="flex-1 h-px bg-gradient-to-r from-[var(--accent-mint)] via-transparent to-transparent w-16" />
            <div className="px-2 py-1 bg-white/10 rounded">TXN700047</div>
          </div>
        </div>
      </section>

      {/* Right Section - Form Container */}
      <section className="flex-1 flex items-center justify-center p-8 lg:p-16 relative">
        <div className="w-full max-w-[420px]">
          {/* Mobile Header (Hidden on Desktop) */}
          <div className="lg:hidden flex items-center gap-2 justify-center mb-12">
            <ShieldCheck className="text-[var(--primary-teal)]" size={28} />
            <span className="text-[var(--sidebar-navy)] font-bold text-xl tracking-wide dark:text-white">LedgerView</span>
          </div>

          {children}

          <div className="mt-12 text-center text-sm font-medium text-[var(--text-secondary)]">
            <ShieldCheck className="inline-block mr-1.5 mb-0.5 opacity-60" size={14} />
            Protected financial workspace
          </div>
        </div>
      </section>
    </main>
  );
}
