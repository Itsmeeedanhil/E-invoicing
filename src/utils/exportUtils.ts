import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { Invoice, CompanySettings } from '../types';
import { showToast } from './toast';

/**
 * Decode HTML and XML numeric & named entities like &#241; -> ñ, &amp; -> &, &quot; -> "
 */
export const decodeHtml = (str: string | null | undefined): string => {
  if (!str) return '';
  let s = String(str);
  // Decode decimal numeric entities like &#241;
  s = s.replace(/&#(\d+);/g, (_, dec) => {
    const code = Number(dec);
    return code ? String.fromCharCode(code) : '';
  });
  // Decode hex numeric entities like &#xF1;
  s = s.replace(/&#x([0-9a-fA-F]+);/gi, (_, hex) => {
    const code = parseInt(hex, 16);
    return code ? String.fromCharCode(code) : '';
  });
  // Decode common named entities
  s = s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&ntilde;/g, 'ñ')
    .replace(/&Ntilde;/g, 'Ñ')
    .replace(/&eacute;/g, 'é')
    .replace(/&Eacute;/g, 'É')
    .replace(/&aacute;/g, 'á')
    .replace(/&Aacute;/g, 'Á')
    .replace(/&iacute;/g, 'í')
    .replace(/&Iacute;/g, 'Í')
    .replace(/&oacute;/g, 'ó')
    .replace(/&Oacute;/g, 'Ó')
    .replace(/&uacute;/g, 'ú')
    .replace(/&Uacute;/g, 'Ú')
    .replace(/&deg;/g, '°');

  return s;
};

/**
 * Format currency in Philippine Peso with 2 decimals
 */
export const formatPHP = (val: number | null | undefined) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(num);
};

/**
 * Clean currency string for PDF rendering without font/unicode missing glyphs
 */
