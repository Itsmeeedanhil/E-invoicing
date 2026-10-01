$ErrorActionPreference = "Stop"

$compFile = "C:\Users\Public\Documents\Intuit\QuickBooks\Company Files\Tetsu Company.qbw"
Write-Host "Connecting with file path: $compFile"

try {
    $rp = New-Object -ComObject "QBXMLRP2.RequestProcessor"
    $rp.OpenConnection2("", "BIR EIS E-Invoicing System", 1)
    $ticket = $rp.BeginSession($compFile, 0)
    Write-Host ">> Successfully opened session with ticket: $ticket"
    
    $qbxml = @"
<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="13.0"?>
<QBXML>
  <QBXMLMsgsRq onError="continueOnError">
    <InvoiceQueryRq>
      <MaxReturned>20</MaxReturned>
      <IncludeLineItems>true</IncludeLineItems>
      <IncludeLinkedTxns>true</IncludeLinkedTxns>
      <OwnerID>0</OwnerID>
    </InvoiceQueryRq>
  </QBXMLMsgsRq>
</QBXML>
"@
    $resp = $rp.ProcessRequest($ticket, $qbxml)
    $rp.EndSession($ticket)
    $rp.CloseConnection()
    
    [xml]$xmlDoc = $resp
    $invoices = $xmlDoc.SelectNodes("//InvoiceRet")
    Write-Host "`nTotal Live QuickBooks Invoices found in company file: $($invoices.Count)"
    
    foreach ($inv in $invoices) {
        $ref = $inv.RefNumber
        $txnId = $inv.TxnID
        $date = $inv.TxnDate
        $cust = $inv.CustomerRef.FullName
        $subtotal = $inv.Subtotal
        $balance = $inv.BalanceRemaining
        $applied = $inv.AppliedAmount
        Write-Host "--------------------------------------------------------"
        Write-Host "QB Invoice #$ref | Date: $date | Cust: $cust | Subtotal: $subtotal | TxnID: $txnId"
        
        $lines = $inv.SelectNodes("InvoiceLineRet")
        foreach ($l in $lines) {
            Write-Host "   -> Item: $($l.ItemRef.FullName) | Desc: $($l.Desc) | Qty: $($l.Quantity) | Rate: $($l.Rate) | Amount: $($l.Amount)"
        }
    }
} catch {
    Write-Host "Error: $($_.Exception.ToString())"
}
