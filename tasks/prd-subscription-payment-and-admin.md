# PRD: Sistem Pembayaran Manual Pintar, Auth & Admin Approval Desk (MBG Quant VIP)

## 1. Introduction / Overview

MBG Quant Terminal saat ini memiliki hierarki entitlement (GUEST, FREE, PRO/VIP) dan koneksi Supabase yang aktif. Namun, alur monetisasi dan registrasi pengguna saat ini terhambat oleh dua kendala:
1. Pendaftaran akun di Cloudflare Edge mengembalikan status HTTP 503 jika `JWT_SECRET` belum diset di Cloudflare Pages.
2. Halaman langganan (`SubscriptionPage.jsx`) hanya menampilkan nomor rekening BCA dan QRIS statis tanpa adanya alur konfirmasi pembayaran, formulir klaim transfer, maupun panel approval untuk Owner (Jendral Arib & Kamerad Fuad). Saat ini, approval harus dilakukan secara manual via SQL query di Supabase SQL Editor.

Fitur ini membangun **Sistem Pembayaran Manual Pintar dan Admin Approval Desk**:
- Pelanggan dapat mendaftar/masuk dengan aman.
- Pelanggan yang telah mentransfer dapat mengisi formulir konfirmasi pembayaran (nama pengirim, bank/e-wallet asal, nominal, tanggal, dan bukti transfer/catatan).
- Data konfirmasi tersimpan ke tabel Supabase `subscription_requests` dan secara otomatis memicu notifikasi ke WhatsApp Kamerad Fuad / Telegram.
- Halaman Admin Desk terintegrasi khusus untuk Owner (`naufalarib60@gmail.com` dan `ahmfuadi28@gmail.com`) untuk meninjau dan menyetujui (Approve) pembayaran dalam 1 klik, yang langsung mengaktifkan status VIP PRO selama 30 hari via stored procedure `activate_subscription`.

---

## 2. Goals

- **Zero-Friction Registration**: Memastikan pengguna dapat mendaftar dan login akun tanpa error 503.
- **Konfirmasi Pembayaran Mandiri**: Pengguna dapat mengirimkan konfirmasi transfer langsung dari dashboard MBG tanpa harus manual mencari kontak admin.
- **1-Click Admin Approval**: Jendral Arib dan Kamerad Fuad dapat menyetujui permintaan aktivasi VIP langsung dari antarmuka web MBG dalam 1 klik tanpa membuka Supabase SQL Editor.
- **Audit Trail & Keamanan Transaksi**: Setiap permintaan pembayaran tercatat dengan status (`pending`, `approved`, `rejected`), waktu transfer, dan admin approver.
- **Notifikasi Otomatis**: Meminimalkan delay aktivasi dengan dispatch pesan notifikasi otomatis via bridge WhatsApp `wa-masfuad` saat ada pembayaran baru.

---

## 3. User Stories

### US-001: Konfigurasi JWT_SECRET & Edge Session Signing
**Description:** Sebagai pengunjung, saya ingin dapat mendaftar akun baru dan login dengan email serta password agar saya dapat mengakses fitur terminal dengan hak akses tersimpan.

**Acceptance Criteria:**
- [ ] Endpoint `POST /api/account/signup` berhasil membuat user baru di Supabase Auth dan mereturn session cookie `mbg_session`.
- [ ] Endpoint `POST /api/account/login` berhasil mengotentikasi kredensial dan menerbitkan cookie `mbg_session`.
- [ ] Endpoint `GET /api/account/me` mengenali user yang sedang login beserta tier entitlement-nya (`free` atau `pro`).
- [ ] Tidak ada lagi respons HTTP 503 terkait `JWT_SECRET belum diisi`.
- [ ] Typecheck dan unit test `accountApi.test.js` lulus 100%.

### US-002: Formulir Konfirmasi Transfer di SubscriptionPage
**Description:** Sebagai pengguna Free yang telah mentransfer biaya langganan via BCA / QRIS, saya ingin mengisi formulir konfirmasi transfer di web agar admin segera memverifikasi dan mengaktifkan akun VIP saya.

