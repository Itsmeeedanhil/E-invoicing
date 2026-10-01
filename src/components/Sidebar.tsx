import React from 'react';
import {
  LayoutDashboard,
  FileCheck2,
  Database,
  Layers,
  Settings,
  History,
  FileSpreadsheet,
  Send,
  BookOpen,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'invoices'
  | 'quickbooks'
  | 'transmissions'
  | 'access_db'
  | 'audit_logs'
  | 'settings'
  | 'user_manual';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  pendingCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  pendingCount,
}) => {
  const menuItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'invoices' as NavTab,
      label: 'BIR EIS Invoices',
      icon: FileCheck2,
      badge: pendingCount > 0 ? `${pendingCount} Queued` : null,
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      id: 'quickbooks' as NavTab,
      label: 'QuickBooks Sync',
      icon: Layers,
      badge: 'SDK Live',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      id: 'transmissions' as NavTab,
      label: 'EIS Transmissions',
      icon: Send,
      badge: null,
    },
    {
      id: 'access_db' as NavTab,
      label: 'MS Access Hub',
      icon: Database,
      badge: '.accdb',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      id: 'audit_logs' as NavTab,
      label: 'CAS Audit Trail',
      icon: History,
      badge: null,
    },
    {
      id: 'settings' as NavTab,
      label: 'BIR & Tax Settings',
      icon: Settings,
      badge: null,
    },
    {
      id: 'user_manual' as NavTab,
      label: 'User Manual & Guide',
      icon: BookOpen,
      badge: 'Help',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 select-none shadow-xs">
      <div className="p-4 space-y-1.5">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Navigation
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition ${
                isActive
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    item.badgeColor || 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* BIR CAS Info Box in sidebar footer */}
      <div className="p-4 m-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
        <div className="flex items-center gap-1.5 font-bold text-slate-900">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>BIR EIS Standard</span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-500">
          Philippine Tax Reform (TRAIN Law) & RR No. 8-2022 compliant. Continuous sequential numbering & hash verification enabled.
        </p>
        <div className="pt-1 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
          <span className="font-medium">CAS PTU: Valid</span>
          <span className="text-emerald-700 font-mono font-bold">12% VAT Auto</span>
        </div>
      </div>
    </aside>
  );
};
