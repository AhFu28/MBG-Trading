# TRUST01 dev helper — runs the Vite dev server with the explicit, opt-in local
# authentication bypass enabled.
#
# This does NOT weaken production: PasswordGate only honours the bypass when
# `import.meta.env.DEV === true` AND `VITE_MBG_DEV_AUTH_BYPASS === 'true'`, and Vite
# statically strips the DEV branch from production builds. There is no hardcoded
# password anywhere.
#
# Usage:  pwsh -File scripts/dev-local.ps1
$ErrorActionPreference = 'Stop'

$env:VITE_MBG_DEV_AUTH_BYPASS = 'true'
Write-Host '[dev-local] VITE_MBG_DEV_AUTH_BYPASS=true (development only)' -ForegroundColor Yellow

$frontend = Join-Path $PSScriptRoot '..\frontend'
Push-Location $frontend
try {
    npm run dev
}
finally {
    Pop-Location
}
