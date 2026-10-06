# ============================================================================
#  MBG Trading — Auto Refresh Crypto Futures
# ============================================================================
#
#  ### DEPRECATED — DO NOT RUN. THE CLOUD OWNS THIS NOW. ###
#
#  Superseded on 2026-10-06. The GitHub Actions workflow
#  `.github/workflows/hourly_crypto_macro.yml` refreshes crypto_futures,
#  whale_intelligence, forex_intelligence and macro in the cloud, then commits
#  the bundle back to the repo. Both Windows tasks were uninstalled that day.
#
#  Why the move: the owner asked why refresh was running on his personal laptop.
#  There was never a good answer — the site is static on Cloudflare, so something
#  had to fetch data, and it defaulted to whichever machine happened to be awake.
#  The cloud path already existed and cost nothing; it was simply broken and
#  reporting success (see commit 352cd07 for the two faults).
#
#  Running this script RE-CREATES a task that duplicates the cloud run and ties
#  data freshness to whether this laptop is open. Only use it as an emergency
#  fallback if Actions is unavailable, and uninstall it again afterwards:
#      Unregister-ScheduledTask -TaskName "MBG-CryptoFutures-Refresh" -Confirm:$false
#
# ============================================================================
#
#  WHY THIS EXISTED
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

# ---------------------------------------------------------------------------
# GUARD: refuse to re-create the task that was deliberately removed.
#
# A comment in the header is not protection — whoever runs this will not read it.
# The cloud workflow replaced this task on 2026-10-06, and re-installing it
# quietly re-ties data freshness to whether this laptop is open.
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
    Write-Host 'Sejak 6 Oktober 2026, refresh crypto futures dikerjakan di cloud oleh:'
    Write-Host '  .github/workflows/hourly_crypto_macro.yml'
    Write-Host ''
    Write-Host 'Menjalankan script ini akan membuat jadwal DUPLIKAT di laptop ini,'
    Write-Host 'dan data jadi bergantung pada laptop menyala atau tidak.'
    Write-Host ''
    Write-Host 'Kalau memang perlu (misal GitHub Actions sedang mati), pakai:'
    Write-Host '  powershell -ExecutionPolicy Bypass -File scripts\install_futures_task.ps1 -Force'
    Write-Host ''
    Write-Host 'Jangan lupa hapus lagi setelah selesai:'
    Write-Host '  Unregister-ScheduledTask -TaskName "MBG-CryptoFutures-Refresh" -Confirm:$false'
    Write-Host ''
    exit 1
}

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
