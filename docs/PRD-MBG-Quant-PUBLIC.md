# MBG Quant: Ringkasan Produk

**Dokumen:** Gambaran produk untuk diskusi
**Versi:** 1.0
**Status:** Ringkas, bukan dokumen teknis

---

## Apa Ini

MBG Quant adalah terminal intelijen pasar. Bukan aplikasi sinyal biasa, bukan
grup telegram berbayar.

Bedanya begini. Kalau orang mau trading, biasanya mereka buka banyak tab:
satu buat grafik, satu buat berita, satu buat kalender ekonomi, satu buat
lihat pergerakan bandar. Lalu mereka gabungkan sendiri di kepala.

MBG Quant menggabungkan semuanya jadi satu layar. Dan yang lebih penting,
setiap angka di layar itu sudah melewati proses analisa, jadi yang muncul
bukan data mentah, tapi kesimpulan yang bisa langsung dipakai.

Satu terminal. Lima kelas aset. Satu cara baca.

---

## Masalah yang Dipecahkan

**Pertama, informasi terpecah.**
Trader pemula buang waktu berpindah-pindah aplikasi. Trader berpengalaman
punya banyak alat, tapi tidak ada yang menyatukan.

**Kedua, data tanpa kesimpulan.**
Berita itu berlimpah. Yang langka adalah jawaban atas pertanyaan: "jadi
saya harus apa?" Harga yang bergerak naik itu fakta. Apakah itu awal tren
atau jebakan, itu yang butuh analisa.

**Ketiga, sinyal tanpa tanggung jawab.**
Banyak layanan kasih sinyal tanpa level risiko, tanpa batas pembatalan,
tanpa alasan. Kalau sinyalnya salah, tidak ada yang bisa dipelajari.

**Keempat, pasar tidak berdiri sendiri.**
Pergerakan saham lokal dipengaruhi oleh yield obligasi global, kurs dolar,
dan harga komoditas. Kalau dilihat terpisah, hubungan sebab-akibatnya hilang.

---

## Prinsip yang Dipegang

Ini yang membedakan MBG Quant dari yang lain. Bukan fiturnya, tapi aturannya.

### Kami tidak mengarang angka

Kalau data tidak tersedia, layar menampilkan tanda kosong. Bukan angka
perkiraan. Bukan nilai default yang kelihatan masuk akal.

Ini terdengar sepele, tapi tidak. Terminal yang menampilkan sebuah angka
selalu terbaca seolah angka itu hasil pengukuran. Kalau ternyata bukan,
pembaca mengambil keputusan di atas dasar yang tidak ada. Lebih baik panel
kosong dan jujur, daripada penuh tapi menyesatkan.

Aturan itu berlaku di seluruh sistem, tanpa pengecualian.

### Fakta dipisahkan dari opini

Setiap kartu analisa membedakan dua hal:

- **Fakta:** harga penutupan resmi, volume, aliran dana asing. Ini tercatat.
- **Opini:** dugaan arah harga, skenario, rasio risiko. Ini probabilitas.

Keduanya disajikan, tapi tidak dicampur. Pembaca selalu tahu mana yang
tercatat dan mana yang diperkirakan.

### Akurasi mengalahkan kenyamanan

Kalau model analisa gagal, sistem bilang gagal. Tidak menyajikan hasil lama
seolah-olah masih baru, dan tidak menyajikan tebakan seolah-olah hasil
hitungan.

### Keputusan tetap milik pengguna

Tidak ada klaim "pasti profit". Yang disediakan adalah analisa, level batas
risiko, dan alasan. Eksekusi dan tanggung jawab tetap di pengguna.

---

## Cakupan Pasar

Lima kelas aset dalam satu terminal:

| Kelas Aset | Isi |
|---|---|
| Saham Indonesia | Emiten bursa lokal, termasuk emiten dividen dan grup konglomerasi |
| Kripto | Spot dan futures, disatukan dalam satu meja |
| Saham Amerika | Emiten besar Wall Street |
| Forex | Pasangan mata uang utama |
| Komoditas | Emas, minyak, dan energi strategis |

Semuanya disajikan seragam. Jadi kalau pengguna paham cara baca satu kelas
aset, dia otomatis paham cara baca yang lain.

---

## Kemampuan Utama

### 1. Rencana Trading Harian

Bukan sekadar daftar koin yang naik. Setiap rencana berisi:

- Level masuk yang terukur
- Batas kerugian (stop loss)
- Target keuntungan
- Rasio risiko terhadap imbalan
- Alasan di baliknya
- Kondisi yang membatalkan skenario

Poin terakhir yang paling sering dilupakan layanan lain. Setiap rencana
menyebutkan kapan dirinya salah.

### 2. Arena Agen Otonom

Sejumlah agen trading otomatis berjalan terus-menerus, masing-masing dengan
karakter strategi berbeda. Ada yang mengikuti tren, ada yang mencari
pembalikan arah, ada yang menunggu momen berita.

