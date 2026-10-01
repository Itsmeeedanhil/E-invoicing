import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  FileCode2,
  Printer,
  Save,
  Send,
  Plus,
  Trash2,
  Lock,
  Percent,
  FileSpreadsheet,
  FileDown,
} from 'lucide-react';
import { Invoice, InvoiceItem, CompanySettings, BirValidationResult } from '../types';
import { api } from '../services/api';
import { exportSingleInvoiceToExcel, autoExportInvoicePdf, decodeHtml } from '../utils/exportUtils';
import { showToast } from '../utils/toast';

interface InvoiceDetailModalProps {
  invoice: Invoice | null;
  settings: CompanySettings | null;
  onClose: () => void;
  onSave: (invoice: Invoice) => void;
  onPrint: (invoice: Invoice) => void;
  onTransmit: (invoiceId: string) => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  invoice,
  settings,
  onClose,
  onSave,
  onPrint,
  onTransmit,
}) => {
  if (!invoice) return null;

  const [form, setForm] = useState<Invoice>(() => ({
    ...invoice,
    customer_name: decodeHtml(invoice.customer_name),
    customer_address: decodeHtml(invoice.customer_address),
    customer_business_style: decodeHtml(invoice.customer_business_style),
    items: invoice.items.map((it) => ({
      ...it,
      item_name: decodeHtml(it.item_name),
      description: decodeHtml(it.description),
    })),
  }));
  const [activeTab, setActiveTab] = useState<'details' | 'json' | 'audit'>('details');
  const [validation, setValidation] = useState<BirValidationResult | null>(null);
  const [rawJson, setRawJson] = useState<string>('');

  // Recalculate totals whenever items or rates change
  useEffect(() => {
    let gross = 0;
    let vatable = 0;
    let exempt = 0;
    let zero = 0;
    let nonVat = 0;
    let totalDiscount = 0;

    form.items.forEach((item) => {
      const lineRaw = item.qty * item.unit_price;
      gross += lineRaw;

      const disc = item.discount_percent > 0 ? lineRaw * (item.discount_percent / 100) : 0;
      totalDiscount += disc;
      const netLine = lineRaw - disc;

      if (item.tax_type === 'VAT_12') {
        vatable += netLine;
      } else if (item.tax_type === 'VAT_EXEMPT') {
        exempt += netLine;
      } else if (item.tax_type === 'ZERO_RATED') {
        zero += netLine;
      } else {
        nonVat += netLine;
      }
    });

    const isVatReg = settings?.is_vat_registered ?? true;
    const vat = isVatReg && vatable > 0 ? Math.round(vatable * 0.12 * 100) / 100 : 0;
    
    const ewt =
      form.withholding_tax_rate > 0
        ? Math.round((vatable + exempt + zero) * form.withholding_tax_rate * 100) / 100
        : 0;

    const netPayable = Math.round((vatable + exempt + zero + nonVat + vat - ewt) * 100) / 100;

    setForm((prev) => ({
      ...prev,
      gross_amount: gross,
      vatable_sales: vatable,
      vat_exempt_sales: exempt,
      zero_rated_sales: zero,
      non_vat_sales: nonVat,
      vat_amount: vat,
      discount_amount: totalDiscount,
      withholding_tax_amount: ewt,
      net_amount_payable: netPayable,
    }));
  }, [form.items, form.withholding_tax_rate, settings?.is_vat_registered]);

  // Run BIR Validation
  useEffect(() => {
    api.validateInvoiceBir(form).then((res) => {
      setValidation(res);
    });
    api.generateBirEisPayload(form).then((json) => {
      setRawJson(JSON.stringify(json, null, 2));
    });
  }, [form]);

  const handleItemChange = (idx: number, field: keyof InvoiceItem, val: any) => {
    const updated = [...form.items];
    updated[idx] = { ...updated[idx], [field]: val };
    if (field === 'qty' || field === 'unit_price') {
      updated[idx].amount = updated[idx].qty * updated[idx].unit_price;
    }
    setForm({ ...form, items: updated });
  };

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: 'item-' + Date.now(),
      invoice_id: form.id,
      item_name: 'New Service / Merchandise Item',
      description: 'Standard Transaction Item',
      qty: 1,
      unit_price: 1000,
      amount: 1000,
      tax_type: 'VAT_12',
      discount_percent: 0,
      is_senior_pwd: false,
    };
    setForm({ ...form, items: [...form.items, newItem] });
  };

  const handleDeleteItem = (idx: number) => {
    setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  };

  const formatPHP = (val: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="font-mono text-base font-bold text-emerald-800">
              {form.ref_number}
            </div>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full">
              {form.invoice_type}
            </span>
            {validation && (
              <span
                className={`px-2.5 py-0.5 text-xs font-bold rounded-full flex items-center gap-1 border ${
                  validation.is_valid
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {validation.is_valid ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <AlertCircle className="w-3 h-3 text-amber-600" />}
                BIR Score: {validation.score}%
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-200 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setActiveTab('details')}
                className={`px-3 py-1 rounded-md transition ${
                  activeTab === 'details' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Invoice Form
              </button>
              <button
                onClick={() => setActiveTab('json')}
                className={`px-3 py-1 rounded-md transition ${
                  activeTab === 'json' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                BIR EIS JSON & Hash
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {activeTab === 'details' ? (
            <>
              {/* Validation Warnings / Errors Banner */}
              {validation && (!validation.is_valid || validation.warnings.length > 0) && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>BIR EIS Compliance Feedback</span>
                  </div>
                  {validation.errors.map((e, idx) => (
                    <p key={idx} className="text-red-700 text-[11px] pl-6 font-medium">
                      • {e}
                    </p>
                  ))}
                  {validation.warnings.map((w, idx) => (
                    <p key={idx} className="text-amber-800 text-[11px] pl-6">
                      • {w}
                    </p>
                  ))}
                </div>
              )}

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Invoice Ref & Date */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <span className="text-slate-500 uppercase text-[10px] font-bold">Document Metadata</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-600 block mb-1 font-medium">Invoice Number</label>
                      <input
                        type="text"
                        value={form.ref_number}
                        onChange={(e) => setForm({ ...form, ref_number: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-emerald-800 font-mono font-bold focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-slate-600 block mb-1 font-medium">Transaction Date</label>
                      <input
                        type="date"
                        value={form.txn_date}
                        onChange={(e) => setForm({ ...form, txn_date: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-600 block mb-1 font-medium">Document Type</label>
                      <select
                        value={form.invoice_type}
                        onChange={(e) => setForm({ ...form, invoice_type: e.target.value as any })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:border-emerald-600 focus:outline-none"
                      >
                        <option value="SALES_INVOICE">Sales Invoice (SI)</option>
                        <option value="OFFICIAL_RECEIPT">Official Receipt (OR)</option>
                        <option value="COMMERCIAL_INVOICE">Commercial Invoice</option>
                        <option value="CREDIT_MEMO">Credit Memo</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-600 block mb-1 font-medium">QuickBooks Txn ID</label>
                      <input
                        type="text"
                        value={form.qb_txn_id || ''}
                        onChange={(e) => setForm({ ...form, qb_txn_id: e.target.value })}
                        placeholder="e.g. QB-TXN-1001"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 font-mono focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Buyer / Customer Information */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <span className="text-slate-500 uppercase text-[10px] font-bold">Buyer / Customer Information</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="text-slate-600 block mb-1 font-medium">Registered Customer Name</label>
                      <input
                        type="text"
                        value={form.customer_name}
                        onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-slate-600 block mb-1 font-medium">Branch Code</label>
                      <input
                        type="text"
                        value={form.customer_branch}
                        onChange={(e) => setForm({ ...form, customer_branch: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 font-mono focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-600 block mb-1 font-medium">Customer TIN (XXX-XXX-XXX-XXXXX)</label>
                      <input
                        type="text"
                        value={form.customer_tin}
                        onChange={(e) => setForm({ ...form, customer_tin: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-emerald-800 font-mono font-semibold focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-slate-600 block mb-1 font-medium">Business Style</label>
                      <input
                        type="text"
                        value={form.customer_business_style}
                        onChange={(e) => setForm({ ...form, customer_business_style: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 uppercase text-[10px] font-bold">Itemized Sales Breakdown</span>
                  <button
                    onClick={handleAddItem}
                    className="flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Item Name & Description</th>
                        <th className="py-2.5 px-3 w-16 text-right">Qty</th>
                        <th className="py-2.5 px-3 w-28 text-right">Unit Price</th>
                        <th className="py-2.5 px-3 w-36">Tax Classification</th>
                        <th className="py-2.5 px-3 w-20 text-right">Disc %</th>
                        <th className="py-2.5 px-3 w-28 text-right">Amount</th>
                        <th className="py-2.5 px-3 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {form.items.map((it, idx) => (
                        <tr key={it.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={it.item_name}
                              onChange={(e) => handleItemChange(idx, 'item_name', e.target.value)}
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-900"
                            />
                          </td>
                          <td className="py-2 px-3 text-right">
                            <input
                              type="number"
                              value={it.qty}
                              onChange={(e) => handleItemChange(idx, 'qty', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono text-right text-slate-900"
                            />
                          </td>
                          <td className="py-2 px-3 text-right">
                            <input
                              type="number"
                              value={it.unit_price}
                              onChange={(e) => handleItemChange(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono text-right text-slate-900"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={it.tax_type}
                              onChange={(e) => handleItemChange(idx, 'tax_type', e.target.value)}
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-800 text-xs font-semibold"
                            >
                              <option value="VAT_12">12% VAT</option>
                              <option value="VAT_EXEMPT">0% VAT-Exempt</option>
                              <option value="ZERO_RATED">0% Zero-Rated</option>
                              <option value="NON_VAT">Non-VAT</option>
                            </select>
                          </td>
                          <td className="py-2 px-3 text-right">
                            <input
                              type="number"
                              value={it.discount_percent}
                              onChange={(e) => handleItemChange(idx, 'discount_percent', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono text-right text-slate-900"
                            />
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-950">
                            {formatPHP(it.qty * it.unit_price)}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              onClick={() => handleDeleteItem(idx)}
                              className="text-slate-400 hover:text-red-600 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tax Calculations & BIR EIS Summary Bar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Senior / Withholding Tax Settings */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <span className="text-slate-500 uppercase text-[10px] font-bold">Special Discounts & Withholding Tax</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-600 block mb-1 font-medium">Discount Type</label>
                      <select
                        value={form.discount_type || 'NONE'}
                        onChange={(e) => setForm({ ...form, discount_type: e.target.value === 'NONE' ? null : e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                      >
                        <option value="NONE">None</option>
                        <option value="SENIOR">Senior Citizen (20% Statutory)</option>
                        <option value="PWD">PWD (20% Statutory)</option>
                        <option value="SPECIAL">Special Commercial Discount</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-600 block mb-1 font-medium">Senior / PWD ID #</label>
                      <input
                        type="text"
                        value={form.discount_id_no || ''}
                        onChange={(e) => setForm({ ...form, discount_id_no: e.target.value })}
                        placeholder="OSCA / PWD ID"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-600 block mb-1 font-medium">Creditable Withholding Tax (BIR 2307)</label>
                    <select
                      value={form.withholding_tax_rate}
                      onChange={(e) => setForm({ ...form, withholding_tax_rate: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-semibold"
                    >
                      <option value="0">0% None</option>
                      <option value="0.01">1% EWT (Purchase of Goods)</option>
                      <option value="0.02">2% EWT (Purchase of Services / Contractor)</option>
                      <option value="0.05">5% EWT (Rental / Professional Fees)</option>
                    </select>
                  </div>
                </div>

                {/* Final Computation Matrix */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span>12% Vatable Sales:</span>
                    <span className="text-slate-900 font-bold">{formatPHP(form.vatable_sales)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>12% Output VAT:</span>
                    <span className="text-emerald-700 font-bold">{formatPHP(form.vat_amount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>VAT-Exempt Sales:</span>
                    <span className="text-slate-900">{formatPHP(form.vat_exempt_sales)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Zero-Rated Sales:</span>
                    <span className="text-blue-700 font-medium">{formatPHP(form.zero_rated_sales)}</span>
                  </div>
                  {form.withholding_tax_amount > 0 && (
                    <div className="flex justify-between text-amber-800 font-semibold">
                      <span>Less: Withholding Tax (EWT):</span>
                      <span>-{formatPHP(form.withholding_tax_amount)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-200 flex justify-between text-sm text-slate-900 font-bold">
                    <span>Total Net Payable:</span>
                    <span className="text-emerald-700 text-base">{formatPHP(form.net_amount_payable)}</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div>
                  <span className="text-slate-900 text-xs font-bold font-mono">BIR EIS Canonical Schema (JSON)</span>
                  <p className="text-[11px] text-slate-500 font-mono">Hash: {form.eis_hash || 'SHA256 Calculated'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(rawJson);
                      showToast({
                        title: 'JSON Copied',
                        message: `BIR EIS Canonical JSON for Invoice #${form.ref_number} copied to clipboard!`,
                        type: 'info',
                      });
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-slate-700 text-xs font-medium transition shadow-2xs cursor-pointer"
                  >
                    <FileCode2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Copy JSON</span>
                  </button>
                  <button
                    onClick={() => {
                      const blob = new Blob([rawJson], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      const jsonFileName = `${form.ref_number}_bir_eis.json`;
                      a.download = jsonFileName;
                      a.click();
                      URL.revokeObjectURL(url);
                      showToast({
                        title: 'JSON File Downloaded',
                        message: `Saved official BIR EIS JSON file (${jsonFileName})!`,
                        type: 'success',
                      });
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Download .JSON</span>
                  </button>
                </div>
              </div>
              <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed max-h-[50vh]">
                {rawJson}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => autoExportInvoicePdf(form, settings)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-2xs cursor-pointer"
              title="Download high-resolution A4 BIR Sales Invoice PDF"
            >
              <FileDown className="w-4 h-4" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={() => exportSingleInvoiceToExcel(form, settings)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-700 font-semibold text-xs transition shadow-2xs cursor-pointer"
              title="Export this invoice to Microsoft Excel (.xlsx) form layout"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={() => onPrint(form)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold text-xs transition shadow-2xs cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Print</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onSave(form)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold text-xs transition shadow-2xs cursor-pointer"
            >
              <Save className="w-4 h-4 text-emerald-600" />
              <span>Save Changes</span>
            </button>

            <button
              onClick={() => onTransmit(form.id)}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition shadow-sm active:scale-95 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Transmit to BIR EIS</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
