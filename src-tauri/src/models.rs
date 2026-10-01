use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompanySettings {
    pub tin: String,
    pub branch_code: String,
    pub business_name: String,
    pub trade_name: String,
    pub business_style: String,
    pub address: String,
    pub rdo: String,
    pub is_vat_registered: bool,
    pub cas_ptu_no: String,
    pub accn_no: String,
    pub pos_machine_id: String,
    pub valid_until: String,
    pub qb_company_path: String,
    pub access_db_path: String,
    pub eis_api_url: String,
    pub eis_client_id: String,
    pub eis_client_secret: String,
    pub eis_environment: String, // "sandbox" or "production"
    pub auto_sync_qb: bool,
}

impl Default for CompanySettings {
    fn default() -> Self {
        Self {
            tin: "123-456-789-00000".to_string(),
            branch_code: "00000".to_string(),
            business_name: "MANILA ENTERPRISE SOLUTIONS CORP.".to_string(),
            trade_name: "MES CORP".to_string(),
            business_style: "COMMERCIAL SOFTWARE & TRADING".to_string(),
            address: "Unit 1802 Ayala Triangle Tower, Makati City, Metro Manila, 1226 Philippines".to_string(),
            rdo: "047".to_string(), // East Makati RDO
            is_vat_registered: true,
            cas_ptu_no: "CAS-2024-008921-MA".to_string(),
            accn_no: "ACCN-047-2024-005612".to_string(),
            pos_machine_id: "POS-01-MKT".to_string(),
            valid_until: "2029-12-31".to_string(),
            qb_company_path: "C:\\Users\\Public\\Documents\\Intuit\\QuickBooks\\Company Files\\Tetsu Company.qbw".to_string(),
            access_db_path: "C:\\Users\\Tetsuro\\Desktop\\E-invoice\\data\\BIR_EIS_Database.accdb".to_string(),
            eis_api_url: "https://eis-cert.bir.gov.ph/api/v1/invoices".to_string(),
            eis_client_id: "CLIENT_BIR_EIS_99201".to_string(),
            eis_client_secret: "sec_live_9a87f4b82c1".to_string(),
            eis_environment: "sandbox".to_string(),
            auto_sync_qb: false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InvoiceItem {
    pub id: String,
    pub invoice_id: String,
    pub item_name: String,
    pub description: String,
    pub qty: f64,
    pub unit_price: f64,
    pub amount: f64,
    pub tax_type: String, // "VAT_12", "VAT_EXEMPT", "ZERO_RATED", "NON_VAT"
    pub discount_percent: f64,
    pub is_senior_pwd: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Invoice {
    pub id: String,
    pub ref_number: String,
    pub qb_txn_id: Option<String>,
    pub customer_name: String,
    pub customer_tin: String,
    pub customer_branch: String,
    pub customer_address: String,
    pub customer_business_style: String,
    pub txn_date: String,
    pub due_date: String,
    pub invoice_type: String, // "SALES_INVOICE", "OFFICIAL_RECEIPT", "COMMERCIAL_INVOICE", "CREDIT_MEMO"
    
    // Tax Breakdowns
    pub gross_amount: f64,
    pub vatable_sales: f64,
    pub vat_exempt_sales: f64,
    pub zero_rated_sales: f64,
    pub non_vat_sales: f64,
    pub vat_amount: f64,
    pub discount_amount: f64,
    pub discount_type: Option<String>, // "NONE", "SENIOR", "PWD", "SPECIAL"
    pub discount_id_no: Option<String>,
    pub withholding_tax_rate: f64, // e.g. 0.01 (1%), 0.02 (2%)
    pub withholding_tax_amount: f64,
    pub net_amount_payable: f64,
    
    // Status and BIR EIS tracking
    pub status: String, // "DRAFT", "PENDING_EIS", "VALIDATED", "TRANSMITTED", "REJECTED"
    pub eis_status: String, // "NOT_SENT", "QUEUED", "TRANSMITTED", "ACCEPTED", "FAILED"
    pub eis_ack_number: Option<String>,
    pub eis_hash: Option<String>,
    pub eis_transmitted_at: Option<String>,
    pub eis_error_message: Option<String>,
    
    pub created_at: String,
    pub updated_at: String,
    pub items: Vec<InvoiceItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EisTransmission {
    pub id: String,
    pub batch_id: String,
    pub invoice_ids: Vec<String>,
    pub invoice_count: usize,
    pub transmitted_at: String,
    pub status: String, // "SUCCESS", "PARTIAL", "FAILED"
    pub ack_number: String,
    pub payload_hash: String,
    pub response_message: String,
    pub raw_request_json: String,
    pub raw_response_json: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaxMapping {
    pub id: String,
    pub qb_tax_code: String,
    pub bir_tax_type: String,
    pub description: String,
    pub tax_rate: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditLog {
    pub id: String,
    pub timestamp: String,
    pub action: String,
    pub entity_type: String,
    pub entity_id: String,
    pub user_name: String,
    pub details: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BirValidationResult {
    pub is_valid: bool,
    pub score: u32, // 0 - 100%
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
    pub calculated_vatable_sales: f64,
    pub calculated_vat_amount: f64,
    pub calculated_net_payable: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccessDbStatus {
    pub is_configured: bool,
    pub path: String,
    pub file_exists: bool,
    pub driver_available: bool,
    pub record_count: usize,
    pub last_synced: Option<String>,
    pub status_message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QbConnectionStatus {
    pub is_connected: bool,
    pub session_type: String, // "Live COM" or "Simulator / Mock"
    pub company_file: String,
    pub qb_version: String,
    pub pending_invoices_count: usize,
    pub last_sync_time: Option<String>,
    pub message: String,
}

