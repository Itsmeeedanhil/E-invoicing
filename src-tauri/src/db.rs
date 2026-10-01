use crate::models::*;
use chrono::Local;
use rusqlite::{params, Connection, Result};
use std::path::Path;
use std::sync::Mutex;
use uuid::Uuid;

pub struct Database {
    conn: Mutex<Connection>,
}

impl Database {
    pub fn new(db_path: &str) -> Result<Self> {
        let path = Path::new(db_path);
        if let Some(parent) = path.parent() {
            let _ = std::fs::create_dir_all(parent);
        }

        let conn = Connection::open(db_path)?;
        let db = Database {
            conn: Mutex::new(conn),
        };
        db.init_schema()?;
        db.seed_initial_data()?;
        Ok(db)
    }

    fn init_schema(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();

        conn.execute_batch(
            "
            CREATE TABLE IF NOT EXISTS company_settings (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                tin TEXT NOT NULL,
                branch_code TEXT NOT NULL,
                business_name TEXT NOT NULL,
                trade_name TEXT NOT NULL,
                business_style TEXT NOT NULL,
                address TEXT NOT NULL,
                rdo TEXT NOT NULL,
                is_vat_registered INTEGER NOT NULL,
                cas_ptu_no TEXT NOT NULL,
                accn_no TEXT NOT NULL,
                pos_machine_id TEXT NOT NULL,
                valid_until TEXT NOT NULL,
                qb_company_path TEXT NOT NULL,
                access_db_path TEXT NOT NULL,
                eis_api_url TEXT NOT NULL,
                eis_client_id TEXT NOT NULL,
                eis_client_secret TEXT NOT NULL,
                eis_environment TEXT NOT NULL,
                auto_sync_qb INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS invoices (
                id TEXT PRIMARY KEY,
                ref_number TEXT NOT NULL UNIQUE,
                qb_txn_id TEXT,
                customer_name TEXT NOT NULL,
                customer_tin TEXT NOT NULL,
                customer_branch TEXT NOT NULL,
                customer_address TEXT NOT NULL,
                customer_business_style TEXT NOT NULL,
                txn_date TEXT NOT NULL,
                due_date TEXT NOT NULL,
                invoice_type TEXT NOT NULL,
                gross_amount REAL NOT NULL,
                vatable_sales REAL NOT NULL,
                vat_exempt_sales REAL NOT NULL,
                zero_rated_sales REAL NOT NULL,
                non_vat_sales REAL NOT NULL,
                vat_amount REAL NOT NULL,
                discount_amount REAL NOT NULL,
                discount_type TEXT,
                discount_id_no TEXT,
                withholding_tax_rate REAL NOT NULL,
                withholding_tax_amount REAL NOT NULL,
                net_amount_payable REAL NOT NULL,
                status TEXT NOT NULL,
                eis_status TEXT NOT NULL,
                eis_ack_number TEXT,
                eis_hash TEXT,
                eis_transmitted_at TEXT,
                eis_error_message TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS invoice_items (
                id TEXT PRIMARY KEY,
                invoice_id TEXT NOT NULL,
                item_name TEXT NOT NULL,
                description TEXT NOT NULL,
                qty REAL NOT NULL,
                unit_price REAL NOT NULL,
                amount REAL NOT NULL,
                tax_type TEXT NOT NULL,
                discount_percent REAL NOT NULL,
                is_senior_pwd INTEGER NOT NULL,
                FOREIGN KEY(invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS tax_mappings (
                id TEXT PRIMARY KEY,
                qb_tax_code TEXT NOT NULL UNIQUE,
                bir_tax_type TEXT NOT NULL,
                description TEXT NOT NULL,
                tax_rate REAL NOT NULL
            );

            CREATE TABLE IF NOT EXISTS eis_transmissions (
                id TEXT PRIMARY KEY,
                batch_id TEXT NOT NULL,
                invoice_count INTEGER NOT NULL,
                transmitted_at TEXT NOT NULL,
                status TEXT NOT NULL,
                ack_number TEXT NOT NULL,
                payload_hash TEXT NOT NULL,
                response_message TEXT NOT NULL,
                raw_request_json TEXT NOT NULL,
                raw_response_json TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS audit_logs (
                id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                action TEXT NOT NULL,
                entity_type TEXT NOT NULL,
                entity_id TEXT NOT NULL,
                user_name TEXT NOT NULL,
                details TEXT NOT NULL
            );
            ",
        )?;

        Ok(())
    }

    fn seed_initial_data(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();

        // Check if settings exist
        let mut count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM company_settings WHERE id = 1",
            [],
            |row| row.get(0),
        )?;

        if count == 0 {
            let def = CompanySettings::default();
            conn.execute(
                "INSERT INTO company_settings (
                    id, tin, branch_code, business_name, trade_name, business_style,
                    address, rdo, is_vat_registered, cas_ptu_no, accn_no, pos_machine_id,
                    valid_until, qb_company_path, access_db_path, eis_api_url,
                    eis_client_id, eis_client_secret, eis_environment, auto_sync_qb
                ) VALUES (
                    1, ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19
                )",
                params![
                    def.tin,
                    def.branch_code,
                    def.business_name,
                    def.trade_name,
                    def.business_style,
                    def.address,
                    def.rdo,
                    if def.is_vat_registered { 1 } else { 0 },
                    def.cas_ptu_no,
                    def.accn_no,
                    def.pos_machine_id,
                    def.valid_until,
                    def.qb_company_path,
                    def.access_db_path,
                    def.eis_api_url,
                    def.eis_client_id,
                    def.eis_client_secret,
                    def.eis_environment,
                    if def.auto_sync_qb { 1 } else { 0 },
                ],
            )?;
        }

        // Tax Mappings seeded if empty
        count = conn.query_row("SELECT COUNT(*) FROM tax_mappings", [], |row| row.get(0))?;
        if count == 0 {
            let mappings = vec![
                ("TAX", "VAT_12", "Standard 12% Value Added Tax", 0.12),
                ("NON", "VAT_EXEMPT", "VAT-Exempt Goods & Services", 0.0),
                ("ZERO", "ZERO_RATED", "Zero-Rated Sales (Export/PEZA)", 0.0),
                ("SENIOR", "VAT_EXEMPT", "Senior Citizen / PWD 20% Discount + VAT-Exempt", 0.0),
                ("EWT_1", "NON_VAT", "1% Creditable Withholding Tax (Goods)", 0.01),
                ("EWT_2", "NON_VAT", "2% Creditable Withholding Tax (Services)", 0.02),
            ];

            for (qb_code, bir_type, desc, rate) in mappings {
                let id = Uuid::new_v4().to_string();
                conn.execute(
                    "INSERT INTO tax_mappings (id, qb_tax_code, bir_tax_type, description, tax_rate) VALUES (?1, ?2, ?3, ?4, ?5)",
                    params![id, qb_code, bir_type, desc, rate],
                )?;
            }
        }

        Ok(())
    }

    pub fn get_company_settings(&self) -> Result<CompanySettings> {
        let conn = self.conn.lock().unwrap();
        conn.query_row(
            "SELECT tin, branch_code, business_name, trade_name, business_style,
                    address, rdo, is_vat_registered, cas_ptu_no, accn_no, pos_machine_id,
                    valid_until, qb_company_path, access_db_path, eis_api_url,
                    eis_client_id, eis_client_secret, eis_environment, auto_sync_qb
             FROM company_settings WHERE id = 1",
            [],
            |row| {
                Ok(CompanySettings {
                    tin: row.get(0)?,
                    branch_code: row.get(1)?,
                    business_name: row.get(2)?,
                    trade_name: row.get(3)?,
                    business_style: row.get(4)?,
                    address: row.get(5)?,
                    rdo: row.get(6)?,
                    is_vat_registered: row.get::<_, i64>(7)? == 1,
                    cas_ptu_no: row.get(8)?,
                    accn_no: row.get(9)?,
                    pos_machine_id: row.get(10)?,
                    valid_until: row.get(11)?,
                    qb_company_path: row.get(12)?,
                    access_db_path: row.get(13)?,
                    eis_api_url: row.get(14)?,
                    eis_client_id: row.get(15)?,
                    eis_client_secret: row.get(16)?,
                    eis_environment: row.get(17)?,
                    auto_sync_qb: row.get::<_, i64>(18)? == 1,
                })
            },
        )
    }

    pub fn save_company_settings(&self, s: &CompanySettings) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE company_settings SET
                tin = ?1, branch_code = ?2, business_name = ?3, trade_name = ?4, business_style = ?5,
                address = ?6, rdo = ?7, is_vat_registered = ?8, cas_ptu_no = ?9, accn_no = ?10,
                pos_machine_id = ?11, valid_until = ?12, qb_company_path = ?13, access_db_path = ?14,
                eis_api_url = ?15, eis_client_id = ?16, eis_client_secret = ?17,
                eis_environment = ?18, auto_sync_qb = ?19
             WHERE id = 1",
            params![
                s.tin,
                s.branch_code,
                s.business_name,
                s.trade_name,
                s.business_style,
                s.address,
                s.rdo,
                if s.is_vat_registered { 1 } else { 0 },
                s.cas_ptu_no,
                s.accn_no,
                s.pos_machine_id,
                s.valid_until,
                s.qb_company_path,
                s.access_db_path,
                s.eis_api_url,
                s.eis_client_id,
                s.eis_client_secret,
                s.eis_environment,
                if s.auto_sync_qb { 1 } else { 0 },
            ],
        )?;
        Ok(())
    }

    pub fn get_all_invoices(&self) -> Result<Vec<Invoice>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, ref_number, qb_txn_id, customer_name, customer_tin, customer_branch,
                    customer_address, customer_business_style, txn_date, due_date, invoice_type,
                    gross_amount, vatable_sales, vat_exempt_sales, zero_rated_sales, non_vat_sales,
                    vat_amount, discount_amount, discount_type, discount_id_no,
                    withholding_tax_rate, withholding_tax_amount, net_amount_payable,
                    status, eis_status, eis_ack_number, eis_hash, eis_transmitted_at,
                    eis_error_message, created_at, updated_at
             FROM invoices ORDER BY txn_date DESC, ref_number DESC",
        )?;

