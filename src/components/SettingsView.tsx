import React, { useState } from 'react';
import {
  Settings,
  Save,
  Building2,
  ShieldCheck,
  Globe,
  Database,
  Layers,
  KeyRound,
  FileSpreadsheet,
  Eye,
  EyeOff,
} from 'lucide-react';
import { CompanySettings } from '../types';

interface SettingsViewProps {
  settings: CompanySettings | null;
  onSaveSettings: (settings: CompanySettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
}) => {
  const defaultSettings: CompanySettings = {
    tin: '123-456-789-00000',
    branch_code: '00000',
    business_name: 'MANILA ENTERPRISE SOLUTIONS CORP.',
    trade_name: 'MES CORP',
    business_style: 'COMMERCIAL SOFTWARE & TRADING',
    address: 'Unit 1802 Ayala Triangle Tower, Makati City, Metro Manila, 1226 Philippines',
    rdo: '047',
    is_vat_registered: true,
    cas_ptu_no: 'CAS-2024-008921-MA',
    accn_no: 'ACCN-047-2024-005612',
    pos_machine_id: 'POS-01-MKT',
    valid_until: '2029-12-31',
    qb_company_path: 'C:\\Users\\Public\\Documents\\Intuit\\QuickBooks\\Company Files\\Manila_Enterprise.qbw',
    access_db_path: 'C:\\Users\\Tetsuro\\Desktop\\E-invoice\\data\\BIR_EIS_Database.accdb',
    eis_api_url: 'https://eis-cert.bir.gov.ph/api/v1/invoices',
    eis_client_id: 'CLIENT_BIR_EIS_99201',
    eis_client_secret: 'sec_live_9a87f4b82c1',
    eis_environment: 'sandbox',
    auto_sync_qb: false,
  };

  const [form, setForm] = useState<CompanySettings>(settings || defaultSettings);
  const [showSecret, setShowSecret] = useState(false);
  const [saved, setSaved] = useState(false);

  React.useEffect(() => {
    if (settings) {
      setForm(settings);
    }
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            BIR Compliance & System Configuration
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure Philippine Tax Reform (TRAIN Law), CAS Permit to Use, QuickBooks path, and MS Access database.
          </p>
        </div>

        <button
          type="submit"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-xs transition shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{saved ? 'Saved Successfully!' : 'Save All Settings'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Taxpayer / Seller Registered Profile */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              1. BIR Taxpayer / Seller Profile
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-600 block mb-1 font-medium">Registered Business Name (as in BIR Form 2303)</label>
              <input
                type="text"
                value={form.business_name}
                onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:border-emerald-500 focus:bg-white focus:outline-none transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-600 block mb-1 font-medium">Trade / Doing Business As Name</label>
                <input
                  type="text"
                  value={form.trade_name}
                  onChange={(e) => setForm({ ...form, trade_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none transition"
                />
              </div>
              <div>
                <label className="text-slate-600 block mb-1 font-medium">Business Line / Style</label>
                <input
                  type="text"
                  value={form.business_style}
                  onChange={(e) => setForm({ ...form, business_style: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="text-slate-600 block mb-1 font-medium">Taxpayer TIN (XXX-XXX-XXX-XXXXX)</label>
                <input
                  type="text"
                  value={form.tin}
                  onChange={(e) => setForm({ ...form, tin: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-emerald-700 font-mono font-bold focus:border-emerald-500 focus:bg-white focus:outline-none transition"
                />
              </div>
              <div>
                <label className="text-slate-600 block mb-1 font-medium">Branch Code</label>
                <input
                  type="text"
                  value={form.branch_code}
                  onChange={(e) => setForm({ ...form, branch_code: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-mono focus:border-emerald-500 focus:bg-white focus:outline-none transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="text-slate-600 block mb-1 font-medium">Registered Address</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none transition"
                />
              </div>
              <div>
                <label className="text-slate-600 block mb-1 font-medium">RDO Code</label>
                <input
                  type="text"
                  value={form.rdo}
                  onChange={(e) => setForm({ ...form, rdo: e.target.value })}
                  placeholder="e.g. 047"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-mono focus:border-emerald-500 focus:bg-white focus:outline-none transition"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_vat_registered}
                  onChange={(e) => setForm({ ...form, is_vat_registered: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20 w-4 h-4 cursor-pointer"
                />
                <span className="text-slate-800 font-semibold">VAT-Registered Enterprise (12% Output VAT)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Section 2: CAS Certification & Permit to Use */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              2. BIR CAS / PTU Permit & EIS Credentials
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-600 block mb-1 font-medium">CAS Permit to Use (PTU) #</label>
                <input
                  type="text"
                  value={form.cas_ptu_no}
                  onChange={(e) => setForm({ ...form, cas_ptu_no: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-emerald-700 font-mono font-bold focus:border-emerald-500 focus:bg-white focus:outline-none transition"
                />
              </div>
              <div>
                <label className="text-slate-600 block mb-1 font-medium">ACCN Number</label>
                <input
                  type="text"
                  value={form.accn_no}
                  onChange={(e) => setForm({ ...form, accn_no: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-mono focus:border-emerald-500 focus:bg-white focus:outline-none transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-600 block mb-1 font-medium">POS / Terminal Machine ID</label>
                <input
                  type="text"
                  value={form.pos_machine_id}
                  onChange={(e) => setForm({ ...form, pos_machine_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-mono focus:border-emerald-500 focus:bg-white focus:outline-none transition"
                />
              </div>
              <div>
                <label className="text-slate-600 block mb-1 font-medium">Permit Valid Until</label>
                <input
                  type="date"
                  value={form.valid_until}
                  onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-600 block mb-1 font-medium">BIR EIS API Gateway Endpoint</label>
              <input
                type="text"
                value={form.eis_api_url}
                onChange={(e) => setForm({ ...form, eis_api_url: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-mono focus:border-emerald-500 focus:bg-white focus:outline-none transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-600 block mb-1 font-medium">EIS Client App ID</label>
                <input
                  type="text"
                  value={form.eis_client_id}
                  onChange={(e) => setForm({ ...form, eis_client_id: e.target.value })}
                  placeholder="e.g. CLIENT_BIR_EIS_99201"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-mono focus:border-emerald-500 focus:bg-white focus:outline-none transition"
                />
              </div>
              <div>
                <label className="text-slate-600 block mb-1 font-medium">EIS Client Secret / API Key</label>
                <div className="relative">
                  <input
                    type={showSecret ? "text" : "password"}
                    value={form.eis_client_secret}
                    onChange={(e) => setForm({ ...form, eis_client_secret: e.target.value })}
                    placeholder="e.g. sec_live_9a87f4b82c1"
                    className="w-full px-3 py-2 pr-10 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-mono focus:border-emerald-500 focus:bg-white focus:outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition"
                    title={showSecret ? "Hide Secret Key" : "Show Secret Key"}
                  >
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="text-slate-600 block mb-1 font-medium">EIS Environment Mode</label>
              <select
                value={form.eis_environment}
                onChange={(e) => setForm({ ...form, eis_environment: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-semibold focus:border-emerald-500 focus:bg-white focus:outline-none transition cursor-pointer"
              >
                <option value="sandbox">Sandbox / EIS Certification Environment (Testing)</option>
                <option value="production">Production Environment (Live BIR EIS Transmission)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: QuickBooks & MS Access File Storage */}
        <div className="col-span-1 md:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Layers className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              3. Integration Paths & Database Locations
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-600 block mb-1 font-medium">QuickBooks Desktop Company File (.QBW)</label>
              <input
                type="text"
                value={form.qb_company_path}
                onChange={(e) => setForm({ ...form, qb_company_path: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-mono focus:border-emerald-500 focus:bg-white focus:outline-none transition"
              />
            </div>

            <div>
              <label className="text-slate-600 block mb-1 font-medium">MS Access Local Database File (.accdb)</label>
              <input
                type="text"
                value={form.access_db_path}
                onChange={(e) => setForm({ ...form, access_db_path: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-mono focus:border-emerald-500 focus:bg-white focus:outline-none transition"
              />
            </div>

            <div className="col-span-1 md:col-span-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.auto_sync_qb}
                  onChange={(e) => setForm({ ...form, auto_sync_qb: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20 w-4 h-4 cursor-pointer"
                />
                <span className="text-slate-800 font-semibold">
                  Enable Automatic QuickBooks Desktop Background Synchronization on Startup
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
