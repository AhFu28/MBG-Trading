# -*- coding: utf-8 -*-
import json
import re
import os

def main():
    with open('engine/cache/subagent_materials.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    # 1. Extract 66 terms
    text = data['critical']
    sec4 = text.split('## 4. AUDIT & REKOMENDASI PERBAIKAN 66 ISTILAH KAMUS LENGKAP')[1].split('## 5.')[0]
    pattern = r'(\d+)\.\s+\*\*(.*?)\*\*.*?Rekomendasi:\*\s+\*\*(.*?)\*\*'
    matches = re.findall(pattern, sec4, re.DOTALL)

    terms_clean = []
    for num, term, reco in matches:
        t_clean = term.strip()
        r_clean = reco.strip().replace('\n', ' ')
        r_clean = re.sub(r'\s+', ' ', r_clean)
        if (r_clean.startswith('"') and r_clean.endswith('"')) or (r_clean.startswith('“') and r_clean.endswith('”')):
            r_clean = r_clean[1:-1]
        terms_clean.append({
            'id': int(num),
            'term': t_clean,
            'def': r_clean
        })

    os.makedirs('engine/cache', exist_ok=True)
    with open('engine/cache/glossary_66_clean.json', 'w', encoding='utf-8') as out:
        json.dump(terms_clean, out, ensure_ascii=False, indent=2)

    print(f"Successfully processed {len(terms_clean)} glossary terms!")

if __name__ == '__main__':
    main()
