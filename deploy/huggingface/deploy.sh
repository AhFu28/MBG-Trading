#!/bin/bash
# =============================================================================
# MBG Trading Arena — 1-Click Hugging Face Space Deployment Script (Bash)
# =============================================================================

echo "=========================================================="
echo "   MBG 24/7 AI ARENA — HUGGING FACE SPACE DEPLOYMENT      "
echo "=========================================================="

SPACE_URL="https://huggingface.co/spaces/AhFu28/mbg-trading-arena"
DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$DEPLOY_DIR"

if [ ! -d ".git" ]; then
    echo "Initializing local git repository for Space..."
    git init
    git remote add origin "$SPACE_URL"
else
    git remote set-url origin "$SPACE_URL"
fi

echo "Staging deployment files..."
git add README.md Dockerfile requirements.txt app.py

git commit -m "feat: deploy 24/7 MBG AI Multi-Agent Arena daemon ($(date '+%Y-%m-%d %H:%M'))"

echo ""
echo "Siap untuk push ke Hugging Face Space!"
echo "Target URL: $SPACE_URL"
echo ""
echo "CATATAN KETIKA GIT MEMINTA CREDENTIAL:"
echo "Username: AhFu28"
echo "Password: Gunakan Hugging Face Access Token (Role: WRITE)"
echo "Buat Token: https://huggingface.co/settings/tokens"
echo ""

read -p "Apakah Anda ingin menjalankan 'git push -f origin main' sekarang? (y/n) " confirm
if [[ $confirm =~ ^[Yy]$ ]]; then
    git branch -M main
    git push -f origin main
    echo "Deployment selesai! Buka: $SPACE_URL"
else
    echo "Push dibatalkan. Anda dapat menjalankan perintah manual:"
    echo "git branch -M main && git push -f origin main"
fi
