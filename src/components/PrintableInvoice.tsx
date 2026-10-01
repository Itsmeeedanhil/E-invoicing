import React, { useState } from 'react';
import { X, Printer, ShieldCheck, FileSpreadsheet, FileDown } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Invoice, CompanySettings } from '../types';
import {
  exportInvoiceToPdf,
  exportSingleInvoiceToExcel,
  autoExportInvoicePdf,
  decodeHtml,
  formatPHP,
} from '../utils/exportUtils';

interface PrintableInvoiceProps {
  invoice: Invoice | null;
  settings: CompanySettings | null;
  onClose: () => void;
}

export const PrintableInvoice: React.FC<PrintableInvoiceProps> = ({
  invoice,
  settings,
  onClose,
}) => {
  if (!invoice) return null;

  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = '';
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 500);
  };

  const handleDownloadPdf = () => {
    setIsExportingPdf(true);
    try {
      autoExportInvoicePdf(invoice, settings);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const formatPHP = (val: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(val);
  };

  // BIR QR Code payload format
  const qrPayload = JSON.stringify({
    bir_eis: '1.0',
    tin: settings?.tin,
    buyer_tin: invoice.customer_tin,
    invoice_no: invoice.ref_number,
    date: invoice.txn_date,
    gross: invoice.gross_amount,
    vat: invoice.vat_amount,
    net: invoice.net_amount_payable,
    ack: invoice.eis_ack_number || 'EIS-PENDING',
    hash: invoice.eis_hash || 'SHA256-UNCOMMITTED',
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto printable-modal-backdrop">
      {/* Container */}
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[96vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 printable-modal-card">
        {/* Action Header - Hidden during print */}
        <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50 no-print">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Official BIR Sales Invoice Preview (BIR RR 8-2022 Compliant)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-xs cursor-pointer disabled:opacity-50"
              title="Download high-resolution A4 PDF document"
            >
              <FileDown className="w-4 h-4" />
              <span>{isExportingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
            </button>

            <button
              onClick={() => exportSingleInvoiceToExcel(invoice, settings)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-700 font-semibold text-xs transition shadow-xs cursor-pointer"
              title="Export this invoice to Microsoft Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Area (A4 / Standard Letter Format) */}
        <div className="p-8 overflow-y-auto bg-white text-slate-900 font-sans printable-paper-wrapper">
          <table className="print-master-page-table w-full border-collapse">
            <thead className="hidden print:table-header-group">
              <tr>
                <td className="h-[10mm] p-0 m-0 border-0 bg-transparent"></td>
              </tr>
            </thead>
            <tfoot className="hidden print:table-footer-group">
              <tr>
                <td className="h-[10mm] p-0 m-0 border-0 bg-transparent"></td>
              </tr>
            </tfoot>
            <tbody>
              <tr>
                <td className="p-0 m-0 border-0">
                  <div id="printable-bir-invoice" className="max-w-3xl mx-auto border-2 border-slate-900 p-6 space-y-6 text-xs bg-white text-slate-900 shadow-sm">
                    {/* Registered Header */}
                    <div className="text-center space-y-1 border-b-2 border-slate-900 pb-4 print-avoid-break">
                      <h1 className="text-lg font-black tracking-wide uppercase">
                        {decodeHtml(settings?.business_name) || 'REGISTERED BUSINESS NAME'}
                      </h1>
                      {settings?.trade_name && (
                        <p className="text-xs font-bold text-slate-700">
                          Trade Name: {decodeHtml(settings.trade_name)}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-700 max-w-lg mx-auto">
                        {decodeHtml(settings?.address) || 'Registered Head Office Address, Philippines'}
                      </p>
                      <div className="text-xs font-mono font-bold flex items-center justify-center gap-4 pt-1">
                        <span>TIN: {settings?.tin || '000-000-000-00000'}</span>
                        <span>•</span>
                        <span>Branch: {settings?.branch_code || '00000'}</span>
                        <span>•</span>
                        <span>RDO: {settings?.rdo || '047'}</span>
                      </div>
                      <p className="text-[10px] uppercase font-bold text-emerald-800 pt-0.5">
                        {settings?.is_vat_registered ? 'VAT REGISTERED ENTERPRISE' : 'NON-VAT REGISTERED'}
                      </p>
                    </div>

                    {/* Document Title & Reference Bar */}
                    <div className="flex items-center justify-between border-b border-slate-400 pb-3 print-avoid-break">
                      <div>
                        <h2 className="text-base font-black tracking-wider text-slate-950 uppercase">
                          {invoice.invoice_type.replace('_', ' ')}
                        </h2>
                        <span className="text-[10px] text-slate-600 font-semibold">
                          (BIR CAS Certified Document)
                        </span>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-mono font-black text-red-600">
                          NO: {invoice.ref_number}
                        </div>
                        <div className="text-[11px] font-semibold text-slate-700">
                          Date: {invoice.txn_date}
                        </div>
                      </div>
                    </div>

                    {/* Buyer / Customer Info Section */}
                    <div className="grid grid-cols-2 gap-4 border-b border-slate-400 pb-4 text-[11px] print-avoid-break">
                      <div className="space-y-1">
                        <div className="flex">
                          <span className="w-24 font-bold text-slate-700">SOLD TO:</span>
                          <span className="font-bold text-slate-900 uppercase">{decodeHtml(invoice.customer_name)}</span>
                        </div>
                        <div className="flex">
                          <span className="w-24 font-bold text-slate-700">TIN:</span>
                          <span className="font-mono font-bold">{invoice.customer_tin || 'N/A'}</span>
                        </div>
                        <div className="flex">
                          <span className="w-24 font-bold text-slate-700">BRANCH:</span>
                          <span className="font-mono">{invoice.customer_branch || '00000'}</span>
                        </div>
                        <div className="flex">
                          <span className="w-24 font-bold text-slate-700">ADDRESS:</span>
                          <span className="text-slate-800">{decodeHtml(invoice.customer_address)}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex">
                          <span className="w-28 font-bold text-slate-700">BUS. STYLE:</span>
                          <span>{decodeHtml(invoice.customer_business_style) || 'General Commercial'}</span>
                        </div>
                        <div className="flex">
                          <span className="w-28 font-bold text-slate-700">TERMS / DUE:</span>
                          <span>{invoice.due_date}</span>
                        </div>
                        {invoice.discount_type && (
                          <div className="flex text-purple-900 font-bold">
                            <span className="w-28">DISCOUNT ID:</span>
                            <span>{invoice.discount_id_no} ({invoice.discount_type})</span>
                          </div>
                        )}
                        {invoice.qb_txn_id && (
                          <div className="flex font-mono text-[10px] text-slate-500">
                            <span className="w-28">QB TXN ID:</span>
                            <span>{invoice.qb_txn_id}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Line Items Table */}
                    <table className="w-full border-collapse text-[11px]">
                      <thead>
                        <tr className="border-y-2 border-slate-900 bg-slate-100 text-slate-900 font-bold uppercase">
                          <th className="py-2 px-2 text-left w-12">Qty</th>
                          <th className="py-2 px-2 text-left">Item Description</th>
                          <th className="py-2 px-2 text-right w-24">Unit Price</th>
                          <th className="py-2 px-2 text-center w-12">Tax</th>
                          <th className="py-2 px-2 text-right w-28">Amount (PHP)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-300">
                        {invoice.items.map((it) => {
                          const itemName = it.item_name && it.item_name !== 'Merchandise / Service'
                            ? it.item_name
                            : it.description || 'General Merchandise';
                          const itemDesc = it.description && it.description !== itemName && it.item_name !== 'Merchandise / Service'
                            ? it.description
                            : '';

                          return (
                            <tr key={it.id} className="align-top print-row-avoid-break">
                              <td className="py-2 px-2 font-mono font-semibold">{it.qty}</td>
                              <td className="py-2 px-2">
                                <div className="font-bold text-slate-900">{decodeHtml(itemName)}</div>
                                {itemDesc && (
                                  <div className="text-[10px] text-slate-600">{decodeHtml(itemDesc)}</div>
                                )}
                              </td>
                              <td className="py-2 px-2 text-right font-mono">{formatPHP(it.unit_price)}</td>
                              <td className="py-2 px-2 text-center font-bold text-[10px]">
                                {it.tax_type === 'VAT_12' ? 'V' : it.tax_type === 'ZERO_RATED' ? 'Z' : 'E'}
                              </td>
                              <td className="py-2 px-2 text-right font-mono font-bold">
                                {formatPHP(it.amount)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* Bottom Section: Tax Breakdown Box & QR Code */}
                    <div className="grid grid-cols-12 gap-4 border-t-2 border-slate-900 pt-4 text-[11px] print-avoid-break">
                      {/* Left Column: BIR Statutory Tax Breakdown Box */}
                      <div className="col-span-7 space-y-1 border border-slate-400 p-2.5 bg-slate-50">
                        <div className="font-bold uppercase text-[10px] text-slate-700 border-b border-slate-300 pb-1 mb-1">
                          VAT & Sales Summary Breakdown
                        </div>
                        <div className="flex justify-between">
                          <span>VATable Sales (12%):</span>
                          <span className="font-mono font-semibold">{formatPHP(invoice.vatable_sales)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>VAT-Exempt Sales:</span>
                          <span className="font-mono font-semibold">{formatPHP(invoice.vat_exempt_sales)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Zero-Rated Sales:</span>
                          <span className="font-mono font-semibold">{formatPHP(invoice.zero_rated_sales)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-slate-900">
                          <span>12% Output VAT:</span>
                          <span className="font-mono">{formatPHP(invoice.vat_amount)}</span>
                        </div>
                        {invoice.discount_amount > 0 && (
                          <div className="flex justify-between text-purple-900 font-semibold">
                            <span>Less: SC / PWD 20% Discount:</span>
                            <span className="font-mono">-{formatPHP(invoice.discount_amount)}</span>
                          </div>
                        )}
                        {invoice.withholding_tax_amount > 0 && (
                          <div className="flex justify-between text-amber-900 font-semibold">
                            <span>Less: Creditable Withholding Tax (2307):</span>
                            <span className="font-mono">-{formatPHP(invoice.withholding_tax_amount)}</span>
                          </div>
                        )}
                      </div>

                      {/* Right Column: Total Net Due + QR Code */}
                      <div className="col-span-5 flex flex-col justify-between items-end text-right">
                        <div className="w-full space-y-1">
                          <div className="text-[10px] uppercase font-bold text-slate-600">Total Amount Due</div>
                          <div className="text-lg font-black font-mono text-slate-950 bg-slate-100 p-2 border border-slate-300 text-right">
                            {formatPHP(invoice.net_amount_payable)}
                          </div>
                        </div>

                        {/* Scannable BIR QR Code */}
                        <div className="flex items-center gap-2 pt-2">
                          <div className="text-[9px] text-slate-500 text-right font-mono">
                            <p className="font-bold text-emerald-800">BIR EIS SCANNABLE</p>
                            <p>Ack: {invoice.eis_ack_number || 'PENDING'}</p>
                          </div>
                          <QRCodeSVG value={qrPayload} size={56} level="M" />
                        </div>
                      </div>
                    </div>

                    {/* Mandatory BIR Footer & Permit to Use (PTU) Details */}
                    <div className="border-t border-slate-400 pt-3 text-[9px] text-slate-600 space-y-1 text-center font-sans print-avoid-break">
                      <div className="grid grid-cols-2 gap-2 text-left font-mono">
                        <div>BIR CAS PTU NO: <span className="font-bold text-slate-800">{settings?.cas_ptu_no || 'CAS-2024-008921-MA'}</span></div>
                        <div>BIR ACCN NO: <span className="font-bold text-slate-800">{settings?.accn_no || 'ACCN-047-2024-005612'}</span></div>
                        <div>POS MACHINE ID: <span className="font-bold text-slate-800">{settings?.pos_machine_id || 'POS-01'}</span></div>
                        <div>DATE ISSUED / VALID UNTIL: <span className="font-bold text-slate-800">{settings?.valid_until || '2029-12-31'}</span></div>
                      </div>
                      <p className="font-bold uppercase text-slate-800 pt-1">
                        "THIS INVOICE SHALL BE VALID FOR FIVE (5) YEARS FROM THE DATE OF THE PERMIT TO USE"
                      </p>
                      <p className="italic text-slate-500">
                        "THIS DOCUMENT IS NOT VALID FOR CLAIM OF INPUT TAX IF NOT PROPERLY FILLED UP"
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
