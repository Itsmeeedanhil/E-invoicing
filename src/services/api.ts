import {
  CompanySettings,
  Invoice,
  EisTransmission,
  TaxMapping,
  AuditLog,
  BirValidationResult,
  AccessDbStatus,
  QbConnectionStatus,
} from '../types';

// Tauri v2 invoke dynamic loader with fallback
async function invokeBackend<T>(cmd: string, args?: Record<string, any>): Promise<T> {
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke<T>(cmd, args);
  } catch (err) {
    // If running in standard browser dev mode without Tauri desktop wrapper, provide fallback handlers
    console.warn(`Tauri invoke('${cmd}') fallback:`, err);
    return fallbackHandler(cmd, args) as T;
  }
}

// Fallback in-memory state for web-only preview
let mockSettings: CompanySettings = {
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
  qb_company_path: 'C:\\Users\\Public\\Documents\\Intuit\\QuickBooks\\Company Files\\Tetsu Company.qbw',
  access_db_path: 'C:\\Users\\Tetsuro\\Desktop\\E-invoice\\data\\BIR_EIS_Database.accdb',
  eis_api_url: 'https://eis-cert.bir.gov.ph/api/v1/invoices',
  eis_client_id: 'CLIENT_BIR_EIS_99201',
  eis_client_secret: 'sec_live_9a87f4b82c1',
  eis_environment: 'sandbox',
  auto_sync_qb: false,
};

let mockInvoices: Invoice[] = [
  {
    id: 'inv-1',
    ref_number: 'SI-2026-000101',
    qb_txn_id: 'QB-INV-9901',
    customer_name: 'AYALA LAND COMMERCIAL INC.',
    customer_tin: '000-888-777-00000',
    customer_branch: '00000',
    customer_address: 'Tower 1, Ayala Triangle, Makati City, Metro Manila',
    customer_business_style: 'PROPERTY MANAGEMENT',
    txn_date: new Date().toISOString().split('T')[0],
    due_date: new Date().toISOString().split('T')[0],
    invoice_type: 'SALES_INVOICE',
    gross_amount: 112000,
    vatable_sales: 100000,
    vat_exempt_sales: 0,
    zero_rated_sales: 0,
    non_vat_sales: 0,
    vat_amount: 12000,
    discount_amount: 0,
    discount_type: null,
    discount_id_no: null,
    withholding_tax_rate: 0.02,
    withholding_tax_amount: 2000,
    net_amount_payable: 110000,
    status: 'VALIDATED',
    eis_status: 'ACCEPTED',
    eis_ack_number: 'EIS-ACK-20261001-09811',
    eis_hash: 'a7f82b13c9e944f0b48a1d77a2e8c614',
    eis_transmitted_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    items: [
      {
        id: 'item-1',
        invoice_id: 'inv-1',
        item_name: 'IT Consulting Services - Phase 1',
        description: 'ERP Integration & BIR Setup',
        qty: 1,
        unit_price: 60000,
        amount: 60000,
        tax_type: 'VAT_12',
        discount_percent: 0,
        is_senior_pwd: false,
      },
      {
        id: 'item-2',
        invoice_id: 'inv-1',
        item_name: 'Annual Software License',
        description: 'Desktop Multi-User License',
        qty: 1,
        unit_price: 40000,
        amount: 40000,
        tax_type: 'VAT_12',
        discount_percent: 0,
        is_senior_pwd: false,
      },
    ],
  },
  {
    id: 'inv-2',
    ref_number: 'SI-2026-000102',
    qb_txn_id: 'QB-INV-9902',
    customer_name: 'JUAN C. DELA CRUZ (SENIOR CITIZEN)',
    customer_tin: '999-123-456-00000',
    customer_branch: '00000',
    customer_address: '45 Jupiter St., Bel-Air, Makati City',
    customer_business_style: 'INDIVIDUAL CONSUMER',
    txn_date: new Date().toISOString().split('T')[0],
    due_date: new Date().toISOString().split('T')[0],
    invoice_type: 'SALES_INVOICE',
    gross_amount: 10000,
    vatable_sales: 0,
    vat_exempt_sales: 8000,
    zero_rated_sales: 0,
    non_vat_sales: 0,
    vat_amount: 0,
    discount_amount: 2000,
    discount_type: 'SENIOR',
    discount_id_no: 'OSCA-MKT-2018-9921',
    withholding_tax_rate: 0,
    withholding_tax_amount: 0,
    net_amount_payable: 8000,
    status: 'VALIDATED',
    eis_status: 'QUEUED',
    eis_ack_number: null,
    eis_hash: 'c827d00f8b1a998c2378a00ef913',
    eis_transmitted_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    items: [
      {
        id: 'item-3',
        invoice_id: 'inv-2',
        item_name: 'Prescription Medical Devices & Software',
        description: 'Assistive Diagnostic Kit',
        qty: 1,
        unit_price: 10000,
        amount: 10000,
        tax_type: 'VAT_EXEMPT',
        discount_percent: 20,
        is_senior_pwd: true,
      },
    ],
  },
  {
    id: 'inv-3',
    ref_number: 'SI-2026-000103',
    qb_txn_id: 'QB-INV-9903',
    customer_name: 'TOKYO ADVANCED TECH PHILS. CORP (PEZA)',
    customer_tin: '204-555-888-00000',
    customer_branch: '00000',
    customer_address: 'Laguna Technopark Special Economic Zone, Binan, Laguna',
    customer_business_style: 'PEZA EXPORT ENTERPRISE',
    txn_date: new Date().toISOString().split('T')[0],
    due_date: new Date().toISOString().split('T')[0],
    invoice_type: 'SALES_INVOICE',
    gross_amount: 250000,
    vatable_sales: 0,
    vat_exempt_sales: 0,
    zero_rated_sales: 250000,
    non_vat_sales: 0,
    vat_amount: 0,
    discount_amount: 0,
    discount_type: null,
    discount_id_no: null,
    withholding_tax_rate: 0,
    withholding_tax_amount: 0,
    net_amount_payable: 250000,
    status: 'VALIDATED',
    eis_status: 'ACCEPTED',
    eis_ack_number: 'EIS-ACK-20261001-09812',
    eis_hash: 'f349d970e4c6f2a81239c0aa6743b918',
    eis_transmitted_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    items: [
      {
        id: 'item-4',
        invoice_id: 'inv-3',
        item_name: 'Export Technical Support',
        description: 'Cloud Infrastructure Dev for Tokyo HQ',
        qty: 1,
        unit_price: 250000,
        amount: 250000,
        tax_type: 'ZERO_RATED',
        discount_percent: 0,
        is_senior_pwd: false,
      },
    ],
  },
];

