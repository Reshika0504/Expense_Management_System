$serverJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD.Path
    npm run server
}

$clientJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD.Path
    npm run client
}

try {
    Receive-Job -Job $serverJob, $clientJob -Wait -AutoRemoveJob
} finally {
    foreach ($job in @($serverJob, $clientJob)) {
        if ($job.State -eq "Running") {
            Stop-Job -Job $job -ErrorAction SilentlyContinue | Out-Null
        }
    }
}
