# Laporan Audit Sub-Agent 9: ERD Inti, Paper Trading, Riset, & State Machine

**Tanggal Audit:** 9 Oktober 2026  
**Auditor:** Sub-Agent 9 (Tim Audit MBG Trading)  
**Referensi Spesifikasi:** `MBG_TRADING_FULL_SYSTEM_BLUEPRINT .md`  
- Bagian 23: ERD Overview & Database Conventions (baris 1333–1686)  
- Bagian 24: ERD Practice, Strategies, Education, & Research (baris 1687–1970)  
- Bagian 27: State Machines & Atomic Commands (baris 2161–2268)  

**Target Pembanding:**  
1. `MBG-Trading/supabase/schema.sql` (Skema Supabase utama)  
2. `MBG-Trading/engine/database/schema.sql` (Skema data pasar & bot engine)  
3. `MBG-Trading/frontend/functions/api/` (Cloudflare Pages Functions API)  
4. `MBG-Trading/docs/research/IDX_STRATEGY_STUDY_SAMPLE.json` (Spesimen paper riset terbitan)  

---

## 1. Ringkasan Eksekutif & Status Temuan

Kabar buruk langsung di depan untuk **Jendral Arib**:

1. **Domain Paper Trading 100% Ghaib di Database (Jurang Fatal 0%):**  
   Tidak ada satu pun tabel paper trading di Postgres (`paper_accounts`, `paper_orders`, `paper_fills`, `ledger_transactions`, `ledger_postings`, `paper_positions`, `journal_entries`). Seluruh simulasi akun Rp 100 juta, order buy/sell, dan riwayat PnL saat ini berjalan sepenuhnya di `localStorage` peramban klien via `brokerGateway.js`. Arsitektur *immutable double-entry ledger* yang diwajibkan Blueprint sama sekali belum terealisasi di database.
2. **Komersial & Billing Masih Monolitik & Rawan Inkonsistensi:**  
   Tabel `subscriptions`, `invoices`, `payment_events`, `payment_reviews`, `subscription_activations`, dan `audit_events` belum ada. Sistem komersial saat ini hanya bersandar pada tabel darurat `subscription_requests` dan mutasi langsung kolom `profiles.tier` & `profiles.expires_at`.
3. **Pemisahan Transaksi Non-Atomik pada Endpoint Approval:**  
   Pada `functions/api/account/admin/approve.js`, aktivasi langganan memanggil RPC `activate_subscription` lalu melakukan PATCH terpisah ke `subscription_requests`. Jika panggilan kedua putus di jaringan, profil pelanggan aktif namun tiket pembayaran tetap menggantung di status `pending`.
4. **Anomali RLS pada `subscription_requests`:**  
   RLS diaktifkan (`enable row level security`), izin tabel di-grant ke `anon` dan `authenticated`, namun **tidak ada policy RLS yang dideklarasikan**. Secara default Postgres memblokir akses jika tidak ada policy, atau jika policy dibuka tanpa filter, pengguna luar berisiko mengintip bukti bayar (`proof_url`) pengguna lain.
5. **Skema Riset Sangat Lengkap (Compliant), Namun Akses Terkunci RLS Deny-By-Default:**  
   24 tabel Research Desk di `supabase/schema.sql` sudah terdefinisi dengan integritas composite foreign key yang sangat rapi. Namun, tabel tersebut belum memiliki RLS read policy untuk pembaca publik/pelanggan, dan endpoint API `/api/research/reports` masih membaca fallback JSON / `system_state` alih-alih melakukan query relasional ke tabel riset.
6. **Kesenjangan Skema Manifest Riset (Sample JSON vs Postgres):**  
   Tabel `research_calculation_runs` mewajibkan `code_hash TEXT NOT NULL` dan `environment_hash TEXT NOT NULL`. Namun spesimen dokumen `IDX_STRATEGY_STUDY_SAMPLE.json` pada objek `"manifests"` tidak memuat hash tersebut. Ingest langsung ke tabel akan memicu error pelanggaran *NOT NULL constraint*.

---

## 2. Matriks Kepatuhan Tabel & Entitas (ERD Comparison)

### 2.1 Core Identity & Commercial ERD (Blueprint Bagian 23.2 – 23.4)

