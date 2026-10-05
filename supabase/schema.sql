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
