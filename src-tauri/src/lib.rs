pub mod access_bridge;
pub mod bir_eis;
pub mod commands;
pub mod db;
pub mod models;
pub mod quickbooks;

use commands::*;
use db::Database;
use std::env;
use std::fs;
use std::path::PathBuf;

fn get_app_database_path() -> PathBuf {
    let base_dir = if let Ok(local_app_data) = env::var("LOCALAPPDATA") {
        PathBuf::from(local_app_data).join("BIR_EIS_App")
    } else if let Ok(user_profile) = env::var("USERPROFILE") {
        PathBuf::from(user_profile).join(".bir_eis_app")
    } else {
        env::temp_dir().join("bir_eis_app")
    };

    let _ = fs::create_dir_all(&base_dir);
    base_dir.join("bir_eis_local.db")
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let db_path = get_app_database_path();
    let db_path_str = db_path.to_string_lossy().to_string();
    
    let database = Database::new(&db_path_str).expect("Failed to initialize database");

    tauri::Builder::default()
        .manage(database)
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            use tauri::Manager;
            let icon_bytes = include_bytes!("../icons/icon.png");
            if let Ok(icon) = tauri::image::Image::from_bytes(icon_bytes) {
                for (_, window) in app.webview_windows() {
                    let _ = window.set_icon(icon.clone());
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_company_settings,
            save_company_settings,
            get_all_invoices,
            get_invoice_by_id,
            save_invoice,
            delete_invoice,
            test_quickbooks_connection,
            sync_quickbooks_invoices,
            validate_invoice_bir,
            generate_bir_eis_payload,
            transmit_invoices_to_bir_eis,
            get_transmissions,
            get_tax_mappings,
            save_tax_mappings,
            get_audit_logs,
            get_access_db_status,
            initialize_ms_access_db,
            export_to_ms_access,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