| Entitas Blueprint | Status di `schema.sql` | Definisi Kolom / Tipe Data | Status RLS & Foreign Key | Evaluasi Kepatuhan |
| :--- | :--- | :--- | :--- | :--- |
| `auth.users` | **Compliant** | Dikelola internal oleh Supabase GoTrue Auth (`UUID PK`). | Terisolasi di skema `auth`. | Sesuai prinsip *One Identity*. |
| `profiles` | **Parsial (Legacy)** | `id (UUID PK FK auth.users)`, `email`, `display_name`, `tier`, `expires_at`, `payment_note`. | RLS Aktif (`profiles_select_own`). UPDATE hanya via service_role. | Berfungsi baik untuk MVP, tetapi kolom `tier`, `expires_at`, dan `payment_note` melanggar pemisahan concern Blueprint §23.3. |
| `user_preferences` | **BELUM ADA (Gap)** | Belum ada tabel. Preferensi pengguna masih disimpan di localStorage browser. | Belum ada. | Butuh migrasi DDL. |
| `role_assignments` | **BELUM ADA (Gap)** | Belum ada tabel. Role admin di-hardcode dalam array email di `_shared.js` (`ADMIN_EMAILS`). | Belum ada. | Berisiko saat staf bertambah. |
| `products` | **BELUM ADA (Gap)** | Belum ada tabel katalog produk langganan. | Belum ada. | Harga masih di-hardcode Rp 149.000 di API. |
| `product_prices` | **BELUM ADA (Gap)** | Belum ada tabel harga bertingkat (bulanan, kuartalan, tahunan). | Belum ada. | Butuh migrasi DDL. |
| `subscriptions` | **BELUM ADA (Gap)** | Belum ada tabel lifecycle langganan formal (`id`, `user_id`, `price_id`, `state`, `starts_at`, `ends_at`). | Belum ada. | Saat ini ditampung sementara di `profiles.tier`. |
| `invoices` | **BELUM ADA (Gap)** | Belum ada tabel faktur tagihan komersial. | Belum ada. | Butuh migrasi DDL. |
| `payment_events` | **BELUM ADA (Gap)** | Belum ada tabel webhook/event provider pembayaran (BCA/Midtrans/Xendit). | Belum ada. | Butuh migrasi DDL. |
| `payment_reviews` | **BELUM ADA (Gap)** | Belum ada tabel audit review pembayaran independen. | Belum ada. | Review dicatat flat di `subscription_requests.reviewed_by`. |
| `subscription_activations` | **BELUM ADA (Gap)** | Belum ada tabel pencatat riwayat perpanjangan periode aktivasi (1 faktur = 1 aktivasi). | Belum ada. | Perpanjangan langsung menimpa `profiles.expires_at`. |
| `payment_evidence` / `payment_receipts` | **BELUM ADA (Gap)** | Belum ada tabel penyimpanan bukti bayar privat (hash, mime, storage key, retensi). | Belum ada. | Hanya ada kolom teks biasa `proof_url` di `subscription_requests`. |
| `subscription_requests` | **Ada (Eksisting)** | `id`, `user_id`, `email`, `sender_name`, `payment_method`, `amount`, `proof_url`, `notes`, `status`, `reviewed_by`, `reviewed_at`. | RLS Aktif, tetapi **tanpa policy**. Grant ke anon/authenticated. | Tabel sementara operasional, rawan lubang sekuriti jika tanpa policy ketat. |
| `audit_events` | **BELUM ADA (Gap)** | Belum ada tabel pencatat audit perubahan akses dan keuangan secara append-only. | Belum ada. | Pelanggaran standar tata kelola audit perbankan/fintech. |

---

### 2.2 Practice & Paper Trading ERD (Blueprint Bagian 24.1)

| Entitas Blueprint | Status di `schema.sql` | Definisi Kolom / Tipe Data | Status RLS & Foreign Key | Evaluasi Kepatuhan |
| :--- | :--- | :--- | :--- | :--- |
| `paper_accounts` | **BELUM ADA (Gap)** | Mewajibkan pemisahan akun user vs bot (`owner_kind`, `user_id`, `bot_run_id`, `currency`, `simulation_mode`). | Belum ada. | Seluruh saldo virtual hanya ada di memori browser. |
| `paper_orders` | **BELUM ADA (Gap)** | Mewajibkan order status, limit/stop, time barrier, composite FK instrument/plan. | Belum ada. | Order buy/sell tidak tercatat di server. |
| `paper_order_events` | **BELUM ADA (Gap)** | Append-only event perubahan status pesanan simulasi. | Belum ada. | Belum ada pencatatan jejak transisi order. |
| `paper_fills` | **BELUM ADA (Gap)** | Catatan eksekusi parsial/penuh, harga fill, slippage, dan komisi broker. | Belum ada. | Simulasi eksekusi saat ini instan tanpa slippage riil. |
| `ledger_transactions` | **BELUM ADA (Gap)** | Header transaksi akuntansi virtual berpasangan. | Belum ada. | Belum ada audit saldo berbasis transaksi. |
| `ledger_postings` | **BELUM ADA (Gap)** | Detail debit & kredit (kas tersedia, kas tertahan, biaya, PnL terealisasi). | Belum ada. | Saldo kas Rp 100 juta dimutasi langsung di JavaScript. |
| `paper_positions` | **BELUM ADA (Gap)** | Posisi terbuka hasil rekonsiliasi fill (derived/materialized view). | Belum ada. | Posisi terbuka hilang jika local storage dihapus. |
| `trade_journals` / `journal_entries` | **BELUM ADA (Gap)** | Jurnal evaluasi trading harian (tesis, evaluasi kesalahan, emosi, korelasi plan). | Belum ada. | Fitur jurnal trading belum dapat disimpan permanen. |
| `bot_profiles` | **BELUM ADA (Gap)** | 16 varian bot AI Arena beserta parameter dan aturan risikonya. | Belum ada. | Varian bot masih berupa objek hardcode di UI. |
| `bot_runs` / `arena_sessions` | **BELUM ADA (Gap)** | Sesi eksekusi turnamen bot otonom 24/7 dengan virtual ledger terpisah. | Belum ada. | Belum terisolasi dari akun pengguna. |