Setiap agen punya modal sendiri dan bisa gagal sendiri. Kalau satu agen
mengalami kerugian besar, dia berhenti dan digantikan generasi berikutnya
yang membawa pelajaran dari kegagalan sebelumnya.

Ini cara kami menguji strategi pada kondisi pasar nyata tanpa mempertaruhkan
uang siapa pun, dan hasilnya terbuka untuk dilihat pengguna.

### 3. Pelacak Aliran Dana Besar

Pasar digerakkan modal besar. Bagian ini menunjukkan ke mana uang besar
bergerak:

- Aliran dana asing masuk atau keluar
- Jejak broker besar yang mengakumulasi atau mendistribusi
- Deteksi fase akumulasi tersembunyi sebelum harga bergerak
- Pergerakan dompet besar di jaringan kripto

### 4. Analisa Makro dan Risiko

Pasar lokal tidak bergerak sendiri. Bagian ini menunjukkan hubungannya:

- Pergerakan obligasi global dan indeks dolar
- Harga komoditas strategis
- Jadwal rilis data ekonomi penting
- Peta risiko geopolitik dari berita yang masuk

Yang terakhir ini baru saja dihidupkan. Sistem membaca berita terkini dan
menyimpulkan tingkat risiko global secara otomatis.

### 5. Berita dengan Konteks

Berita pasar tersedia, tapi tidak berhenti di judul. Setiap berita dikaitkan
dengan sektor dan emiten yang terdampak, plus ringkasan yang bisa dibaca
orang awam.

### 6. Ruang Belajar

Materi kuantitatif, matriks korelasi antar aset, dan lab pengujian strategi.
Pengguna bisa melihat bagaimana sebuah strategi berperilaku di data masa lalu
sebelum mempercayainya.

### 7. Terminal Trading

Meja eksekusi lengkap: grafik, order book, form order, dan manajemen posisi.
Termasuk simulator untuk latihan tanpa risiko dana nyata.

### 8. Tampilan dan Bahasa

Mode gelap dan terang, lima bahasa, dan tampilan yang bisa disederhanakan
untuk pengguna baru.

---

## Yang Sengaja Tidak Ditampilkan

Bagian ini sama pentingnya dengan daftar fitur.

Ada beberapa data yang umum diminta trader tapi tidak kami sediakan, karena
sumber publik yang kredibel tidak tersedia. Di antaranya:

- Aliran dana masuk keluar produk ETF
- Data likuidasi pasar
- Konten komunitas dan media sosial

Kami memilih mengosongkan panel itu daripada mengisinya dengan angka
perkiraan. Kalau nanti sumbernya ada, baru diisi.

---

## Cara Kerja Secara Garis Besar

Tiga lapisan:

**Pengumpulan.** Sistem menarik data pasar, berita, dan indikator ekonomi
secara berkala. Prosesnya otomatis dan berjalan terjadwal.

**Analisa.** Data yang terkumpul diolah oleh mesin analisa. Sebagian berupa
hitungan kuantitatif, sebagian lagi pembacaan konteks berita untuk menyusun
kesimpulan.

**Penyajian.** Hasilnya dikirim ke terminal dan tampil sebagai panel yang siap
dibaca. Pengguna tidak perlu mengolah apa pun.

Sistem menyimpan riwayat, jadi kondisi sekarang bisa dibandingkan dengan
sebelumnya.

---

## Untuk Siapa

**Trader aktif** yang butuh satu layar berisi semua konteks, bukan lima
aplikasi terpisah.

**Pemula serius** yang belum bisa membaca grafik sendiri tapi mau belajar
dengan data nyata, bukan teori.

**Pengamat pasar** yang ingin tahu aliran dana besar dan hubungan antar pasar
tanpa membangun sistem sendiri.

Yang tidak cocok: orang yang mencari sinyal instan tanpa mau memahami
alasannya.

---

## Kondisi Sekarang

Produk sudah berjalan dan bisa dipakai. Yang sudah ada:

- Lima kelas aset terhubung dengan data langsung
- Rencana trading otomatis untuk pasar lokal dan kripto
- Arena agen otonom berjalan terjadwal
- Analisa makro, risiko, dan aliran dana besar
- Terminal trading dengan grafik dan meja eksekusi
- Sistem akun dengan tingkatan akses

Yang masih dalam pengembangan:

- Penambahan bahasa pada layar yang belum diterjemahkan
- Perluasan cakupan emiten dan instrumen
- Perbaikan berkelanjutan pada kualitas analisa

---

## Catatan Penutup

MBG Quant dibangun dengan satu keyakinan: trader tidak kekurangan data. Mereka
kekurangan kejelasan, dan kekurangan alat yang jujur.

Karena itu aturan pertama kami bukan "tambahkan lebih banyak fitur", tapi
"jangan pernah menampilkan angka yang tidak bisa kami pertanggungjawabkan".

---

*Dokumen ini gambaran produk untuk keperluan diskusi. Rincian teknis,
sumber data, dan metode analisa bersifat internal.*
