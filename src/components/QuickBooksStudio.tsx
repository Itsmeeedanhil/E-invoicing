import React, { useState } from 'react';
import {
  Layers,
  RefreshCw,
  CheckCircle2,
  Sliders,
  Code2,
  FileCheck,
  Plus,
  Trash2,
  Save,
  HelpCircle,
} from 'lucide-react';
import { QbConnectionStatus, TaxMapping, CompanySettings } from '../types';

interface QuickBooksStudioProps {
  qbStatus: QbConnectionStatus | null;
  taxMappings: TaxMapping[];
  settings: CompanySettings | null;
  onTestConnection: () => void;
  onSyncInvoices: () => void;
  onSaveTaxMappings: (mappings: TaxMapping[]) => void;
  isTesting: boolean;
  isSyncing: boolean;
}

export const QuickBooksStudio: React.FC<QuickBooksStudioProps> = ({
  qbStatus,
  taxMappings = [],
  settings,
  onTestConnection,
  onSyncInvoices,
  onSaveTaxMappings,
  isTesting,
  isSyncing,
}) => {
  const [mappings, setMappings] = useState<TaxMapping[]>(taxMappings || []);
  const [isSaved, setIsSaved] = useState(false);
  const [showXmlModal, setShowXmlModal] = useState(false);

  React.useEffect(() => {
    if (taxMappings && taxMappings.length > 0) {
      setMappings(taxMappings);
    }
  }, [taxMappings]);

  const handleRateChange = (id: string, rate: number) => {
    setMappings(
      mappings.map((m) => (m.id === id ? { ...m, tax_rate: rate } : m))
    );
  };

  const handleBirTypeChange = (id: string, birType: string) => {
    setMappings(
      mappings.map((m) => (m.id === id ? { ...m, bir_tax_type: birType } : m))
    );
  };

  const handleAddMapping = () => {
    const newMapping: TaxMapping = {
      id: 'tm-' + Date.now(),
      qb_tax_code: 'CUSTOM_TAX',
      bir_tax_type: 'VAT_12',
      description: 'Custom Tax Rule',
      tax_rate: 0.12,
    };
    setMappings([...mappings, newMapping]);
  };

  const handleDeleteMapping = (id: string) => {
    setMappings(mappings.filter((m) => m.id !== id));
  };

  const handleSave = () => {
    onSaveTaxMappings(mappings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const sampleQbxml = `<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="13.0"?>
<QBXML>
  <QBXMLMsgsRq onError="stopOnError">
    <InvoiceQueryRq>
      <MaxReturned>50</MaxReturned>
      <IncludeLineItems>true</IncludeLineItems>
      <IncludeLinkedTxns>true</IncludeLinkedTxns>
    </InvoiceQueryRq>
  </QBXMLMsgsRq>
</QBXML>`;

  return (
    <div className="space-y-6">
      {/* Top Banner: Connection & SDK Diagnostics */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  QuickBooks Desktop SDK (QBSDK) Connector
                </h2>
                <span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  COM Bridge Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Target Company File: <span className="font-mono font-medium text-slate-700">{settings?.qb_company_path || 'Default active instance'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onTestConnection}
              disabled={isTesting}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold transition active:scale-95 disabled:opacity-50 flex items-center gap-2 shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-emerald-600' : ''}`} />
              <span>{isTesting ? 'Testing COM...' : 'Test Connection'}</span>
            </button>

            <button
              onClick={onSyncInvoices}
              disabled={isSyncing}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition shadow-sm active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              <Layers className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing Invoices...' : 'Sync Invoices Now'}</span>
            </button>
          </div>
        </div>

        {/* Diagnostics Info Box */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 uppercase text-[10px] font-bold">Live COM State</span>
            <p className={`font-bold mt-1 font-mono text-xs flex items-center gap-1.5 ${qbStatus?.is_connected ? 'text-emerald-700' : 'text-amber-700'}`}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              {qbStatus?.is_connected ? 'Connected to Active Session' : 'Standby (Launch QB)'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 uppercase text-[10px] font-bold">QBSDK COM Class</span>
            <p className="text-slate-800 font-semibold mt-1 font-mono text-xs">
              QBXMLRP2.RequestProcessor (Active)
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 uppercase text-[10px] font-bold">Live Message</span>
            <p className="text-slate-600 mt-1 font-mono text-[11px] truncate" title={qbStatus?.message}>
              {qbStatus?.message || 'Ready for live query.'}
            </p>
          </div>
        </div>

        {/* Live QuickBooks Setup Guide Box */}
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-2 text-slate-700">
          <div className="flex items-center gap-2 text-emerald-800 font-bold">
            <HelpCircle className="w-4 h-4 text-emerald-700" />
            <span>How to Connect to Live QuickBooks Desktop</span>
          </div>
          <ol className="list-decimal pl-5 space-y-1 text-slate-600 text-[11px] leading-relaxed">
            <li>Open <strong className="text-slate-900">QuickBooks Desktop</strong> and log into your company file (.QBW) as Admin.</li>
            <li>Click <strong className="text-slate-900">"Test Connection"</strong> or <strong className="text-slate-900">"Sync Invoices Now"</strong> above.</li>
            <li>In QuickBooks, go to <strong className="text-slate-900">Edit &gt; Preferences &gt; Integrated Applications &gt; Company Preferences</strong> and grant permission to this app.</li>
            <li>All live sales invoices will stream in, calculate 12% VAT / Exempt / Zero-Rated breakdowns, and be ready for BIR transmission.</li>
          </ol>
        </div>
      </div>

      {/* Tax Code Mapping Studio */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900">
                QuickBooks to BIR Tax Code Mapping Matrix
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Configure how QuickBooks sales tax codes automatically convert into Philippine BIR EIS tax classifications (12% VAT, 0% VAT-Exempt, 0% Zero-Rated).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowXmlModal(!showXmlModal)}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
            >
              <Code2 className="w-3.5 h-3.5 text-blue-600" />
              <span>{showXmlModal ? 'Hide QBXML' : 'View QBXML'}</span>
            </button>

            <button
              onClick={handleAddMapping}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span>Add Code</span>
            </button>

            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaved ? 'Saved!' : 'Save Mappings'}</span>
            </button>
          </div>
        </div>

        {/* QBXML Preview Expandable Panel */}
        {showXmlModal && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600 font-mono">
              <span className="font-bold">QBXML InvoiceQueryRq Template</span>
              <span className="text-emerald-700">Targeting QBXMLRP2 COM</span>
            </div>
            <pre className="p-3 rounded-lg bg-white text-slate-800 text-xs font-mono overflow-x-auto border border-slate-200">
              {sampleQbxml}
            </pre>
          </div>
        )}

        {/* Mapping Table */}
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">QuickBooks Tax Code</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Target BIR Classification</th>
                <th className="py-3 px-4 text-right">Tax Rate (%)</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {mappings.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                    <input
                      type="text"
                      value={m.qb_tax_code}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMappings(
                          mappings.map((item) =>
                            item.id === m.id ? { ...item, qb_tax_code: val } : item
                          )
                        );
                      }}
                      className="px-2 py-1 bg-white border border-slate-300 rounded font-mono text-emerald-800 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </td>

                  <td className="py-3 px-4 text-slate-700">
                    <input
                      type="text"
                      value={m.description}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMappings(
                          mappings.map((item) =>
                            item.id === m.id ? { ...item, description: val } : item
                          )
                        );
                      }}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </td>

                  <td className="py-3 px-4">
                    <select
                      value={m.bir_tax_type}
                      onChange={(e) => handleBirTypeChange(m.id, e.target.value)}
                      className="px-2.5 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer font-semibold"
                    >
                      <option value="VAT_12">12% VAT (Vatable Sales)</option>
                      <option value="VAT_EXEMPT">0% VAT-Exempt (Statutory / Senior / PWD)</option>
                      <option value="ZERO_RATED">0% Zero-Rated (PEZA / Direct Export)</option>
                      <option value="NON_VAT">Non-VAT / Creditable Withholding Tax (EWT)</option>
                    </select>
                  </td>

                  <td className="py-3 px-4 text-right font-mono">
                    <input
                      type="number"
                      step="0.01"
                      value={m.tax_rate}
                      onChange={(e) => handleRateChange(m.id, parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-1 bg-white border border-slate-300 rounded font-mono text-right text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </td>

                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleDeleteMapping(m.id)}
                      className="p-1 rounded text-slate-400 hover:text-red-600 transition"
                      title="Delete Mapping"
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
    </div>
  );
};
