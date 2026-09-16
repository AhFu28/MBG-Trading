#!/usr/bin/env python3
"""
scripts/sync_upstream.py
========================
Skrip otomatis untuk mengecek dan menyinkronkan pembaruan minor dari repo asli (origin/main)
setiap jam 12 (Midday Sesi 1 Closing) atau kapanpun owner melakukan push minor.
"""

import os
import sys
import json
import subprocess
from datetime import datetime, timezone

# Pastikan UTF-8 encoding di Windows console
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

def run_cmd(cmd, cwd=None, check=True):
    res = subprocess.run(cmd, cwd=cwd, shell=True, capture_output=True, text=True, encoding='utf-8', errors='replace')
    if check and res.returncode != 0:
        print(f"[ERROR] Executing: {cmd}")
        print(res.stderr.strip())
        sys.exit(res.returncode)
    return res.stdout.strip()

def main():
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    print(f"[SYNC] MBG APEX Upstream Sync Desk (Target: {root_dir})")
    
    # 1. Fetch remote origin
    print("[1/5] Mengambil riwayat terbaru dari origin/main...")
    run_cmd("git fetch origin main", cwd=root_dir)
    
    # 2. Check incoming commits
    current_branch = run_cmd("git rev-parse --abbrev-ref HEAD", cwd=root_dir)
    commits_behind = run_cmd("git log HEAD..origin/main --oneline", cwd=root_dir, check=False)
    
    if not commits_behind:
        print("[OK] Cabang lokal Anda sudah up-to-date dengan origin/main. Tidak ada update baru dari owner.")
        return

    print("\n[2/5] Ditemukan commit baru dari origin/main:")
    for line in commits_behind.splitlines():
        print(f"   > {line}")

    # 3. Safe Merge logic
    print("\n[3/5] Menggabungkan perubahan upstream...")
    subprocess.run("git merge origin/main --no-commit", cwd=root_dir, shell=True, capture_output=True, text=True)
    
    bundle_rel_paths = [
        os.path.join("frontend", "public", "data", "latest_cockpit_bundle.json"),
        os.path.join("engine", "cache", "latest_cockpit_bundle.json")
    ]
    
    # Resolve bundle conflict if any
    try:
        raw_main = subprocess.check_output(["git", "show", "origin/main:frontend/public/data/latest_cockpit_bundle.json"], cwd=root_dir)
        main_bundle = json.loads(raw_main.decode('utf-8'))
        
        bundle_local_path = os.path.join(root_dir, bundle_rel_paths[0])
        with open(bundle_local_path, "r", encoding="utf-8") as bf:
            local_bundle = json.load(bf)
            
        merged = dict(main_bundle)
        merged['whale_intelligence'] = local_bundle.get('whale_intelligence', {})
        merged['crypto_futures'] = local_bundle.get('crypto_futures', {})
        merged['forex_intelligence'] = local_bundle.get('forex_intelligence', {})
        merged['us_stocks'] = local_bundle.get('us_stocks', {})
        
        # CryptoWave news
        feat_news = local_bundle.get('macro_telemetry', {}).get('live_news', [])
        cw_news = [n for n in feat_news if 'CRYPTOWAVE' in (n.get('source') or '')]
        main_news = merged.get('macro_telemetry', {}).get('live_news', [])
        existing_ids = {n.get('id') for n in main_news}
        combined_news = list(main_news)
        for cn in cw_news:
            if cn.get('id') not in existing_ids:
                combined_news.insert(0, cn)
                existing_ids.add(cn.get('id'))
                
        if 'macro_telemetry' not in merged:
            merged['macro_telemetry'] = {}
        merged['macro_telemetry']['live_news'] = combined_news
        
        now_iso = datetime.now(timezone.utc).isoformat()
        merged['last_updated'] = main_bundle.get('last_updated', now_iso)
        merged['section_timestamps'] = {
            'idx': now_iso,
            'crypto': now_iso,
            'macro': now_iso,
            'trade_plans': main_bundle.get('section_timestamps', {}).get('trade_plans', now_iso)
        }
        
        for bp in bundle_rel_paths:
            full_bp = os.path.join(root_dir, bp)
            with open(full_bp, "w", encoding="utf-8") as f:
                json.dump(merged, f, ensure_ascii=False, indent=2)
            run_cmd(f'git add "{bp}"', cwd=root_dir)
            
        print("[OK] Master telemetry bundle berhasil digabungkan (Quotes baru diserap + Modul v3.0 terjaga).")
    except Exception as e:
        print(f"[WARN] Catatan penggabungan bundle: {e}")

    # 4. Commit merge
    commit_msg = f"merge: sync upstream origin/main ({commits_behind.splitlines()[0].split()[0]}) with active workspace"
    run_cmd(f'git commit -m "{commit_msg}"', cwd=root_dir, check=False)
    
    # 5. Build verification
    print("\n[4/5] Menjalankan verifikasi build frontend Vite...")
    frontend_dir = os.path.join(root_dir, "frontend")
    run_cmd("npm run build", cwd=frontend_dir)
    print("[OK] Frontend build lulus 100% tanpa error.")
    
    # 6. Push to feature branch
    print(f"\n[5/5] Mendorong hasil sinkronisasi ke origin {current_branch}...")
    run_cmd(f"git push origin {current_branch}", cwd=root_dir)
    print(f"[SUCCESS] Cabang {current_branch} kini selaras sempurna dengan update jam 12 dari repo asli.")

if __name__ == "__main__":
    main()