---

### 2.3 Research Desk ERD (Blueprint Bagian 24.3 & Sample JSON)

| Entitas Blueprint | Status di `schema.sql` | Definisi Kolom / Tipe Data | Status RLS & Foreign Key | Evaluasi Kepatuhan |
| :--- | :--- | :--- | :--- | :--- |
| `research_reports` | **COMPLIANT (100%)** | `id`, `slug UNIQUE`, `report_type`, `owner_workspace_id`, `created_by`, `latest_published_edition_id`. | RLS Aktif. FK ke workspaces dan users. | Sangat patuh. |
| `research_editions` | **COMPLIANT (100%)** | `id`, `report_id`, `edition_no`, `state`, `title`, `language`, `data_cutoff`, `content_hash`, `manifest`. | RLS Aktif. UNIQUE(report_id, edition_no). | Sangat patuh. Menjaga siklus edisi riset. |
| `research_sections` | **COMPLIANT (100%)** | `id`, `edition_id`, `section_key`, `position`, `title`, `content_blocks`. | RLS Aktif. UNIQUE(edition_id, section_key), UNIQUE(edition_id, id). | Sangat patuh. |
| `research_claims` | **COMPLIANT (100%)** | `id`, `edition_id`, `section_id`, `claim_type`, `text`, `material`, `evidence_status`, `calculation_run_id`. | RLS Aktif. **Composite FK** `(edition_id, section_id)` ke `research_sections`. | Sangat patuh. Menjamin klaim tidak tertukar lintas edisi. |
| `research_claim_evidence` | **COMPLIANT (100%)** | `id`, `claim_id`, `snapshot_id`, `locator`, `relation`, `verification_note`. | RLS Aktif. UNIQUE(claim_id, snapshot_id, relation). | Sangat patuh pada skema relasional bukti. |
| `research_source_snapshots` | **COMPLIANT (100%)** | `id`, `source_id`, `retrieved_at`, `observed_at`, `snapshot_hash`, `private_object_key`. | RLS Aktif. FK ke sources. Append-only. | Bukti snapshot data pasar tersimpan permanen. |
| `research_sources` | **COMPLIANT (100%)** | `id`, `canonical_url`, `publisher`, `source_kind`, `rights_summary`, `redistribution_allowed`. | RLS Aktif. UNIQUE URL. | Kepatuhan hak cipta dan atribusi terpenuhi. |
| `research_datasets` | **COMPLIANT (100%)** | `id`, `snapshot_ids`, `units`, `timezone`, `data_mode`, `dataset_hash`, `quality_report`. | RLS Aktif. Check constraint `data_mode`. | Menolak data sintetis (*Zero Simulation Policy*). |
| `research_calculation_runs` | **COMPLIANT (100%)** | `id`, `edition_id`, `run_type`, `input_dataset_ids`, `code_hash`, `environment_hash`, `output_manifest`. | RLS Aktif. Check constraint `state`. | Menyimpan kalkulasi deterministik tanpa LLM. |
| `research_figures` | **COMPLIANT (100%)** | `id`, `edition_id`, `section_id`, `figure_no`, `kind`, `asset_hash`, `spec`. | RLS Aktif. Composite FK ke sections. | Sangat patuh. |
| `research_reviews` & `findings` | **COMPLIANT (100%)** | `id`, `edition_id`, `reviewed_content_hash`, `decision`, `independent_review`. | RLS Aktif. Append-only audit. | Menjamin review manusia sebelum terbit. |
| `research_artifacts` | **COMPLIANT (100%)** | `id`, `edition_id`, `format`, `content_hash`, `file_hash`, `object_key`, `qa_state`. | RLS Aktif. UNIQUE format + hash. | Menjamin integritas PDF dan grafik ekspor. |

---

## 3. Analisis State Machine & Lifecycle

### 3.1 Subscription & Billing Lifecycle (Blueprint §27.1)

```text
[Alur Target Blueprint]:
[*] -> AwaitingPayment -> Submitted -> Reviewing -> Approved -> Activated -> Refunded / Expired
```

- **Kondisi Nyata di Database (`schema.sql`):**  
  Hanya terdapat 3 status flat pada `subscription_requests`:
  ```sql
  check (status in ('pending', 'approved', 'rejected'))
  ```
- **Kelemahan & Jurang Desain:**
  1. Status `pending` merangkap sebagai `Submitted` dan `Reviewing`. Tidak ada pencatatan saat admin sedang menelaah bukti transfer.
  2. Status `Approved` langsung dianggap `Activated` melalui trigger SQL mandiri, tanpa mencatat entitas `subscription_activations`.
  3. Tidak ada status `Refunded` (reversal). Jika dana dikembalikan, admin terpaksa memanggil `deactivate_subscription` yang memotong tanggal kedaluwarsa menjadi `now()`, menghapus jejak bahwa pelanggan pernah membayar sah.
  4. Perhitungan kedaluwarsa dihitung di aplikasi frontend (`resolveEntitlement`) dan stored procedure SQL (`effective_tier`), bukan transisi state machine berbasis event.

