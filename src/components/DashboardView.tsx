import React from 'react';
import {
  TrendingUp,
  FileCheck2,
  Send,
  Database,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  FileText,
  AlertTriangle,
  Receipt,
  Percent,
  FileSpreadsheet,
} from 'lucide-react';
import { Invoice, CompanySettings } from '../types';
import { exportInvoicesToExcel } from '../utils/exportUtils';

interface DashboardViewProps {
  invoices: Invoice[];
  settings: CompanySettings | null;
  onSyncQuickBooks: () => void;
  onTransmitQueued: () => void;
  onOpenInvoice: (invoice: Invoice) => void;
  onExportAccess: () => void;
  isSyncing: boolean;
  isTransmitting: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  invoices,
  settings,
  onSyncQuickBooks,
  onTransmitQueued,
  onOpenInvoice,
  onExportAccess,
  isSyncing,
  isTransmitting,
}) => {
  // Aggregate calculations
  const safeInvoices = invoices || [];
  const totalGross = safeInvoices.reduce((acc, inv) => acc + (Number(inv.gross_amount) || 0), 0);
  const totalVatable = safeInvoices.reduce((acc, inv) => acc + (Number(inv.vatable_sales) || 0), 0);
  const totalVat = safeInvoices.reduce((acc, inv) => acc + (Number(inv.vat_amount) || 0), 0);
  const totalExempt = safeInvoices.reduce((acc, inv) => acc + (Number(inv.vat_exempt_sales) || 0), 0);
  const totalZeroRated = safeInvoices.reduce((acc, inv) => acc + (Number(inv.zero_rated_sales) || 0), 0);
  const totalDiscount = safeInvoices.reduce((acc, inv) => acc + (Number(inv.discount_amount) || 0), 0);
  const totalEwt = safeInvoices.reduce((acc, inv) => acc + (Number(inv.withholding_tax_amount) || 0), 0);
  const totalNetPayable = safeInvoices.reduce((acc, inv) => acc + (Number(inv.net_amount_payable) || 0), 0);

  const acceptedCount = safeInvoices.filter((i) => i.eis_status === 'ACCEPTED').length;
  const queuedCount = safeInvoices.filter((i) => i.eis_status === 'QUEUED' || i.eis_status === 'NOT_SENT').length;
  const compliantCount = safeInvoices.filter((i) => i.status === 'VALIDATED' || i.status === 'TRANSMITTED').length;
  const complianceRate = safeInvoices.length > 0 ? Math.round((compliantCount / safeInvoices.length) * 100) : 100;

  const formatPHP = (val: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: BIR EIS Compliance Health & Quick Actions */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white border border-emerald-200/80 p-6 shadow-xs">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 border border-emerald-300 text-emerald-800 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              BIR Electronic Invoicing System (EIS) Active • RR No. 8-2022
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              E-Invoicing & QuickBooks Synchronizer
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Automated BIR-compliant tax calculations (12% VAT, 20% Senior/PWD statutory exemption, PEZA Zero-Rating), QBSDK integration, and continuous local MS Access storage.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onSyncQuickBooks}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs transition shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Layers className={`w-4 h-4 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing QB...' : 'Sync QuickBooks'}</span>
            </button>

            <button
              onClick={onTransmitQueued}
              disabled={isTransmitting || queuedCount === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Send className={`w-4 h-4 ${isTransmitting ? 'animate-pulse' : ''}`} />
              <span>{isTransmitting ? 'Transmitting...' : `Transmit to BIR EIS (${queuedCount})`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Invoiced */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3 hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Gross Sales</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
              {formatPHP(totalGross)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Net Payable: <span className="font-semibold text-slate-800">{formatPHP(totalNetPayable)}</span>
            </p>
          </div>
        </div>

        {/* 12% Output VAT */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3 hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">12% Output VAT</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-emerald-700 tracking-tight">
              {formatPHP(totalVat)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Vatable Base: <span className="font-semibold text-slate-800">{formatPHP(totalVatable)}</span>
            </p>
          </div>
        </div>

        {/* Exempt & Zero-Rated */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3 hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Exempt & Zero-Rated</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-blue-700 tracking-tight">
              {formatPHP(totalExempt + totalZeroRated)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Zero-Rated: <span className="text-slate-700 font-mono font-medium">{formatPHP(totalZeroRated)}</span> • Exempt: <span className="text-slate-700 font-mono font-medium">{formatPHP(totalExempt)}</span>
            </p>
          </div>
        </div>

        {/* EIS Compliance Rate */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3 hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">BIR EIS Submissions</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight flex items-baseline gap-2">
              <span>{acceptedCount}/{invoices.length}</span>
              <span className="text-xs font-bold text-emerald-700">{complianceRate}% Valid</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              {acceptedCount} Transmitted • {queuedCount} In Queue
            </p>
          </div>
        </div>
      </div>

      {/* Tax Breakdown Matrix & Storage Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* BIR Tax Breakdown Summary Card */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                BIR Official Tax Breakdown Summary (PHP)
              </h3>
            </div>
            <span className="text-[11px] font-mono font-medium text-slate-500">
              CAS Permit: {settings?.cas_ptu_no || 'CAS-PENDING'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] text-slate-500 uppercase font-bold">12% Vatable Sales</span>
              <p className="text-sm font-bold font-mono text-slate-900 mt-1">{formatPHP(totalVatable)}</p>
              <span className="text-[10px] text-emerald-700 font-medium">Output VAT: {formatPHP(totalVat)}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] text-slate-500 uppercase font-bold">VAT-Exempt Sales</span>
              <p className="text-sm font-bold font-mono text-slate-900 mt-1">{formatPHP(totalExempt)}</p>
              <span className="text-[10px] text-slate-500">0% VAT (Statutory)</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Zero-Rated Sales</span>
              <p className="text-sm font-bold font-mono text-slate-900 mt-1">{formatPHP(totalZeroRated)}</p>
              <span className="text-[10px] text-blue-700 font-medium">PEZA / Export 0%</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Creditable EWT (2307)</span>
              <p className="text-sm font-bold font-mono text-amber-700 mt-1">{formatPHP(totalEwt)}</p>
              <span className="text-[10px] text-amber-600">1% Goods / 2% Svc</span>
            </div>
          </div>

          {totalDiscount > 0 && (
            <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-between text-xs">
              <span className="text-purple-900 font-semibold">
                Senior Citizen / PWD 20% Statutory Discounts Applied:
              </span>
              <span className="font-mono font-bold text-purple-900">{formatPHP(totalDiscount)}</span>
            </div>
          )}
        </div>

        {/* Quick Sync & Database Companion */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Local MS Access Database
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Continuous local persistence in <span className="text-blue-700 font-mono font-semibold">.accdb</span> format for offline audits, CAS compliance verification, and instant historical lookup.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={onExportAccess}
              className="w-full py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-xs font-bold transition flex items-center justify-center gap-2 shadow-2xs"
            >
              <Database className="w-3.5 h-3.5 text-blue-600" />
              <span>Export & Backup to MS Access (.accdb)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Recent Synced Invoices
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Total {invoices.length} invoices registered
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer / Buyer</th>
                <th className="py-3 px-4">Customer TIN</th>
                <th className="py-3 px-4 text-right">Gross Amount</th>
                <th className="py-3 px-4 text-right">12% VAT</th>
                <th className="py-3 px-4 text-right">Net Payable</th>
                <th className="py-3 px-4 text-center">BIR EIS Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                    No invoices recorded yet. Click "Sync QuickBooks" to fetch live invoices.
                  </td>
                </tr>
              ) : (
                invoices.slice(0, 8).map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => onOpenInvoice(inv)}
                    className="hover:bg-slate-50 cursor-pointer transition"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                      {inv.ref_number}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{inv.txn_date}</td>
                    <td className="py-3.5 px-4 text-slate-900 font-semibold max-w-[220px] truncate">
                      {inv.customer_name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{inv.customer_tin}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-800">
                      {formatPHP(inv.gross_amount)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-700 font-semibold">
                      {inv.vat_amount > 0 ? formatPHP(inv.vat_amount) : '₱0.00'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-950">
                      {formatPHP(inv.net_amount_payable)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          inv.eis_status === 'ACCEPTED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : inv.eis_status === 'QUEUED'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {inv.eis_status === 'ACCEPTED' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {inv.eis_status === 'QUEUED' && <Clock className="w-3 h-3 text-amber-600" />}
                        {inv.eis_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenInvoice(inv);
                        }}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition"
                        title="Inspect Invoice"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
