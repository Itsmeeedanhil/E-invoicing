import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { BirComplianceCenter } from './components/BirComplianceCenter';
import { QuickBooksStudio } from './components/QuickBooksStudio';
import { AccessDbManager } from './components/AccessDbManager';
import { SettingsView } from './components/SettingsView';
import { AuditLogView } from './components/AuditLogView';
import { InvoiceDetailModal } from './components/InvoiceDetailModal';
import { PrintableInvoice } from './components/PrintableInvoice';
import { TransmissionModal } from './components/TransmissionModal';
import { UserManualView } from './components/UserManualView';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  X,
  FileSpreadsheet,
  FileDown,
} from 'lucide-react';
import {
  CompanySettings,
  Invoice,
  TaxMapping,
  EisTransmission,
  AuditLog,
  AccessDbStatus,
  QbConnectionStatus,
} from './types';
import { api } from './services/api';
import { ToastPayload, showToast as triggerToast } from './utils/toast';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [taxMappings, setTaxMappings] = useState<TaxMapping[]>([]);
  const [transmissions, setTransmissions] = useState<EisTransmission[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [qbStatus, setQbStatus] = useState<QbConnectionStatus | null>(null);
  const [accessStatus, setAccessStatus] = useState<AccessDbStatus | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [isTestingQb, setIsTestingQb] = useState(false);
  const [isProcessingAccess, setIsProcessingAccess] = useState(false);

  // Modals state
  const [inspectInvoice, setInspectInvoice] = useState<Invoice | null>(null);
  const [printableInvoice, setPrintableInvoice] = useState<Invoice | null>(null);
  const [transmissionResult, setTransmissionResult] = useState<EisTransmission | null>(null);
  const [activeToast, setActiveToast] = useState<ToastPayload | null>(null);

  const showToast = (payload: string | ToastPayload) => {
    triggerToast(payload);
  };

  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent<ToastPayload>;
      if (customEvent.detail) {
        setActiveToast(customEvent.detail);
      }
    };

    window.addEventListener('app-toast', handleToastEvent);
    return () => {
      window.removeEventListener('app-toast', handleToastEvent);
    };
  }, []);

  useEffect(() => {
    if (!activeToast) return;
    const duration = activeToast.duration || 4500;
    const timer = setTimeout(() => {
      setActiveToast(null);
    }, duration);
    return () => clearTimeout(timer);
  }, [activeToast]);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      // Load local database data instantly
      const [s, invs, tm, tr, logs, acc] = await Promise.all([
        api.getCompanySettings(),
        api.getAllInvoices(),
        api.getTaxMappings(),
        api.getTransmissions(),
        api.getAuditLogs(),
        api.getAccessDbStatus(),
      ]);
      setSettings(s);
      setInvoices(invs);
      setTaxMappings(tm);
      setTransmissions(tr);
      setAuditLogs(logs);
      setAccessStatus(acc);
      setIsLoading(false);

      // Check QuickBooks status in background without blocking UI
      api.testQuickBooksConnection().then((qb) => {
        setQbStatus(qb);
      }).catch((err) => {
        console.warn('QuickBooks background test:', err);
      });
    } catch (err) {
      console.error('Failed to load application data:', err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleSyncQuickBooks = async () => {
    setIsSyncing(true);
    try {
      const synced = await api.syncQuickBooksInvoices();
      const updatedInvs = await api.getAllInvoices();
      const updatedLogs = await api.getAuditLogs();
      setInvoices(updatedInvs);
      setAuditLogs(updatedLogs);
      showToast(`Successfully synced and mapped ${synced.length} invoices from QuickBooks Desktop!`);
    } catch (err) {
      showToast(`QuickBooks Sync error: ${err}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTestQb = async () => {
    setIsTestingQb(true);
    try {
      const res = await api.testQuickBooksConnection();
      setQbStatus(res);
      showToast(res.message);
    } catch (err) {
      showToast(`QuickBooks test failed: ${err}`);
    } finally {
      setIsTestingQb(false);
    }
  };

  const handleTransmitInvoices = async (ids: string[]) => {
    if (ids.length === 0) return;
    setIsTransmitting(true);
    try {
      const result = await api.transmitInvoicesToBirEis(ids);
      setTransmissionResult(result);
      const updatedInvs = await api.getAllInvoices();
      const updatedTr = await api.getTransmissions();
      const updatedLogs = await api.getAuditLogs();
      setInvoices(updatedInvs);
      setTransmissions(updatedTr);
      setAuditLogs(updatedLogs);
      showToast(`Transmitted ${ids.length} invoices to BIR EIS! Ack: ${result.ack_number}`);
    } catch (err) {
      showToast(`BIR EIS Transmission error: ${err}`);
    } finally {
      setIsTransmitting(false);
    }
  };

  const handleTransmitQueued = () => {
    const queuedIds = invoices
      .filter((i) => i.eis_status === 'QUEUED' || i.eis_status === 'NOT_SENT')
      .map((i) => i.id);
    handleTransmitInvoices(queuedIds);
  };

  const handleSaveInvoice = async (inv: Invoice) => {
    try {
      await api.saveInvoice(inv);
      const updated = await api.getAllInvoices();
      const updatedLogs = await api.getAuditLogs();
      setInvoices(updated);
      setAuditLogs(updatedLogs);
      setInspectInvoice(null);
      showToast(`Invoice ${inv.ref_number} saved and recalculated for BIR EIS!`);
    } catch (err) {
      showToast(`Failed to save invoice: ${err}`);
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    try {
      await api.deleteInvoice(id);
      const updated = await api.getAllInvoices();
      const updatedLogs = await api.getAuditLogs();
      setInvoices(updated);
      setAuditLogs(updatedLogs);
      showToast('Invoice deleted successfully.');
    } catch (err) {
      showToast(`Failed to delete invoice: ${err}`);
    }
  };

  const handleSaveSettings = async (newSettings: CompanySettings) => {
    try {
      await api.saveCompanySettings(newSettings);
      setSettings(newSettings);
      const updatedLogs = await api.getAuditLogs();
      setAuditLogs(updatedLogs);
      showToast('BIR Company Settings & CAS configuration saved!');
    } catch (err) {
      showToast(`Failed to save settings: ${err}`);
    }
  };

  const handleSaveTaxMappings = async (mappings: TaxMapping[]) => {
    try {
      await api.saveTaxMappings(mappings);
      setTaxMappings(mappings);
      showToast('QuickBooks tax code mappings updated!');
    } catch (err) {
      showToast(`Failed to save tax mappings: ${err}`);
    }
  };

  const handleInitializeAccess = async () => {
    setIsProcessingAccess(true);
    try {
      const res = await api.initializeMsAccessDb();
      const acc = await api.getAccessDbStatus();
      setAccessStatus(acc);
      showToast(res);
    } catch (err) {
      showToast(`MS Access error: ${err}`);
    } finally {
      setIsProcessingAccess(false);
    }
  };

  const handleExportAccess = async () => {
    setIsProcessingAccess(true);
    try {
      const res = await api.exportToMsAccess();
      const acc = await api.getAccessDbStatus();
      setAccessStatus(acc);
      showToast(res);
    } catch (err) {
      showToast(`MS Access export error: ${err}`);
    } finally {
      setIsProcessingAccess(false);
    }
  };

  const handleNewInvoice = () => {
    const today = new Date().toISOString().split('T')[0];
    const newInv: Invoice = {
      id: 'inv-' + Date.now(),
      ref_number: `SI-2026-${String(invoices.length + 101).padStart(6, '0')}`,
      qb_txn_id: null,
      customer_name: 'NEW CORPORATE BUYER CORP.',
      customer_tin: '000-111-222-00000',
      customer_branch: '00000',
      customer_address: 'Makati Central Business District, Philippines',
      customer_business_style: 'COMMERCIAL TRADING',
      txn_date: today,
      due_date: today,
      invoice_type: 'SALES_INVOICE',
      gross_amount: 11200,
      vatable_sales: 10000,
      vat_exempt_sales: 0,
      zero_rated_sales: 0,
      non_vat_sales: 0,
      vat_amount: 1200,
      discount_amount: 0,
      discount_type: null,
      discount_id_no: null,
      withholding_tax_rate: 0.02,
      withholding_tax_amount: 200,
      net_amount_payable: 11000,
      status: 'VALIDATED',
      eis_status: 'NOT_SENT',
      eis_ack_number: null,
      eis_hash: null,
      eis_transmitted_at: null,
      eis_error_message: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: [
        {
          id: 'item-' + Date.now(),
          invoice_id: 'inv-' + Date.now(),
          item_name: 'Consulting & Software Services',
          description: 'BIR EIS Compliant Deliverable',
          qty: 1,
          unit_price: 10000,
          amount: 10000,
          tax_type: 'VAT_12',
          discount_percent: 0,
          is_senior_pwd: false,
        },
      ],
    };
    setInspectInvoice(newInv);
  };

  const pendingCount = invoices.filter(
    (i) => i.eis_status === 'QUEUED' || i.eis_status === 'NOT_SENT'
  ).length;

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 text-slate-900 overflow-hidden select-none">
      {/* Top Header */}
      <Header
        settings={settings}
        qbStatus={qbStatus}
        accessStatus={accessStatus}
        onRefreshAll={loadAllData}
        isLoading={isLoading}
      />

      {/* Prominent High-Visibility Toast Prompt */}
      {activeToast && (
        <div className="fixed top-20 right-6 z-[9999] max-w-md w-auto animate-in fade-in slide-in-from-top-4 duration-200 pointer-events-auto no-print">
          <div
            className={`px-4 py-3.5 rounded-2xl shadow-2xl border flex items-start gap-3 backdrop-blur-md transition-all ${
              activeToast.type === 'error'
                ? 'bg-rose-950/95 border-rose-600/60 text-white shadow-rose-950/40'
                : activeToast.type === 'warning'
                ? 'bg-amber-950/95 border-amber-500/60 text-white shadow-amber-950/40'
                : activeToast.type === 'info'
                ? 'bg-slate-900/95 border-blue-500/60 text-white shadow-slate-950/50'
                : 'bg-slate-900/95 border-emerald-500/60 text-white shadow-slate-950/50'
            }`}
          >
            {/* Status Icon */}
            <div className="shrink-0 mt-0.5">
              {activeToast.type === 'error' && (
                <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                </div>
              )}
              {activeToast.type === 'warning' && (
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              )}
              {activeToast.type === 'info' && (
                <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Info className="w-4 h-4" />
                </div>
              )}
              {(!activeToast.type || activeToast.type === 'success') && (
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* Content Body */}
            <div className="flex-1 min-w-[200px] max-w-sm">
              {activeToast.title && (
                <div className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5 mb-0.5">
                  <span>{activeToast.title}</span>
                </div>
              )}
              <div className="text-xs font-medium text-slate-200 leading-snug break-words">
                {activeToast.message}
              </div>
            </div>

            {/* Dismiss Close Button */}
            <button
              onClick={() => setActiveToast(null)}
              className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Close notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace Body */}
      <div id="app-main-layout" className="flex flex-1 overflow-hidden no-print">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          pendingCount={pendingCount}
        />

        {/* Dynamic Content View Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-100/70">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardView
                invoices={invoices}
                settings={settings}
                onSyncQuickBooks={handleSyncQuickBooks}
                onTransmitQueued={handleTransmitQueued}
                onOpenInvoice={(inv) => setInspectInvoice(inv)}
                onExportAccess={handleExportAccess}
                isSyncing={isSyncing}
                isTransmitting={isTransmitting}
              />
            )}

            {activeTab === 'invoices' && (
              <BirComplianceCenter
                invoices={invoices}
                settings={settings}
                onOpenInvoice={(inv) => setInspectInvoice(inv)}
                onPrintInvoice={(inv) => setPrintableInvoice(inv)}
                onTransmitSelected={handleTransmitInvoices}
                onNewInvoice={handleNewInvoice}
                onDeleteInvoice={handleDeleteInvoice}
                isTransmitting={isTransmitting}
              />
            )}

            {activeTab === 'quickbooks' && (
              <QuickBooksStudio
                qbStatus={qbStatus}
                taxMappings={taxMappings}
                settings={settings}
                onTestConnection={handleTestQb}
                onSyncInvoices={handleSyncQuickBooks}
                onSaveTaxMappings={handleSaveTaxMappings}
                isTesting={isTestingQb}
                isSyncing={isSyncing}
              />
            )}

            {activeTab === 'access_db' && (
              <AccessDbManager
                accessStatus={accessStatus}
                invoices={invoices}
                transmissions={transmissions}
                taxMappings={taxMappings}
                auditLogs={auditLogs}
                onInitializeAccess={handleInitializeAccess}
                onExportAccess={handleExportAccess}
                isProcessing={isProcessingAccess}
                initialTable="invoices"
              />
            )}

            {activeTab === 'transmissions' && (
              <AccessDbManager
                accessStatus={accessStatus}
                invoices={invoices}
                transmissions={transmissions}
                taxMappings={taxMappings}
                auditLogs={auditLogs}
                onInitializeAccess={handleInitializeAccess}
                onExportAccess={handleExportAccess}
                isProcessing={isProcessingAccess}
                initialTable="transmissions"
              />
            )}

            {activeTab === 'audit_logs' && (
              <AuditLogView auditLogs={auditLogs} />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                settings={settings}
                onSaveSettings={handleSaveSettings}
              />
            )}

            {activeTab === 'user_manual' && (
              <UserManualView />
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      {inspectInvoice && (
        <InvoiceDetailModal
          invoice={inspectInvoice}
          settings={settings}
          onClose={() => setInspectInvoice(null)}
          onSave={handleSaveInvoice}
          onPrint={(inv) => {
            setInspectInvoice(null);
            setPrintableInvoice(inv);
          }}
          onTransmit={(id) => {
            setInspectInvoice(null);
            handleTransmitInvoices([id]);
          }}
        />
      )}

      {printableInvoice && (
        <PrintableInvoice
          invoice={printableInvoice}
          settings={settings}
          onClose={() => setPrintableInvoice(null)}
        />
      )}

      {transmissionResult && (
        <TransmissionModal
          transmission={transmissionResult}
          onClose={() => setTransmissionResult(null)}
        />
      )}
    </div>
  );
};