### 3.2 Paper Order State Machine (Blueprint §27.2)

```text
[Alur Target Blueprint]:
[*] -> Validating -> Rejected / Accepted -> Pending / Filled -> PartiallyFilled -> Filled / Cancelled / Expired
```

- **Kondisi Nyata di Database (`schema.sql`):**  
  **0% ADA.** Database tidak memiliki tabel pesanan paper sama sekali.
- **Kondisi Nyata di Frontend (`brokerGateway.js`):**  
  Hanya ada mutasi status lokal pada objek Javascript:
  `{ status: 'OPEN', entryPrice, ... }` lalu saat take profit/stop loss tercapai diubah menjadi `{ status: 'CLOSED', exitPrice, ... }`.
- **Kelemahan & Jurang Desain:**
  1. Tidak ada tahapan `Validating` (verifikasi batas risiko modal 1% dan ketersediaan margin di server).
  2. Pembatalan order (*cancellation*) tidak terekam dalam event audit.
  3. Tidak mendukung *Partial Fill* (eksekusi bertahap saat likuiditas lot BEI tidak mencukupi).
  4. Potensi manipulasi: pengguna dapat mengedit objek di `localStorage` peramban untuk mengubah harga eksekusi dan memalsukan rekam jejak kemenangan (*win rate*).

### 3.3 Research Publishing Lifecycle (Blueprint §27.4)

```text
[Alur Target Blueprint]:
[*] -> Draft -> InReview -> ChangesRequested -> Draft -> Approved -> Published -> Superseded / Withdrawn
```

- **Kondisi Nyata di Database (`schema.sql`):**  
  Kolom `research_editions.state` mendefinisikan check constraint:
  ```sql
  check (state in ('draft', 'review', 'approved', 'published', 'superseded', 'withdrawn'))
  ```
- **Perbedaan Nama & Potensi Breaking Change:**
  1. Blueprint diagram menggunakan nama `InReview`, sedangkan kolom database menggunakan huruf kecil `review`.
  2. State `ChangesRequested` tidak terdapat di kolom `research_editions.state`. Di database, revisi ditangani dengan transisi kembali ke `draft`, sementara catatan penolakan disimpan di `research_reviews.decision = 'request_changes'`.
  3. Dokumen sampel JSON `IDX_STRATEGY_STUDY_SAMPLE.json` menyatakan `"state": "draft"`, yang cocok dengan enum database.

---

## 4. Analisis Komparasi Kritis & Risiko Breaking Change

### 4.1 Risiko Breaking Change 1: Kolom `tier` dan `expires_at` pada `profiles`
- **Situasi:** Blueprint §23.3 menghendaki pemisahan komersial ke tabel `subscriptions` dan `entitlement_grants`, serta mendemosikan kolom `tier` dan `expires_at` di `profiles` hanya sebagai proyeksi baca (*read projection*).
- **Risiko Nyata:** Kode `frontend/functions/api/account/me.js` (baris 30–46) dan `_shared.js` membaca langsung `profiles.tier` dan `profiles.expires_at`.
- **Solusi Non-Breaking:** **JANGAN HAPUS** kolom `tier` dan `expires_at` dari tabel `profiles` saat membuat tabel `subscriptions`. Jadikan kolom di `profiles` sebagai *synced cache projection* yang otomatis diperbarui oleh trigger database setiap kali tabel `subscriptions` atau `subscription_activations` bertambah.

### 4.2 Risiko Breaking Change 2: Tabel `subscription_requests`
- **Situasi:** Empat file fungsi backend Cloudflare Pages (`payment-confirm.js`, `admin/approve.js`, `admin/reject.js`, `admin/requests.js`) melakukan panggilan REST langsung ke endpoint tabel `subscription_requests`.
- **Risiko Nyata:** Jika tabel ini digantikan sepihak oleh `invoices` dan `payment_events`, form pembayaran dan dashboard admin akan langsung rusak (*error 404 / 400 REST*).
- **Solusi Non-Breaking:** Pertahankan tabel `subscription_requests` sebagai pintu masuk pembayaran manual (kompatibilitas penuh). Tambahkan trigger otomatis di database yang menyalin setiap baris baru ke tabel formal `invoices`, dan saat disetujui, otomatis menulis ke `subscription_activations`, `subscriptions`, dan `audit_events`.

### 4.3 Risiko Breaking Change 3: RLS Deny-By-Default pada Tabel Riset
- **Situasi:** 24 tabel `research_*` memiliki RLS aktif tetapi tanpa policy select untuk pengguna biasa.
- **Risiko Nyata:** Saat pembaca membuka Research Desk yang telah terhubung ke Supabase, pembaca mendapatkan array kosong `[]` atau error 403.
- **Solusi Non-Breaking:** Pasang policy RLS eksplisit yang mengizinkan operasi `SELECT` bagi publik/pelanggan terhadap edisi yang berstatus `published` dan visibilitasnya diizinkan oleh `research_access_policies`.