**Acceptance Criteria:**
- [ ] Form konfirmasi transfer tersedia di `SubscriptionPage.jsx` memuat: Nama Rekening Pengirim, Bank/Metode Asal (BCA, Mandiri, BRI, QRIS/GoPay/OVO/Dana), Nominal Transfer (default Rp 149.000), Tanggal Transfer, dan Catatan / Nomor Referensi.
- [ ] Tombol "Kirim Konfirmasi Pembayaran" mengirim data ke endpoint `POST /api/account/payment-confirm`.
- [ ] Data tersimpan di tabel `public.subscription_requests` di Supabase dengan status `pending`.
- [ ] Terdapat status banner bagi pengguna: *"Konfirmasi pembayaran Anda sedang diverifikasi oleh admin (Estimasi 5-15 menit)"*.
- [ ] Typecheck/lint lulus.
- [ ] **[UI stories only]** Verify in browser using dev-browser skill.

### US-003: Notifikasi WhatsApp Otomatis ke Kamerad Fuad
**Description:** Sebagai admin/owner, saya ingin menerima notifikasi instan di WhatsApp saat ada pelanggan yang mengirim bukti pembayaran baru agar aktivasi dapat diproses segera.

**Acceptance Criteria:**
- [ ] Script integrasi bridge WhatsApp (`MbgWaBridge` / `wa-masfuad`) mendeteksi submission pembayaran baru.
- [ ] Pesan dikirim secara aman menggunakan opsi `--file` dengan format ringkas bahasa Inggris/Indonesia (Email user, Metode, Nominal, Waktu).
- [ ] Tidak terjadi spamming atau loop duplikasi notifikasi.

### US-004: Admin Approval Desk di Frontend MBG
**Description:** Sebagai Jendral Arib atau Kamerad Fuad, saya ingin melihat tab/modal rahasia "Admin Approval" saat login dengan email owner agar saya dapat menyetujui pembayaran pelanggan dalam 1 klik.

**Acceptance Criteria:**
- [ ] Menu / Tab "Admin Desk" HANYA terlihat jika email user yang login adalah `naufalarib60@gmail.com` atau `ahmfuadi28@gmail.com`.
- [ ] Menampilkan daftar tabel permintaan pembayaran dengan status `pending` (Email, Nama Pengirim, Metode, Nominal, Waktu Request).
- [ ] Tombol "Approve (30 Hari)" memanggil endpoint `POST /api/account/admin/approve`.
- [ ] Approval mengeksekusi stored procedure `public.activate_subscription(email, 30, note)` di Supabase.
- [ ] Status permintaan terupdate menjadi `approved` dan tier user otomatis ter-upgrade menjadi `pro`.
- [ ] Tombol "Reject" dengan input alasan penolakan jika bukti tidak valid.
- [ ] Typecheck/lint lulus.
- [ ] **[UI stories only]** Verify in browser using dev-browser skill.

---

## 4. Functional Requirements

- **FR-1:** Sistem backend edge wajib menyediakan tabel `public.subscription_requests` di Supabase:
  - `id` (UUID, Primary Key)
  - `user_id` (UUID, Foreign Key ke auth.users)
  - `email` (TEXT, NOT NULL)
  - `sender_name` (TEXT, NOT NULL)
  - `payment_method` (TEXT, NOT NULL)
  - `amount` (NUMERIC, NOT NULL)
  - `notes` (TEXT)
  - `status` (TEXT, DEFAULT 'pending', CHECK in ('pending', 'approved', 'rejected'))
  - `reviewed_by` (TEXT)
  - `created_at` (TIMESTAMPTZ, DEFAULT now())
  - `reviewed_at` (TIMESTAMPTZ)
