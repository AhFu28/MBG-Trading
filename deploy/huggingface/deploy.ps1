# =============================================================================
# MBG Trading Arena — 1-Click Hugging Face Space Deployment Script
# =============================================================================

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   MBG 24/7 AI ARENA — HUGGING FACE SPACE DEPLOYMENT      " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

$SPACE_URL = "https://huggingface.co/spaces/AhFu28/mbg-trading-arena"
$DEPLOY_DIR = $PSScriptRoot

Set-Location $DEPLOY_DIR

if (-not (Test-Path ".git")) {
    Write-Host "Initializing local git repository for Space..." -ForegroundColor Yellow
    git init
    git remote add origin $SPACE_URL
} else {
    git remote set-url origin $SPACE_URL
}

Write-Host "Staging deployment files (Dockerfile, app.py, requirements.txt, README.md)..." -ForegroundColor Yellow
git add README.md Dockerfile requirements.txt app.py

$commitMsg = "feat: deploy 24/7 MBG AI Multi-Agent Arena daemon ($(Get-Date -Format 'yyyy-MM-dd HH:mm'))"
git commit -m $commitMsg

Write-Host "`nSiap untuk melakukan push ke Hugging Face Space!" -ForegroundColor Green
Write-Host "Target URL : $SPACE_URL" -ForegroundColor White
Write-Host "`nCATATAN KETIKA GIT MEMINTA CREDENTIAL:" -ForegroundColor Yellow
Write-Host "Username : AhFu28" -ForegroundColor White
Write-Host "Password : Gunakan Hugging Face Access Token (Role: WRITE)" -ForegroundColor White
Write-Host "Buat Token : https://huggingface.co/settings/tokens`n" -ForegroundColor Cyan

$confirm = Read-Host "Apakah Anda ingin menjalankan 'git push -f origin main' sekarang? (Y/N)"
if ($confirm -eq "Y" -or $confirm -eq "y") {
    git branch -M main
    git push -f origin main
    Write-Host "`nDeployment selesai! Buka: $SPACE_URL" -ForegroundColor Green
} else {
    Write-Host "`nPush dibatalkan. Anda dapat menjalankan perintah manual kapan saja:" -ForegroundColor Yellow
    Write-Host "git branch -M main; git push -f origin main" -ForegroundColor White
}