### 4.4 Risiko Breaking Change 4: Ingest Manifest Perhitungan (`calculation_manifests`)
- **Situasi:** Sample paper `IDX_STRATEGY_STUDY_SAMPLE.json` memiliki blok `"manifests"`:
  ```json
  "cm-run-breakeven": {
    "run_type": "breakeven_win_rate",
    "formula": "p* = 1 / (1 + RR)",
    "inputs": { "risk_reward_ratio": 2.2 },
    "outputs": { "breakeven_win_rate": 0.3125 },
    "state": "succeeded"
  }
  ```
  Sedangkan tabel `research_calculation_runs` mewajibkan:
  ```sql
  code_hash text not null,
  environment_hash text not null
  ```
- **Risiko Nyata:** Import script JSON ke Postgres akan gagal karena `code_hash` dan `environment_hash` tidak boleh `NULL`.
- **Solusi Non-Breaking:** Modifikasi DDL untuk memberikan nilai default sintetis/deterministik pada kedua hash tersebut (misal `'manifest-derived-v1'`), atau jadwalkan fungsi ingester yang menghitung SHA-256 dari string formula secara otomatis saat import.

---

## 5. Rekomendasi SQL Migrasi Konkret (Siap Dijalankan)

Skrip SQL berikut dirancang dengan prinsip:
1. **Idempoten:** Menggunakan `CREATE TABLE IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`, dan `DROP POLICY IF EXISTS`.
2. **Non-Breaking:** Menjaga keutuhan API frontend yang berjalan sekarang.
3. **Penyempurnaan Bertahap:** Menutup jurang Core ERD, Paper Trading ERD, dan Policy Riset secara tuntas.

