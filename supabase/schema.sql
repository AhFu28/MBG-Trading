-- =============================================================================
-- MBG TRADING — ACCOUNT & SUBSCRIPTION SCHEMA
-- =============================================================================
-- Cara pakai:
--   1. Buka project Supabase Anda -> SQL Editor -> New query
--   2. Tempel SELURUH isi file ini
--   3. Klik Run
--
-- File ini AMAN dijalankan berulang kali (idempoten): semua perintah memakai
-- IF NOT EXISTS atau CREATE OR REPLACE, jadi tidak akan error kalau diulang.
--
-- KENAPA PASSWORD TIDAK ADA DI FILE INI:
-- Kata sandi ditangani sepenuhnya oleh Supabase Auth (GoTrue), yang sudah
-- teruji dan menangani hashing, salt, serta rate limiting. Menyimpan hash
-- sendiri adalah cara paling umum membuat kebocoran data. Kita hanya menyimpan
-- PROFIL (tier langganan), bukan kredensial.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. TABEL PROFIL — satu baris per pengguna
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  -- id sama dengan auth.users.id, jadi satu akun = satu profil.
  id            uuid primary key references auth.users(id) on delete cascade,

  email         text,
  display_name  text,

  -- Tier menentukan fitur mana yang terbuka.
  --   free = fitur terbatas (sinyal tertunda 24 jam, tab dasar)
  --   pro  = semua fitur + sinyal real-time + notifikasi
  -- Nilai lain ditolak oleh constraint di bawah.
  tier          text not null default 'free',

  -- Kapan langganan berakhir. NULL = tidak pernah berakhir (akun owner).
  -- Saat tanggal ini lewat, akses PRO otomatis turun jadi FREE saat dibaca.
  expires_at    timestamptz,

  -- Catatan internal untuk Anda: siapa yang membayar, lewat apa, dsb.
  -- TIDAK pernah ditampilkan ke pengguna.
  payment_note  text,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint profiles_tier_valid check (tier in ('free', 'pro'))
);

-- Cari cepat berdasarkan email (untuk bantuan pelanggan).
create index if not exists profiles_email_idx on public.profiles (lower(email));

-- Cari cepat langganan yang akan berakhir (untuk pengingat perpanjangan).
create index if not exists profiles_expires_idx on public.profiles (expires_at);


-- -----------------------------------------------------------------------------
-- 2. OTOMATIS BUAT PROFIL SAAT PENGGUNA BARU DAFTAR
-- -----------------------------------------------------------------------------
-- Tanpa ini, setiap pengguna baru tidak akan punya baris profil dan aplikasi
-- harus menanganinya sebagai kasus khusus. Trigger ini membuat akun baru
-- langsung punya profil FREE.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, tier)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(coalesce(new.email, ''), '@', 1)),
    'free'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- -----------------------------------------------------------------------------
-- 3. JAGA updated_at TETAP AKURAT
-- -----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();


-- -----------------------------------------------------------------------------
-- 4. KEAMANAN BARIS (ROW LEVEL SECURITY)
-- -----------------------------------------------------------------------------
-- PENTING: tanpa ini, siapa pun yang punya anon key bisa membaca SEMUA profil
-- pelanggan Anda. Ini mengunci agar setiap orang hanya bisa melihat barisnya
-- sendiri, dan TIDAK BISA mengubah tier-nya sendiri.
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

-- Sengaja TIDAK ada policy INSERT/UPDATE/DELETE untuk pengguna biasa.
-- Artinya: perubahan tier hanya bisa dilakukan oleh Anda (service role)
-- melalui dashboard Supabase atau SQL Editor. Pengguna tidak bisa
-- memberi dirinya PRO walau mengubah JavaScript di browser.


