# BUILD WP7 — Provenance model & redaksi data sensitif

Owner: lead · Tanggal: 2026-10-11 · Task: task-21

## 1. P2-4 — provenance tidak boleh mengarang nama model

Temuan dari tes pengunci yang baru dibuat: `App.jsx:107` menulis

    data?.model_used || data?.daily_snips?.model_used || 'gemini-3.8-flash'

Artinya bila bundel tidak mencatat model apa pun, UI tetap menampilkan "Gemini LLM: 🟢 3.8-FLASH" — nama model **dan** titik sehat hijau untuk sesuatu yang tidak pernah tercatat. Itu persis pelanggaran yang dilarang aturan kejujuran proyek.

Perbaikan:
- `App.jsx:107-108` — fallback keras dihapus, nilainya `null` bila tidak tercatat.
- `App.jsx:1312` — badge jadi `⚪ TIDAK TERCATAT` tanpa titik hijau saat model tidak diketahui.
- `NewsTab.jsx:797` — `news.model_used || 'Gemini'` jadi `news.model_used || 'model tidak tercatat'`.
- Tes pengunci baru: `frontend/src/components/__tests__/provenanceModel.test.js` (3 tes) — melarang fallback bernama model, dan mewajibkan kalimat jujur saat tidak tercatat.

## 2. Redaksi data sensitif di changelog (akibat E-1)

Setelah Changelog diturunkan ke tier FREE, isinya terbuka untuk setiap akun gratis. Ditemukan dua hal yang seharusnya tidak ada di UI:

| Temuan | Lokasi | Tindakan |
|---|---|---|
| Nomor WhatsApp partner | `description` entri 6 Okt, `step` Sprint 27, `markdownContent`, link `wa.me/...` | Diganti `[nomor disunting]` |
| Sandi gerbang live dan potongan hash | entri v5.8.0 | Diganti keterangan bahwa detail kredensial dihapus; fakta teknis yang aman dipertahankan |

Diverifikasi: pencarian `812-2417`, `8122417`, `628122417`, `baab58` di `changelogData.js` → **0 kemunculan**.

## 3. Yang TIDAK saya ubah (dan alasannya)

PII nomor yang sama masih ada di 15+ tempat lain di repo — dan itu **sudah tercatat sebagai isu** di `new plan/MBG_TRADING_UPDATE_PLAN_V3.md:15` ("PII nomor telepon (+6281224170187) di 15+ tempat repo publik").
Saya tidak menyapu bersih karena nomor itu **dipakai fitur**: `engine/send_wa_fuad.py:16 TARGET_PHONE`, `frontend/src/services/whatsappHandoff.js`, dan tes-tesnya. Mengubahnya butuh keputusan Jendral, misalnya memindahkannya ke env var.

Kredensial di `CHANGELOG.md:514` **juga masih ada** dan repositori ini publik, jadi nilainya sudah terbit. Menyunting berkasnya tidak menariknya kembali dari riwayat git — satu-satunya obat adalah **rotasi sandi** (P0-0 di rencana).

## 4. Tes

    npx vitest run          -> 42 files, 594 tests passed
    npx vite build          -> sukses
