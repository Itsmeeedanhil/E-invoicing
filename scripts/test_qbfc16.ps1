$ErrorActionPreference = "Continue"

Write-Host "=== Testing QBFC16 SessionManager ==="
try {
    $sm = New-Object -ComObject "QBFC16.QBSessionManager"
    Write-Host "Created QBFC16 object"
    $sm.OpenConnection2("", "BIR EIS Compliance System", 1)
    Write-Host "QBFC16 OpenConnection2 OK"
    
    $ticket = $sm.BeginSession("", 0)
    Write-Host ">> SUCCESS with QBFC16 BeginSession! Ticket: $ticket"
    
    $msgSet = $sm.CreateMsgSetRequest("US", 16, 0)
    $msgSet.Attributes.OnError = 1 # roeContinue
    $invQuery = $msgSet.AppendInvoiceQueryRq()
    $invQuery.IncludeLineItems.SetValue($true)
    $invQuery.MaxReturned.SetValue(20)
    
    $respSet = $sm.DoRequests($msgSet)
    $respList = $respSet.ResponseList
    Write-Host "Responses count: $($respList.Count)"
    
    for ($i = 0; $i -lt $respList.Count; $i++) {
        $resp = $respList.GetAt($i)
        Write-Host "Response $i StatusCode: $($resp.StatusCode), StatusMessage: $($resp.StatusMessage)"
        if ($resp.Detail) {
            $invList = $resp.Detail
            Write-Host "Total Invoices returned from Live QB: $($invList.Count)"
            for ($j = 0; $j -lt $invList.Count; $j++) {
                $inv = $invList.GetAt($j)
                Write-Host "  Invoice #$($inv.RefNumber.GetValue()) | Date: $($inv.TxnDate.GetValue().ToString('yyyy-MM-dd')) | Customer: $($inv.CustomerRef.FullName.GetValue()) | Amount: $($inv.AppliedAmount.GetValue()) / $($inv.BalanceRemaining.GetValue())"
            }
        }
    }
    
    $sm.EndSession()
    $sm.CloseConnection()
} catch {
    Write-Host "QBFC16 Failed: $($_.Exception.ToString())"
}