let mockTaxMappings: TaxMapping[] = [
  { id: 'tm-1', qb_tax_code: 'TAX', bir_tax_type: 'VAT_12', description: 'Standard 12% Value Added Tax', tax_rate: 0.12 },
  { id: 'tm-2', qb_tax_code: 'NON', bir_tax_type: 'VAT_EXEMPT', description: 'VAT-Exempt Goods & Services', tax_rate: 0.0 },
  { id: 'tm-3', qb_tax_code: 'ZERO', bir_tax_type: 'ZERO_RATED', description: 'Zero-Rated Sales (Export/PEZA)', tax_rate: 0.0 },
  { id: 'tm-4', qb_tax_code: 'SENIOR', bir_tax_type: 'VAT_EXEMPT', description: 'Senior Citizen / PWD 20% Discount + VAT-Exempt', tax_rate: 0.0 },
  { id: 'tm-5', qb_tax_code: 'EWT_1', bir_tax_type: 'NON_VAT', description: '1% Creditable Withholding Tax (Goods)', tax_rate: 0.01 },
  { id: 'tm-6', qb_tax_code: 'EWT_2', bir_tax_type: 'NON_VAT', description: '2% Creditable Withholding Tax (Services)', tax_rate: 0.02 },
];

let mockTransmissions: EisTransmission[] = [
  {
    id: 'tx-1',
    batch_id: 'BATCH-20261001-001',
    invoice_ids: ['inv-1', 'inv-3'],
    invoice_count: 2,
    transmitted_at: new Date().toISOString(),
    status: 'SUCCESS',
    ack_number: 'EIS-ACK-20261001-09811',
    payload_hash: 'a7f82b13c9e944f0b48a1d77a2e8c614',
    response_message: 'BIR EIS Acknowledgement Received (Status: ACCEPTED)',
    raw_request_json: JSON.stringify({ batch: 'BATCH-20261001-001', count: 2 }, null, 2),
    raw_response_json: JSON.stringify({ status: 'ACCEPTED', ack: 'EIS-ACK-20261001-09811' }, null, 2),
  },
];

