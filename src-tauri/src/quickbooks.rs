use crate::bir_eis::BirEisEngine;
use crate::models::*;
use chrono::Local;
use regex::Regex;
use std::env;
use std::fs;
use std::process::Command;
use uuid::Uuid;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

const CREATE_NO_WINDOW: u32 = 0x08000000;

pub struct QuickBooksSdk;

impl QuickBooksSdk {
    /// Ensures the PowerShell bridge script is located in a known temp path
    fn get_bridge_script_path() -> String {
        let temp_dir = env::temp_dir();
        let script_file = temp_dir.join("bir_eis_qb_bridge.ps1");
        
        let script_content = include_str!("../scripts/qb_bridge.ps1");
        let _ = fs::write(&script_file, script_content);
        
        script_file.to_string_lossy().to_string()
    }

    /// Tests live connection to QuickBooks Desktop via COM without popping up visible console windows
    pub fn test_connection(company_file: &str) -> QbConnectionStatus {
        let now = Local::now().to_rfc3339();

        #[cfg(target_os = "windows")]
        {
            let script_path = Self::get_bridge_script_path();
            let mut cmd = Command::new("powershell");
            cmd.creation_flags(CREATE_NO_WINDOW);
            cmd.args([
                "-NoProfile",
                "-ExecutionPolicy",
                "Bypass",
                "-File",
                &script_path,
                "-Action",
                "test",
                "-CompanyFile",
                company_file,
            ]);

            match cmd.output() {
                Ok(output) => {
                    let out_str = String::from_utf8_lossy(&output.stdout).trim().to_string();
                    if let Ok(json) = serde_json::from_str::<serde_json::Value>(&out_str) {
                        let connected = json["connected"].as_bool().unwrap_or(false);
                        let mode = json["mode"].as_str().unwrap_or("Live COM");
                        let msg = json["message"].as_str().unwrap_or(&out_str);

                        QbConnectionStatus {
                            is_connected: connected,
                            session_type: mode.to_string(),
                            company_file: if company_file.is_empty() {
                                "Active QuickBooks Session".to_string()
                            } else {
                                company_file.to_string()
                            },
                            qb_version: "QuickBooks Desktop (QBSDK QBXMLRP2 COM)".to_string(),
                            pending_invoices_count: 0,
                            last_sync_time: Some(now),
                            message: msg.to_string(),
                        }
                    } else {
                        QbConnectionStatus {
                            is_connected: false,
                            session_type: "COM Bridge Diagnostic".to_string(),
                            company_file: company_file.to_string(),
                            qb_version: "QBSDK COM".to_string(),
                            pending_invoices_count: 0,
                            last_sync_time: Some(now),
                            message: if out_str.is_empty() {
                                "QuickBooks is not currently running. Please launch QuickBooks and open your company file.".to_string()
                            } else {
                                out_str
                            },
                        }
                    }
                }
                Err(e) => QbConnectionStatus {
                    is_connected: false,
                    session_type: "Execution Error".to_string(),
                    company_file: company_file.to_string(),
                    qb_version: "Unknown".to_string(),
                    pending_invoices_count: 0,
                    last_sync_time: Some(now),
                    message: format!("Failed to execute QuickBooks COM bridge: {}", e),
                },
            }
        }

        #[cfg(not(target_os = "windows"))]
        {
            QbConnectionStatus {
                is_connected: false,
                session_type: "Non-Windows Platform".to_string(),
                company_file: company_file.to_string(),
                qb_version: "N/A".to_string(),
                pending_invoices_count: 0,
                last_sync_time: Some(now),
                message: "QuickBooks Desktop SDK requires a Windows host with QuickBooks Desktop installed.".to_string(),
            }
        }
    }

