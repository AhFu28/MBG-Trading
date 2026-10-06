# ============================================================================
#  MBG Trading — Auto Refresh Forex / Metals / Energy
# ============================================================================
#
#  ### DEPRECATED — DO NOT RUN. THE CLOUD OWNS THIS NOW. ###
#
#  Superseded on 2026-10-06. The GitHub Actions workflow
#  `.github/workflows/hourly_crypto_macro.yml` refreshes forex_intelligence in
#  the cloud, alongside crypto_futures, whale_intelligence and macro, then
#  commits the bundle back to the repo. Both Windows tasks were uninstalled.
#
#  Forex needed one extra step to get here: the hourly workflow covered crypto,
#  whales and macro but NOT forex, so deleting the local task first would have
#  silently frozen this desk. `hourly_crypto_macro` was added to the forex mode
#  list in engine/run_pipeline.py beforehand (commit d071418), and the cloud run
#  verified it at 33 pairs.
#
#  Running this script RE-CREATES a task that duplicates the cloud run and ties
#  data freshness to whether this laptop is open. Emergency fallback only:
#      Unregister-ScheduledTask -TaskName "MBG-Forex-Refresh" -Confirm:$false
#
# ============================================================================
#
#  WHY THIS EXISTED
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

# ---------------------------------------------------------------------------
# GUARD: refuse to re-create the task that was deliberately removed.
#
# A comment in the header is not protection — whoever runs this will not read it.
# The cloud workflow replaced this task on 2026-10-06 and the forex section was
# verified there at 33 pairs before the local task was deleted.
#
# Emergency override: -Force
#
# NOTE: param() must be the first executable statement in a PowerShell script.
# Nothing — not even $ErrorActionPreference — may precede it. Comments are fine.
# ---------------------------------------------------------------------------
param([switch]$Force)

$ErrorActionPreference = 'Stop'

if (-not $Force) {
    Write-Host ''
    Write-Host 'JADWAL INI SUDAH TIDAK DIPAKAI.' -ForegroundColor Yellow
    Write-Host ''
    Write-Host 'Sejak 6 Oktober 2026, refresh forex dikerjakan di cloud oleh:'
    Write-Host '  .github/workflows/hourly_crypto_macro.yml'
    Write-Host ''
    Write-Host 'Menjalankan script ini akan membuat jadwal DUPLIKAT di laptop ini,'
    Write-Host 'dan data jadi bergantung pada laptop menyala atau tidak.'
    Write-Host ''
    Write-Host 'Kalau memang perlu (misal GitHub Actions sedang mati), pakai:'
    Write-Host '  powershell -ExecutionPolicy Bypass -File scripts\install_forex_task.ps1 -Force'
    Write-Host ''
    Write-Host 'Jangan lupa hapus lagi setelah selesai:'
    Write-Host '  Unregister-ScheduledTask -TaskName "MBG-Forex-Refresh" -Confirm:$false'
    Write-Host ''
    exit 1
}

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
