param(
    [string]$Action = "test", # "test", "query_invoices", "query_company", "query_customers"
    [string]$CompanyFile = "C:\Users\Public\Documents\Intuit\QuickBooks\Company Files\Tetsu Company.qbw",
    [string]$AppName = "BIR EIS E-Invoicing System",
    [string]$FromDate = "",
    [int]$MaxReturned = 50
)

$ErrorActionPreference = "Stop"

function Create-RequestProcessor {
    $progIds = @("QBXMLRP2.RequestProcessor", "QBXMLRP2.RequestProcessor.1", "QBXMLRP2.RequestProcessor.2")
    foreach ($p in $progIds) {
        try {
            $rp = New-Object -ComObject $p
            return $rp
        } catch {}
    }
    throw "Unable to instantiate QBXMLRP2 COM object. Please ensure QuickBooks Desktop SDK is registered."
}

function Open-QBSession {
    param([string]$compFile, [string]$app, [bool]$fastTest = $false)
    
    # If doing a quick background check, verify if QuickBooks (QBW32.EXE / QBW.EXE) is running first
    if ($fastTest) {
        $qbProc = Get-Process -Name "QBW32", "QBW" -ErrorAction SilentlyContinue
        if (-not $qbProc) {
            throw "QuickBooks Desktop is not currently running. Launch QuickBooks and open your company file to sync live invoices."
        }
    }

    $rp = Create-RequestProcessor
    $rp.OpenConnection2("", $app, 1)
    
    # First attempt with active open company file ("")
    $ticket = $null
    try {
        $ticket = $rp.BeginSession("", 0)
    } catch {
        if ($fastTest) {
            throw $_
        }
        # Fallback with specified company file path only during explicit sync
        if ($compFile -and $compFile -ne "") {
            $ticket = $rp.BeginSession($compFile, 0)
        } else {
            throw $_
        }
    }
    
    return @{
        Processor = $rp
        Ticket = $ticket
    }
}

function Close-QBSession {
    param($session)
    try {
        if ($session.Processor -and $session.Ticket) {
            $session.Processor.EndSession($session.Ticket)
        }
    } catch {}
    try {
        if ($session.Processor) {
            $session.Processor.CloseConnection()
        }
    } catch {}
}

if ($Action -eq "test") {
    $session = $null
    try {
        $session = Open-QBSession -compFile $CompanyFile -app $AppName -fastTest $true
        Close-QBSession -session $session
        Write-Output '{"success": true, "connected": true, "mode": "Live COM (QuickBooks Active Session)", "message": "Successfully connected to live QuickBooks Desktop session."}'
    } catch {
        if ($session) { Close-QBSession -session $session }
        $errMsg = $_.Exception.Message
        Write-Output ('{"success": false, "connected": false, "mode": "Offline / QuickBooks Closed", "message": "' + ($errMsg -replace '"', '\"') + '"}')
    }
    exit 0
}

if ($Action -eq "query_invoices") {
    $session = $null
    try {
        $session = Open-QBSession -compFile $CompanyFile -app $AppName
        
        $dateXml = ""
        if ($FromDate -ne "") {
            $dateXml = "<FromModifiedDate>$FromDate" + "T00:00:00</FromModifiedDate>"
        }

        $qbxml = @"
<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="13.0"?>
<QBXML>
  <QBXMLMsgsRq onError="continueOnError">
    <InvoiceQueryRq>
      <MaxReturned>$MaxReturned</MaxReturned>
      <IncludeLineItems>true</IncludeLineItems>
      <IncludeLinkedTxns>true</IncludeLinkedTxns>
      <OwnerID>0</OwnerID>
    </InvoiceQueryRq>
  </QBXMLMsgsRq>
</QBXML>
"@

        $responseXml = $session.Processor.ProcessRequest($session.Ticket, $qbxml)
        Close-QBSession -session $session
        
        Write-Output $responseXml
        exit 0
    } catch {
        if ($session) { Close-QBSession -session $session }
        $errMsg = $_.Exception.Message
        Write-Error "Failed to query live invoices from QuickBooks: $errMsg"
        exit 1
    }
}