    /// Queries live invoices from active QuickBooks Desktop session and parses QBXML response
    pub fn fetch_live_invoices(
        company_file: &str,
        from_date: Option<&str>,
        max_returned: usize,
        tax_mappings: &[TaxMapping],
        seller_settings: &CompanySettings,
    ) -> Result<Vec<Invoice>, String> {
        #[cfg(target_os = "windows")]
        {
            let script_path = Self::get_bridge_script_path();
            let mut cmd = Command::new("powershell");
            cmd.creation_flags(CREATE_NO_WINDOW);
            cmd.args([
                "-NoProfile",
                "-ExecutionPolicy",
                "Bypass",
                "-File",
                &script_path,
                "-Action",
                "query_invoices",
                "-CompanyFile",
                company_file,
                "-FromDate",
                from_date.unwrap_or(""),
                "-MaxReturned",
                &max_returned.to_string(),
            ]);

            let output = cmd
                .output()
                .map_err(|e| format!("Failed to execute QuickBooks live query: {}", e))?;

            if !output.status.success() {
                let stderr = String::from_utf8_lossy(&output.stderr).to_string();
                let stdout = String::from_utf8_lossy(&output.stdout).to_string();
                let combined = format!("{}\n{}", stdout, stderr).trim().to_string();
                
                if combined.contains("Could not start QuickBooks") || combined.contains("0x80040408") {
                    return Err("QuickBooks connection returned 'Could not start QuickBooks' (0x80040408).\n\nPlease verify:\n1. QuickBooks Desktop is OPEN and you are LOGGED IN as 'Admin' to your company file (past the password/login screen).\n2. In QuickBooks, go to Edit > Preferences > Integrated Applications > Company Preferences and ensure 'Don't allow any applications to access this company file' is UNCHECKED.\n3. Make sure no modal/popup dialogs (like reminders or registration prompts) are open inside QuickBooks.\n4. If QuickBooks was started as 'Run as Administrator', launch this app as Administrator as well (or restart both as standard user).".to_string());
                } else if combined.contains("modal dialog") || combined.contains("0x80040416") {
                    return Err("A modal dialog is currently open in QuickBooks. Please close any open popups or dialogs inside QuickBooks and try again.".to_string());
                } else if combined.contains("permission") || combined.contains("0x80040414") {
                    return Err("QuickBooks access permission was denied. In QuickBooks, go to Edit > Preferences > Integrated Applications > Company Preferences and allow this application.".to_string());
                }
                
                return Err(format!("QuickBooks SDK error: {}", combined));
            }

            let qbxml_resp = String::from_utf8_lossy(&output.stdout).to_string();
            Self::parse_qbxml_invoices(&qbxml_resp, tax_mappings, seller_settings)
        }

        #[cfg(not(target_os = "windows"))]
        {
            Err("QuickBooks Desktop SDK is only supported on Windows.".to_string())
        }
    }

    /// Decodes XML numeric character entities like &#241; and named entities into UTF-8
    pub fn decode_qbxml_text(s: &str) -> String {
        let mut res = s.to_string();
        res = res.replace("&amp;", "&");
        res = res.replace("&quot;", "\"");
        res = res.replace("&apos;", "'");
        res = res.replace("&#39;", "'");
        res = res.replace("&lt;", "<");
        res = res.replace("&gt;", ">");

        let num_re = Regex::new(r"&#(\d+);").unwrap();
        num_re
            .replace_all(&res, |caps: &regex::Captures| {
                if let Ok(code) = caps[1].parse::<u32>() {
                    if let Some(c) = char::from_u32(code) {
                        return c.to_string();
                    }
                }
                caps[0].to_string()
            })
            .to_string()
    }

