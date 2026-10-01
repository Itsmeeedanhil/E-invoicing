import React, { useState } from 'react';
import {
  Database,
  RefreshCw,
  FolderOpen,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Table,
  Layers,
} from 'lucide-react';
import { AccessDbStatus, Invoice, EisTransmission, TaxMapping, AuditLog } from '../types';

interface AccessDbManagerProps {
  accessStatus: AccessDbStatus | null;
  invoices: Invoice[];
  transmissions: EisTransmission[];
  taxMappings: TaxMapping[];
  auditLogs: AuditLog[];
  onInitializeAccess: () => void;
  onExportAccess: () => void;
  isProcessing: boolean;
  initialTable?: 'invoices' | 'transmissions' | 'tax_mappings' | 'audit';
}

export const AccessDbManager: React.FC<AccessDbManagerProps> = ({
  accessStatus,
  invoices = [],
  transmissions = [],
  taxMappings = [],
  auditLogs = [],
  onInitializeAccess,
  onExportAccess,
  isProcessing,
  initialTable = 'invoices',
}) => {
  const [activeTable, setActiveTable] = useState<'invoices' | 'transmissions' | 'tax_mappings' | 'audit'>(
    initialTable
  );

  React.useEffect(() => {
    if (initialTable) {
      setActiveTable(initialTable);
    }
  }, [initialTable]);

  return (
    <div className="space-y-6">
      {/* Top Banner: MS Access Status Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  Local MS Access Database (.accdb) Engine
                </h2>
                <span className="px-2.5 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Local Storage Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Target Database File: <span className="font-mono font-medium text-blue-700">{accessStatus?.path || 'BIR_EIS_Database.accdb'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onInitializeAccess}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold transition active:scale-95 disabled:opacity-50 flex items-center gap-2 shadow-2xs"
            >
              <Database className="w-3.5 h-3.5 text-blue-600" />
              <span>Initialize Access DB</span>
            </button>

            <button
              onClick={onExportAccess}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-sm active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Invoices to .accdb</span>
            </button>
          </div>
        </div>

        {/* Diagnostic Status Box */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 uppercase text-[10px] font-bold">File State</span>
            <p className="text-emerald-700 font-bold mt-1 font-mono text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              {accessStatus?.file_exists ? 'Database File Created' : 'Ready to Create'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 uppercase text-[10px] font-bold">Records Cached</span>
            <p className="text-slate-800 font-bold mt-1 font-mono text-xs">
              {invoices.length} Invoices • {auditLogs.length} CAS Logs
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 uppercase text-[10px] font-bold">Database Driver</span>
            <p className="text-blue-700 font-semibold mt-1 font-mono text-xs">
              Microsoft.ACE.OLEDB.12/16 + Native Bridge
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Table Browser */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Table className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">
              MS Access Database Tables Inspector
            </h3>
          </div>

          {/* Table Selector Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setActiveTable('invoices')}
              className={`px-3 py-1.5 rounded-lg transition font-medium ${
                activeTable === 'invoices' ? 'bg-white text-blue-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              tbl_Invoices ({invoices.length})
            </button>
            <button
              onClick={() => setActiveTable('transmissions')}
              className={`px-3 py-1.5 rounded-lg transition font-medium ${
                activeTable === 'transmissions' ? 'bg-white text-blue-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              tbl_BIR_Transmissions ({transmissions.length})
            </button>
            <button
              onClick={() => setActiveTable('tax_mappings')}
              className={`px-3 py-1.5 rounded-lg transition font-medium ${
                activeTable === 'tax_mappings' ? 'bg-white text-blue-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              tbl_TaxMappings ({taxMappings.length})
            </button>
            <button
              onClick={() => setActiveTable('audit')}
              className={`px-3 py-1.5 rounded-lg transition font-medium ${
                activeTable === 'audit' ? 'bg-white text-blue-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              tbl_CAS_AuditTrail ({auditLogs.length})
            </button>
          </div>
        </div>

        {/* Active Table Render */}
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          {activeTable === 'invoices' && (
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">RefNumber</th>
                    <th className="py-2.5 px-3">CustomerName</th>
                    <th className="py-2.5 px-3">CustomerTIN</th>
                    <th className="py-2.5 px-3 text-right">GrossAmount</th>
                    <th className="py-2.5 px-3 text-right">VatableSales</th>
                    <th className="py-2.5 px-3 text-right">VATAmount</th>
                    <th className="py-2.5 px-3 text-right">NetPayable</th>
                    <th className="py-2.5 px-3">EIS_Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-700">
                  {(invoices || []).map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-emerald-700 font-bold">{inv.ref_number}</td>
                      <td className="py-2 px-3 text-slate-900 font-sans font-medium">{inv.customer_name}</td>
                      <td className="py-2 px-3 text-slate-500">{inv.customer_tin || 'N/A'}</td>
                      <td className="py-2 px-3 text-right text-slate-700">₱{(Number(inv.gross_amount) || 0).toFixed(2)}</td>
                      <td className="py-2 px-3 text-right text-slate-700">₱{(Number(inv.vatable_sales) || 0).toFixed(2)}</td>
                      <td className="py-2 px-3 text-right text-emerald-700 font-semibold">₱{(Number(inv.vat_amount) || 0).toFixed(2)}</td>
                      <td className="py-2 px-3 text-right text-slate-950 font-bold">₱{(Number(inv.net_amount_payable) || 0).toFixed(2)}</td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200">
                          {inv.eis_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTable === 'transmissions' && (
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">BatchID</th>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3 text-center">InvoiceCount</th>
                    <th className="py-2.5 px-3">AckNumber</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-700">
                  {(transmissions || []).map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-blue-700 font-bold">{t.batch_id}</td>
                      <td className="py-2 px-3 text-slate-600">
                        {t.transmitted_at ? new Date(t.transmitted_at).toLocaleString() : 'N/A'}
                      </td>
                      <td className="py-2 px-3 text-center text-slate-800 font-bold">{t.invoice_count}</td>
                      <td className="py-2 px-3 text-emerald-700 font-bold">{t.ack_number || 'PENDING'}</td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTable === 'tax_mappings' && (
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">QB_TaxCode</th>
                    <th className="py-2.5 px-3">BIR_TaxType</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-right">TaxRate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-700">
                  {(taxMappings || []).map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-emerald-700 font-bold">{m.qb_tax_code}</td>
                      <td className="py-2 px-3 text-blue-700 font-semibold">{m.bir_tax_type}</td>
                      <td className="py-2 px-3 text-slate-800 font-sans">{m.description}</td>
                      <td className="py-2 px-3 text-right text-slate-900 font-bold">{((Number(m.tax_rate) || 0) * 100).toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTable === 'audit' && (
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Entity</th>
                    <th className="py-2.5 px-3">User</th>
                    <th className="py-2.5 px-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-700">
                  {(auditLogs || []).map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-slate-500">
                        {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : 'N/A'}
                      </td>
                      <td className="py-2 px-3 text-emerald-700 font-bold">{log.action}</td>
                      <td className="py-2 px-3 text-blue-700 font-semibold">{log.entity_type}</td>
                      <td className="py-2 px-3 text-slate-700 font-medium">{log.user_name}</td>
                      <td className="py-2 px-3 text-slate-800 font-sans max-w-md">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
