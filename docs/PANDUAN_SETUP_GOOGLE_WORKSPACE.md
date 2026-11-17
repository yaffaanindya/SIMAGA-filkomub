# PANDUAN LENGKAP INTEGRASI GOOGLE WORKSPACE (GOOGLE SHEETS & DRIVE)
## SISTEM INFORMASI MAGANG DAN ALUMNI (SIMAGA) — FILKOM UNIVERSITAS BRAWIJAYA

Dokumen ini menyediakan panduan teknis langkah-demi-langkah bagi administrator dan pengembang untuk menghubungkan aplikasi web **SIMAGA** ke **Google Sheets sebagai Database Utama (11 Tabel Relasional)** dan **Google Drive sebagai Penyimpanan Berkas Lamaran Mahasiswa (Format PDF)**.

Tersedia dua metode integrasi yang didukung secara penuh:
* **Metode 1 (Rekomendasi Utama — Serverless & Instan):** Menggunakan **Google Apps Script Web App**. Sangat cepat, tanpa biaya, tanpa perlu kartu kredit/Google Cloud Console, dan terhubung langsung dengan izin akun Google Drive & Sheets Anda.
* **Metode 2 (Enterprise / Backend Server):** Menggunakan **Google Cloud Platform (GCP) Service Account** dengan pustaka resmi `googleapis` pada Node.js.

---

## METODE 1: SETUP MENGGUNAKAN GOOGLE APPS SCRIPT (REKOMENDASI INSTAN)

Metode ini memungkinkan Google Sheets dan Google Drive Anda bertindak sebagai RESTful Backend Serverless dalam hitungan menit.

