$ErrorActionPreference = "Continue"

Write-Host "=== Diagnosing QuickBooks Desktop COM Connection ==="

# Check running QB processes
$qbwProcesses = Get-Process -Name *qbw* -ErrorAction SilentlyContinue
Write-Host "Running QB processes count: $($qbwProcesses.Count)"
foreach ($p in $qbwProcesses) {
    Write-Host "Process ID: $($p.Id), Name: $($p.ProcessName), Path: $($p.Path), WindowTitle: $($p.MainWindowTitle)"
}

$progIds = @("QBXMLRP2.RequestProcessor", "QBXMLRP2.RequestProcessor.1", "QBFC16.QBSessionManager", "QBFC15.QBSessionManager", "QBFC13.QBSessionManager")
foreach ($prog in $progIds) {
    try {
        $obj = New-Object -ComObject $prog -ErrorAction Stop
        Write-Host "[OK] COM Class registered: $prog"
    } catch {
        Write-Host "[FAIL] COM Class not available: $prog ($($_.Exception.Message))"
    }
}

Write-Host "`nAttempting RequestProcessor..."
try {
    $rp = New-Object -ComObject "QBXMLRP2.RequestProcessor"
    Write-Host "Step 1: Instantiated QBXMLRP2.RequestProcessor"
    
    $rp.OpenConnection2("", "BIR EIS Compliance System", 1)
    Write-Host "Step 2: OpenConnection2 succeeded"
    
    Write-Host "Step 3a: Trying BeginSession with empty string (active company)..."
    try {
        $ticket = $rp.BeginSession("", 0)
        Write-Host ">> SUCCESS! BeginSession('') ticket: $ticket"
        $rp.EndSession($ticket)
    } catch {
        Write-Host ">> Failed BeginSession(''): $($_.Exception.Message)"
        
        $companyFile = "C:\Users\Public\Documents\Intuit\QuickBooks\Company Files\Tetsu Company.qbw"
        Write-Host "Step 3b: Trying BeginSession with file path: $companyFile..."
        try {
            $ticket = $rp.BeginSession($companyFile, 0)
            Write-Host ">> SUCCESS! BeginSession(filepath) ticket: $ticket"
            $rp.EndSession($ticket)
        } catch {
            Write-Host ">> Failed BeginSession(filepath): $($_.Exception.Message)"
        }
    }
    
    $rp.CloseConnection()
    Write-Host "Closed connection cleanly."
} catch {
    Write-Host "FATAL COM ERROR: $($_.Exception.ToString())"
}