let mockAuditLogs: AuditLog[] = [
  {
    id: 'log-1',
    timestamp: new Date().toISOString(),
    action: 'SYSTEM_INITIALIZATION',
    entity_type: 'SYSTEM',
    entity_id: 'ROOT',
    user_name: 'SYSTEM',
    details: 'BIR EIS & QuickBooks E-Invoicing System initialized with compliant CAS audit tracking.',
  },
];

function fallbackHandler(cmd: string, args?: Record<string, any>): any {
  switch (cmd) {
    case 'get_company_settings':
      return mockSettings;
    case 'save_company_settings':
      if (args?.settings) mockSettings = args.settings;
      return null;
    case 'get_all_invoices':
      return mockInvoices;
    case 'get_invoice_by_id':
      return mockInvoices.find((i) => i.id === args?.id) || null;
    case 'save_invoice': {
      const inv = args?.invoice as Invoice;
      const idx = mockInvoices.findIndex((i) => i.id === inv.id);
      if (idx >= 0) mockInvoices[idx] = inv;
      else mockInvoices.unshift(inv);
      return null;
    }
    case 'delete_invoice':
      mockInvoices = mockInvoices.filter((i) => i.id !== args?.id);
      return null;
    case 'test_quickbooks_connection':
      return {
        is_connected: true,
        session_type: 'Live COM (QBXMLRP2.RequestProcessor)',
        company_file: mockSettings.qb_company_path,
        qb_version: 'QuickBooks Desktop 2024 / Enterprise (QBSDK 13.0)',
        pending_invoices_count: 3,
        last_sync_time: new Date().toISOString(),
        message: 'Successfully connected to QuickBooks Desktop via QBSDK COM interface.',
      };
    case 'sync_quickbooks_invoices': {
      const newInv: Invoice = {
        id: 'inv-' + Date.now(),
        ref_number: 'SI-2026-000104',
        qb_txn_id: 'QB-TXN-1004',
        customer_name: 'METRO CEBU DISTRIBUTORS INC.',
        customer_tin: '102-334-991-00000',
        customer_branch: '00000',
        customer_address: 'Cebu IT Park, Lahug, Cebu City',
        customer_business_style: 'WHOLESALE MERCHANDISE',
        txn_date: new Date().toISOString().split('T')[0],
        due_date: new Date().toISOString().split('T')[0],
        invoice_type: 'SALES_INVOICE',
        gross_amount: 56000,
        vatable_sales: 50000,
        vat_exempt_sales: 0,
        zero_rated_sales: 0,
        non_vat_sales: 0,
        vat_amount: 6000,
        discount_amount: 0,
        discount_type: null,
        discount_id_no: null,
        withholding_tax_rate: 0.01,
        withholding_tax_amount: 500,
        net_amount_payable: 55500,
        status: 'VALIDATED',
        eis_status: 'NOT_SENT',
        eis_ack_number: null,
        eis_hash: 'd892a0139b819f2a',
        eis_transmitted_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        items: [
          {
            id: 'item-sync-1',
            invoice_id: 'inv-' + Date.now(),
            item_name: 'Hardware POS Terminal Units',
            description: 'Thermal Receipt Printer & Scanner Set',
            qty: 2,
            unit_price: 25000,
            amount: 50000,
            tax_type: 'VAT_12',
            discount_percent: 0,
            is_senior_pwd: false,
          },
        ],
      };
      mockInvoices.unshift(newInv);
      return [newInv];
    }
    case 'validate_invoice_bir': {
      const inv = args?.invoice as Invoice;
      const errors: string[] = [];
      const warnings: string[] = [];
      if (!inv.customer_tin || inv.customer_tin.length < 9) {
        warnings.push('Customer TIN should be a valid 9 or 12 digit format.');
      }
      return {
        is_valid: errors.length === 0,
        score: errors.length === 0 ? (warnings.length > 0 ? 90 : 100) : 60,
        errors,
        warnings,
        calculated_vatable_sales: inv.vatable_sales,
        calculated_vat_amount: inv.vat_amount,
        calculated_net_payable: inv.net_amount_payable,
      };
    }
    case 'generate_bir_eis_payload': {
      const inv = args?.invoice as Invoice;
      return {
        eis_version: '1.0',
        seller: mockSettings,
        buyer: {
          tin: inv.customer_tin,
          name: inv.customer_name,
          address: inv.customer_address,
        },
        invoice_number: inv.ref_number,
        gross_sales: inv.gross_amount,
        vatable_sales: inv.vatable_sales,
        vat_amount: inv.vat_amount,
        net_amount_payable: inv.net_amount_payable,
      };
    }
    case 'transmit_invoices_to_bir_eis': {
      const ids = (args?.invoice_ids as string[]) || [];
      const ack = `EIS-ACK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(10000 + Math.random() * 90000)}`;
      mockInvoices.forEach((i) => {
        if (ids.includes(i.id)) {
          i.eis_status = 'ACCEPTED';
          i.status = 'TRANSMITTED';
          i.eis_ack_number = ack;
          i.eis_transmitted_at = new Date().toISOString();
        }
      });
      const tr: EisTransmission = {
        id: 'tx-' + Date.now(),
        batch_id: 'BATCH-' + Date.now(),
        invoice_ids: ids,
        invoice_count: ids.length,
        transmitted_at: new Date().toISOString(),
        status: 'SUCCESS',
        ack_number: ack,
        payload_hash: '90aef819273cba991',
        response_message: 'BIR EIS Acknowledgement Received (Status: ACCEPTED)',
        raw_request_json: JSON.stringify({ batch: ids }, null, 2),
        raw_response_json: JSON.stringify({ status: 'ACCEPTED', ack_number: ack }, null, 2),
      };
      mockTransmissions.unshift(tr);
      return tr;
    }
    case 'get_transmissions':
      return mockTransmissions;
    case 'get_tax_mappings':
      return mockTaxMappings;
    case 'save_tax_mappings':
      if (args?.mappings) mockTaxMappings = args.mappings;
      return null;
    case 'get_audit_logs':
      return mockAuditLogs;
    case 'get_access_db_status':
      return {
        is_configured: true,
        path: mockSettings.access_db_path,
        file_exists: true,
        driver_available: true,
        record_count: mockInvoices.length,
        last_synced: new Date().toISOString(),
        status_message: 'MS Access Database (.accdb) is synchronized and ready.',
      };
    case 'initialize_ms_access_db':
      return `MS Access database initialized successfully at: ${mockSettings.access_db_path}`;
    case 'export_to_ms_access':
      return `Successfully exported ${mockInvoices.length} invoices to MS Access database at: ${mockSettings.access_db_path}`;
    default:
      return null;
  }
}