-- -----------------------------------------------------------------------------
-- 5. FUNGSI BANTU: tier efektif dengan memperhitungkan masa berlaku
-- -----------------------------------------------------------------------------
-- Membaca tier mentah saja tidak cukup: langganan yang sudah lewat harus
-- dianggap FREE walaupun kolomnya masih 'pro'. Fungsi ini yang dipakai
-- aplikasi, sehingga tidak ada pelanggan kedaluwarsa yang tetap dapat akses.
create or replace function public.effective_tier(
  p_tier text,
  p_expires_at timestamptz
)
returns text
language sql
immutable
as $$
  select case
    when p_tier = 'pro' and p_expires_at is not null and p_expires_at < now() then 'free'
    else coalesce(p_tier, 'free')
  end;
$$;


-- -----------------------------------------------------------------------------
-- 6. AKTIVASI LANGGANAN (MANUAL — jalankan setelah pembayaran masuk)
-- -----------------------------------------------------------------------------
-- Setelah pelanggan transfer, buka SQL Editor dan jalankan perintah berikut
-- dengan email pelanggan. Ganti bagian yang ditandai.
--
--   MBG-AKTIF 30 HARI:
--   select public.activate_subscription('pelanggan@email.com', 30, 'Transfer BCA 5 Okt');
--
--   MBG-AKTIF 90 HARI:
--   select public.activate_subscription('pelanggan@email.com', 90, 'Transfer BCA 5 Okt');
--
--   MBG-MATIKAN (pelanggan berhenti):
--   select public.deactivate_subscription('pelanggan@email.com');
--
--   MBG-LIHAT SEMUA PELANGGAN BERBAYAR:
--   select email, tier, expires_at, payment_note from public.profiles
--   where tier = 'pro' order by expires_at;
create or replace function public.activate_subscription(
  p_email text,
  p_days integer default 30,
  p_note text default null
)
returns table (email text, tier text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.profiles
     set tier = 'pro',
         -- Perpanjangan menambah dari tanggal berakhir yang ada (kalau masih
         -- aktif), bukan dari hari ini — supaya pelanggan tidak kehilangan hari.
         expires_at = greatest(coalesce(expires_at, now()), now()) + (p_days || ' days')::interval,
         payment_note = coalesce(p_note, payment_note)
   where lower(profiles.email) = lower(p_email)
  returning profiles.email, profiles.tier, profiles.expires_at;
end;
$$;

create or replace function public.deactivate_subscription(p_email text)
returns table (email text, tier text)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.profiles
     set tier = 'free',
         expires_at = now()
   where lower(profiles.email) = lower(p_email)
  returning profiles.email, profiles.tier;
end;
$$;


-- -----------------------------------------------------------------------------
-- 7. VERIFIKASI — pastikan semuanya terpasang
-- -----------------------------------------------------------------------------
-- Jalankan baris ini sendirian untuk memastikan tabel & security sudah benar.
-- Harus muncul: profiles (dengan rowsecurity = true)
select
  tablename,
  rowsecurity as rls_aktif
from pg_tables
where schemaname = 'public' and tablename = 'profiles';

-- ====================================================================
-- TABEL: subscription_requests (Konfirmasi Pembayaran Manual)
-- ====================================================================
create table if not exists public.subscription_requests (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete set null,
    email text not null,
    sender_name text not null,
    payment_method text not null,
    amount numeric not null default 149000,
    proof_url text,
    notes text,
    status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
    reviewed_by text,
    reviewed_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_sub_requests_status on public.subscription_requests(status);
create index if not exists idx_sub_requests_email on public.subscription_requests(email);
create index if not exists idx_sub_requests_created_at on public.subscription_requests(created_at desc);

alter table public.subscription_requests enable row level security;
grant select, insert, update on table public.subscription_requests to anon, authenticated, service_role;

-- ====================================================================
-- RESEARCH DESK — SKEMA FONDASI (P-8 P0a, spesifikasi update-fitur §7)
-- ====================================================================
-- Prinsip (spesifikasi §7.1 + §7.6):
--   * Report = identitas riset berkelanjutan; Edition = satu versi isi.
--   * Claim/section/figure terikat ke edition — lintas edition DITOLAK
--     dengan composite FK, bukan hanya FK sederhana.
--   * Snapshot/dataset append-only; paper terbit tidak hard-delete.
--   * RLS AKTIF tanpa policy publik = deny-by-default (P0a exit gate);
--     policy reader ditambahkan bersama gelombang katalog (P0c).
--   * USER mengacu auth.users Supabase (identitas yang sudah ada) —
--     BUKAN identitas kedua.

-- --------------------------------------------------------------------
-- 1. WORKSPACE + MEMBERSHIP + GRANT (akses, §7.4)
-- --------------------------------------------------------------------
create table if not exists public.research_workspaces (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    kind text not null default 'internal' check (kind in ('internal', 'team')),
    created_at timestamptz not null default now()
);

create table if not exists public.research_memberships (
    user_id uuid not null references auth.users(id) on delete cascade,
    workspace_id uuid not null references public.research_workspaces(id) on delete cascade,
    role text not null default 'member' check (role in ('owner', 'editor', 'reviewer', 'member')),
    active boolean not null default true,
    created_at timestamptz not null default now(),
    primary key (user_id, workspace_id)
);

create table if not exists public.research_grants (
    id uuid primary key default gen_random_uuid(),
    -- XOR: tepat satu subject — user ATAU workspace (spesifikasi §7.4)
    user_id uuid references auth.users(id) on delete cascade,
    workspace_id uuid references public.research_workspaces(id) on delete cascade,
    capability text not null,
    packs jsonb not null default '[]'::jsonb,
    valid_from timestamptz not null default now(),
    valid_until timestamptz,
    quota_policy jsonb,
    granted_by uuid references auth.users(id),
    revoked_at timestamptz,
    created_at timestamptz not null default now(),
    constraint grants_single_subject check ((user_id is null) <> (workspace_id is null))
);
create index if not exists idx_research_grants_subject on public.research_grants(user_id, workspace_id, valid_until);

create table if not exists public.research_usage (
    id uuid primary key default gen_random_uuid(),
    grant_id uuid not null references public.research_grants(id) on delete cascade,
    user_id uuid references auth.users(id),
    job_id uuid,
    action text not null,
    period_key text not null,
    quantity int not null default 1,
    idempotency_key text not null unique,
    created_at timestamptz not null default now()
);
create index if not exists idx_research_usage_grant on public.research_usage(grant_id, period_key);

-- --------------------------------------------------------------------
-- 2. SOURCE + SNAPSHOT (bukti, append-only, §7.2)
-- --------------------------------------------------------------------
create table if not exists public.research_sources (
    id uuid primary key default gen_random_uuid(),
    canonical_url text,
    publisher text,
    source_kind text not null,
    rights_summary text,
    redistribution_allowed boolean not null default false,
    created_at timestamptz not null default now()
);
create unique index if not exists idx_research_sources_url on public.research_sources(canonical_url) where canonical_url is not null;

create table if not exists public.research_source_snapshots (
    id uuid primary key default gen_random_uuid(),
    source_id uuid not null references public.research_sources(id) on delete cascade,
    retrieved_at timestamptz not null default now(),
    available_at timestamptz,
    observed_at timestamptz,
    locator_manifest jsonb,
    snapshot_hash text not null,
    private_object_key text,
    revision_label text,
    created_at timestamptz not null default now()
    -- append-only: tidak ada update/delete policy — service role saja
);
create index if not exists idx_research_snapshots_source on public.research_source_snapshots(source_id, retrieved_at);

-- --------------------------------------------------------------------
-- 3. DATASET + CALCULATION RUNS (deterministik, §7.2/§7.5)
-- --------------------------------------------------------------------
create table if not exists public.research_datasets (
    id uuid primary key default gen_random_uuid(),
    snapshot_ids jsonb not null default '[]'::jsonb,
    schema jsonb,
    units jsonb,
    timezone text not null default 'Asia/Jakarta',
    period_start timestamptz,
    period_end timestamptz,
    available_at timestamptz,
    -- observed / derived / illustrative terpisah (Zero Simulation Policy)
    data_mode text not null check (data_mode in ('observed', 'derived', 'illustrative')),
    dataset_hash text not null,
    object_key text,
    quality_report jsonb,
    created_at timestamptz not null default now()
);

create table if not exists public.research_edition_datasets (
    edition_id uuid not null,
    dataset_id uuid not null references public.research_datasets(id),
    purpose text not null,
    primary key (edition_id, dataset_id)
);

create table if not exists public.research_calculation_runs (
    id uuid primary key default gen_random_uuid(),
    edition_id uuid,
    run_type text not null,
    input_dataset_ids jsonb not null default '[]'::jsonb,
    code_hash text not null,
    environment_hash text not null,
    parameters jsonb,
    output_manifest jsonb,
    state text not null default 'queued' check (state in ('queued', 'running', 'succeeded', 'failed')),
    created_at timestamptz not null default now()
);
create index if not exists idx_research_runs_edition on public.research_calculation_runs(edition_id, state);

-- --------------------------------------------------------------------
-- 4. REPORT + EDITION + SECTION + CLAIM + FIGURE (konten, §7.2)
-- --------------------------------------------------------------------
create table if not exists public.research_reports (
    id uuid primary key default gen_random_uuid(),
    slug text not null unique,
    report_type text not null,
    owner_workspace_id uuid references public.research_workspaces(id),
    created_by uuid references auth.users(id),
    latest_published_edition_id uuid,
    created_at timestamptz not null default now()
);

create table if not exists public.research_editions (
    id uuid primary key default gen_random_uuid(),
    report_id uuid not null references public.research_reports(id) on delete cascade,
    edition_no int not null,
    draft_revision int not null default 0,
    schema_version int not null default 1,
    -- lifecycle: draft/review/approved/published/superseded/withdrawn
    state text not null default 'draft' check (state in ('draft', 'review', 'approved', 'published', 'superseded', 'withdrawn')),
    title text not null,
    language text not null default 'id',
    asset_scope jsonb,
    data_cutoff timestamptz,
    issued_at timestamptz,
    content_hash text,
    manifest jsonb,
    supersedes_edition_id uuid references public.research_editions(id),
    correction_reason text,
    created_at timestamptz not null default now(),
    unique (report_id, edition_no)
);
create index if not exists idx_research_editions_state on public.research_editions(state, data_cutoff);

create table if not exists public.research_sections (
    id uuid primary key default gen_random_uuid(),
    edition_id uuid not null references public.research_editions(id) on delete cascade,
    section_key text not null,
    position int not null default 0,
    title text,
    content_blocks jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default now(),
    unique (edition_id, section_key)
);
create index if not exists idx_research_sections_pos on public.research_sections(edition_id, position);
-- id ikut unique per edition agar composite FK lintas-edition (claims/figures) bisa dibuat
create unique index if not exists idx_research_sections_edition_id on public.research_sections(edition_id, id);

create table if not exists public.research_claims (
    id uuid primary key default gen_random_uuid(),
    edition_id uuid not null references public.research_editions(id) on delete cascade,
    section_id uuid not null,
    claim_type text not null check (claim_type in ('fact', 'derived', 'inference', 'scenario', 'illustration')),
    text text not null,
    material boolean not null default false,
    evidence_status text not null default 'missing' check (evidence_status in ('sourced', 'missing', 'pending')),
    calculation_run_id uuid references public.research_calculation_runs(id),
    created_at timestamptz not null default now(),
    -- invariant 1: section harus edition sama (composite FK, bukan FK sederhana)
    foreign key (edition_id, section_id) references public.research_sections(edition_id, id) on delete cascade
);
create index if not exists idx_research_claims_edition on public.research_claims(edition_id, claim_type);

create table if not exists public.research_claim_evidence (
    id uuid primary key default gen_random_uuid(),
    claim_id uuid not null references public.research_claims(id) on delete cascade,
    snapshot_id uuid not null references public.research_source_snapshots(id),
    locator jsonb,
    relation text not null check (relation in ('supports', 'contradicts', 'context')),
    verification_note text,
    created_at timestamptz not null default now(),
    -- duplicate link dicegah (spesifikasi §7.5)
    unique (claim_id, snapshot_id, relation)
);
create index if not exists idx_research_evidence_claim on public.research_claim_evidence(claim_id);
create index if not exists idx_research_evidence_snapshot on public.research_claim_evidence(snapshot_id);

create table if not exists public.research_figures (
    id uuid primary key default gen_random_uuid(),
    edition_id uuid not null references public.research_editions(id) on delete cascade,
    section_id uuid not null,
    calculation_run_id uuid references public.research_calculation_runs(id),
    figure_no int not null,
    kind text not null,
    title text,
    caption text,
    alt_text text,
    spec jsonb,
    asset_key text,
    asset_hash text,
    created_at timestamptz not null default now(),
    unique (edition_id, figure_no),
    foreign key (edition_id, section_id) references public.research_sections(edition_id, id) on delete cascade
);

create table if not exists public.research_figure_datasets (
    figure_id uuid not null references public.research_figures(id) on delete cascade,
    dataset_id uuid not null references public.research_datasets(id),
    series_key text not null,
    primary key (figure_id, dataset_id, series_key)
);

-- --------------------------------------------------------------------
-- 5. REVIEW + FINDING (review manusia wajib, append-only, §7.3)
-- --------------------------------------------------------------------
create table if not exists public.research_reviews (
    id uuid primary key default gen_random_uuid(),
    edition_id uuid not null references public.research_editions(id) on delete cascade,
    reviewer_id uuid references auth.users(id),
    reviewed_content_hash text not null,
    decision text not null check (decision in ('approve', 'request_changes', 'reject')),
    decided_at timestamptz not null default now(),
    independent_review boolean not null default true
    -- append-only: approval berlaku hanya pada hash yang sama
);
create index if not exists idx_research_reviews_edition on public.research_reviews(edition_id, decided_at);

create table if not exists public.research_review_findings (
    id uuid primary key default gen_random_uuid(),
    review_id uuid not null references public.research_reviews(id) on delete cascade,
    section_id uuid,
    claim_id uuid,
    severity text not null check (severity in ('blocker', 'major', 'minor')),
    message text not null,
    resolution_event_id uuid,
    created_at timestamptz not null default now()
);
create index if not exists idx_research_findings_review on public.research_review_findings(review_id, severity);

-- --------------------------------------------------------------------
-- 6. JOB + AGENT RUN + ARTIFACT (bounded agents, §7.3)
-- --------------------------------------------------------------------
create table if not exists public.research_jobs (
    id uuid primary key default gen_random_uuid(),
    edition_id uuid not null references public.research_editions(id) on delete cascade,
    job_type text not null,
    requested_by uuid references auth.users(id),
    requested_content_hash text,
    idempotency_key text not null unique,
    state text not null default 'queued' check (state in ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
    attempt int not null default 0,
    lease_until timestamptz,
    next_retry_at timestamptz,
    error_code text,
    budget jsonb,
    created_at timestamptz not null default now()
);
create index if not exists idx_research_jobs_state on public.research_jobs(state, next_retry_at, lease_until);

create table if not exists public.research_agent_runs (
    id uuid primary key default gen_random_uuid(),
    job_id uuid not null references public.research_jobs(id) on delete cascade,
    role text not null,
    model_version text,
    prompt_hash text not null,
    tool_trace jsonb,
    input_hash text,
    output_manifest jsonb,
    tokens_cost jsonb,
    state text not null default 'running',
    created_at timestamptz not null default now()
    -- append-only; model nullable untuk tahap deterministik
);
create index if not exists idx_research_agent_runs_job on public.research_agent_runs(job_id);

create table if not exists public.research_artifacts (
    id uuid primary key default gen_random_uuid(),
    edition_id uuid not null references public.research_editions(id) on delete cascade,
    job_id uuid references public.research_jobs(id),
    format text not null,
    renderer_version text not null,
    content_hash text not null,
    file_hash text not null,
    object_key text not null,
    size_bytes bigint not null default 0,
    qa_state text not null default 'pending' check (qa_state in ('pending', 'passed', 'failed')),
    qa_report jsonb,
    created_at timestamptz not null default now(),
    unique (edition_id, format, content_hash, renderer_version)
);

-- --------------------------------------------------------------------
-- 7. EVENT + ACCESS POLICY + BOOKMARK (audit, §7.3/§7.4)
-- --------------------------------------------------------------------
create table if not exists public.research_events (
    id uuid primary key default gen_random_uuid(),
    edition_id uuid,
    report_id uuid,
    actor_id uuid,
    event_type text not null,
    payload jsonb,
    occurred_at timestamptz not null default now()
    -- append-only: publish/correction/withdrawal/revision/access changes
);
create index if not exists idx_research_events_edition on public.research_events(edition_id, occurred_at);

create table if not exists public.research_access_policies (
    report_id uuid primary key references public.research_reports(id) on delete cascade,
    visibility text not null default 'internal' check (visibility in ('public', 'subscriber', 'workspace', 'internal')),
    required_packs jsonb not null default '[]'::jsonb,
    preview_edition_id uuid references public.research_editions(id),
    preview_blocks jsonb,
    allow_public_pdf boolean not null default false
);

create table if not exists public.research_bookmarks (
    user_id uuid not null references auth.users(id) on delete cascade,
    report_id uuid not null references public.research_reports(id) on delete cascade,
    last_edition_id uuid,
    last_section_key text,
    updated_at timestamptz not null default now(),
    primary key (user_id, report_id)
);

-- --------------------------------------------------------------------
-- 8. RLS: DENY-BY-DEFAULT (P0a exit gate)
--    Semua tabel riset: RLS aktif, TANPA policy publik. Service role
--    bypasses RLS (backend editorial). Policy reader ditambahkan di P0c
--    sesuai research_access_policies — sebelum itu, non-service = ditolak.
-- --------------------------------------------------------------------
alter table public.research_workspaces enable row level security;
alter table public.research_memberships enable row level security;
alter table public.research_grants enable row level security;
alter table public.research_usage enable row level security;
alter table public.research_sources enable row level security;
alter table public.research_source_snapshots enable row level security;
alter table public.research_datasets enable row level security;
alter table public.research_edition_datasets enable row level security;
alter table public.research_calculation_runs enable row level security;
alter table public.research_reports enable row level security;
alter table public.research_editions enable row level security;
alter table public.research_sections enable row level security;
alter table public.research_claims enable row level security;
alter table public.research_claim_evidence enable row level security;
alter table public.research_figures enable row level security;
alter table public.research_figure_datasets enable row level security;
alter table public.research_reviews enable row level security;
alter table public.research_review_findings enable row level security;
alter table public.research_jobs enable row level security;
alter table public.research_agent_runs enable row level security;
alter table public.research_artifacts enable row level security;
alter table public.research_events enable row level security;
alter table public.research_access_policies enable row level security;
alter table public.research_bookmarks enable row level security;

-- --------------------------------------------------------------------
-- 9. VERIFIKASI
-- --------------------------------------------------------------------
-- Jalankan setelah schema: semua tabel riset harus rls_aktif = true.
select
  tablename,
  rowsecurity as rls_aktif
from pg_tables
where schemaname = 'public' and tablename like 'research_%'
order by tablename;


