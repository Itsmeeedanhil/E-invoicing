import React from 'react';
import {
  BookOpen,
  CheckCircle2,
  ShieldCheck,
  Layers,
  Database,
  Printer,
  Receipt,
  HelpCircle,
  Key,
} from 'lucide-react';

export const UserManualView: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto text-slate-200 text-xs leading-relaxed pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-emerald-950/40 border border-slate-800 space-y-3 shadow-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
          <BookOpen className="w-3.5 h-3.5" />
          Official Operations Manual • BIR EIS & QuickBooks Desktop
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          BIR EIS & QuickBooks E-Invoicing System User Guide
        </h2>
        <p className="text-sm text-slate-300">
          Complete step-by-step instructions for connecting live QuickBooks Desktop sessions, managing 12% VAT / Senior PWD exemptions, transmitting to BIR EIS, printing official receipts, and managing the local MS Access database.
        </p>
      </div>

      {/* Chapter 1: Regulatory Background */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-md">
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            1. BIR EIS Regulatory Foundation (RR No. 8-2022 & RR No. 9-2021)
          </h3>
        </div>
        <p>
          Under Republic Act No. 10963 (<strong className="text-white">TRAIN Law</strong>) and BIR Revenue Regulations No. 8-2022, covered taxpayers must issue electronic receipts/invoices and transmit sales data in JSON format directly to the BIR Electronic Invoicing System (EIS).
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
            <span className="font-bold text-emerald-400">Sequential Numbering:</span>
            <p className="text-slate-400 text-[11px]">Strict serial continuity with zero gap tolerances.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
            <span className="font-bold text-emerald-400">SHA-256 Anti-Tampering:</span>
            <p className="text-slate-400 text-[11px]">Each invoice hash is generated automatically before transmission.</p>
          </div>
        </div>
      </div>

      {/* Chapter 2: Live QuickBooks Connection */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-md">
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
          <Layers className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            2. Connecting to Live QuickBooks Desktop (QBSDK)
          </h3>
        </div>
        <ol className="list-decimal pl-5 space-y-2 text-slate-300">
          <li>
            <strong className="text-white">Launch QuickBooks Desktop</strong> on your Windows machine and open your company file (<code className="text-emerald-400">.QBW</code>).
          </li>
          <li>
            Log into QuickBooks with an <strong className="text-white">Administrator</strong> account or an account with sales permissions.
          </li>
          <li>
            In this app, go to <strong className="text-emerald-400">QuickBooks Sync</strong> and click <strong className="text-white">"Sync Invoices Now"</strong>.
          </li>
          <li>
            When QuickBooks prompts with the <strong className="text-amber-300">Application Certificate Dialog</strong> (<em>"Do you want to allow this application to read and modify this company file?"</em>), choose <strong className="text-emerald-300">"Yes, whenever this QuickBooks company file is open"</strong>.
          </li>
          <li>
            The app will stream your live invoices, line items, and customers into the local database and compute all tax breakdowns in real-time.
          </li>
        </ol>
      </div>

      {/* Chapter 3: Tax Code Mapping & Computations */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-md">
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
          <Receipt className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            3. Philippine Tax Rules & QuickBooks Tax Code Mapping
          </h3>
        </div>
        <p>Configure your tax mapping in <strong className="text-white">QuickBooks Sync &gt; Tax Code Mapping Matrix</strong>:</p>
        <div className="rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px]">
              <tr>
                <th className="py-2.5 px-3">QuickBooks Code</th>
                <th className="py-2.5 px-3">BIR Tax Classification</th>
                <th className="py-2.5 px-3">Rate</th>
                <th className="py-2.5 px-3">Statutory Rule</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
              <tr>
                <td className="py-2 px-3 text-emerald-400 font-bold">TAX</td>
                <td className="py-2 px-3 text-slate-200">12% VATable Sales</td>
                <td className="py-2 px-3">12%</td>
                <td className="py-2 px-3 text-slate-400 font-sans">Standard domestic commercial goods and services.</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-emerald-400 font-bold">NON</td>
                <td className="py-2 px-3 text-slate-200">0% VAT-Exempt</td>
                <td className="py-2 px-3">0%</td>
                <td className="py-2 px-3 text-slate-400 font-sans">Statutory exempt raw agricultural, educational, medical items.</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-emerald-400 font-bold">ZERO</td>
                <td className="py-2 px-3 text-slate-200">0% Zero-Rated</td>
                <td className="py-2 px-3">0%</td>
                <td className="py-2 px-3 text-slate-400 font-sans">PEZA ecozone locators and direct foreign exports.</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-emerald-400 font-bold">SENIOR</td>
                <td className="py-2 px-3 text-purple-300">Senior/PWD 20% + Exempt</td>
                <td className="py-2 px-3">0%</td>
                <td className="py-2 px-3 text-slate-400 font-sans">Applies 20% statutory discount and exempts net from 12% VAT.</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-emerald-400 font-bold">EWT_1 / EWT_2</td>
                <td className="py-2 px-3 text-amber-300">Creditable Withholding (2307)</td>
                <td className="py-2 px-3">1% / 2%</td>
                <td className="py-2 px-3 text-slate-400 font-sans">Withholding tax deducted on net base (1% Goods, 2% Services).</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Chapter 4: Transmitting to BIR EIS */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-md">
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            4. Transmitting Batches to BIR EIS
          </h3>
        </div>
        <ol className="list-decimal pl-5 space-y-2 text-slate-300">
          <li>Navigate to <strong className="text-white">BIR EIS Invoices</strong>.</li>
          <li>Select the invoices to transmit using the checkboxes on the left.</li>
          <li>Click <strong className="text-emerald-400">"Transmit Selected (N)"</strong>.</li>
          <li>The application packages the canonical JSON payload, signs it with SHA-256, and submits it to the BIR EIS API.</li>
          <li>An official <strong className="text-white">Acknowledgement Number</strong> (e.g. <code className="text-emerald-400 font-mono">EIS-ACK-20261001-99214</code>) is returned and recorded on every invoice.</li>
        </ol>
      </div>

      {/* Chapter 5: Printing & MS Access */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-md">
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
          <Printer className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            5. Printing Invoices & MS Access Operations
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Official BIR Printing</span>
            </h4>
            <p className="text-slate-400 text-[11px]">
              Click the printer icon on any invoice to generate the official BIR Sales Invoice. It includes the mandatory BIR CAS header, tax summary box, 5-year permit clause, and scannable QR Code verification.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <Database className="w-4 h-4 text-blue-400" />
              <span>MS Access Hub (.accdb)</span>
            </h4>
            <p className="text-slate-400 text-[11px]">
              Navigate to <strong className="text-slate-200">MS Access Hub</strong> and click <strong className="text-blue-300">"Export Invoices to .accdb"</strong> to backup and mirror all sales records in a local Microsoft Access database file.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
