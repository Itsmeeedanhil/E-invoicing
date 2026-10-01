import React, { useState } from 'react';
import {
  FileCheck2,
  Search,
  Filter,
  Send,
  Printer,
  FileCode2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Trash2,
  Eye,
  ShieldCheck,
  Building2,
  Download,
  FileSpreadsheet,
  FileDown,
} from 'lucide-react';
import { Invoice, CompanySettings } from '../types';
import {
  exportInvoicesToExcel,
  exportSingleInvoiceToExcel,
  autoExportInvoicePdf,
  decodeHtml,
} from '../utils/exportUtils';
import { showToast } from '../utils/toast';

interface BirComplianceCenterProps {
  invoices: Invoice[];
  settings: CompanySettings | null;
  onOpenInvoice: (invoice: Invoice) => void;
  onPrintInvoice: (invoice: Invoice) => void;
  onTransmitSelected: (selectedIds: string[]) => void;
  onNewInvoice: () => void;
  onDeleteInvoice: (id: string) => void;
  isTransmitting: boolean;
}

export const BirComplianceCenter: React.FC<BirComplianceCenterProps> = ({
  invoices,
  settings,
  onOpenInvoice,
  onPrintInvoice,
  onTransmitSelected,
  onNewInvoice,
  onDeleteInvoice,
  isTransmitting,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACCEPTED' | 'QUEUED' | 'NOT_SENT'>('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.ref_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customer_tin.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'ACCEPTED'
        ? inv.eis_status === 'ACCEPTED'
        : statusFilter === 'QUEUED'
        ? inv.eis_status === 'QUEUED'
        : inv.eis_status === 'NOT_SENT';

    return matchesSearch && matchesStatus;
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredInvoices.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredInvoices.map((i) => i.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const formatPHP = (val: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(val);
  };

  const handleExportBatchJson = () => {
    const targetInvoices = selectedIds.length > 0
      ? invoices.filter((i) => selectedIds.includes(i.id))
      : filteredInvoices;

    if (targetInvoices.length === 0) {
      showToast({
        title: 'Export Notice',
        message: 'No invoices available to export.',
        type: 'warning',
      });
      return;
    }

    const batchPayload = {
      batch_id: `BATCH-${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}`,
      seller_tin: settings?.tin || '000-000-000-00000',
      branch_code: settings?.branch_code || '00000',
      cas_ptu: settings?.cas_ptu_no || '',
      total_invoices: targetInvoices.length,
      exported_at: new Date().toISOString(),
      invoices: targetInvoices,
    };

    const blob = new Blob([JSON.stringify(batchPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const downloadName = `BIR_EIS_Batch_${batchPayload.batch_id}.json`;
    a.download = downloadName;
    a.click();
    URL.revokeObjectURL(url);

    showToast({
      title: 'Batch JSON Exported',
      message: `Extracted ${targetInvoices.length} invoices into official BIR EIS JSON format (${downloadName})!`,
      type: 'success',
    });
  };

  const handleExportExcel = () => {
    const targetInvoices = selectedIds.length > 0
      ? invoices.filter((i) => selectedIds.includes(i.id))
      : filteredInvoices;

    if (targetInvoices.length === 0) {
      showToast({
        title: 'Export Notice',
        message: 'No invoices available to export.',
        type: 'warning',
      });
      return;
    }

    const dateStr = new Date().toISOString().split('T')[0];
    exportInvoicesToExcel(targetInvoices, `BIR_EIS_Sales_Invoices_${dateStr}.xlsx`);
  };

  const handleExportPdf = () => {
    const targetInvoices = selectedIds.length > 0
      ? invoices.filter((i) => selectedIds.includes(i.id))
      : filteredInvoices;

    if (targetInvoices.length === 0) {
      showToast({
        title: 'Export Notice',
        message: 'No invoices available to export.',
        type: 'warning',
      });
      return;
    }

    targetInvoices.forEach((inv) => {
      autoExportInvoicePdf(inv, settings);
    });

    if (targetInvoices.length > 1) {
      showToast({
        title: 'Batch PDF Export Complete',
        message: `Successfully generated and downloaded ${targetInvoices.length} official BIR PDF Sales Invoices!`,
        type: 'success',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              BIR EIS Compliance & Invoicing Hub
            </h2>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
              RR No. 8-2022 Certified
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review tax classifications, inspect SHA-256 payload hashes, export canonical JSON, and transmit to EIS.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportBatchJson}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs transition active:scale-95 shadow-2xs cursor-pointer"
            title="Download formatted JSON batch file for BIR EIS upload or inspection"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export JSON ({selectedIds.length > 0 ? selectedIds.length : filteredInvoices.length})</span>
          </button>

          <button
            onClick={onNewInvoice}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 hover:text-slate-900 font-semibold text-xs transition active:scale-95 shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>New Invoice</span>
          </button>

          <button
            onClick={() => onTransmitSelected(selectedIds)}
            disabled={selectedIds.length === 0 || isTransmitting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Transmit Selected ({selectedIds.length})</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by invoice #, customer, TIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {(['ALL', 'ACCEPTED', 'QUEUED', 'NOT_SENT'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                statusFilter === status
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              {status === 'ALL'
                ? `All (${invoices.length})`
                : status === 'ACCEPTED'
                ? `Accepted (${invoices.filter((i) => i.eis_status === 'ACCEPTED').length})`
                : status === 'QUEUED'
                ? `Queued (${invoices.filter((i) => i.eis_status === 'QUEUED').length})`
                : `Not Sent (${invoices.filter((i) => i.eis_status === 'NOT_SENT').length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredInvoices.length > 0 &&
                      selectedIds.length === filteredInvoices.length
                    }
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4">Invoice / Serial #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer Name & TIN</th>
                <th className="py-3 px-4 text-right">Gross (PHP)</th>
                <th className="py-3 px-4 text-right">12% VAT (PHP)</th>
                <th className="py-3 px-4 text-right">Net Payable</th>
                <th className="py-3 px-4 text-center">EIS Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                    No invoices matching the current filter.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const isSelected = selectedIds.includes(inv.id);
                  const isAccepted = inv.eis_status === 'ACCEPTED';
                  const isQueued = inv.eis_status === 'QUEUED';

                  return (
                    <tr
                      key={inv.id}
                      className={`hover:bg-slate-50 transition cursor-pointer ${
                        isSelected ? 'bg-emerald-50/60' : ''
                      }`}
                      onClick={() => onOpenInvoice(inv)}
                    >
                      <td
                        className="py-3.5 px-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(inv.id)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20 cursor-pointer"
                        />
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-emerald-700">
                          {inv.ref_number}
                        </div>
                        {inv.qb_txn_id && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            QB: {inv.qb_txn_id}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">{inv.txn_date}</td>

                      <td className="py-3.5 px-4 max-w-[240px]">
                        <div className="text-slate-900 font-semibold truncate">
                          {decodeHtml(inv.customer_name)}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
                          <span>{inv.customer_tin}</span>
                          {inv.discount_type && (
                            <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 text-[9px] font-bold">
                              {inv.discount_type} (20%)
                            </span>
                          )}
                        </div>
                      </td>

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
                            isAccepted
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : isQueued
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {isAccepted && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          {isQueued && <Clock className="w-3 h-3 text-amber-600" />}
                          {inv.eis_status}
                        </span>
                        {inv.eis_ack_number && (
                          <div className="text-[9px] font-mono text-slate-500 truncate max-w-[120px] mx-auto mt-0.5">
                            {inv.eis_ack_number}
                          </div>
                        )}
                      </td>

                      <td
                        className="py-3.5 px-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => autoExportInvoicePdf(inv, settings)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 transition cursor-pointer"
                            title="Direct Download PDF (A4 Format)"
                          >
                            <FileDown className="w-3.5 h-3.5 text-blue-600" />
                          </button>

                          <button
                            onClick={() => exportSingleInvoiceToExcel(inv, settings)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition cursor-pointer"
                            title="Export this invoice to Excel (.xlsx) form layout"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                          </button>

                          <button
                            onClick={() => onPrintInvoice(inv)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-emerald-700 transition cursor-pointer"
                            title="Print Official BIR Sales Invoice / OR"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onOpenInvoice(inv)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition cursor-pointer"
                            title="Inspect & Validate BIR Fields"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onDeleteInvoice(inv.id)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 transition cursor-pointer"
                            title="Delete Invoice"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
