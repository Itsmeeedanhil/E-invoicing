# 📖 BIR EIS & QuickBooks E-Invoicing System — Comprehensive User Manual
**Philippine Bureau of Internal Revenue (BIR) Compliance Guide (RR No. 8-2022 & RR No. 9-2021)**

---

## Table of Contents
1. [Introduction & Regulatory Foundation](#1-introduction--regulatory-foundation)
2. [Prerequisites & System Requirements](#2-prerequisites--system-requirements)
3. [First-Time Configuration (Seller Profile & CAS Permit)](#3-first-time-configuration-seller-profile--cas-permit)
4. [Connecting to Live QuickBooks Desktop via QBSDK](#4-connecting-to-live-quickbooks-desktop-via-qbsdk)
5. [QuickBooks to BIR Tax Code Mapping](#5-quickbooks-to-bir-tax-code-mapping)
6. [Daily Invoicing Workflow & Tax Computations](#6-daily-invoicing-workflow--tax-computations)
   - 6.1 [12% Standard Vatable Sales](#61-12-standard-vatable-sales)
   - 6.2 [0% VAT-Exempt Sales & Senior Citizen / PWD 20% Discounts](#62-0-vat-exempt-sales--senior-citizen--pwd-20-discounts)
   - 6.3 [0% Zero-Rated Sales (PEZA & Direct Exports)](#63-0-zero-rated-sales-peza--direct-exports)
   - 6.4 [Creditable Withholding Tax (BIR Form 2307 / EWT)](#64-creditable-withholding-tax-bir-form-2307--ewt)
7. [Validating & Transmitting Batches to BIR EIS](#7-validating--transmitting-batches-to-bir-eis)
8. [Printing Official BIR Sales Invoices & QR Verification](#8-printing-official-bir-sales-invoices--qr-verification)
9. [Local MS Access Database (`.accdb`) Operations](#9-local-ms-access-database-accdb-operations)
10. [CAS Immutable Audit Trail Inspection](#10-cas-immutable-audit-trail-inspection)
11. [Troubleshooting & FAQ](#11-troubleshooting--faq)

---

## 1. Introduction & Regulatory Foundation

The **BIR EIS & QuickBooks E-Invoicing System** is a Computerized Accounting System (CAS) companion desktop application designed for Philippine taxpayers. It bridges **QuickBooks Desktop** with the **Bureau of Internal Revenue Electronic Invoicing / e-Receipting System (BIR EIS)** mandated under Republic Act No. 10963 (**TRAIN Law**), **Revenue Regulations (RR) No. 8-2022**, and **RR No. 9-2021**.

### Mandatory Compliance Rules Enforced:
- **Zero Gaps in Numbering**: Continuous sequential serial numbers (`SI-YYYY-XXXXXX`).
- **Cryptographic Anti-Tampering**: Each invoice receives a canonical **SHA-256 digital payload hash**.
- **Accurate VAT Breakdown**: Automatic itemized calculation of 12% Output VAT, VAT-Exempt base, Zero-Rated base, 20% Senior/PWD statutory discount deduction, and Creditable Withholding Tax (EWT).
- **Mandatory BIR Document Footer**: Auto-includes CAS Permit to Use (PTU) number, ACCN, POS Machine ID, date of issuance, and the mandatory statutory clause: *"THIS INVOICE SHALL BE VALID FOR FIVE (5) YEARS FROM THE DATE OF THE PERMIT TO USE"*.
- **Scannable QR Code**: Embeds an encrypted BIR verification payload on every printed invoice.

---

## 2. Prerequisites & System Requirements

- **Operating System**: Microsoft Windows 10 or Windows 11 (64-bit).
- **QuickBooks**: QuickBooks Desktop Pro, Premier, Enterprise (2018 or later).
- **Database**: Local MS Access Engine (`Microsoft.ACE.OLEDB` or Microsoft Access 2016+).
- **Node.js**: v18.0+ & **Rust**: 1.80+ (for source builds).

---

## 3. First-Time Configuration (Seller Profile & CAS Permit)

Before synchronizing invoices, configure your official taxpayer information in accordance with your **BIR Certificate of Registration (BIR Form 2303)** and **Permit to Use (PTU)**:

1. In the left navigation menu, click **BIR & Tax Settings**.
2. Complete the required fields:
   - **Registered Business Name**: Enter exact legal name matching BIR Form 2303 (e.g., `MANILA ENTERPRISE SOLUTIONS CORP.`).
   - **Trade / Doing Business As Name**: (e.g., `MES CORP`).
   - **Business Line / Style**: (e.g., `COMMERCIAL SOFTWARE & TRADING`).
   - **Taxpayer TIN**: 9 or 12 numeric digits with branch code formatted as `XXX-XXX-XXX-XXXXX` (e.g., `123-456-789-00000`).
   - **Branch Code**: `00000` for Head Office, or specific 5-digit branch identifier.
   - **Revenue District Office (RDO)**: (e.g., `047` for East Makati).
   - **VAT Registration**: Check `VAT-Registered Enterprise` if subject to 12% VAT.
   - **CAS Permit to Use (PTU) Number**: (e.g., `CAS-2024-008921-MA`).
   - **ACCN Number**: Acknowledgement Certificate Control Number.
   - **POS / Machine ID**: Terminal identifier (e.g., `POS-01-MKT`).
   - **Permit Valid Until**: Expiry date (standard 5-year validity).
   - **QuickBooks Company File Path**: File path to your live `.QBW` file.
   - **MS Access Database Path**: Destination `.accdb` file path.
3. Click **Save All Settings**.

---

## 4. Connecting to Live QuickBooks Desktop via QBSDK

The system connects to live QuickBooks company files using the **QuickBooks Foundation Classes (QBSDK) COM RequestProcessor (`QBXMLRP2.RequestProcessor`)**.

### Step-by-Step Connection Procedure:
1. Launch **QuickBooks Desktop** on your computer.
2. Open your company file (`.QBW`) and log in with an Administrator or Invoicing account.
3. Keep QuickBooks running in the background.
4. In the E-Invoicing app, navigate to **QuickBooks Sync**.
5. Click **Test Connection** or **Sync Invoices Now**.
6. **Intuit Authorization Prompt**:
   - QuickBooks will display an official security dialog:
     > *"Do you want to allow this application to read and modify this company file?"*
   - Select option: **"Yes, whenever this QuickBooks company file is open"**.
   - If prompted for a user, select `Admin` or the current logged-in user.
   - Click **Continue** and confirm by clicking **Done**.
7. The status card will update to **CONNECTED** with green live status indicators.

---

## 5. QuickBooks to BIR Tax Code Mapping

QuickBooks Desktop uses custom Sales Tax Codes on line items. To ensure invoices convert into Philippine tax classifications automatically, configure the **Tax Code Mapping Matrix**:

1. Navigate to **QuickBooks Sync**.
2. Scroll to the **Tax Code Mapping Matrix** section.
3. Verify or adjust the standard Philippine mappings:

| QuickBooks Tax Code | Target BIR Classification | Tax Rate | Description / Rule |
| :--- | :--- | :--- | :--- |
| `TAX` | `12% VAT (Vatable Sales)` | `0.12` | Standard 12% Value Added Tax on domestic sales. |
| `NON` | `0% VAT-Exempt` | `0.00` | Non-vatable statutory exempt goods & services. |
| `ZERO` | `0% Zero-Rated` | `0.00` | PEZA accredited ecozone locators & direct foreign exports. |
| `SENIOR` | `0% VAT-Exempt (Senior/PWD)` | `0.00` | Applies 20% statutory discount and removes 12% VAT. |
| `EWT_1` | `Non-VAT / Creditable EWT` | `0.01` | 1% Creditable Withholding Tax on purchase of goods (BIR Form 2307). |
| `EWT_2` | `Non-VAT / Creditable EWT` | `0.02` | 2% Creditable Withholding Tax on purchase of services (BIR Form 2307). |

4. Click **Save Mappings**.

---

## 6. Daily Invoicing Workflow & Tax Computations

### 6.1 12% Standard Vatable Sales
For standard commercial goods and services:
$$\text{Gross Amount} = \text{Quantity} \times \text{Unit Price}$$
$$\text{Vatable Sales (Net of VAT)} = \text{Gross Amount}$$
$$\text{Output VAT (12\%)} = \text{Vatable Sales} \times 0.12$$
$$\text{Total Amount Payable} = \text{Vatable Sales} + \text{Output VAT} - \text{Withholding Tax}$$

### 6.2 0% VAT-Exempt Sales & Senior Citizen / PWD 20% Discounts
Under Republic Act No. 9994 (Expanded Senior Citizens Act) and RA 10754 (PWD Act):
1. When an invoice is issued to a Senior Citizen or Person With Disability (PWD):
2. In the **Invoice Detail Modal**, select `SENIOR` or `PWD` under Discount Type.
3. Enter the mandatory **OSCA ID Number** or **PWD ID Number**.
4. The calculation automatically applies:
$$\text{Statutory Discount (20\%)} = \text{Gross Amount} \times 0.20$$
$$\text{VAT-Exempt Sales} = \text{Gross Amount} - \text{Statutory Discount}$$
$$\text{Output VAT} = \text{₱0.00 (Exempt)}$$
$$\text{Net Payable} = \text{VAT-Exempt Sales}$$

### 6.3 0% Zero-Rated Sales (PEZA & Direct Exports)
For export enterprises or enterprises registered with PEZA / BOI:
1. Ensure the item tax type is set to `ZERO_RATED`.
2. Output VAT is computed as `₱0.00`.
3. The total amount is classified under **Zero-Rated Sales** in the BIR Tax Breakdown Box.

### 6.4 Creditable Withholding Tax (BIR Form 2307 / EWT)
When dealing with Top Withholding Agents (TWAs) or corporate buyers withholding tax:
1. Select the withholding rate: `1% (Goods)`, `2% (Services)`, or `5% (Rental/Prof. Fees)`.
2. Withholding tax is computed strictly on the **Net Base (exclusive of 12% VAT)**.
3. Deducted from Net Payable:
$$\text{Net Amount Payable} = \text{Gross} + \text{VAT} - \text{Withholding Tax Amount}$$

---

## 7. Validating & Transmitting Batches to BIR EIS

1. Navigate to **BIR EIS Invoices**.
2. Review the list of synced invoices. Statuses include:
   - `NOT_SENT`: Newly synced from QuickBooks.
   - `QUEUED`: Ready for EIS transmission.
   - `ACCEPTED`: Successfully transmitted and acknowledged by the BIR EIS gateway.
3. **Inspect and Validate**:
   - Click on any invoice row or the eye icon to view the **Invoice Inspector**.
   - Check the **BIR Compliance Score** (target: 100%).
   - Switch to the **BIR EIS JSON & Hash** tab to preview the canonical JSON payload and SHA-256 hash.
4. **Batch Transmission**:
   - Select multiple invoices using the checkboxes.
   - Click **Transmit Selected (N)** or click **Transmit to BIR EIS** on the Dashboard.
   - The app securely transmits the JSON batch payload to the BIR EIS API.
   - A **BIR EIS Transmission Receipt Modal** will display the official **Acknowledgement Number** (e.g., `EIS-ACK-20261001-99214`) and batch hash.

---

## 8. Printing Official BIR Sales Invoices & QR Verification

1. Navigate to **BIR EIS Invoices**.
2. Click the **Printer Icon** on any invoice.
3. The **Official BIR Sales Invoice Preview** opens in compliance with BIR CAS formatting:
   - Official Taxpayer Header & TIN.
   - Serial Invoice Number.
   - Sold To Buyer Name, TIN, Branch, and Registered Address.
   - Itemized table with quantity, unit rates, and tax category indicators (`V` for Vatable, `E` for Exempt, `Z` for Zero-Rated).
   - Official **Sales Summary & VAT Breakdown Box**.
   - **Scannable BIR QR Code** containing encrypted verification payload.
   - Statutory footer with CAS Permit Number, ACCN, POS Machine ID, and 5-year validity statement.
4. Click **Print Invoice** to print directly or export as a PDF.

---

## 9. Local MS Access Database (`.accdb`) Operations

The system maintains a local **Microsoft Access Database (`.accdb`)** containing your entire sales, tax, and transmission audit trail.

1. Navigate to **MS Access Hub**.
2. **Initialize Database**:
   - If setting up on a new workstation, click **Initialize Access DB**.
   - This automatically creates the `.accdb` file and structured tables (`tbl_Invoices`, `tbl_InvoiceItems`, `tbl_BIR_Transmissions`, `tbl_CAS_AuditTrail`, `tbl_TaxMappings`).
3. **Export & Backup**:
   - Click **Export Invoices to .accdb** to synchronize and back up all QuickBooks and BIR invoice records.
4. **Table Inspector**:
   - Switch between table tabs (`tbl_Invoices`, `tbl_BIR_Transmissions`, `tbl_TaxMappings`, `tbl_CAS_AuditTrail`) to inspect records directly inside the application.

---

## 10. CAS Immutable Audit Trail Inspection

Under BIR CAS regulations, all invoice creations, edits, deletions, QuickBooks synchronizations, and EIS transmissions must be logged chronologically without alteration.

1. Navigate to **CAS Audit Trail**.
2. Search or filter through system logs:
   - `Timestamp`: ISO 8601 recorded date & time.
   - `Action Event`: E.g., `SYNC_QUICKBOOKS_LIVE`, `SAVE_INVOICE`, `BIR_EIS_TRANSMISSION`.
   - `Entity Reference`: Invoice reference number or batch ID.
   - `Operator`: Active username or `SYSTEM`.
   - `Event Details`: Exact parameters and status messages.

---

## 11. Troubleshooting & FAQ

### Q1: QuickBooks gives error "Could not start QuickBooks" (0x80040408)
- **Cause**: QuickBooks Desktop is not open or running on this Windows computer.
- **Solution**: Open QuickBooks Desktop, log into your company file (`.QBW`), and click **Sync Invoices Now** again.

### Q2: QuickBooks gives error "A modal dialog is currently open in QuickBooks" (0x80040416)
- **Cause**: An open window, alert popup, or preference window is currently active inside QuickBooks.
- **Solution**: Switch to QuickBooks, close any open modal dialogs, and re-run the sync.

### Q3: Permission prompt doesn't appear in QuickBooks
- **Solution**: In QuickBooks Desktop, go to **Edit** > **Preferences** > **Integrated Applications** > **Company Preferences**. Ensure the E-Invoicing application is listed and check the **Allow Access** checkbox.

### Q4: Customer TIN displays as Warning in Compliance Score
- **Cause**: The buyer TIN is missing or not in 9/12 digit format (`XXX-XXX-XXX-XXXXX`).
- **Solution**: Click on the invoice in **BIR EIS Invoices**, edit the Customer TIN field, and click **Save Changes**.

---

*BIR EIS & QuickBooks Compliance System • Developed for Philippine Tax Law Compliance (RA 10963 / RR 8-2022)*
