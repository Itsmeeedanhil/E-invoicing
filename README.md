# BIR EIS & QuickBooks E-Invoicing Compliance System

A desktop application built with **Tauri 2 (Rust)**, **React.js (Vite + Tailwind CSS)**, **QuickBooks Desktop SDK (QBSDK / QBXML COM)**, and **Local MS Access Database (`.accdb`)** storage, engineered to comply with the **Bureau of Internal Revenue (BIR) Philippines Electronic Invoicing System (EIS)** regulations (RR No. 8-2022, RR No. 9-2021, TRAIN Law RA 10963) and **Computerized Accounting System (CAS)** standards.

---

## 🏛️ BIR Compliance: EIS vs IES Clarification

> **Official Name**: The BIR official electronic invoicing initiative is **BIR EIS (Electronic Invoicing / Electronic Receipting System)**, not "IES". 
> 
> Under **Revenue Regulations (RR) No. 8-2022** and **RR No. 9-2021**:
> - Taxpayers engaged in export of goods/services, e-commerce, and Large Taxpayers Service (LTS) are required to issue electronic receipts/invoices and transmit sales data in real-time or within 3 calendar days to the BIR EIS portal.
> - Taxpayers operating Computerized Accounting Systems (CAS) must maintain strict audit trails, sequential numbering without gaps, 12% VAT calculations, Senior/PWD statutory exemption rules, and digital hashing (SHA-256).

---

## 🚀 Key Features

1. **BIR EIS Compliance Engine**:
   - **TIN Validation**: Validates 9 and 12-digit Philippine TIN with branch codes (`XXX-XXX-XXX-XXXXX`).
   - **Tax Classifications**:
     - 12% VATable Sales (`Net = Gross / 1.12`, `Output VAT = Net * 0.12`).
     - 0% VAT-Exempt Sales (Statutory Exempt goods & services).
     - 0% Zero-Rated Sales (PEZA registered enterprises & direct exports).
     - Non-VAT & Creditable Withholding Tax (BIR Form 2307 / 1% Goods, 2% Services).
     - Senior Citizen & PWD 20% statutory discount + VAT-Exempt deductions.
   - **Canonical EIS JSON Generator**: Conforms to standard BIR EIS transmission schemas.
   - **SHA-256 Cryptographic Hash**: Automatic digest computation for anti-tampering verification.
   - **Batch Transmission**: Batch transmission to BIR EIS with official Acknowledgement Numbers (`EIS-ACK-YYYYMMDD-XXXXX`).

2. **QuickBooks Desktop SDK (QBSDK) Integration**:
   - **Direct COM Bridge**: Interfaces with `QBXMLRP2.RequestProcessor` via Windows COM.
   - **QBXML Query Builder**: Builds `InvoiceQueryRq`, `SalesReceiptQueryRq`, `CustomerQueryRq`.
   - **Tax Code Mapping Studio**: Maps QuickBooks sales tax codes (`TAX`, `NON`, `ZERO`, `SENIOR`, `EWT_1`, `EWT_2`) directly into BIR EIS tax categories.
   - **Integrated QBSDK Simulator**: Built-in simulator allows testing and syncing invoices even when QuickBooks is closed.

3. **Local MS Access Database (`.accdb` / `.mdb`)**:
   - **OLEDB / ODBC Integration**: Uses Windows `Microsoft.ACE.OLEDB` / Access ODBC drivers.
   - **Schema Tables**:
     - `tbl_Invoices` - Primary sales records with BIR EIS status and SHA-256 hashes.
     - `tbl_InvoiceItems` - Detailed line items, tax classifications, unit rates.
     - `tbl_BIR_Transmissions` - EIS batch history and official acknowledgement codes.
     - `tbl_CAS_AuditTrail` - Immutable chronological CAS compliance log.
     - `tbl_TaxMappings` - QuickBooks-to-BIR tax rules.
   - **1-Click Access Initializer & Exporter**: Auto-generates the database and exports data.

4. **Official BIR Sales Invoice & OR Printing**:
   - Formatted strictly according to BIR CAS printing requirements.
   - Includes mandatory BIR footer, CAS Permit to Use (PTU) number, ACCN, POS machine ID, date issued, and 5-year validity clause.
   - Scannable BIR EIS QR Code containing digital payload verification data.