- **FR-2:** RLS di tabel `subscription_requests`:
  - User biasa hanya bisa `INSERT` permintaan miliknya dan `SELECT` permintaan dengan `user_id = auth.uid()`.
  - Admin (`naufalarib60@gmail.com`, `ahmfuadi28@gmail.com`) memiliki hak akses `SELECT` dan `UPDATE` ke semua baris.
- **FR-3:** Endpoint `POST /api/account/payment-confirm`:
  - Menerima payload `{ senderName, paymentMethod, amount, notes }`.
  - Memeriksa validitas sesi pengguna melalui cookie `mbg_session`.
  - Menyimpan record baru ke `subscription_requests`.
  - Merespons status 201 dengan ID request.
- **FR-4:** Endpoint `GET /api/account/admin/requests`:
  - Memeriksa apakah pemanggil adalah email owner yang terotorisasi.
  - Mengembalikan daftar permintaan pembayaran `pending` terbaru diurutkan dari yang terlama belum diproses.
- **FR-5:** Endpoint `POST /api/account/admin/approve`:
  - Memeriksa otorisasi email admin.
  - Menjalankan fungsi SQL `public.activate_subscription(p_email, p_days, p_note)`.
  - Mengubah status request menjadi `approved` dan mencatat `reviewed_at`.
- **FR-6:** Frontend `SubscriptionPage.jsx` wajib memperbarui state secara reaktif saat request diajukan, menampilkan indikator status `pending`.

---

## 5. Non-Goals (Out of Scope)

- Tidak menggunakan payment gateway pihak ketiga berbayar (Midtrans/Xendit/Tripay) pada fase ini untuk menghindari biaya integrasi dan verifikasi badan usaha/KYC merchant yang rumit.
- Tidak menyimpan file fisik gambar bukti transfer di disk lokal server; bukti transfer difokuskan pada nama pengirim, nominal, nomor referensi mutasi bank, dan opsional link gambar eksternal (Google Drive / Imgur).
- Tidak memodifikasi logika tier engine inti (GUEST, FREE, PRO tetap single source of truth di `featureAccess.js`).

---

## 6. Design & UI Considerations

- **Integrasi Warna & Gaya:** Mengikuti tema dark cyber-terminal MBG (latar `#0b0f19`, aksen emerald `#10b981` untuk tombol aksi, aksen gold `#f59e0b` untuk status pending, dan slate `#64748b` untuk border).
- **Komponen Form:** Gunakan input bergaya terminal konsisten dengan font monospace untuk kode transaksi dan nominal.
- **Admin Desk Placement:** Menu diletakkan di section `ACCOUNT` paling bawah dengan badge khusus `👑 ADMIN` sehingga tidak membingungkan pengguna umum.

---

## 7. Technical Considerations

- **Keamanan Edge:** Validasi admin dilakukan di sisi server Cloudflare Edge Functions (`/api/account/admin/*`), BUKAN hanya di sisi klien React.
- **JWT Key Fallback & Secret Rotation:** Dukungan multi-layer key resolution agar terminal tidak crash jika salah satu env var belum direfresh.
- **Stored Procedure Supabase:** Memanfaatkan fungsi database `activate_subscription(p_email, p_days, p_note)` yang sudah ada dan teruji di Supabase schema.

---

## 8. Success Metrics

- Pengguna baru dapat mendaftar akun dan login dalam waktu kurang dari 30 detik.
- Formulir konfirmasi pembayaran dapat diselesaikan pengguna dalam kurang dari 1 menit.
- Owner dapat memverifikasi dan menyetujui aktivasi VIP hanya dengan 1 klik (kurang dari 5 detik).
- 0% error 503 pada alur registrasi dan login.

---

## 9. Open Questions & Action Items

1. **Pengaturan Cloudflare Pages Secret**: Menjalankan inject `JWT_SECRET` ke Cloudflare Pages atau menyediakan token CLI.
2. **Eksekusi DDL Migration**: Menambahkan tabel `public.subscription_requests` ke Supabase via Management API token `sbp_...` yang sudah terverifikasi aktif.
