# ============================================================================
#  MBG Trading — Auto Refresh Crypto Futures
# ============================================================================
#
#  WHY THIS EXISTS
#  ---------------
#  The Crypto Futures desk sat frozen from 26 September to 6 October. Nothing
#  was broken in a way that alerted anyone: the pipeline only refreshed crypto
#  telemetry when someone ran it by hand, and nobody did. The desk quietly
#  served nine-day-old funding rates and open interest.
#
#  This task refreshes ONLY the futures section, which:
#    • is fast (a handful of HTTP calls, no broker or MT5 connection),
#    • cannot overwrite the rest of the bundle, and
#    • is safe to run unattended every 30 minutes.
#
#  INSTALL (run once, in PowerShell):
#      powershell -ExecutionPolicy Bypass -File scripts\install_futures_task.ps1
#
#  REMOVE:
#      Unregister-ScheduledTask -TaskName "MBG-CryptoFutures-Refresh" -Confirm:$false
# ============================================================================

$ErrorActionPreference = 'Stop'

$TaskName    = 'MBG-CryptoFutures-Refresh'
$RepoRoot    = Split-Path -Parent $PSScriptRoot
$ScriptPath  = Join-Path $PSScriptRoot 'refresh_crypto_futures.py'

# Prefer the project virtualenv (it has the pinned dependencies); fall back to
# whatever `python` resolves to so this still works on a fresh machine.
$VenvPython = Join-Path $RepoRoot '.venv\Scripts\python.exe'
$Python = if (Test-Path $VenvPython) { $VenvPython } else { 'python' }

Write-Host ''
Write-Host '=== MEMASANG JADWAL AUTO-REFRESH CRYPTO FUTURES ===' -ForegroundColor Cyan
Write-Host "Python  : $Python"
Write-Host "Script  : $ScriptPath"
Write-Host "Jadwal  : setiap 30 menit"
Write-Host ''

if (-not (Test-Path $ScriptPath)) {
    throw "Script tidak ditemukan: $ScriptPath"
}

$Action = New-ScheduledTaskAction `
    -Execute $Python `
    -Argument "`"$ScriptPath`"" `
    -WorkingDirectory $RepoRoot

# Every 30 minutes, repeating indefinitely. A fixed interval rather than a
# trigger at specific hours, because crypto perps never close.
$Trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(2) `
    -RepetitionInterval (New-TimeSpan -Minutes 30)

$Settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 10) `
    -MultipleInstances IgnoreNew

if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
    Write-Host 'Jadwal lama ditemukan — memperbarui...' -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $Action `
    -Trigger $Trigger `
    -Settings $Settings `
    -Description 'Refresh data Crypto Futures (funding, OI, long/short, likuidasi) tiap 30 menit. Bagian bundle lain tidak disentuh.' | Out-Null

Write-Host ''
Write-Host '[OK] Jadwal terpasang.' -ForegroundColor Green
Write-Host ''
Write-Host 'Uji sekarang (jalankan sekali, tunggu ~10 detik):' -ForegroundColor Cyan
Write-Host "    Start-ScheduledTask -TaskName '$TaskName'"
Write-Host "    Get-ScheduledTaskInfo -TaskName '$TaskName' | Select LastRunTime, LastTaskResult"
Write-Host ''
Write-Host 'Jalankan manual tanpa menunggu jadwal:' -ForegroundColor Cyan
Write-Host "    & '$Python' '$ScriptPath'"
Write-Host ''