    /// Parses raw QBXML `<InvoiceQueryRs>` into compliant BIR Invoice models
    pub fn parse_qbxml_invoices(
        qbxml: &str,
        tax_mappings: &[TaxMapping],
        seller_settings: &CompanySettings,
    ) -> Result<Vec<Invoice>, String> {
        let mut invoices = Vec::new();
        let now = Local::now().to_rfc3339();

        // Check for error in response
        if qbxml.contains("statusCode=\"1\"") || qbxml.contains("statusMessage=\"A query request did not find a matching object") {
            // Empty result / no invoices found
            return Ok(Vec::new());
        }

        // Extract each <InvoiceRet> block (multiline dot-matches-all)
        let inv_block_re = Regex::new(r"(?s)<InvoiceRet>(.*?)</InvoiceRet>").unwrap();
        let txn_id_re = Regex::new(r"(?s)<TxnID>([^<]+)</TxnID>").unwrap();
        let ref_num_re = Regex::new(r"(?s)<RefNumber>([^<]+)</RefNumber>").unwrap();
        let txn_date_re = Regex::new(r"(?s)<TxnDate>([^<]+)</TxnDate>").unwrap();
        let due_date_re = Regex::new(r"(?s)<DueDate>([^<]+)</DueDate>").unwrap();
        let cust_name_re = Regex::new(r"(?s)<CustomerRef>[\s\S]*?<FullName>([^<]+)</FullName>").unwrap();
        
        let addr1_re = Regex::new(r"(?s)<BillAddress>[\s\S]*?<Addr1>([^<]+)</Addr1>").unwrap();
        let addr2_re = Regex::new(r"(?s)<BillAddress>[\s\S]*?<Addr2>([^<]+)</Addr2>").unwrap();
        let addr3_re = Regex::new(r"(?s)<BillAddress>[\s\S]*?<Addr3>([^<]+)</Addr3>").unwrap();
        let city_re = Regex::new(r"(?s)<BillAddress>[\s\S]*?<City>([^<]+)</City>").unwrap();
        let state_re = Regex::new(r"(?s)<BillAddress>[\s\S]*?<State>([^<]+)</State>").unwrap();
        let postal_re = Regex::new(r"(?s)<BillAddress>[\s\S]*?<PostalCode>([^<]+)</PostalCode>").unwrap();
        
        let memo_re = Regex::new(r"(?s)<Memo>([^<]+)</Memo>").unwrap();
        let subtotal_re = Regex::new(r"(?s)<Subtotal>([^<]+)</Subtotal>").unwrap();
        let data_ext_re = Regex::new(r"(?s)<DataExtRet>[\s\S]*?<DataExtName>([^<]+)</DataExtName>[\s\S]*?<DataExtValue>([^<]+)</DataExtValue>").unwrap();

        // Line Item regex (handles multiline tags inside InvoiceLineRet)
        let line_re = Regex::new(r"(?s)<InvoiceLineRet>(.*?)</InvoiceLineRet>").unwrap();
        let line_id_re = Regex::new(r"(?s)<TxnLineID>([^<]+)</TxnLineID>").unwrap();
        let item_name_re = Regex::new(r"(?s)<ItemRef>[\s\S]*?<FullName>([^<]+)</FullName>").unwrap();
        let desc_re = Regex::new(r"(?s)<Desc>([^<]+)</Desc>").unwrap();
        let qty_re = Regex::new(r"(?s)<Quantity>([^<]+)</Quantity>").unwrap();
        let rate_re = Regex::new(r"(?s)<Rate>([^<]+)</Rate>").unwrap();
        let amount_re = Regex::new(r"(?s)<Amount>([^<]+)</Amount>").unwrap();
        let tax_code_re = Regex::new(r"(?s)<SalesTaxCodeRef>[\s\S]*?<FullName>([^<]+)</FullName>").unwrap();

        for cap in inv_block_re.captures_iter(qbxml) {
            let block = &cap[1];

            let txn_id = txn_id_re.captures(block).map(|c| c[1].trim().to_string());
            let ref_number = ref_num_re
                .captures(block)
                .map(|c| Self::decode_qbxml_text(&c[1]).trim().to_string())
                .unwrap_or_else(|| format!("QB-{}", txn_id.as_deref().unwrap_or("INV")));

            let txn_date = txn_date_re
                .captures(block)
                .map(|c| c[1].trim().to_string())
                .unwrap_or_else(|| Local::now().format("%Y-%m-%d").to_string());

            let due_date = due_date_re
                .captures(block)
                .map(|c| c[1].trim().to_string())
                .unwrap_or_else(|| txn_date.clone());

            let raw_customer_name = cust_name_re
                .captures(block)
                .map(|c| Self::decode_qbxml_text(&c[1]).trim().to_string())
                .unwrap_or_else(|| "General Customer".to_string());

            // Clean customer name if job syntax (Parent:Job)
            let customer_name = if raw_customer_name.contains(':') {
                raw_customer_name.split(':').last().unwrap_or(&raw_customer_name).trim().to_string()
            } else {
                raw_customer_name
            };

            let mut address_parts = Vec::new();
            if let Some(c) = addr1_re.captures(block) { address_parts.push(Self::decode_qbxml_text(&c[1]).trim().to_string()); }
            if let Some(c) = addr2_re.captures(block) { address_parts.push(Self::decode_qbxml_text(&c[1]).trim().to_string()); }
            if let Some(c) = addr3_re.captures(block) { address_parts.push(Self::decode_qbxml_text(&c[1]).trim().to_string()); }
            if let Some(c) = city_re.captures(block) { address_parts.push(Self::decode_qbxml_text(&c[1]).trim().to_string()); }
            if let Some(c) = state_re.captures(block) { address_parts.push(Self::decode_qbxml_text(&c[1]).trim().to_string()); }
            if let Some(c) = postal_re.captures(block) { address_parts.push(Self::decode_qbxml_text(&c[1]).trim().to_string()); }

            let customer_address = if !address_parts.is_empty() {
                address_parts.join(", ")
            } else {
                "Philippines".to_string()
            };

            // Custom fields & TIN detection
            let mut customer_tin = String::new();
            let mut customer_branch = "00000".to_string();
            let mut customer_business_style = "COMMERCIAL ENTERPRISE".to_string();

            for dext in data_ext_re.captures_iter(block) {
                let name = Self::decode_qbxml_text(&dext[1]).to_uppercase();
                let val = Self::decode_qbxml_text(&dext[2]).trim().to_string();
                if name.contains("TIN") || name.contains("TAX ID") {
                    customer_tin = val;
                } else if name.contains("BRANCH") {
                    customer_branch = val;
                } else if name.contains("STYLE") || name.contains("LINE OF BUSINESS") {
                    customer_business_style = val;
                }
            }

            // Fallback: check Memo for TIN regex
            if customer_tin.is_empty() {
                if let Some(mcap) = memo_re.captures(block) {
                    let memo_str = Self::decode_qbxml_text(&mcap[1]);
                    let tin_pattern = Regex::new(r"(?i)TIN[:\s]+([0-9]{3}[-\s]?[0-9]{3}[-\s]?[0-9]{3}[-\s]?[0-9]{3,5})").unwrap();
                    if let Some(tc) = tin_pattern.captures(&memo_str) {
                        customer_tin = tc[1].replace(' ', "-");
                    }
                }
            }

            if customer_tin.is_empty() {
                customer_tin = "000-000-000-00000".to_string();
            }

            let inv_id = Uuid::new_v4().to_string();
            let mut items = Vec::new();

            let mut gross_amount = 0.0;
            let mut vatable_sales = 0.0;
            let mut vat_exempt_sales = 0.0;
            let mut zero_rated_sales = 0.0;
            let mut non_vat_sales = 0.0;
            let mut total_discount = 0.0;

            let is_senior_or_pwd = customer_name.to_uppercase().contains("SENIOR")
                || customer_name.to_uppercase().contains("PWD")
                || block.to_uppercase().contains("OSCA")
                || block.to_uppercase().contains("SENIOR CITIZEN");

            for line_cap in line_re.captures_iter(block) {
                let lblock = &line_cap[1];

                let line_id = line_id_re
                    .captures(lblock)
                    .map(|c| c[1].trim().to_string())
                    .unwrap_or_else(|| Uuid::new_v4().to_string());

                let raw_iname = item_name_re
                    .captures(lblock)
                    .map(|c| Self::decode_qbxml_text(&c[1]).trim().to_string())
                    .unwrap_or_default();

                let raw_desc = desc_re
                    .captures(lblock)
                    .map(|c| Self::decode_qbxml_text(&c[1]).trim().to_string())
                    .unwrap_or_default();

                // Determine exact item name and description from QuickBooks
                let (iname, idesc) = if !raw_iname.is_empty() && raw_iname != "Merchandise / Service" {
                    let d = if !raw_desc.is_empty() && raw_desc != raw_iname {
                        raw_desc
                    } else {
                        String::new()
                    };
                    (raw_iname, d)
                } else if !raw_desc.is_empty() {
                    (raw_desc, String::new())
                } else {
                    ("General Merchandise".to_string(), String::new())
                };

                let qty = qty_re
                    .captures(lblock)
                    .and_then(|c| c[1].trim().parse::<f64>().ok())
                    .unwrap_or(1.0);

                let rate = rate_re
                    .captures(lblock)
                    .and_then(|c| c[1].trim().parse::<f64>().ok())
                    .unwrap_or(0.0);

                let amount = amount_re
                    .captures(lblock)
                    .and_then(|c| c[1].trim().parse::<f64>().ok())
                    .unwrap_or(qty * rate);

                let qb_tax_code = tax_code_re
                    .captures(lblock)
                    .map(|c| c[1].trim().to_string())
                    .unwrap_or_else(|| "TAX".to_string());

                // Find tax mapping
                let bir_tax_type = tax_mappings
                    .iter()
                    .find(|m| m.qb_tax_code.eq_ignore_ascii_case(&qb_tax_code))
                    .map(|m| m.bir_tax_type.clone())
                    .unwrap_or_else(|| {
                        if qb_tax_code.eq_ignore_ascii_case("TAX") {
                            "VAT_12".to_string()
                        } else if qb_tax_code.eq_ignore_ascii_case("NON") {
                            "VAT_EXEMPT".to_string()
                        } else if qb_tax_code.eq_ignore_ascii_case("ZERO") {
                            "ZERO_RATED".to_string()
                        } else {
                            "NON_VAT".to_string()
                        }
                    });

                let disc_pct = if is_senior_or_pwd { 20.0 } else { 0.0 };
                let disc_amt = if disc_pct > 0.0 {
                    amount * (disc_pct / 100.0)
                } else {
                    0.0
                };
                total_discount += disc_amt;
                let net_item_amount = amount - disc_amt;
                gross_amount += amount;

                match bir_tax_type.as_str() {
                    "VAT_12" => {
                        if is_senior_or_pwd {
                            // Senior / PWD purchases become VAT Exempt under Philippine Law
                            vat_exempt_sales += net_item_amount;
                        } else {
                            vatable_sales += net_item_amount;
                        }
                    }
                    "VAT_EXEMPT" => {
                        vat_exempt_sales += net_item_amount;
                    }
                    "ZERO_RATED" => {
                        zero_rated_sales += net_item_amount;
                    }
                    _ => {
                        non_vat_sales += net_item_amount;
                    }
                }

                items.push(InvoiceItem {
                    id: line_id,
                    invoice_id: inv_id.clone(),
                    item_name: iname,
                    description: idesc,
                    qty,
                    unit_price: rate,
                    amount,
                    tax_type: if is_senior_or_pwd && bir_tax_type == "VAT_12" {
                        "VAT_EXEMPT".to_string()
                    } else {
                        bir_tax_type
                    },
                    discount_percent: disc_pct,
                    is_senior_pwd: is_senior_or_pwd,
                });
            }

            // Fallback if no line items parsed
            if items.is_empty() {
                let subtotal = subtotal_re
                    .captures(block)
                    .and_then(|c| c[1].trim().parse::<f64>().ok())
                    .unwrap_or(0.0);

                gross_amount = subtotal;
                vatable_sales = subtotal;
                items.push(InvoiceItem {
                    id: Uuid::new_v4().to_string(),
                    invoice_id: inv_id.clone(),
                    item_name: "QuickBooks Sales Item".to_string(),
                    description: "Imported from QuickBooks Desktop".to_string(),
                    qty: 1.0,
                    unit_price: subtotal,
                    amount: subtotal,
                    tax_type: "VAT_12".to_string(),
                    discount_percent: 0.0,
                    is_senior_pwd: false,
                });
            }

            let vat_amount = if seller_settings.is_vat_registered && vatable_sales > 0.0 {
                (vatable_sales * 0.12 * 100.0).round() / 100.0
            } else {
                0.0
            };

            let withholding_tax_rate = if !is_senior_or_pwd && gross_amount > 50000.0 {
                0.01 // Standard 1% for corporate purchases of goods
            } else {
                0.0
            };

            let withholding_tax_amount = if withholding_tax_rate > 0.0 {
                ((vatable_sales + vat_exempt_sales + zero_rated_sales) * withholding_tax_rate * 100.0).round() / 100.0
            } else {
                0.0
            };

            let net_amount_payable = (vatable_sales + vat_exempt_sales + zero_rated_sales + non_vat_sales + vat_amount - withholding_tax_amount).round();

            let mut inv = Invoice {
                id: inv_id,
                ref_number,
                qb_txn_id: txn_id,
                customer_name,
                customer_tin,
                customer_branch,
                customer_address,
                customer_business_style,
                txn_date,
                due_date,
                invoice_type: "SALES_INVOICE".to_string(),
                gross_amount,
                vatable_sales,
                vat_exempt_sales,
                zero_rated_sales,
                non_vat_sales,
                vat_amount,
                discount_amount: total_discount,
                discount_type: if is_senior_or_pwd { Some("SENIOR".to_string()) } else { None },
                discount_id_no: if is_senior_or_pwd { Some("OSCA-VERIFIED".to_string()) } else { None },
                withholding_tax_rate,
                withholding_tax_amount,
                net_amount_payable,
                status: "VALIDATED".to_string(),
                eis_status: "NOT_SENT".to_string(),
                eis_ack_number: None,
                eis_hash: None,
                eis_transmitted_at: None,
                eis_error_message: None,
                created_at: now.clone(),
                updated_at: now.clone(),
                items,
            };

            inv.eis_hash = Some(BirEisEngine::compute_invoice_hash(&inv, seller_settings));
            invoices.push(inv);
        }

        Ok(invoices)
    }
}