### Langkah 1: Buat Google Spreadsheet Baru
1. Buka peramban dan kunjungi [https://sheets.new](https://sheets.new).
2. Beri nama Spreadsheet di pojok kiri atas: **`SIMAGA_Database_FILKOM_UB`**.
3. Salin **Spreadsheet ID** dari URL browser Anda:
   * Format URL: `https://docs.google.com/spreadsheets/d/`**`[SPREADSHEET_ID_ANDA]`**`/edit`

### Langkah 2: Buka Apps Script Editor
1. Pada menu navigasi Google Sheets, klik **Extensions (Ekstensi)** > **Apps Script**.
2. Beri nama proyek Apps Script: **`SIMAGA_Backend_API`**.

### Langkah 3: Salin Kode Setup dan API
1. Hapus isi berkas default `Code.gs`.
2. Buat file baru di Apps Script dengan mengklik tanda `+` di samping *Files*:
   * Pilih **Script**, beri nama: `Setup`
   * Buka file `google-apps-script/Setup.gs` yang ada pada repository SIMAGA, salin seluruh kodenya, lalu tempelkan ke file `Setup.gs`.
3. Pada file `Code.gs`:
   * Buka file `google-apps-script/Code.gs` dari repository SIMAGA, salin seluruh kodenya, lalu tempelkan ke file `Code.gs`.
4. Klik tombol **Save (Simpan / Ikon Disket)**.

### Langkah 4: Jalankan Inisialisasi Otomatis (11 Sheets & Drive Storage)
1. Pada bilah atas Apps Script editor, pilih fungsi **`setupDatabase`** pada dropdown fungsi yang akan dijalankan.
2. Klik tombol **Run (Jalankan)**.
3. Google akan meminta **Authorization Required (Otorisasi Diperlukan)**:
   * Klik **Review Permissions (Tinjau Izin)**.
   * Pilih akun Google Anda.
   * Jika muncul peringatan *"Google hasn't verified this app"*, klik **Advanced (Lanjutan)** > klik **Go to SIMAGA_Backend_API (unsafe)**.
   * Klik **Allow (Izinkan)**.
4. Periksa log eksekusi. Skrip akan secara otomatis:
   * Membuat ke-11 lembar kerja (*sheets*): `pengguna`, `mahasiswa`, `alumni`, `admin`, `mitra_industri`, `lowongan`, `pendaftaran`, `berkas_persyaratan`, `kuesioner`, `riwayat_pengingat`, `notifikasi`.
   * Memberi warna header hijau zamrud resmi FILKOM UB (`#143E35`), teks tebal putih, *freeze header row*, dan *auto-fit column width*.
   * Mengisi data *seed / dummy* awal yang realistis untuk ke-4 peran pengguna (Mahasiswa Bambang, Mitra Carmenita, Alumni Yaffa, dan Admin Dina).
   * Membuat folder root Google Drive **`SIMAGA_Storage`** dan mengatur izin akses lihat (*view permission*) untuk tautan berkas pendaftaran.
5. Kembali ke tab Google Sheets Anda dan saksikan seluruh 11 tab relasional telah siap digunakan!

### Langkah 5: Publikasikan sebagai Web App (RESTful API Endpoint)
1. Di Apps Script editor, klik tombol biru **Deploy (Terapkan)** di pojok kanan atas > pilih **New deployment (Penerapan baru)**.
2. Klik ikon gerigi (Select type) > pilih **Web app**.
3. Konfigurasikan formulir:
   * **Description:** `SIMAGA Production Web App API v1.0`
   * **Execute as (Jalankan sebagai):** `Me (email-anda@gmail.com)`
   * **Who has access (Siapa yang memiliki akses):** `Anyone (Siapa saja)`
4. Klik **Deploy (Terapkan)**.
5. Salin **Web app URL** yang muncul (format: `https://script.google.com/macros/s/AKfycb.../exec`).

### Langkah 6: Hubungkan ke Antarmuka Web SIMAGA
1. Buka aplikasi web SIMAGA di browser Anda.
2. Klik tombol **Integrasi Google Sheets & Drive** di pojok kanan atas navbar.
3. Pada pilihan **Mode Eksekusi**, pilih `Direct Google Apps Script Web App`.
4. Tempelkan URL Web App yang telah disalin ke kolom **URL Google Apps Script Web App**.
5. Klik **Simpan Pengaturan**.
6. Selesai! Seluruh aksi login, pendaftaran magang, pengunggahan 3 file PDF ke Google Drive, kuesioner Tracer Study, kurasi lowongan, hingga validasi anomali sekarang tersinkronisasi secara *real-time* ke Google Sheets dan Google Drive Anda.

---

## METODE 2: SETUP MENGGUNAKAN GOOGLE CLOUD SERVICE ACCOUNT (NODE.JS SERVER)

Jika Anda ingin menjalankan backend Node.js mandiri yang berkomunikasi langsung dengan Google API melalui server Anda sendiri:

### Langkah 1: Buat Proyek di Google Cloud Console
1. Buka [https://console.cloud.google.com](https://console.cloud.google.com).
2. Buat proyek baru dengan nama: **`SIMAGA FILKOM UB`**.

### Langkah 2: Aktifkan API yang Dibutuhkan
1. Di menu navigasi kiri, buka **APIs & Services** > **Library**.
2. Cari dan aktifkan:
   * **Google Sheets API** (klik *Enable*)
   * **Google Drive API** (klik *Enable*)

### Langkah 3: Buat Service Account & Kunci JSON
1. Buka **APIs & Services** > **Credentials**.
2. Klik **Create Credentials** > pilih **Service Account**.
3. Beri nama: `simaga-backend-service`.
4. Berikan peran (*Role*): **Editor**.
5. Setelah dibuat, klik nama Service Account tersebut > masuk ke tab **Keys**.
6. Klik **Add Key** > **Create new key** > pilih format **JSON**.
7. File JSON kunci akan terunduh ke komputer Anda.
8. Ubah nama file tersebut menjadi **`credentials.json`** dan letakkan di dalam folder `server/credentials.json` pada repositori SIMAGA.
9. Catat **client_email** dari Service Account tersebut (contoh: `simaga-backend-service@simaga-filkom-ub.iam.gserviceaccount.com`).

### Langkah 4: Bagikan Google Sheet dan Folder Drive ke Service Account
1. Buka file Google Spreadsheet Anda di Google Drive.
2. Klik tombol **Share (Bagikan)** di pojok kanan atas.
3. Tempelkan alamat surel Service Account (`simaga-backend-service@...`).
4. Atur peran sebagai **Editor**, hapus centang *Notify people*, lalu klik **Share**.
5. Buka Google Drive, buat folder bernama **`SIMAGA_Storage`**, lalu bagikan juga folder tersebut ke email Service Account dengan peran **Editor**.

### Langkah 5: Konfigurasi File Environment `.env`
1. Di folder `server/`, buat file bernama `.env` berdasarkan salinan `.env.example`:
```env
PORT=3000
GOOGLE_INTEGRATION_MODE=service_account
SPREADSHEET_ID=[MASUKKAN_SPREADSHEET_ID_ANDA]
GOOGLE_SERVICE_ACCOUNT_KEY=./server/credentials.json
```

### Langkah 6: Jalankan Inisialisasi Otomatis via Terminal
Buka terminal dan jalankan skrip berikut:
```powershell
npm run init-sheets
```
Skrip ini akan menghubungkan ke Spreadsheet ID Anda, membuat ke-11 tab relasional dengan header lengkap, dan menyuntikkan data *seed* awal untuk 4 aktor.

### Langkah 7: Jalankan Server SIMAGA
```powershell
npm start
```
Akses aplikasi melalui peramban: `http://localhost:3000`.

---

## SPESIFIKASI PENYIMPANAN BERKAS GOOGLE DRIVE (`SIMAGA_Storage`)

Struktur penyimpanan file PDF pada Google Drive dirancang modular dan terisolasi per pengajuan lamaran:

```
Google Drive (Root)
└── SIMAGA_Storage/                                      <- Folder Induk Utama
    ├── Pendaftaran_REG-20261102-091500/                 <- Subfolder per ID Pendaftaran
    │   ├── cv_bambang_prakoso.pdf                       <- Dokumen CV Pelamar (<= 5 MB)
    │   ├── transkrip_nilai_bambang.pdf                  <- Transkrip Akademik (<= 5 MB)
    │   └── surat_rekomendasi_fakultas_bambang.pdf       <- Rekomendasi Fakultas (<= 5 MB)
    └── Pendaftaran_REG-[ID_BERIKUTNYA]/
        ├── ...
```

Setiap berkas yang tersimpan akan memiliki URL publik Drive (`drive_url`) dan ID berkas unik (`drive_file_id`) yang secara otomatis dicatat ke tab sheet `berkas_persyaratan`. Mitra industri dan admin dapat langsung mengklik tautan tersebut dari dashboard SIMAGA untuk meninjau dokumen pelamar tanpa perlu meminta mahasiswa mengirimkan berkas secara manual via email.
