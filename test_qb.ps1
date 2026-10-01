$ErrorActionPreference = "Stop"

$compFile = "C:\Users\Public\Documents\Intuit\QuickBooks\Company Files\Tetsu Company.qbw"
Write-Host "=== Testing with specific company file: $compFile ==="

try {
    $rp = New-Object -ComObject QBXMLRP2.RequestProcessor
    $rp.OpenConnection2("", "BIR EIS E-Invoicing System", 1)
    Write-Host "OpenConnection2 SUCCESS!"

    Write-Host "Calling BeginSession with: $compFile ..."
    $ticket = $rp.BeginSession($compFile, 0)
    Write-Host "BeginSession SUCCESS! Ticket: $ticket"

    $queryXml = @"
<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="13.0"?>
<QBXML>
  <QBXMLMsgsRq onError="continueOnError">
    <InvoiceQueryRq>
      <MaxReturned>5</MaxReturned>
      <IncludeLineItems>true</IncludeLineItems>
    </InvoiceQueryRq>
  </QBXMLMsgsRq>
</QBXML>
"@
    $res = $rp.ProcessRequest($ticket, $queryXml)
    Write-Host "ProcessRequest SUCCESS! Response length: $($res.Length)"
    Write-Host "Preview: $($res.Substring(0, [Math]::Min(500, $res.Length)))"

    $rp.EndSession($ticket)
    $rp.CloseConnection()
    Write-Host "=== SUCCESS! ==="
} catch {
    Write-Host "FAILED with Error: $($_.Exception.Message)"
    Write-Host "Details: $($_.Exception.ToString())"
}

