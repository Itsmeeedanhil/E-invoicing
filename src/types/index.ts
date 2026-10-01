export interface CompanySettings {
  tin: string;
  branch_code: string;
  business_name: string;
  trade_name: string;
  business_style: string;
  address: string;
  rdo: string;
  is_vat_registered: boolean;
  cas_ptu_no: string;
  accn_no: string;
  pos_machine_id: string;
  valid_until: string;
  qb_company_path: string;
  access_db_path: string;
  eis_api_url: string;
  eis_client_id: string;
  eis_client_secret: string;
  eis_environment: string;
  auto_sync_qb: boolean;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  item_name: string;
  description: string;
  qty: number;
  unit_price: number;
  amount: number;
  tax_type: 'VAT_12' | 'VAT_EXEMPT' | 'ZERO_RATED' | 'NON_VAT';
  discount_percent: number;
  is_senior_pwd: boolean;
}

export interface Invoice {
  id: string;
  ref_number: string;
  qb_txn_id?: string | null;
  customer_name: string;
  customer_tin: string;
  customer_branch: string;
  customer_address: string;
  customer_business_style: string;
  txn_date: string;
  due_date: string;
  invoice_type: 'SALES_INVOICE' | 'OFFICIAL_RECEIPT' | 'COMMERCIAL_INVOICE' | 'CREDIT_MEMO';
  
  // Tax & breakdown fields
  gross_amount: number;
  vatable_sales: number;
  vat_exempt_sales: number;
  zero_rated_sales: number;
  non_vat_sales: number;
  vat_amount: number;
  discount_amount: number;
  discount_type?: string | null;
  discount_id_no?: string | null;
  withholding_tax_rate: number;
  withholding_tax_amount: number;
  net_amount_payable: number;
  
  // BIR EIS tracking
  status: 'DRAFT' | 'PENDING_EIS' | 'VALIDATED' | 'TRANSMITTED' | 'REJECTED';
  eis_status: 'NOT_SENT' | 'QUEUED' | 'TRANSMITTED' | 'ACCEPTED' | 'FAILED';
  eis_ack_number?: string | null;
  eis_hash?: string | null;
  eis_transmitted_at?: string | null;
  eis_error_message?: string | null;
  
  created_at: string;
  updated_at: string;
  items: InvoiceItem[];
}

export interface EisTransmission {
  id: string;
  batch_id: string;
  invoice_ids: string[];
  invoice_count: number;
  transmitted_at: string;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  ack_number: string;
  payload_hash: string;
  response_message: string;
  raw_request_json: string;
  raw_response_json: string;
}

export interface TaxMapping {
  id: string;
  qb_tax_code: string;
  bir_tax_type: string;
  description: string;
  tax_rate: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  entity_type: string;
  entity_id: string;
  user_name: string;
  details: string;
}

export interface BirValidationResult {
  is_valid: boolean;
  score: number;
  errors: string[];
  warnings: string[];
  calculated_vatable_sales: number;
  calculated_vat_amount: number;
  calculated_net_payable: number;
}

export interface AccessDbStatus {
  is_configured: boolean;
  path: string;
  file_exists: boolean;
  driver_available: boolean;
  record_count: number;
  last_synced?: string | null;
  status_message: string;
}

export interface QbConnectionStatus {
  is_connected: boolean;
  session_type: string;
  company_file: string;
  qb_version: string;
  pending_invoices_count: number;
  last_sync_time?: string | null;
  message: string;
}