        let invoice_rows = stmt.query_map([], |row| {
            Ok(Invoice {
                id: row.get(0)?,
                ref_number: row.get(1)?,
                qb_txn_id: row.get(2)?,
                customer_name: row.get(3)?,
                customer_tin: row.get(4)?,
                customer_branch: row.get(5)?,
                customer_address: row.get(6)?,
                customer_business_style: row.get(7)?,
                txn_date: row.get(8)?,
                due_date: row.get(9)?,
                invoice_type: row.get(10)?,
                gross_amount: row.get(11)?,
                vatable_sales: row.get(12)?,
                vat_exempt_sales: row.get(13)?,
                zero_rated_sales: row.get(14)?,
                non_vat_sales: row.get(15)?,
                vat_amount: row.get(16)?,
                discount_amount: row.get(17)?,
                discount_type: row.get(18)?,
                discount_id_no: row.get(19)?,
                withholding_tax_rate: row.get(20)?,
                withholding_tax_amount: row.get(21)?,
                net_amount_payable: row.get(22)?,
                status: row.get(23)?,
                eis_status: row.get(24)?,
                eis_ack_number: row.get(25)?,
                eis_hash: row.get(26)?,
                eis_transmitted_at: row.get(27)?,
                eis_error_message: row.get(28)?,
                created_at: row.get(29)?,
                updated_at: row.get(30)?,
                items: Vec::new(),
            })
        })?;