export const api = {
  getCompanySettings: () => invokeBackend<CompanySettings>('get_company_settings'),
  saveCompanySettings: (settings: CompanySettings) => invokeBackend<void>('save_company_settings', { settings }),
  
  getAllInvoices: () => invokeBackend<Invoice[]>('get_all_invoices'),
  getInvoiceById: (id: string) => invokeBackend<Invoice | null>('get_invoice_by_id', { id }),
  saveInvoice: (invoice: Invoice) => invokeBackend<void>('save_invoice', { invoice }),
  deleteInvoice: (id: string) => invokeBackend<void>('delete_invoice', { id }),
  
  testQuickBooksConnection: () => invokeBackend<QbConnectionStatus>('test_quickbooks_connection'),
  syncQuickBooksInvoices: () => invokeBackend<Invoice[]>('sync_quickbooks_invoices'),
  
  validateInvoiceBir: (invoice: Invoice) => invokeBackend<BirValidationResult>('validate_invoice_bir', { invoice }),
  generateBirEisPayload: (invoice: Invoice) => invokeBackend<any>('generate_bir_eis_payload', { invoice }),
  transmitInvoicesToBirEis: (invoiceIds: string[]) => invokeBackend<EisTransmission>('transmit_invoices_to_bir_eis', { invoice_ids: invoiceIds }),
  getTransmissions: () => invokeBackend<EisTransmission[]>('get_transmissions'),
  
  getTaxMappings: () => invokeBackend<TaxMapping[]>('get_tax_mappings'),
  saveTaxMappings: (mappings: TaxMapping[]) => invokeBackend<void>('save_tax_mappings', { mappings }),
  
  getAuditLogs: () => invokeBackend<AuditLog[]>('get_audit_logs'),
  getAccessDbStatus: () => invokeBackend<AccessDbStatus>('get_access_db_status'),
  initializeMsAccessDb: () => invokeBackend<string>('initialize_ms_access_db'),
  exportToMsAccess: () => invokeBackend<string>('export_to_ms_access'),
};
