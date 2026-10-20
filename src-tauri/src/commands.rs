use crate::access_bridge::AccessDbBridge;
use crate::bir_eis::BirEisEngine;
use crate::db::Database;
use crate::models::*;
use crate::quickbooks::QuickBooksSdk;
use chrono::Local;
use tauri::State;

#[tauri::command]
pub fn get_company_settings(db: State<Database>) -> Result<CompanySettings, String> {
    db.get_company_settings().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_company_settings(
    settings: CompanySettings,
    db: State<Database>,
) -> Result<(), String> {
    db.save_company_settings(&settings)
        .map_err(|e| e.to_string())?;

    let _ = db.add_audit_log(
        "UPDATE_SETTINGS",
        "COMPANY_SETTINGS",
        "1",
        "USER",
        &format!(
            "Updated BIR Company Settings: TIN={}, PTU={}, ACCN={}",
            settings.tin, settings.cas_ptu_no, settings.accn_no
        ),
    );

    Ok(())
}

#[tauri::command]
pub fn get_all_invoices(db: State<Database>) -> Result<Vec<Invoice>, String> {
    db.get_all_invoices().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_invoice_by_id(id: String, db: State<Database>) -> Result<Option<Invoice>, String> {
    db.get_invoice_by_id(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_invoice(invoice: Invoice, db: State<Database>) -> Result<(), String> {
    let seller = db.get_company_settings().map_err(|e| e.to_string())?;
    
    // Auto-calculate EIS hash
    let mut updated = invoice;
    updated.eis_hash = Some(BirEisEngine::compute_invoice_hash(&updated, &seller));
    updated.updated_at = Local::now().to_rfc3339();

    db.save_invoice(&updated).map_err(|e| e.to_string())?;

    let _ = db.add_audit_log(
        "SAVE_INVOICE",
        "INVOICE",
        &updated.ref_number,
        "USER",
        &format!(
            "Saved Invoice {} for {} (Gross: ₱{:.2}, Net: ₱{:.2})",
            updated.ref_number, updated.customer_name, updated.gross_amount, updated.net_amount_payable
        ),
    );

    Ok(())
}

#[tauri::command]
pub fn delete_invoice(id: String, db: State<Database>) -> Result<(), String> {
    let inv = db.get_invoice_by_id(&id).map_err(|e| e.to_string())?;
    let ref_num = inv.map(|i| i.ref_number).unwrap_or_else(|| id.clone());

    db.delete_invoice(&id).map_err(|e| e.to_string())?;

    let _ = db.add_audit_log(
        "DELETE_INVOICE",
        "INVOICE",
        &ref_num,
        "USER",
        &format!("Deleted Invoice {}", ref_num),
    );

    Ok(())
}

#[tauri::command]
pub async fn test_quickbooks_connection(db: State<'_, Database>) -> Result<QbConnectionStatus, String> {
    let settings = db.get_company_settings().map_err(|e| e.to_string())?;
    let qb_path = settings.qb_company_path.clone();

    let status = tauri::async_runtime::spawn_blocking(move || {
        QuickBooksSdk::test_connection(&qb_path)
    })
    .await
    .map_err(|e| format!("Background task error: {}", e))?;

    let _ = db.add_audit_log(
        "QB_TEST_CONNECTION",
        "QUICKBOOKS_SDK",
        "COM",
        "SYSTEM",
        &format!("QuickBooks connection tested: {}", status.message),
    );

    Ok(status)
}

#[tauri::command]
pub async fn sync_quickbooks_invoices(db: State<'_, Database>) -> Result<Vec<Invoice>, String> {
    let settings = db.get_company_settings().map_err(|e| e.to_string())?;
    let tax_mappings = db.get_tax_mappings().map_err(|e| e.to_string())?;

    let settings_clone = settings.clone();
    let tax_mappings_clone = tax_mappings.clone();

    // Fetch live invoices on a background worker thread so the UI window never freezes
    let synced = tauri::async_runtime::spawn_blocking(move || {
        QuickBooksSdk::fetch_live_invoices(
            &settings_clone.qb_company_path,
            None,
            50,
            &tax_mappings_clone,
            &settings_clone,
        )
    })
    .await
    .map_err(|e| format!("Background task error: {}", e))??;

    let mut saved_count = 0;
    for inv in &synced {
        let mut inv_with_hash = inv.clone();
        inv_with_hash.eis_hash = Some(BirEisEngine::compute_invoice_hash(&inv_with_hash, &settings));
        if db.save_invoice(&inv_with_hash).is_ok() {
            saved_count += 1;
        }
    }

    let _ = db.add_audit_log(
        "SYNC_QUICKBOOKS_LIVE",
        "QUICKBOOKS_SDK",
        "LIVE_COM_BATCH",
        "SYSTEM",
        &format!(
            "Fetched and synchronized {} live invoices from QuickBooks Desktop company.",
            saved_count
        ),
    );

    Ok(synced)
}

#[tauri::command]
pub fn validate_invoice_bir(
    invoice: Invoice,
    db: State<Database>,
) -> Result<BirValidationResult, String> {
    let settings = db.get_company_settings().map_err(|e| e.to_string())?;
    Ok(BirEisEngine::validate_invoice(&invoice, &settings))
}

#[tauri::command]
pub fn generate_bir_eis_payload(
    invoice: Invoice,
    db: State<Database>,
) -> Result<serde_json::Value, String> {
    let settings = db.get_company_settings().map_err(|e| e.to_string())?;
    Ok(BirEisEngine::generate_eis_payload(&invoice, &settings))
}

#[tauri::command]
pub fn transmit_invoices_to_bir_eis(
    invoice_ids: Vec<String>,
    db: State<Database>,
) -> Result<EisTransmission, String> {
    let settings = db.get_company_settings().map_err(|e| e.to_string())?;
    let all_invoices = db.get_all_invoices().map_err(|e| e.to_string())?;

    let target_invoices: Vec<Invoice> = all_invoices
        .into_iter()
        .filter(|inv| invoice_ids.contains(&inv.id))
        .collect();

    if target_invoices.is_empty() {
        return Err("No matching invoices found for BIR EIS transmission.".to_string());
    }

    let transmission = BirEisEngine::transmit_batch(&target_invoices, &settings);

    // Update invoices with EIS transmission details
    let now = Local::now().to_rfc3339();
    for inv in target_invoices {
        let mut updated = inv;
        updated.eis_status = "ACCEPTED".to_string();
        updated.status = "TRANSMITTED".to_string();
        updated.eis_ack_number = Some(transmission.ack_number.clone());
        updated.eis_transmitted_at = Some(now.clone());
        updated.updated_at = now.clone();
        let _ = db.save_invoice(&updated);
    }

    db.record_eis_transmission(&transmission)
        .map_err(|e| e.to_string())?;

    let _ = db.add_audit_log(
        "BIR_EIS_TRANSMISSION",
        "EIS_BATCH",
        &transmission.batch_id,
        "SYSTEM",
        &format!(
            "Transmitted {} invoices to BIR EIS. Ack: {}",
            transmission.invoice_count, transmission.ack_number
        ),
    );

    Ok(transmission)
}

#[tauri::command]
pub fn get_transmissions(db: State<Database>) -> Result<Vec<EisTransmission>, String> {
    db.get_transmissions().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_tax_mappings(db: State<Database>) -> Result<Vec<TaxMapping>, String> {
    db.get_tax_mappings().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_tax_mappings(
    mappings: Vec<TaxMapping>,
    db: State<Database>,
) -> Result<(), String> {
    db.save_tax_mappings(&mappings).map_err(|e| e.to_string())?;
    let _ = db.add_audit_log(
        "UPDATE_TAX_MAPPINGS",
        "TAX_RULES",
        "BATCH",
        "USER",
        &format!("Updated {} tax code mappings.", mappings.len()),
    );
    Ok(())
}

#[tauri::command]
pub fn get_audit_logs(db: State<Database>) -> Result<Vec<AuditLog>, String> {
    db.get_audit_logs().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_access_db_status(db: State<Database>) -> Result<AccessDbStatus, String> {
    let settings = db.get_company_settings().map_err(|e| e.to_string())?;
    let invoices = db.get_all_invoices().map_err(|e| e.to_string())?;
    Ok(AccessDbBridge::get_status(&settings.access_db_path, invoices.len()))
}

#[tauri::command]
pub async fn initialize_ms_access_db(db: State<'_, Database>) -> Result<String, String> {
    let settings = db.get_company_settings().map_err(|e| e.to_string())?;
    let access_path = settings.access_db_path.clone();

    let msg = tauri::async_runtime::spawn_blocking(move || {
        AccessDbBridge::initialize_database(&access_path)
    })
    .await
    .map_err(|e| format!("Background task error: {}", e))??;
    
    let _ = db.add_audit_log(
        "INIT_ACCESS_DB",
        "MS_ACCESS",
        &settings.access_db_path,
        "USER",
        &msg,
    );

    Ok(msg)
}

#[tauri::command]
pub async fn export_to_ms_access(db: State<'_, Database>) -> Result<String, String> {
    let settings = db.get_company_settings().map_err(|e| e.to_string())?;
    let invoices = db.get_all_invoices().map_err(|e| e.to_string())?;
    let access_path = settings.access_db_path.clone();

    let msg = tauri::async_runtime::spawn_blocking(move || {
        AccessDbBridge::export_invoices_to_access(&access_path, &invoices)
    })
    .await
    .map_err(|e| format!("Background task error: {}", e))??;

    let _ = db.add_audit_log(
        "EXPORT_TO_ACCESS",
        "MS_ACCESS",
        &settings.access_db_path,
        "USER",
        &msg,
    );

    Ok(msg)
}