const formatPdfPHP = (val: number | null | undefined) => {
  const num = Number(val) || 0;
  return 'PHP ' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

/**
 * Export single invoice to Excel matching the EXACT visual layout and box styling of the BIR Sales Invoice Form
 */
export const exportSingleInvoiceToExcel = async (
  invoice: Invoice,
  settings: CompanySettings | null
): Promise<void> => {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'BIR Electronic Invoicing System';
  wb.created = new Date();

  const sheetName = `Invoice_${invoice.ref_number}`.slice(0, 31);
  const ws = wb.addWorksheet(sheetName, {
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
    },
    views: [{ showGridLines: true }],
  });

  // Column definitions (A: 14, B: 30, C: 16, D: 20, E: 12, F: 22)
  ws.columns = [
    { key: 'colA', width: 15 },
    { key: 'colB', width: 30 },
    { key: 'colC', width: 16 },
    { key: 'colD', width: 20 },
    { key: 'colE', width: 13 },
    { key: 'colF', width: 22 },
  ];

  // Palette constants
  const COLOR_DARK = 'FF0F172A'; // Slate 900
  const COLOR_SLATE700 = 'FF334155'; // Slate 700
  const COLOR_SLATE600 = 'FF475569'; // Slate 600
  const COLOR_SLATE500 = 'FF64748B'; // Slate 500
  const COLOR_BORDER = 'FF94A3B8'; // Slate 400
  const COLOR_LIGHT_BORDER = 'FFCBD5E1'; // Slate 300
  const COLOR_BG_HEADER = 'FFF1F5F9'; // Slate 100
  const COLOR_BG_CARD = 'FFF8FAFC'; // Slate 50
  const COLOR_GREEN = 'FF047857'; // Emerald 700
  const COLOR_RED = 'FFDC2626'; // Red 600

  // Border helper
  const BORDER_THIN: ExcelJS.Border = { style: 'thin', color: { argb: COLOR_LIGHT_BORDER } };
  const BORDER_MEDIUM: ExcelJS.Border = { style: 'medium', color: { argb: COLOR_DARK } };
  const BORDER_BOX: ExcelJS.Border = { style: 'thin', color: { argb: COLOR_BORDER } };

  const applyRangeBorders = (
    startRow: number,
    startCol: number,
    endRow: number,
    endCol: number,
    borders: { top?: ExcelJS.Border; bottom?: ExcelJS.Border; left?: ExcelJS.Border; right?: ExcelJS.Border }
  ) => {
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const cell = ws.getCell(r, c);
        cell.border = {
          ...cell.border,
          ...(r === startRow && borders.top ? { top: borders.top } : {}),
          ...(r === endRow && borders.bottom ? { bottom: borders.bottom } : {}),
          ...(c === startCol && borders.left ? { left: borders.left } : {}),
          ...(c === endCol && borders.right ? { right: borders.right } : {}),
        };
      }
    }
  };

  const applyRangeFill = (
    startRow: number,
    startCol: number,
    endRow: number,
    endCol: number,
    argb: string
  ) => {
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const cell = ws.getCell(r, c);
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb },
        };
      }
    }
  };

  let currentRow = 1;

  // ==========================================
  // 1. REGISTERED HEADER (SELLER INFO)
  // ==========================================
  const headerStartRow = currentRow;

  // Business Name
  const bizName = (decodeHtml(settings?.business_name) || 'REGISTERED BUSINESS NAME').toUpperCase();
  const rowBiz = ws.getRow(currentRow);
  rowBiz.getCell(1).value = bizName;
  rowBiz.getCell(1).font = { name: 'Segoe UI', size: 13, bold: true, color: { argb: COLOR_DARK } };
  rowBiz.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  rowBiz.height = 24;
  ws.mergeCells(currentRow, 1, currentRow, 6);
  currentRow++;

  // Trade Name (if present)
  if (settings?.trade_name) {
    const rowTrade = ws.getRow(currentRow);
    rowTrade.getCell(1).value = `Trade Name: ${decodeHtml(settings.trade_name)}`;
    rowTrade.getCell(1).font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: COLOR_SLATE700 } };
    rowTrade.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    rowTrade.height = 18;
    ws.mergeCells(currentRow, 1, currentRow, 6);
    currentRow++;
  }

  // Address
  const address = decodeHtml(settings?.address) || 'Registered Head Office Address, Philippines';
  const rowAddr = ws.getRow(currentRow);
  rowAddr.getCell(1).value = address;
  rowAddr.getCell(1).font = { name: 'Segoe UI', size: 9, color: { argb: COLOR_SLATE600 } };
  rowAddr.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  rowAddr.height = 18;
  ws.mergeCells(currentRow, 1, currentRow, 6);
  currentRow++;

  // TIN • Branch • RDO
  const tinLine = `TIN: ${settings?.tin || '000-000-000-00000'}   •   Branch: ${settings?.branch_code || '00000'}   •   RDO: ${settings?.rdo || '047'}`;
  const rowTin = ws.getRow(currentRow);
  rowTin.getCell(1).value = tinLine;
  rowTin.getCell(1).font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: COLOR_DARK } };
  rowTin.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  rowTin.height = 18;
  ws.mergeCells(currentRow, 1, currentRow, 6);
  currentRow++;

  // VAT Status Badge
  const vatStatus = settings?.is_vat_registered ? 'VAT REGISTERED ENTERPRISE' : 'NON-VAT REGISTERED';
  const rowVat = ws.getRow(currentRow);
  rowVat.getCell(1).value = vatStatus;
  rowVat.getCell(1).font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: COLOR_GREEN } };
  rowVat.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  rowVat.height = 18;
  ws.mergeCells(currentRow, 1, currentRow, 6);

  // Bottom double/medium border for registered header
  applyRangeBorders(currentRow, 1, currentRow, 6, { bottom: BORDER_MEDIUM });
  currentRow++;

  // Small Spacing Row
  ws.getRow(currentRow).height = 8;
  currentRow++;

  // ==========================================
  // 2. DOCUMENT TITLE & REFERENCE BAR
  // ==========================================
  const docType = invoice.invoice_type.replace(/_/g, ' ').toUpperCase();
  const rowTitle1 = ws.getRow(currentRow);
  rowTitle1.getCell(1).value = docType;
  rowTitle1.getCell(1).font = { name: 'Segoe UI', size: 13, bold: true, color: { argb: COLOR_DARK } };
  rowTitle1.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
  ws.mergeCells(currentRow, 1, currentRow, 3);

  rowTitle1.getCell(4).value = `NO: ${invoice.ref_number}`;
  rowTitle1.getCell(4).font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: COLOR_RED } };
  rowTitle1.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };
  ws.mergeCells(currentRow, 4, currentRow, 6);
  rowTitle1.height = 20;
  currentRow++;

  const rowTitle2 = ws.getRow(currentRow);
  rowTitle2.getCell(1).value = '(BIR CAS Certified Document)';
  rowTitle2.getCell(1).font = { name: 'Segoe UI', size: 8.5, color: { argb: COLOR_SLATE500 } };
  rowTitle2.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
  ws.mergeCells(currentRow, 1, currentRow, 3);

  rowTitle2.getCell(4).value = `Date: ${invoice.txn_date}`;
  rowTitle2.getCell(4).font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: COLOR_SLATE700 } };
  rowTitle2.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };
  ws.mergeCells(currentRow, 4, currentRow, 6);
  rowTitle2.height = 18;

  // Thin separator line
  applyRangeBorders(currentRow, 1, currentRow, 6, { bottom: BORDER_BOX });
  currentRow++;

  // Small Spacing Row
  ws.getRow(currentRow).height = 8;
  currentRow++;

  // ==========================================
  // 3. BUYER & TRANSACTION INFO BOX (2-COL FORM)
  // ==========================================
  const buyerStartRow = currentRow;

  const buyerFields: [string, string, string, string][] = [
    [
      'SOLD TO:',
      decodeHtml(invoice.customer_name).toUpperCase(),
      'BUS. STYLE:',
      decodeHtml(invoice.customer_business_style) || 'COMMERCIAL ENTERPRISE',
    ],
    [
      'TIN:',
      invoice.customer_tin || 'N/A',
      'TERMS / DUE:',
      invoice.due_date || invoice.txn_date,
    ],
    [
      'BRANCH:',
      invoice.customer_branch || '00000',
      'DISCOUNT ID:',
      invoice.discount_type ? `${invoice.discount_id_no || ''} (${invoice.discount_type})` : 'None',
    ],
    [
      'ADDRESS:',
      decodeHtml(invoice.customer_address) || 'Philippines',
      'QB TXN ID:',
      invoice.qb_txn_id || 'N/A',
    ],
  ];

  buyerFields.forEach(([label1, val1, label2, val2]) => {
    const row = ws.getRow(currentRow);
    row.height = 19;

    // Col A: Label 1
    row.getCell(1).value = label1;
    row.getCell(1).font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: COLOR_SLATE600 } };
    row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };

    // Col B & C: Val 1
    row.getCell(2).value = val1;
    row.getCell(2).font = { name: 'Segoe UI', size: 9.5, bold: label1 === 'SOLD TO:' || label1 === 'TIN:', color: { argb: COLOR_DARK } };
    row.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };
    ws.mergeCells(currentRow, 2, currentRow, 3);

    // Col D: Label 2
    row.getCell(4).value = label2;
    row.getCell(4).font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: COLOR_SLATE600 } };
    row.getCell(4).alignment = { horizontal: 'left', vertical: 'middle' };

    // Col E & F: Val 2
    row.getCell(5).value = val2;
    row.getCell(5).font = { name: 'Segoe UI', size: 9.5, color: { argb: COLOR_DARK } };
    row.getCell(5).alignment = { horizontal: 'left', vertical: 'middle' };
    ws.mergeCells(currentRow, 5, currentRow, 6);

    currentRow++;
  });

  const buyerEndRow = currentRow - 1;
  // Apply neat outer box border & fill to Buyer Section
  applyRangeFill(buyerStartRow, 1, buyerEndRow, 6, COLOR_BG_CARD);
  applyRangeBorders(buyerStartRow, 1, buyerEndRow, 6, {
    top: BORDER_BOX,
    bottom: BORDER_MEDIUM,
    left: BORDER_BOX,
    right: BORDER_BOX,
  });

  // Small Spacing Row
  ws.getRow(currentRow).height = 8;
  currentRow++;

  // ==========================================
  // 4. LINE ITEMS TABLE BOX
  // ==========================================
  const tableHeaderRowIdx = currentRow;
  const thRow = ws.getRow(tableHeaderRowIdx);
  thRow.height = 22;

  const thCols = [
    { col: 1, text: 'Qty', align: 'center' as const },
    { col: 2, text: 'Item Description & Details', align: 'left' as const },
    { col: 4, text: 'Unit Price (PHP)', align: 'right' as const },
    { col: 5, text: 'Tax', align: 'center' as const },
    { col: 6, text: 'Amount (PHP)', align: 'right' as const },
  ];

  thCols.forEach(({ col, text, align }) => {
    const cell = thRow.getCell(col);
    cell.value = text;
    cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: COLOR_DARK } };
    cell.alignment = { horizontal: align, vertical: 'middle' };
  });
  ws.mergeCells(tableHeaderRowIdx, 2, tableHeaderRowIdx, 3);

  // Apply table header styling & background
  applyRangeFill(tableHeaderRowIdx, 1, tableHeaderRowIdx, 6, COLOR_BG_HEADER);
  applyRangeBorders(tableHeaderRowIdx, 1, tableHeaderRowIdx, 6, {
    top: BORDER_MEDIUM,
    bottom: BORDER_MEDIUM,
    left: BORDER_BOX,
    right: BORDER_BOX,
  });
  currentRow++;

  // Table Data Rows
  const tableDataStartRow = currentRow;
  invoice.items.forEach((item) => {
    const row = ws.getRow(currentRow);
    const realName = item.item_name && item.item_name !== 'Merchandise / Service'
      ? item.item_name
      : item.description || 'General Merchandise';
    const extraDesc = item.description && item.description !== realName && item.item_name !== 'Merchandise / Service'
      ? '\n' + decodeHtml(item.description)
      : '';
    const desc = `${decodeHtml(realName)}${extraDesc}`;
    const taxCode = item.tax_type === 'VAT_12' ? 'V (12%)' : item.tax_type === 'ZERO_RATED' ? 'Z (0%)' : 'E (Exempt)';
    row.height = extraDesc ? 28 : 20;

    // Col A: Qty
    const cellQty = row.getCell(1);
    cellQty.value = item.qty;
    cellQty.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: COLOR_DARK } };
    cellQty.alignment = { horizontal: 'center', vertical: 'middle' };

    // Col B & C: Description
    const cellDesc = row.getCell(2);
    cellDesc.value = desc;
    cellDesc.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: COLOR_DARK } };
    cellDesc.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
    ws.mergeCells(currentRow, 2, currentRow, 3);

    // Col D: Unit Price
    const cellPrice = row.getCell(4);
    cellPrice.value = item.unit_price;
    cellPrice.numFmt = '#,##0.00';
    cellPrice.font = { name: 'Segoe UI', size: 9.5, color: { argb: COLOR_DARK } };
    cellPrice.alignment = { horizontal: 'right', vertical: 'middle' };

    // Col E: Tax Code
    const cellTax = row.getCell(5);
    cellTax.value = taxCode;
    cellTax.font = { name: 'Segoe UI', size: 8.5, bold: true, color: { argb: COLOR_SLATE700 } };
    cellTax.alignment = { horizontal: 'center', vertical: 'middle' };

    // Col F: Amount
    const cellAmt = row.getCell(6);
    cellAmt.value = item.amount;
    cellAmt.numFmt = '#,##0.00';
    cellAmt.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: COLOR_DARK } };
    cellAmt.alignment = { horizontal: 'right', vertical: 'middle' };

    // Inner line item borders
    applyRangeBorders(currentRow, 1, currentRow, 6, {
      top: BORDER_THIN,
      bottom: BORDER_THIN,
      left: BORDER_BOX,
      right: BORDER_BOX,
    });

    currentRow++;
  });

  const tableDataEndRow = currentRow - 1;
  applyRangeBorders(tableDataEndRow, 1, tableDataEndRow, 6, { bottom: BORDER_MEDIUM });

  // Small Spacing Row
  ws.getRow(currentRow).height = 8;
  currentRow++;

  // ==========================================
  // 5. VAT BREAKDOWN & TOTAL DUE (SIDE-BY-SIDE BOXES)
  // ==========================================
  const summaryStartRow = currentRow;

  // Left Box Header: VAT & SALES SUMMARY BREAKDOWN
  const sumHeaderRow = ws.getRow(currentRow);
  sumHeaderRow.height = 20;

  sumHeaderRow.getCell(1).value = 'VAT & SALES SUMMARY BREAKDOWN';
  sumHeaderRow.getCell(1).font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: COLOR_SLATE700 } };
  sumHeaderRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
  ws.mergeCells(currentRow, 1, currentRow, 3);

  // Right Box: TOTAL AMOUNT DUE Label
  sumHeaderRow.getCell(4).value = 'TOTAL AMOUNT DUE (PHP):';
  sumHeaderRow.getCell(4).font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: COLOR_SLATE600 } };
  sumHeaderRow.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };
  ws.mergeCells(currentRow, 4, currentRow, 5);

  sumHeaderRow.getCell(6).value = invoice.net_amount_payable;
  sumHeaderRow.getCell(6).numFmt = '#,##0.00';
  sumHeaderRow.getCell(6).font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: COLOR_DARK } };
  sumHeaderRow.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };

  currentRow++;

  // Summary Rows
  const breakdownRows: [string, number, string, string][] = [
    ['VATable Sales (12%):', invoice.vatable_sales, 'BIR EIS Status:', invoice.eis_status],
    ['VAT-Exempt Sales:', invoice.vat_exempt_sales, 'BIR Ack Number:', invoice.eis_ack_number || 'PENDING'],
    ['Zero-Rated Sales:', invoice.zero_rated_sales, 'SHA-256 Digest:', (invoice.eis_hash || 'N/A').slice(0, 24) + '...'],
    ['12% Output VAT:', invoice.vat_amount, '', ''],
  ];

  if (invoice.discount_amount > 0) {
    breakdownRows.push(['Less: SC / PWD 20% Discount:', -invoice.discount_amount, '', '']);
  }
  if (invoice.withholding_tax_amount > 0) {
    breakdownRows.push(['Less: Creditable EWT (2307):', -invoice.withholding_tax_amount, '', '']);
  }

  breakdownRows.forEach(([lblLeft, valLeft, lblRight, valRight]) => {
    const row = ws.getRow(currentRow);
    row.height = 18;

    // Left Column Label (A)
    row.getCell(1).value = lblLeft;
    row.getCell(1).font = {
      name: 'Segoe UI',
      size: 9,
      bold: lblLeft.includes('Output VAT') || lblLeft.includes('VATable'),
      color: { argb: COLOR_DARK },
    };
    row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };

    // Left Column Value (B:C merged)
    row.getCell(2).value = valLeft;
    row.getCell(2).numFmt = '#,##0.00';
    row.getCell(2).font = {
      name: 'Segoe UI',
      size: 9,
      bold: lblLeft.includes('Output VAT'),
      color: { argb: COLOR_DARK },
    };
    row.getCell(2).alignment = { horizontal: 'right', vertical: 'middle' };
    ws.mergeCells(currentRow, 2, currentRow, 3);

    // Right Column Label (D:E merged)
    if (lblRight) {
      row.getCell(4).value = lblRight;
      row.getCell(4).font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: COLOR_SLATE600 } };
      row.getCell(4).alignment = { horizontal: 'left', vertical: 'middle' };
      ws.mergeCells(currentRow, 4, currentRow, 5);

      // Right Column Value (F)
      row.getCell(6).value = valRight;
      row.getCell(6).font = { name: 'Segoe UI', size: 8.5, bold: lblRight.includes('Status'), color: { argb: COLOR_DARK } };
      row.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };
    }

    currentRow++;
  });

  const summaryEndRow = currentRow - 1;

  // Style Left Box (VAT Breakdown)
  applyRangeFill(summaryStartRow, 1, summaryEndRow, 3, COLOR_BG_CARD);
  applyRangeBorders(summaryStartRow, 1, summaryEndRow, 3, {
    top: BORDER_BOX,
    bottom: BORDER_BOX,
    left: BORDER_BOX,
    right: BORDER_BOX,
  });

  // Style Right Box (Total Amount & EIS metadata)
  applyRangeFill(summaryStartRow, 4, summaryStartRow, 6, COLOR_BG_HEADER);
  applyRangeBorders(summaryStartRow, 4, summaryEndRow, 6, {
    top: BORDER_BOX,
    bottom: BORDER_BOX,
    left: BORDER_BOX,
    right: BORDER_BOX,
  });

  // Small Spacing Row
  ws.getRow(currentRow).height = 8;
  currentRow++;

  // ==========================================
  // 6. MANDATORY BIR PERMIT & CAS LEGAL FOOTERS
  // ==========================================
  const footerStartRow = currentRow;

  // Permit Row 1
  const fRow1 = ws.getRow(currentRow);
  fRow1.height = 18;
  fRow1.getCell(1).value = `BIR CAS PTU NO:  ${settings?.cas_ptu_no || 'CAS-2024-008921-MA'}`;
  fRow1.getCell(1).font = { name: 'Segoe UI', size: 8.5, color: { argb: COLOR_SLATE700 } };
  fRow1.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
  ws.mergeCells(currentRow, 1, currentRow, 3);

  fRow1.getCell(4).value = `BIR ACCN NO:  ${settings?.accn_no || 'ACCN-047-2024-005612'}`;
  fRow1.getCell(4).font = { name: 'Segoe UI', size: 8.5, color: { argb: COLOR_SLATE700 } };
  fRow1.getCell(4).alignment = { horizontal: 'left', vertical: 'middle' };
  ws.mergeCells(currentRow, 4, currentRow, 6);
  currentRow++;

  // Permit Row 2
  const fRow2 = ws.getRow(currentRow);
  fRow2.height = 18;
  fRow2.getCell(1).value = `POS MACHINE ID:  ${settings?.pos_machine_id || 'POS-01-MKT'}`;
  fRow2.getCell(1).font = { name: 'Segoe UI', size: 8.5, color: { argb: COLOR_SLATE700 } };
  fRow2.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
  ws.mergeCells(currentRow, 1, currentRow, 3);

  fRow2.getCell(4).value = `DATE ISSUED / VALID UNTIL:  ${settings?.valid_until || '2029-12-31'}`;
  fRow2.getCell(4).font = { name: 'Segoe UI', size: 8.5, color: { argb: COLOR_SLATE700 } };
  fRow2.getCell(4).alignment = { horizontal: 'left', vertical: 'middle' };
  ws.mergeCells(currentRow, 4, currentRow, 6);
  currentRow++;

  // Notice 1
  const fRow3 = ws.getRow(currentRow);
  fRow3.height = 18;
  fRow3.getCell(1).value = '"THIS INVOICE SHALL BE VALID FOR FIVE (5) YEARS FROM THE DATE OF THE PERMIT TO USE"';
  fRow3.getCell(1).font = { name: 'Segoe UI', size: 8, bold: true, color: { argb: COLOR_DARK } };
  fRow3.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  ws.mergeCells(currentRow, 1, currentRow, 6);
  currentRow++;

  // Notice 2
  const fRow4 = ws.getRow(currentRow);
  fRow4.height = 18;
  fRow4.getCell(1).value = '"THIS DOCUMENT IS NOT VALID FOR CLAIM OF INPUT TAX IF NOT PROPERLY FILLED UP"';
  fRow4.getCell(1).font = { name: 'Segoe UI', size: 8, italic: true, color: { argb: COLOR_SLATE500 } };
  fRow4.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  ws.mergeCells(currentRow, 1, currentRow, 6);

  const footerEndRow = currentRow;
  applyRangeBorders(footerStartRow, 1, footerStartRow, 6, { top: BORDER_MEDIUM });

  // ==========================================
  // MASTER OUTER DOCUMENT BORDER
  // ==========================================
  applyRangeBorders(headerStartRow, 1, footerEndRow, 6, {
    top: BORDER_MEDIUM,
    bottom: BORDER_MEDIUM,
    left: BORDER_MEDIUM,
    right: BORDER_MEDIUM,
  });

  // Export buffer to file download
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const outFileName = `BIR_Invoice_${invoice.ref_number}.xlsx`;
  const a = document.createElement('a');
  a.href = url;
  a.download = outFileName;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);

  showToast({
    title: 'Excel Export Complete',
    message: `BIR Sales Invoice #${invoice.ref_number} exported with official form boxes and styling (${outFileName})!`,
    type: 'success',
  });
};