---

## 🛠️ Tech Stack

- **Desktop Container & Backend**: [Tauri v2](https://v2.tauri.app/) (Rust 1.98+)
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4
- **Icons & UI**: Lucide React + Plus Jakarta Sans + JetBrains Mono
- **Database**: Local SQLite + MS Access (`.accdb` / OLEDB Bridge)
- **Accounting SDK**: QuickBooks Desktop SDK 13.0 / 14.0 (QBXML COM)

---

## 📦 Getting Started

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v22)
- **Rust**: 1.80+ (tested on Rust 1.98)
- **Windows OS**: Windows 10 or 11 (64-bit)
- *(Optional for Live QuickBooks)*: QuickBooks Desktop Pro, Premier, or Enterprise installed.
- *(Optional for MS Access)*: Microsoft Access 2016+ or Microsoft Access Database Engine Redistributable.

### 2. Running in Development Mode
```powershell
# Run the Vite React frontend and Tauri desktop application together:
npm run tauri dev
```

### 3. Running Frontend Web Preview Only
```powershell
npm run dev
```

### 4. Building Production Desktop Installer (`.exe` / `.msi`)
```powershell
npm run tauri build
```

---

## 📂 Project Structure

```
E-invoice/
├── src-tauri/                  # Tauri (Rust) Backend
│   ├── src/
│   │   ├── access_bridge.rs    # MS Access (.accdb) ADOX & OLEDB bridge
│   │   ├── bir_eis.rs          # BIR EIS tax engine, SHA-256, validation, transmission
│   │   ├── commands.rs         # Tauri #[tauri::command] API endpoints
│   │   ├── db.rs               # Local SQLite database & CAS audit log
│   │   ├── models.rs           # Core Data Transfer Objects (DTOs)
│   │   ├── quickbooks.rs       # QBSDK COM / QBXML builder & processor
│   │   ├── lib.rs              # Tauri runtime initializer
│   │   └── main.rs             # Application entry point
│   ├── Cargo.toml              # Rust crate dependencies
│   └── tauri.conf.json         # Tauri configuration & window dimensions
├── src/                        # React Frontend
│   ├── components/
│   │   ├── Header.tsx          # Real-time connection indicators & BIR status
│   │   ├── Sidebar.tsx         # App navigation tabs
│   │   ├── DashboardView.tsx   # BIR KPIs, VAT summary, quick actions
│   │   ├── BirComplianceCenter.tsx # Batch transmission & invoice directory
│   │   ├── QuickBooksStudio.tsx    # QBSDK COM connection & Tax Code mapping
│   │   ├── AccessDbManager.tsx     # Local MS Access (.accdb) table viewer & backup
│   │   ├── PrintableInvoice.tsx    # BIR CAS official printable invoice & QR code
│   │   ├── InvoiceDetailModal.tsx  # Tax calculation inspector & EIS validator
│   │   ├── SettingsView.tsx        # BIR Seller profile, PTU, ACCN, & API setup
│   │   ├── AuditLogView.tsx        # Immutable CAS audit trail
│   │   └── TransmissionModal.tsx   # BIR EIS batch transmission receipt modal
│   ├── services/
│   │   └── api.ts              # Tauri IPC bridge & offline fallback handlers
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces
│   ├── App.tsx                 # Master state coordinator
│   ├── index.css               # Tailwind CSS & Print styles
│   └── main.tsx                # React DOM mount
├── package.json
└── vite.config.ts
```

---

## ⚖️ Tax Breakdown Verification Rules

| Tax Classification | Rate | Output VAT Formula | Notes |
| :--- | :--- | :--- | :--- |
| **VATable Sales** | 12% | `Vatable Sales × 0.12` | Standard goods and commercial services. |
| **VAT-Exempt Sales** | 0% | `₱0.00` | Raw foods, statutory exempt items, Senior/PWD purchases. |
| **Zero-Rated Sales** | 0% | `₱0.00` | PEZA accredited ecozone locators & direct foreign export. |
| **Senior/PWD 20%** | -20% | `₱0.00 (Exempt)` | Statutory 20% discount on gross, net is VAT-Exempt. |
| **Creditable EWT (2307)** | 1% or 2% | `Base × Rate` | Withheld by top withholding agents (1% goods, 2% svc). |