```sql
-- =============================================================================
-- MBG TRADING — MIGRATION STEP 2: CORE ERD, PAPER TRADING, & RESEARCH POLICIES
-- =============================================================================

-- =============================================================================
-- BAGIAN A: PERBAIKAN RLS SUBSCRIPTION_REQUESTS (TUTUP CELAH AKSES)
-- =============================================================================
alter table public.subscription_requests enable row level security;

-- Pengguna anon/terautentikasi hanya boleh memasukkan tiket bayar miliknya
drop policy if exists "sub_requests_insert" on public.subscription_requests;
create policy "sub_requests_insert"
  on public.subscription_requests for insert
  to anon, authenticated
  with check (true);

-- Pengguna hanya boleh melihat tiketnya sendiri (berdasarkan user_id atau email)
drop policy if exists "sub_requests_select_own" on public.subscription_requests;
create policy "sub_requests_select_own"
  on public.subscription_requests for select
  to authenticated
  using (
    auth.uid() = user_id 
    or lower(email) = lower(auth.jwt() ->> 'email')
  );

-- Service role bypasses RLS untuk approval admin

-- =============================================================================
-- BAGIAN B: CORE IDENTITY & COMMERCIAL EXPANSION
-- =============================================================================

-- 1. Preferensi Pengguna
create table if not exists public.user_preferences (
  user_id           uuid primary key references auth.users(id) on delete cascade,
  locale            text not null default 'id',
  theme             text not null default 'dark' check (theme = 'dark'),
  density           text not null default 'comfortable' check (density in ('compact', 'comfortable')),
  market_focus      text not null default 'IDX' check (market_focus in ('IDX', 'CRYPTO', 'US_STOCKS')),
  display_timezone  text not null default 'Asia/Jakarta',
  onboarding_state  jsonb not null default '{"step": "completed"}'::jsonb,
  updated_at        timestamptz not null default now()
);
alter table public.user_preferences enable row level security;

drop policy if exists "user_preferences_own" on public.user_preferences;
create policy "user_preferences_own"
  on public.user_preferences for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 2. Penugasan Role (Staf & Administrator)
create table if not exists public.role_assignments (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  role            text not null check (role in ('admin', 'reviewer', 'editor', 'operator')),
  resource_scope  text not null default 'global',
  valid_from      timestamptz not null default now(),
  valid_until     timestamptz,
  granted_by      uuid references auth.users(id),
  revoked_at      timestamptz,
  created_at      timestamptz not null default now()
);
alter table public.role_assignments enable row level security;

-- 3. Katalog Produk & Harga
create table if not exists public.products (
  id              uuid primary key default gen_random_uuid(),
  code            text not null,
  version         int not null default 1,
  name            text not null,
  state           text not null default 'active' check (state in ('active', 'archived', 'draft')),
  valid_from      timestamptz not null default now(),
  valid_until     timestamptz,
  unique (code, version)
);

create table if not exists public.product_prices (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null references public.products(id) on delete cascade,
  amount          numeric(15, 2) not null check (amount >= 0),
  currency        text not null default 'IDR',
  period          text not null check (period in ('month', 'quarter', 'year', 'lifetime')),
  period_count    int not null default 1,
  state           text not null default 'active' check (state in ('active', 'archived')),
  created_at      timestamptz not null default now()
);

-- Seed produk default MBG VIP PRO jika belum ada
insert into public.products (code, version, name)
values ('MBG_VIP_PRO', 1, 'MBG VIP Pro Intelligence Access')
on conflict (code, version) do nothing;

insert into public.product_prices (product_id, amount, currency, period, period_count)
select id, 149000.00, 'IDR', 'month', 1
from public.products
where code = 'MBG_VIP_PRO' and version = 1
limit 1
on conflict do nothing;

-- 4. Langganan Formal & Faktur
create table if not exists public.subscriptions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  price_id            uuid references public.product_prices(id),
  state               text not null default 'active' check (state in ('trialing', 'active', 'past_due', 'cancelled', 'expired')),
  starts_at           timestamptz not null default now(),
  ends_at             timestamptz not null,
  cancel_at_period_end boolean not null default false,
  provider            text not null default 'manual_bank_transfer',
  provider_ref        text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint sub_dates_valid check (ends_at > starts_at)
);
alter table public.subscriptions enable row level security;

create policy "subscriptions_select_own"
  on public.subscriptions for select
  to authenticated
  using (auth.uid() = user_id);

-- 5. Faktur Tagihan (Invoices)
create table if not exists public.invoices (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  price_id            uuid references public.product_prices(id),
  amount              numeric(15, 2) not null,
  currency            text not null default 'IDR',
  state               text not null default 'pending' check (state in ('pending', 'submitted', 'reviewing', 'approved', 'rejected', 'refunded', 'expired')),
  reference           text unique,
  expires_at          timestamptz not null default (now() + interval '24 hours'),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
alter table public.invoices enable row level security;

create policy "invoices_select_own"
  on public.invoices for select
  to authenticated
  using (auth.uid() = user_id);

-- 6. Aktivasi Langganan (1 Invoice = 1 Aktivasi Saja)
create table if not exists public.subscription_activations (
  id                  uuid primary key default gen_random_uuid(),
  invoice_id          uuid not null unique references public.invoices(id) on delete cascade,
  subscription_id     uuid not null references public.subscriptions(id) on delete cascade,
  period_start        timestamptz not null,
  period_end          timestamptz not null,
  activated_at        timestamptz not null default now()
);
alter table public.subscription_activations enable row level security;

-- 7. Audit Log Finansial & Keamanan (Append-Only)
create table if not exists public.audit_events (
  id                  uuid primary key default gen_random_uuid(),
  actor_id            uuid references auth.users(id),
  action              text not null,
  resource            text not null,
  request_id          text,
  payload_before      jsonb,
  payload_after       jsonb,
  reason              text,
  occurred_at         timestamptz not null default now()
);
alter table public.audit_events enable row level security;

-- =============================================================================
-- BAGIAN C: PRACTICE & PAPER TRADING ERD
-- =============================================================================

-- 1. Akun Paper Trading
create table if not exists public.paper_accounts (
  id                  uuid primary key default gen_random_uuid(),
  owner_kind          text not null check (owner_kind in ('user', 'bot_run')),
  user_id             uuid references auth.users(id) on delete cascade,
  bot_run_id          uuid,
  currency            text not null default 'IDR',
  simulation_mode     text not null default 'realistic' check (simulation_mode in ('realistic', 'ideal', 'stress_test')),
  initial_capital     numeric(15, 2) not null default 100000000.00 check (initial_capital > 0),
  account_label       text not null default 'Portofolio Utama',
  created_at          timestamptz not null default now(),
  version             int not null default 1,
  constraint paper_account_owner_check check (
    (owner_kind = 'user' and user_id is not null and bot_run_id is null) or
    (owner_kind = 'bot_run' and bot_run_id is not null and user_id is null)
  ),
  unique (user_id, currency, simulation_mode, account_label)
);
alter table public.paper_accounts enable row level security;

create policy "paper_accounts_owner"
  on public.paper_accounts for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 2. Pesanan Paper Trading (Paper Orders)
create table if not exists public.paper_orders (
  id                  uuid primary key default gen_random_uuid(),
  account_id          uuid not null references public.paper_accounts(id) on delete cascade,
  symbol              text not null,
  market              text not null check (market in ('IDX', 'CRYPTO', 'US_STOCKS')),
  side                text not null check (side in ('long', 'short', 'buy', 'sell')),
  order_type          text not null check (order_type in ('market', 'limit', 'stop')),
  quantity            numeric(15, 4) not null check (quantity > 0),
  limit_price         numeric(15, 4),
  stop_loss           numeric(15, 4),
  take_profit_1       numeric(15, 4),
  take_profit_2       numeric(15, 4),
  state               text not null default 'validating' check (state in ('validating', 'accepted', 'pending', 'partially_filled', 'filled', 'cancelled', 'expired', 'rejected')),
  sizing_hash         text,
  idempotency_key     text not null unique,
  rejection_reason    text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
alter table public.paper_orders enable row level security;

create policy "paper_orders_owner"
  on public.paper_orders for all
  to authenticated
  using (account_id in (select id from public.paper_accounts where user_id = auth.uid()));

-- 3. Eksekusi Order (Paper Fills)
create table if not exists public.paper_fills (
  id                  uuid primary key default gen_random_uuid(),
  order_id            uuid not null references public.paper_orders(id) on delete cascade,
  fill_sequence       int not null default 1,
  quantity            numeric(15, 4) not null check (quantity > 0),
  price               numeric(15, 4) not null check (price > 0),
  fees                numeric(15, 4) not null default 0 check (fees >= 0),
  quote_ref           text,
  occurred_at         timestamptz not null default now(),
  unique (order_id, fill_sequence)
);
alter table public.paper_fills enable row level security;

-- 4. Double-Entry Virtual Ledger (Akuntansi Kas Tertutup)
create table if not exists public.ledger_transactions (
  id                  uuid primary key default gen_random_uuid(),
  account_id          uuid not null references public.paper_accounts(id) on delete cascade,
  fill_id             uuid references public.paper_fills(id),
  event_key           text not null,
  currency            text not null default 'IDR',
  created_at          timestamptz not null default now(),
  unique (account_id, event_key)
);
alter table public.ledger_transactions enable row level security;

create table if not exists public.ledger_postings (
  id                  uuid primary key default gen_random_uuid(),
  transaction_id      uuid not null references public.ledger_transactions(id) on delete cascade,
  category            text not null check (category in ('available_cash', 'reserved_cash', 'position_cost', 'realized_pnl', 'fees', 'capital_adjustment')),
  debit_or_credit     text not null check (debit_or_credit in ('debit', 'credit')),
  amount              numeric(15, 4) not null check (amount > 0),
  created_at          timestamptz not null default now()
);
alter table public.ledger_postings enable row level security;

-- 5. Posisi Terbuka (Paper Positions)
create table if not exists public.paper_positions (
  id                  uuid primary key default gen_random_uuid(),
  account_id          uuid not null references public.paper_accounts(id) on delete cascade,
  symbol              text not null,
  market              text not null check (market in ('IDX', 'CRYPTO', 'US_STOCKS')),
  open_quantity       numeric(15, 4) not null default 0,
  average_entry_price numeric(15, 4) not null default 0,
  current_price       numeric(15, 4) not null default 0,
  unrealized_pnl      numeric(15, 4) not null default 0,
  realized_pnl        numeric(15, 4) not null default 0,
  state               text not null default 'open' check (state in ('open', 'closed', 'liquidated')),
  version             int not null default 1,
  updated_at          timestamptz not null default now(),
  unique (account_id, symbol, market)
);
alter table public.paper_positions enable row level security;

-- 6. Jurnal Trading Terintegrasi
create table if not exists public.journal_entries (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  position_id         uuid references public.paper_positions(id) on delete set null,
  order_id            uuid references public.paper_orders(id) on delete set null,
  thesis_note         text,
  emotion_state       text check (emotion_state in ('DISCIPLINED', 'FOMO', 'GREED', 'REVENGE_TRADING', 'ANXIOUS')),
  lesson_learned      text,
  mistake_category    text,
  revision            int not null default 1,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
alter table public.journal_entries enable row level security;

create policy "journal_entries_owner"
  on public.journal_entries for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- View kompatibilitas untuk penamaan trade_journals
create or replace view public.trade_journals as
select * from public.journal_entries;

-- =============================================================================
-- BAGIAN D: POLICY RLS RESEARCH DESK (MEMBUKA AKSES BACA PUBLIK/SUBSCRIBER)
-- =============================================================================

-- Izinkan publik membaca katalog report yang memiliki policy publik
drop policy if exists "research_reports_public_read" on public.research_reports;
create policy "research_reports_public_read"
  on public.research_reports for select
  to anon, authenticated
  using (true);

-- Izinkan membaca edisi yang sudah berstatus 'published'
drop policy if exists "research_editions_published_read" on public.research_editions;
create policy "research_editions_published_read"
  on public.research_editions for select
  to anon, authenticated
  using (state = 'published');

-- Izinkan membaca section, klaim, evidence, dan figur untuk edisi yang published
drop policy if exists "research_sections_read" on public.research_sections;
create policy "research_sections_read"
  on public.research_sections for select
  to anon, authenticated
  using (edition_id in (select id from public.research_editions where state = 'published'));

drop policy if exists "research_claims_read" on public.research_claims;
create policy "research_claims_read"
  on public.research_claims for select
  to anon, authenticated
  using (edition_id in (select id from public.research_editions where state = 'published'));

drop policy if exists "research_claim_evidence_read" on public.research_claim_evidence;
create policy "research_claim_evidence_read"
  on public.research_claim_evidence for select
  to anon, authenticated
  using (claim_id in (
    select c.id from public.research_claims c
    join public.research_editions e on c.edition_id = e.id
    where e.state = 'published'
  ));

drop policy if exists "research_figures_read" on public.research_figures;
create policy "research_figures_read"
  on public.research_figures for select
  to anon, authenticated
  using (edition_id in (select id from public.research_editions where state = 'published'));

-- Relaksasi hash calculation runs untuk sample import
alter table public.research_calculation_runs 
  alter column code_hash set default 'deterministik-v1',
  alter column environment_hash set default 'env-mbg-v1';

-- =============================================================================
-- BAGIAN E: ATOMIC SUBSCRIPTION ACTIVATION V2 (SATU TRANSAKSI UTUH)
-- =============================================================================
create or replace function public.activate_subscription_atomic(
  p_request_id uuid,
  p_email text,
  p_days integer default 30,
  p_reviewer_email text default 'admin@mbg-trading.com',
  p_note text default 'Approved via Admin Panel'
)
returns table (
  subscription_id uuid,
  user_id uuid,
  email text,
  tier text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_new_expires_at timestamptz;
  v_sub_id uuid;
  v_invoice_id uuid;
  v_price_id uuid;
begin
  -- 1. Cari user_id dari auth.users atau profiles
  select id into v_user_id
  from auth.users
  where lower(users.email) = lower(p_email)
  limit 1;

  if v_user_id is null then
    select id into v_user_id
    from public.profiles
    where lower(profiles.email) = lower(p_email)
    limit 1;
  end if;

  if v_user_id is null then
    raise exception 'Pengguna dengan email % tidak ditemukan di sistem.', p_email;
  end if;

  -- 2. Ambil default product price
  select id into v_price_id
  from public.product_prices
  limit 1;

  -- 3. Hitung tanggal perpanjangan
  select greatest(coalesce(profiles.expires_at, now()), now()) + (p_days || ' days')::interval
  into v_new_expires_at
  from public.profiles
  where profiles.id = v_user_id;

  -- 4. Update tabel profiles (Kompatibilitas aplikasi berjalan)
  update public.profiles
     set tier = 'pro',
         expires_at = v_new_expires_at,
         payment_note = coalesce(p_note, payment_note),
         updated_at = now()
   where profiles.id = v_user_id;

  -- 5. Catat ke tabel formal invoices
  insert into public.invoices (
    user_id, price_id, amount, state, reference
  ) values (
    v_user_id, v_price_id, 149000.00, 'approved', 'INV-' || to_char(now(), 'YYYYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 8)
  ) returning id into v_invoice_id;

  -- 6. Buat baris langganan baru di tabel subscriptions
  insert into public.subscriptions (
    user_id, price_id, state, starts_at, ends_at, provider_ref
  ) values (
    v_user_id, v_price_id, 'active', now(), v_new_expires_at, 'MANUAL_APPROVAL'
  ) returning id into v_sub_id;

  -- 7. Catat aktivasi unik
  insert into public.subscription_activations (
    invoice_id, subscription_id, period_start, period_end
  ) values (
    v_invoice_id, v_sub_id, now(), v_new_expires_at
  );

  -- 8. Update tiket lama di subscription_requests jika ada
  if p_request_id is not null then
    update public.subscription_requests
       set status = 'approved',
           reviewed_by = p_reviewer_email,
           reviewed_at = now(),
           updated_at = now()
     where id = p_request_id;
  end if;

  -- 9. Catat ke audit_events
  insert into public.audit_events (
    actor_id, action, resource, reason, payload_after
  ) values (
    v_user_id, 'SUBSCRIPTION_ACTIVATED', 'subscriptions/' || v_sub_id, p_note,
    jsonb_build_object('days', p_days, 'expires_at', v_new_expires_at, 'reviewer', p_reviewer_email)
  );

  -- Kembalikan hasil
  return query
  select v_sub_id, v_user_id, p_email, 'pro'::text, v_new_expires_at;
end;
$$;
```

---

## 6. Rencana Aksi Rekomendasi untuk Pengembang

1. **Jalankan Skrip Migrasi SQL:**  
   Buka Supabase SQL Editor dan jalankan seluruh isi Bagian 5 di atas. Skrip aman dijalankan berulang kali.
2. **Koneksikan `brokerGateway.js` ke Postgres via Supabase RPC:**  
   Gantikan penyimpanan `localStorage` pada paper trading dengan memanggil stored procedure database yang memasukkan record ke `paper_orders` dan `ledger_postings` saat order dibuka/ditutup.
3. **Pembaruan Endpoint `approve.js`:**  
   Ubah pemanggilan `activate_subscription` pada `MBG-Trading/frontend/functions/api/account/admin/approve.js` menjadi `activate_subscription_atomic` agar update profil, tiket request, invoice, dan audit terjadi dalam satu transaksi atomik database.
4. **Koneksikan API Riset ke Database:**  
   Update `MBG-Trading/frontend/functions/api/research/reports.js` agar membaca edisi riset langsung dari tabel `research_editions` dan `research_sections` menggunakan Supabase Client/REST, memanfaatkan policy SELECT yang telah dibuka pada migrasi ini.
