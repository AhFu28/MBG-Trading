# ============================================================================
#  MBG Trading — Auto Refresh Forex / Metals / Energy
# ============================================================================
#
#  WHY THIS EXISTS
#  ---------------
#  Jendral Arib reported "forex dan xau dll ga jalan". The network was fine —
#  TradingView answered every symbol. The data was a day stale because NOTHING
#  ever refreshed it. A desk that only updates when a human remembers to run the
#  pipeline is a desk showing yesterday's prices.
#
#  This task refreshes ONLY the forex/metals section, so it:
#    • is fast (two HTTP calls, no broker or MT5 connection),
#    • cannot overwrite the rest of the bundle, and
#    • is safe to run unattended every 30 minutes.
#
#  INSTALL (run once, in PowerShell):
#      powershell -ExecutionPolicy Bypass -File scripts\install_forex_task.ps1
#
#  REMOVE:
#      Unregister-ScheduledTask -TaskName "MBG-Forex-Refresh" -Confirm:$false
# ============================================================================

$ErrorActionPreference = 'Stop'

$TaskName   = 'MBG-Forex-Refresh'
$RepoRoot   = Split-Path -Parent $PSScriptRoot
$ScriptPath = Join-Path $PSScriptRoot 'refresh_forex.py'

$VenvPython = Join-Path $RepoRoot '.venv\Scripts\python.exe'
$Python = if (Test-Path $VenvPython) { $VenvPython } else { 'python' }

Write-Host ''
Write-Host '=== MEMASANG JADWAL AUTO-REFRESH FOREX / METALS ===' -ForegroundColor Cyan
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

# Forex runs 24/5, but metals and oil keep moving during the weekend gap in
# some venues; a fixed 30-minute interval is simplest and costs nothing.
$Trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(4) `
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
    -Description 'Refresh forex 28 pair + GOLD/SILVER/USOIL/UKOIL/DXY tiap 30 menit. Bagian bundle lain tidak disentuh.' | Out-Null

Write-Host ''
Write-Host '[OK] Jadwal terpasang.' -ForegroundColor Green
Write-Host ''
Write-Host 'Uji sekarang:' -ForegroundColor Cyan
Write-Host "    Start-ScheduledTask -TaskName '$TaskName'"
Write-Host "    Get-ScheduledTaskInfo -TaskName '$TaskName' | Select LastRunTime, LastTaskResult"
Write-Host ''
Write-Host 'Jalankan manual:' -ForegroundColor Cyan
Write-Host "    & '$Python' '$ScriptPath'"
Write-Host ''
