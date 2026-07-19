import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Upload, ShieldCheck, FileSpreadsheet, PieChart, Settings, X } from 'lucide-react';

export function Sidebar({ className = '', onClose }: { className?: string; onClose?: () => void }) {
  const links = [
    { name: 'Overview', to: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Upload Data', to: '/#upload', icon: <Upload size={20} /> },
    { name: 'Discrepancies', to: '/#discrepancies', icon: <FileSpreadsheet size={20} /> },
    { name: 'Reconciliation', to: '/#reconciliation', icon: <ShieldCheck size={20} /> },
    { name: 'Reports', to: '/#reports', icon: <PieChart size={20} /> },
    { name: 'Settings', to: '/#settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className={`bg-[var(--sidebar-navy)] text-slate-300 flex flex-col ${className}`}>
      <div className="h-16 flex items-center justify-between px-6 bg-[var(--sidebar-navy)]/50">
        <div className="flex items-center gap-2 text-white font-bold text-lg">
          <ShieldCheck className="text-[var(--accent-mint)]" size={24} />
          LedgerView
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg lg:hidden">
            <X size={20} />
          </button>
        )}
      </div>

      <div className="px-4 py-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">Menu</p>
        <nav className="space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.name}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                  isActive && link.to === '/'
                    ? 'bg-[var(--primary-teal)] text-white'
                    : 'hover:bg-white/10 hover:text-white'
                }`
              }
              onClick={onClose}
            >
              {link.icon}
              {link.name}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-4">
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-sm font-semibold text-white">Active Workspace</p>
          <p className="text-xs text-slate-400 mt-1 truncate">Q2 Revenue Recon</p>
        </div>
      </div>
    </div>
  );
}