/**
 * Export multiple invoices to structured Master Excel (.xlsx)
 */
export const exportInvoicesToExcel = (
  invoices: Invoice[],
  filename = 'BIR_EIS_Invoices_Master.xlsx'
) => {
  if (!invoices || invoices.length === 0) {
    alert('No invoices available to export.');
    return;
  }

  const summaryData = invoices.map((inv, idx) => ({
    'No.': idx + 1,
    'Invoice Ref #': inv.ref_number,
    'QB Txn ID': inv.qb_txn_id || 'N/A',
    'Date': inv.txn_date,
    'Due Date': inv.due_date,
    'Buyer Name': decodeHtml(inv.customer_name),
    'Buyer TIN': inv.customer_tin,
    'Branch Code': inv.customer_branch,
    'Business Style': decodeHtml(inv.customer_business_style),
    'Buyer Address': decodeHtml(inv.customer_address),
    'Document Type': inv.invoice_type,
    'Gross Amount (PHP)': inv.gross_amount,
    '12% VATable Sales': inv.vatable_sales,
    '12% Output VAT': inv.vat_amount,
    'VAT-Exempt Sales': inv.vat_exempt_sales,
    'Zero-Rated Sales': inv.zero_rated_sales,
    'Non-VAT Sales': inv.non_vat_sales,
    'Discount Amount': inv.discount_amount,
    'Discount Type': inv.discount_type || 'NONE',
    'Discount ID No.': inv.discount_id_no || '',
    'EWT Rate': `${(inv.withholding_tax_rate * 100).toFixed(0)}%`,
    'EWT 2307 Amount': inv.withholding_tax_amount,
    'Net Payable (PHP)': inv.net_amount_payable,
    'BIR EIS Status': inv.eis_status,
    'BIR Ack Number': inv.eis_ack_number || 'PENDING',
    'SHA-256 Digest Hash': inv.eis_hash || 'N/A',
    'Transmitted At': inv.eis_transmitted_at || 'N/A',
  }));

  const lineItemsData: Record<string, any>[] = [];
  invoices.forEach((inv) => {
    inv.items.forEach((item, itemIdx) => {
      lineItemsData.push({
        'Invoice Ref #': inv.ref_number,
        'Item #': itemIdx + 1,
        'Item Name': decodeHtml(item.item_name),
        'Description': decodeHtml(item.description),
        'Quantity': item.qty,
        'Unit Price (PHP)': item.unit_price,
        'Amount (PHP)': item.amount,
        'Tax Classification': item.tax_type,
        'Discount %': `${item.discount_percent}%`,
        'Senior/PWD Benefit': item.is_senior_pwd ? 'YES' : 'NO',
      });
    });
  });

  const wb = XLSX.utils.book_new();
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  const wsLines = XLSX.utils.json_to_sheet(lineItemsData);

  wsSummary['!cols'] = [
    { wch: 5 },  { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 12 },
    { wch: 32 }, { wch: 20 }, { wch: 12 }, { wch: 25 }, { wch: 35 },
    { wch: 16 }, { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 18 },
    { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 16 },
    { wch: 10 }, { wch: 16 }, { wch: 18 }, { wch: 14 }, { wch: 24 },
    { wch: 35 }, { wch: 24 },
  ];

  wsLines['!cols'] = [
    { wch: 18 }, { wch: 8 },  { wch: 28 }, { wch: 38 }, { wch: 10 },
    { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 12 }, { wch: 18 },
  ];

  XLSX.utils.book_append_sheet(wb, wsSummary, 'Invoices Summary');
  XLSX.utils.book_append_sheet(wb, wsLines, 'Line Items Breakdown');

  XLSX.writeFile(wb, filename);

  showToast({
    title: 'Excel Master File Exported',
    message: `Successfully extracted ${invoices.length} invoice(s) with line items to ${filename}!`,
    type: 'success',
  });
};

