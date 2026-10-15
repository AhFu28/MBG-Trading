# BUILD WP1 — Admin dikenali sebagai admin (P0-5, P0-6)

Owner: lead · Tanggal: 2026-10-10 · Task: task-14

## Masalah

Owner yang masuk lewat password cockpit (/api/auth) selalu berakhir sebagai PRO dan terkena layar "Modul Ini Khusus Pro" / "Modul Ini Khusus Legend".

Rantai penyebab:
1. `auth.js:153` (GET) mengembalikan `{ authenticated: true, tier: payload.tier || 'PRO' }` — tanpa `email`, tanpa `isAdmin`.
2. `auth.js:218` (POST) mengembalikan `{ authenticated: true, tier: 'PRO', expiresAt }` dan menandatangani klaim tanpa identitas.
3. `App.jsx:194` menulis `tier: 'pro'` secara tetap dengan `email: body.email || null` → null.
4. `App.jsx:248-250` mencari `account.isAdmin` (tidak ada) atau email cocok (null) → `isAdmin = false`.
5. `App.jsx:274` tidak pernah mengembalikan LEGEND; `App.jsx:277` jatuh ke PRO.
6. `App.jsx:748` `!isAdmin && !canAccess(...)` → true → layar kunci muncul.

## Perubahan

### `frontend/functions/api/auth.js`

- **POST** menandatangani klaim pemilik: `{ authenticated: true, kind: 'owner', role: 'admin', tier: 'LEGEND', expiresAt }`, dan merespons `{ authenticated: true, tier: 'LEGEND', isAdmin: true, expiresAt }`.
- **GET** menghitung `isOwner` lalu merespons `{ authenticated, tier: isOwner ? 'LEGEND' : (payload.tier || 'FREE'), isAdmin: isOwner, email, expiresAt }`.

### `frontend/src/App.jsx`

- Jalur owner (`:194`) berhenti menulis `tier: 'pro'`. Sekarang membaca `tier` dan `isAdmin` dari respons server.

## Batas keamanan (bagian terpenting)

`/api/auth` GET membaca cookie `mbg_jwt` **maupun** `mbg_session`, dan kedua keluarga token itu berbagi ruang cookie. Memberi `isAdmin: true` untuk setiap token yang valid akan **menaikkan setiap pelanggan yang login menjadi admin**.

Karena itu `isOwner` dibatasi:
```js
const isOwner = payload.kind === 'owner' || (payload.kind === undefined && !!payload.tier);
```

| Penerbit token | Klaim | Dianggap owner? |
|---|---|---|
| `auth.js` POST (setelah cek password) | `kind: 'owner'` | **Ya** |
| Token owner lama (sebelum perubahan ini) | tanpa `kind`, ada `tier` | **Ya** — owner tidak perlu login ulang |
| `account/login.js:60` | `kind: 'account'` | Tidak |
| `account/signup.js:68` | `kind: 'account'` | Tidak |

Diverifikasi dengan grep seluruh `frontend/functions`: hanya `auth.js` yang menandatangani tanpa `kind: 'account'`. Karena tanda tangan JWT diverifikasi dengan `JWT_SECRET`, tidak ada pihak lain yang bisa membuat token owner palsu.

## Tes

```
npx vitest run src/components/__tests__/adminAccess.test.jsx \
               src/components/__tests__/lockedModuleScreen.test.js \
               src/services/__tests__/featureAccess.test.js
Test Files  3 passed (3) | Tests  58 passed (58)
```

Tes baru (pengunci regresi): `frontend/src/services/__tests__/ownerAdminSession.test.js` — **8 tes lulus**.
Isinya: klaim `kind: 'owner'` ada; `isAdmin: true` pada respons login; `isAdmin: isOwner` pada respons sesi; `tier: 'PRO'` tidak lagi diterbitkan; token akun tidak bisa dinaikkan; `App.jsx` tidak lagi mengunci `tier: 'pro'`; `App.jsx` membaca `!!body.isAdmin`.
Catatan: assertion negatif dijalankan setelah komentar dibuang, karena dokumentasi di file itu mengutip baris lama `tier: 'PRO'`.

## Sisa risiko

- **Belum diuji di produksi.** Perlu deploy + login owner, lalu pastikan menu Changelog terbuka dan modul Legend tidak lagi menampilkan layar kunci.
- **Sesi lama** tetap aman (jalur token owner lama sudah ditangani), jadi tidak ada paksaan login ulang.
- **Bypass klien masih ada**: `localStorage.mbg_admin_access = 'true'` tetap membuat `isAdmin` true di klien (P1-10). Belum diubah — menunggu keputusan Jendral.
- **Daftar email admin masih ganda** (`App.jsx:250` dan `_shared.js:299-302`) — P1-7, belum diubah.
- **`DEFAULT_PASSWORD_HASH` = sha256("MBG")** (`auth.js:68`) masih menjadi sandi default bila env tidak diset. Ini sudah ada sebelumnya, tetapi **kini lebih berbahaya** karena pemegang sandi owner otomatis menjadi admin. Perlu diputuskan Jendral.
