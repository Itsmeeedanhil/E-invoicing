import React from 'react';
import { ShieldCheck, RefreshCw, Database, Landmark } from 'lucide-react';
import { CompanySettings, QbConnectionStatus, AccessDbStatus } from '../types';

interface HeaderProps {
  settings: CompanySettings | null;
  qbStatus: QbConnectionStatus | null;
  accessStatus: AccessDbStatus | null;
  onRefreshAll: () => void;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  qbStatus,
  accessStatus,
  onRefreshAll,
  isLoading,
}) => {
  return (
    <header className="h-16 bg-white/95 backdrop-blur border-b border-slate-200 px-6 flex items-center justify-between z-20 shrink-0 shadow-xs no-print">
      {/* Brand & BIR Emblem */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-0.5 shadow-sm shadow-emerald-500/20 flex items-center justify-center">
          <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
            <Landmark className="w-5 h-5 text-emerald-600" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tight text-slate-900">
              BIR EIS & QuickBooks E-Invoicing
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              BIR RR 8-2022 / CAS Certified
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {settings?.business_name || 'Loading Enterprise...'} • TIN: <span className="font-mono font-medium text-slate-700">{settings?.tin || '---'}</span> (RDO {settings?.rdo || '---'})
          </p>
        </div>
      </div>

      {/* Real-time Status Badges & Quick Action */}
      <div className="flex items-center gap-3">
        {/* QB Status Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs shadow-2xs">
          <div
            className={`w-2 h-2 rounded-full ${
              qbStatus?.is_connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          />
          <span className="text-slate-600 font-medium">QuickBooks:</span>
          <span className={`font-semibold font-mono text-[11px] ${qbStatus?.is_connected ? 'text-emerald-700' : 'text-amber-700'}`}>
            {qbStatus?.is_connected ? 'CONNECTED' : 'DISCONNECTED'}
          </span>
        </div>

        {/* Access DB Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs shadow-2xs">
          <Database className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-slate-600 font-medium">MS Access:</span>
          <span className="text-blue-700 font-semibold font-mono text-[11px]">
            {accessStatus?.file_exists ? 'SYNCED (.accdb)' : 'READY'}
          </span>
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefreshAll}
          disabled={isLoading}
          className="p-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 transition shadow-xs active:scale-95 disabled:opacity-50"
          title="Refresh All Connections and Data"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
        </button>
      </div>
    </header>
  );
};