/**
 * Direct Auto-Export PDF: Generates and downloads a clean, professional BIR Sales Invoice PDF
 * matching the exact visual layout and pagination of the in-app print preview.
 */
export const autoExportInvoicePdf = async (
  invoice: Invoice,
  settings: CompanySettings | null
): Promise<void> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const leftX = 14;
  const rightX = 196;
  const contentWidth = rightX - leftX; // 182mm
  let y = 12;

  const drawTableHeader = (curY: number): number => {
    let ty = curY + 2.5;
    doc.setFillColor(241, 245, 249); // Slate 100
    doc.rect(leftX, ty - 2.5, contentWidth, 7, 'F');

    // Double/medium borders
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.4);
    doc.line(leftX, ty - 2.5, rightX, ty - 2.5);
    doc.line(leftX, ty + 4.5, rightX, ty + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Qty', leftX + 4, ty + 2);
    doc.text('Item Description', leftX + 22, ty + 2);
    doc.text('Unit Price', leftX + 115, ty + 2, { align: 'right' });
    doc.text('Tax', leftX + 132, ty + 2, { align: 'center' });
    doc.text('Amount (PHP)', rightX - 4, ty + 2, { align: 'right' });

    ty += 5.5;
    return ty;
  };

  // 1. Registered Header (Seller Profile) - Page 1
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text(
    (decodeHtml(settings?.business_name) || 'REGISTERED BUSINESS NAME').toUpperCase(),
    pageWidth / 2,
    y,
    { align: 'center' }
  );

  if (settings?.trade_name) {
    y += 4.5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text(`Trade Name: ${decodeHtml(settings.trade_name)}`, pageWidth / 2, y, { align: 'center' });
  }

  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(decodeHtml(settings?.address) || 'Registered Head Office Address, Philippines', pageWidth / 2, y, {
    align: 'center',
  });

  y += 4.2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(
    `TIN: ${settings?.tin || '000-000-000-00000'}   •   Branch: ${settings?.branch_code || '00000'}   •   RDO: ${settings?.rdo || '047'}`,
    pageWidth / 2,
    y,
    { align: 'center' }
  );

  y += 3.8;
  doc.setFontSize(8.5);
  doc.setTextColor(5, 150, 105); // Emerald 600
  doc.text(
    settings?.is_vat_registered ? 'VAT REGISTERED ENTERPRISE' : 'NON-VAT REGISTERED',
    pageWidth / 2,
    y,
    { align: 'center' }
  );

  y += 4;
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.6);
  doc.line(leftX, y, rightX, y);

  // 2. Document Title & Reference Bar
  y += 5.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.invoice_type.replace(/_/g, ' ').toUpperCase(), leftX + 4, y);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('(BIR CAS Certified Document)', leftX + 4, y + 3.8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(220, 38, 38); // Bold Red Ref Number
  doc.text(`NO: ${invoice.ref_number}`, rightX - 4, y, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`Date: ${invoice.txn_date}`, rightX - 4, y + 4, { align: 'right' });

  y += 7.5;
  doc.setDrawColor(148, 163, 184); // Slate 400
  doc.setLineWidth(0.3);
  doc.line(leftX, y, rightX, y);

  // 3. Buyer & Transaction Information Box (2-Column Form)
  y += 4.5;
  const col1X = leftX + 4;
  const val1X = leftX + 24;
  const col2X = leftX + 96;
  const val2X = leftX + 124;

  // Row 1
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('SOLD TO:', col1X, y);
  doc.setTextColor(15, 23, 42);
  doc.text(decodeHtml(invoice.customer_name).toUpperCase(), val1X, y, { maxWidth: 68 });

  doc.setTextColor(71, 85, 105);
  doc.text('BUS. STYLE:', col2X, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(decodeHtml(invoice.customer_business_style) || 'General Commercial', val2X, y, { maxWidth: 64 });

  // Row 2
  y += 4.5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('TIN:', col1X, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.customer_tin || 'N/A', val1X, y);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('TERMS / DUE:', col2X, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.due_date || invoice.txn_date, val2X, y);

  // Row 3
  y += 4.5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('BRANCH:', col1X, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.customer_branch || '00000', val1X, y);

  if (invoice.discount_type) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(126, 34, 206);
    doc.text('DISCOUNT ID:', col2X, y);
    doc.text(`${invoice.discount_id_no || ''} (${invoice.discount_type})`, val2X, y);
  } else if (invoice.qb_txn_id) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`QB TXN ID: ${invoice.qb_txn_id}`, col2X, y);
    doc.setFontSize(8.5);
  }

  // Row 4
  y += 4.5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('ADDRESS:', col1X, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(decodeHtml(invoice.customer_address) || 'Philippines', val1X, y, { maxWidth: 68 });

  if (invoice.discount_type && invoice.qb_txn_id) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`QB TXN ID: ${invoice.qb_txn_id}`, col2X, y);
    doc.setFontSize(8.5);
  }

  y += 6.5;
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.line(leftX, y, rightX, y);

  // 4. Line Items Table (Page 1 Header)
  y = drawTableHeader(y);

  // Line Item Rows with dynamic multi-page flow matching the browser print layout
  invoice.items.forEach((it) => {
    const realName = it.item_name && it.item_name !== 'Merchandise / Service'
      ? it.item_name
      : it.description || 'General Merchandise';
    const itemDesc = it.description && it.description !== realName && it.item_name !== 'Merchandise / Service'
      ? it.description
      : '';

    const estimatedRowHeight = itemDesc ? 10.5 : 7.0;

    // Check if row exceeds printable page boundary (248mm)
    if (y + estimatedRowHeight > 248) {
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.4);
      doc.line(leftX, y + 1, rightX, y + 1);

      doc.addPage();
      y = 12;
      y = drawTableHeader(y);
    }

    y += 5.2;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(String(it.qty), leftX + 4, y);

    doc.setFont('helvetica', 'bold');
    doc.text(decodeHtml(realName), leftX + 22, y, { maxWidth: 78 });

    doc.setFont('helvetica', 'normal');
    doc.text(formatPdfPHP(it.unit_price), leftX + 115, y, { align: 'right' });
    const taxCode = it.tax_type === 'VAT_12' ? 'V' : it.tax_type === 'ZERO_RATED' ? 'Z' : 'E';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(taxCode, leftX + 132, y, { align: 'center' });
    doc.text(formatPdfPHP(it.amount), rightX - 4, y, { align: 'right' });

    if (itemDesc) {
      y += 3.8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(decodeHtml(itemDesc), leftX + 22, y, { maxWidth: 78 });
    }

    y += 1.8;
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.setLineWidth(0.2);
    doc.line(leftX, y + 1, rightX, y + 1);
  });

  y += 4;
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.5);
  doc.line(leftX, y, rightX, y);

  // 5. Bottom Section: VAT Breakdown Box + Total Due + Scannable BIR QR Code + Permit Footer
  const requiredBottomHeight = 56; // ~56mm needed for summary boxes & BIR legal permit footer
  if (y + requiredBottomHeight > 265) {
    doc.addPage();
    y = 12;
  }

  y += 4.5;
  const taxBoxX = leftX + 4;
  const taxBoxW = 94;
  const taxBoxH = 34;
  const rightBoxX = leftX + 104;
  const rightBoxW = rightX - rightBoxX - 4; // 74mm

  // Left VAT Summary Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.rect(taxBoxX, y, taxBoxW, taxBoxH, 'FD');

  let ty = y + 4.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text('VAT & SALES SUMMARY BREAKDOWN', taxBoxX + 3, ty);
  doc.line(taxBoxX + 3, ty + 1.5, taxBoxX + taxBoxW - 3, ty + 1.5);

  ty += 5.2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('VATable Sales (12%):', taxBoxX + 3, ty);
  doc.text(formatPdfPHP(invoice.vatable_sales), taxBoxX + taxBoxW - 3, ty, { align: 'right' });

  ty += 4.5;
  doc.text('VAT-Exempt Sales:', taxBoxX + 3, ty);
  doc.text(formatPdfPHP(invoice.vat_exempt_sales), taxBoxX + taxBoxW - 3, ty, { align: 'right' });

  ty += 4.5;
  doc.text('Zero-Rated Sales:', taxBoxX + 3, ty);
  doc.text(formatPdfPHP(invoice.zero_rated_sales), taxBoxX + taxBoxW - 3, ty, { align: 'right' });

  ty += 4.5;
  doc.setFont('helvetica', 'bold');
  doc.text('12% Output VAT:', taxBoxX + 3, ty);
  doc.text(formatPdfPHP(invoice.vat_amount), taxBoxX + taxBoxW - 3, ty, { align: 'right' });

  if (invoice.discount_amount > 0) {
    ty += 4.5;
    doc.setTextColor(126, 34, 206);
    doc.text('Less: SC / PWD 20% Discount:', taxBoxX + 3, ty);
    doc.text(`-${formatPdfPHP(invoice.discount_amount)}`, taxBoxX + taxBoxW - 3, ty, { align: 'right' });
  }

  if (invoice.withholding_tax_amount > 0) {
    ty += 4.5;
    doc.setTextColor(180, 83, 9);
    doc.text('Less: Creditable Withholding Tax (2307):', taxBoxX + 3, ty);
    doc.text(`-${formatPdfPHP(invoice.withholding_tax_amount)}`, taxBoxX + taxBoxW - 3, ty, { align: 'right' });
  }

  // Right Side: Total Amount Due + BIR EIS Scannable QR Code
  let ry = y + 3;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('TOTAL AMOUNT DUE', rightX - 4, ry, { align: 'right' });

  ry += 2.5;
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.rect(rightBoxX, ry, rightBoxW, 11, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(formatPdfPHP(invoice.net_amount_payable), rightX - 6, ry + 7.5, { align: 'right' });

  // Generate and embed live BIR QR Code
  const qrPayload = JSON.stringify({
    bir_eis: '1.0',
    tin: settings?.tin,
    buyer_tin: invoice.customer_tin,
    invoice_no: invoice.ref_number,
    date: invoice.txn_date,
    gross: invoice.gross_amount,
    vat: invoice.vat_amount,
    net: invoice.net_amount_payable,
    ack: invoice.eis_ack_number || 'EIS-PENDING',
    hash: invoice.eis_hash || 'SHA256-UNCOMMITTED',
  });

  try {
    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      margin: 1,
      width: 200,
      errorCorrectionLevel: 'M',
    });

    const qrSize = 19;
    const qrX = rightX - qrSize - 4;
    const qrY = ry + 13.5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(5, 150, 105);
    doc.text('BIR EIS SCANNABLE', qrX - 3, qrY + 6, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Ack: ${invoice.eis_ack_number || 'PENDING'}`, qrX - 3, qrY + 10.5, { align: 'right' });
    doc.text(`Status: ${invoice.eis_status}`, qrX - 3, qrY + 14.5, { align: 'right' });

    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
  } catch (err) {
    console.warn('QR Code generation fallback:', err);
    doc.setFontSize(7);
    doc.setTextColor(5, 150, 105);
    doc.text(`BIR EIS Status: ${invoice.eis_status}`, rightBoxX, ry + 16);
    doc.setTextColor(100, 116, 139);
    doc.text(`Ack #: ${invoice.eis_ack_number || 'PENDING'}`, rightBoxX, ry + 20);
  }

  y += Math.max(taxBoxH, 38) + 4;

  // 6. Mandatory BIR Permit & Legal Footer
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(leftX, y, rightX, y);

  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text(`BIR CAS PTU NO: ${settings?.cas_ptu_no || 'CAS-2024-008921-MA'}`, leftX + 4, y);
  doc.text(`BIR ACCN NO: ${settings?.accn_no || 'ACCN-047-2024-005612'}`, leftX + 96, y);

  y += 3.8;
  doc.text(`POS MACHINE ID: ${settings?.pos_machine_id || 'POS-01-MKT'}`, leftX + 4, y);
  doc.text(`DATE ISSUED / VALID UNTIL: ${settings?.valid_until || '2029-12-31'}`, leftX + 96, y);

  y += 5;
  doc.setFontSize(6.5);
  doc.setTextColor(30, 41, 59);
  doc.text(
    '"THIS INVOICE SHALL BE VALID FOR FIVE (5) YEARS FROM THE DATE OF THE PERMIT TO USE"',
    pageWidth / 2,
    y,
    { align: 'center' }
  );

  y += 3.5;
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 116, 139);
  doc.text(
    '"THIS DOCUMENT IS NOT VALID FOR CLAIM OF INPUT TAX IF NOT PROPERLY FILLED UP"',
    pageWidth / 2,
    y,
    { align: 'center' }
  );

  y += 4;

  // Outer border surrounding document on single-page invoices
  const totalPages = doc.getNumberOfPages();
  if (totalPages === 1) {
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.6);
    doc.rect(leftX, 10, contentWidth, y - 10);
  }

  const pdfFileName = `BIR_Sales_Invoice_${invoice.ref_number}.pdf`;
  doc.save(pdfFileName);

  showToast({
    title: 'PDF Export Complete',
    message: `Generated and downloaded official A4 BIR Sales Invoice (${pdfFileName})!`,
    type: 'success',
  });
};

/**
 * Export Invoice via Canvas (fallback)
 */
export const exportInvoiceToPdf = async (
  elementId: string,
  filename = 'BIR_Sales_Invoice.pdf'
): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) {
    window.print();
    return;
  }

  try {
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, Math.min(imgHeight, pdfHeight - 20));
    pdf.save(filename);

    showToast({
      title: 'PDF Export Complete',
      message: `Rendered and downloaded ${filename}!`,
      type: 'success',
    });
  } catch (err) {
    console.error('Canvas export error:', err);
    window.print();
  }
};