        let mut invoices = Vec::new();
        for inv in invoice_rows {
            let mut invoice = inv?;
            let mut item_stmt = conn.prepare(
                "SELECT id, invoice_id, item_name, description, qty, unit_price, amount, tax_type, discount_percent, is_senior_pwd
                 FROM invoice_items WHERE invoice_id = ?1",
            )?;

            let item_rows = item_stmt.query_map(params![invoice.id], |irow| {
                Ok(InvoiceItem {
                    id: irow.get(0)?,
                    invoice_id: irow.get(1)?,
                    item_name: irow.get(2)?,
                    description: irow.get(3)?,
                    qty: irow.get(4)?,
                    unit_price: irow.get(5)?,
                    amount: irow.get(6)?,
                    tax_type: irow.get(7)?,
                    discount_percent: irow.get(8)?,
                    is_senior_pwd: irow.get::<_, i64>(9)? == 1,
                })
            })?;

            for it in item_rows {
                invoice.items.push(it?);
            }
            invoices.push(invoice);
        }

        Ok(invoices)
    }

    pub fn get_invoice_by_id(&self, id: &str) -> Result<Option<Invoice>> {
        let invoices = self.get_all_invoices()?;
        Ok(invoices.into_iter().find(|i| i.id == id))
    }

    pub fn save_invoice(&self, inv: &Invoice) -> Result<()> {
        let mut conn = self.conn.lock().unwrap();
        let tx = conn.transaction()?;

        tx.execute(
            "INSERT INTO invoices (
                id, ref_number, qb_txn_id, customer_name, customer_tin, customer_branch,
                customer_address, customer_business_style, txn_date, due_date, invoice_type,
                gross_amount, vatable_sales, vat_exempt_sales, zero_rated_sales, non_vat_sales,
                vat_amount, discount_amount, discount_type, discount_id_no,
                withholding_tax_rate, withholding_tax_amount, net_amount_payable,
                status, eis_status, eis_ack_number, eis_hash, eis_transmitted_at,
                eis_error_message, created_at, updated_at
            ) VALUES (
                ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16,
                ?17, ?18, ?19, ?20, ?21, ?22, ?23, ?24, ?25, ?26, ?27, ?28, ?29, ?30, ?31
            )
            ON CONFLICT(id) DO UPDATE SET
                ref_number = excluded.ref_number,
                qb_txn_id = excluded.qb_txn_id,
                customer_name = excluded.customer_name,
                customer_tin = excluded.customer_tin,
                customer_branch = excluded.customer_branch,
                customer_address = excluded.customer_address,
                customer_business_style = excluded.customer_business_style,
                txn_date = excluded.txn_date,
                due_date = excluded.due_date,
                invoice_type = excluded.invoice_type,
                gross_amount = excluded.gross_amount,
                vatable_sales = excluded.vatable_sales,
                vat_exempt_sales = excluded.vat_exempt_sales,
                zero_rated_sales = excluded.zero_rated_sales,
                non_vat_sales = excluded.non_vat_sales,
                vat_amount = excluded.vat_amount,
                discount_amount = excluded.discount_amount,
                discount_type = excluded.discount_type,
                discount_id_no = excluded.discount_id_no,
                withholding_tax_rate = excluded.withholding_tax_rate,
                withholding_tax_amount = excluded.withholding_tax_amount,
                net_amount_payable = excluded.net_amount_payable,
                status = excluded.status,
                eis_status = excluded.eis_status,
                eis_ack_number = excluded.eis_ack_number,
                eis_hash = excluded.eis_hash,
                eis_transmitted_at = excluded.eis_transmitted_at,
                eis_error_message = excluded.eis_error_message,
                updated_at = excluded.updated_at",
            params![
                inv.id,
                inv.ref_number,
                inv.qb_txn_id,
                inv.customer_name,
                inv.customer_tin,
                inv.customer_branch,
                inv.customer_address,
                inv.customer_business_style,
                inv.txn_date,
                inv.due_date,
                inv.invoice_type,
                inv.gross_amount,
                inv.vatable_sales,
                inv.vat_exempt_sales,
                inv.zero_rated_sales,
                inv.non_vat_sales,
                inv.vat_amount,
                inv.discount_amount,
                inv.discount_type,
                inv.discount_id_no,
                inv.withholding_tax_rate,
                inv.withholding_tax_amount,
                inv.net_amount_payable,
                inv.status,
                inv.eis_status,
                inv.eis_ack_number,
                inv.eis_hash,
                inv.eis_transmitted_at,
                inv.eis_error_message,
                inv.created_at,
                inv.updated_at,
            ],
        )?;

        // Replace items
        tx.execute("DELETE FROM invoice_items WHERE invoice_id = ?1", params![inv.id])?;
        for item in &inv.items {
            tx.execute(
                "INSERT INTO invoice_items (
                    id, invoice_id, item_name, description, qty, unit_price,
                    amount, tax_type, discount_percent, is_senior_pwd
                ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
                params![
                    item.id,
                    inv.id,
                    item.item_name,
                    item.description,
                    item.qty,
                    item.unit_price,
                    item.amount,
                    item.tax_type,
                    item.discount_percent,
                    if item.is_senior_pwd { 1 } else { 0 },
                ],
            )?;
        }

        tx.commit()?;
        Ok(())
    }

    pub fn delete_invoice(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM invoice_items WHERE invoice_id = ?1", params![id])?;
        conn.execute("DELETE FROM invoices WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn get_tax_mappings(&self) -> Result<Vec<TaxMapping>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT id, qb_tax_code, bir_tax_type, description, tax_rate FROM tax_mappings")?;
        let rows = stmt.query_map([], |r| {
            Ok(TaxMapping {
                id: r.get(0)?,
                qb_tax_code: r.get(1)?,
                bir_tax_type: r.get(2)?,
                description: r.get(3)?,
                tax_rate: r.get(4)?,
            })
        })?;

        let mut list = Vec::new();
        for r in rows {
            list.push(r?);
        }
        Ok(list)
    }

    pub fn save_tax_mappings(&self, mappings: &[TaxMapping]) -> Result<()> {
        let mut conn = self.conn.lock().unwrap();
        let tx = conn.transaction()?;
        tx.execute("DELETE FROM tax_mappings", [])?;
        for m in mappings {
            tx.execute(
                "INSERT INTO tax_mappings (id, qb_tax_code, bir_tax_type, description, tax_rate) VALUES (?1, ?2, ?3, ?4, ?5)",
                params![m.id, m.qb_tax_code, m.bir_tax_type, m.description, m.tax_rate],
            )?;
        }
        tx.commit()?;
        Ok(())
    }

    pub fn add_audit_log(&self, action: &str, entity_type: &str, entity_id: &str, user_name: &str, details: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let id = Uuid::new_v4().to_string();
        let now = Local::now().to_rfc3339();
        conn.execute(
            "INSERT INTO audit_logs (id, timestamp, action, entity_type, entity_id, user_name, details) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![id, now, action, entity_type, entity_id, user_name, details],
        )?;
        Ok(())
    }

    pub fn get_audit_logs(&self) -> Result<Vec<AuditLog>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT id, timestamp, action, entity_type, entity_id, user_name, details FROM audit_logs ORDER BY timestamp DESC LIMIT 200")?;
        let rows = stmt.query_map([], |r| {
            Ok(AuditLog {
                id: r.get(0)?,
                timestamp: r.get(1)?,
                action: r.get(2)?,
                entity_type: r.get(3)?,
                entity_id: r.get(4)?,
                user_name: r.get(5)?,
                details: r.get(6)?,
            })
        })?;

        let mut list = Vec::new();
        for r in rows {
            list.push(r?);
        }
        Ok(list)
    }

    pub fn record_eis_transmission(&self, transmission: &EisTransmission) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO eis_transmissions (id, batch_id, invoice_count, transmitted_at, status, ack_number, payload_hash, response_message, raw_request_json, raw_response_json)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            params![
                transmission.id,
                transmission.batch_id,
                transmission.invoice_count as i64,
                transmission.transmitted_at,
                transmission.status,
                transmission.ack_number,
                transmission.payload_hash,
                transmission.response_message,
                transmission.raw_request_json,
                transmission.raw_response_json,
            ],
        )?;
        Ok(())
    }

    pub fn get_transmissions(&self) -> Result<Vec<EisTransmission>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT id, batch_id, invoice_count, transmitted_at, status, ack_number, payload_hash, response_message, raw_request_json, raw_response_json FROM eis_transmissions ORDER BY transmitted_at DESC LIMIT 50")?;
        let rows = stmt.query_map([], |r| {
            Ok(EisTransmission {
                id: r.get(0)?,
                batch_id: r.get(1)?,
                invoice_ids: Vec::new(),
                invoice_count: r.get::<_, i64>(2)? as usize,
                transmitted_at: r.get(3)?,
                status: r.get(4)?,
                ack_number: r.get(5)?,
                payload_hash: r.get(6)?,
                response_message: r.get(7)?,
                raw_request_json: r.get(8)?,
                raw_response_json: r.get(9)?,
            })
        })?;

        let mut list = Vec::new();
        for r in rows {
            list.push(r?);
        }
        Ok(list)
    }
}

