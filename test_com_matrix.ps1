$compFile = "C:\Users\Public\Documents\Intuit\QuickBooks\Company Files\Tetsu Company.qbw"
Write-Host "PowerShell Architecture: $(if ([IntPtr]::Size -eq 8) { '64-bit' } else { '32-bit' })"

$progIds = @(
    "QBXMLRP2.RequestProcessor",
    "QBXMLRP2.RequestProcessor.2",
    "QBXMLRP2.RequestProcessor.1",
    "QBXMLRP.RequestProcessor"
)

$connTypes = @(1, 2, 0)
$openModes = @(0, 2, 1)

foreach ($prog in $progIds) {
    Write-Host "`n--- Testing ProgID: $prog ---"
    try {
        $rp = New-Object -ComObject $prog
        Write-Host "Created COM instance: $prog"
        
        foreach ($ct in $connTypes) {
            try {
                $rp.OpenConnection2("", "BIR EIS E-Invoicing System", $ct)
                Write-Host "OpenConnection2 (connType=$ct) succeeded!"

                # Try with empty string (active company)
                try {
                    $ticket = $rp.BeginSession("", 0)
                    Write-Host "SUCCESS! BeginSession with active company succeeded! Ticket: $ticket"
                    $rp.EndSession($ticket)
                    $rp.CloseConnection()
                    exit 0
                } catch {
                    Write-Host "BeginSession('', 0) failed: $($_.Exception.Message)"
                }

                # Try with file path
                foreach ($om in $openModes) {
                    try {
                        $ticket = $rp.BeginSession($compFile, $om)
                        Write-Host "SUCCESS! BeginSession('$compFile', openMode=$om) succeeded! Ticket: $ticket"
                        $rp.EndSession($ticket)
                        $rp.CloseConnection()
                        exit 0
                    } catch {
                        Write-Host "BeginSession('$compFile', $om) failed: $($_.Exception.Message)"
                    }
                }

                $rp.CloseConnection()
            } catch {
                Write-Host "OpenConnection2 (connType=$ct) failed: $($_.Exception.Message)"
            }
        }
    } catch {
        Write-Host "Failed to create COM instance $prog : $($_.Exception.Message)"
    }
}

