# SIMAGA (Sistem Informasi Magang dan Alumni / Tracer Study)
### Fakultas Ilmu Komputer Universitas Brawijaya (FILKOM UB)

> **Proyek Rekayasa Sistem Informasi (Kelompok 8 - FILKOM UB 2026)**  
> **Backend Utama:** Google Sheets (11 Lembar Kerja Relasional)  
> **Penyimpanan Berkas (PDF):** Google Drive Storage (`SIMAGA_Storage`)  
> **UI Aesthetic:** Academic Prestige (Terinspirasi Desain Nuova Edile Costanza & Identitas Resmi FILKOM UB)

---

## 🌟 Fitur Utama & Kesesuaian Spesifikasi

1. **Database Relasional Google Sheets (11 Sheets):**
   * `pengguna`, `mahasiswa`, `alumni`, `admin`, `mitra_industri`, `lowongan`, `pendaftaran`, `berkas_persyaratan`, `kuesioner`, `riwayat_pengingat`, `notifikasi`.
   * Skrip inisialisasi otomatis (`google-apps-script/Setup.gs` dan `server/scripts/init_sheets.js`) membuat seluruh tab, format header hijau zamrud FILKOM (`#143E35`), dan data seed awal untuk 4 aktor.
2. **Penyimpanan Berkas Google Drive (`SIMAGA_Storage`):**
   * Subfolder terisolasi otomatis per pendaftaran (`Pendaftaran_{id_pendaftaran}/`).
   * Validasi ketat format `.pdf` dan batas ukuran $\le 5$ MB (`5120 KB`) untuk 3 dokumen wajib: **CV**, **Transkrip Nilai Akademik Terbaru**, dan **Surat Rekomendasi Fakultas**.
   * Link publik Drive (`drive_url`) dan file ID (`drive_file_id`) tersimpan di sheet `berkas_persyaratan` dan dapat langsung ditinjau oleh Mitra Industri & Admin.
3. **Autentikasi & Hak Akses Berbasis Peran (RBAC - UC-16):**
   * **Mahasiswa (MHS):** Cari lowongan magang terkurasi, mendaftar dengan upload 3 PDF, pantau linimasa seleksi real-time.
   * **Alumni (ALM):** Lowongan kerja fresh graduate, kuesioner Tracer Study dinamis 3 tahap, simpan draf, unduh tanda terima PDF berstempel resmi dan QR Code.
   * **Mitra Industri (MIN):** Ajukan lowongan baru dengan validasi tanggal, tinjau berkas pelamar via link Drive, perbarui status seleksi bertahap disertai catatan interview.
   * **Admin Career & Internship (ADM):** Kurasi lowongan mitra (setujui/tolak dengan catatan revisi), pantau analitik IKU 1 real-time, validasi responden dengan auto-flagging anomali gaji, kirim email pengingat massal, dan ekspor laporan ke Excel (.xlsx) serta PDF.

---

## 🚀 Panduan Memulai Cepat (Quick Start)

### 1. Menjalankan Server Lokal (Node.js)
Pastikan Anda berada di direktori proyek `e:\SIMAGA`:
```powershell
# Jalankan server SIMAGA
npm start
```
Buka browser dan akses: **`http://localhost:3000`**

### 2. Kredensial Akun Uji Coba (Demo 1-Klik)
Sistem menyediakan tombol **Pilih Akun Demo** pada form login untuk memudahkan pengujian:
* **Mahasiswa (MHS):** `bambang@student.ub.ac.id` / `bambang123`
* **Alumni (ALM):** `yaya@alumni.ub.ac.id` / `yaya123`
* **Mitra Industri (MIN):** `carmen@techindo.com` / `mitra123`
* **Admin Fakultas (ADM):** `dina@ub.ac.id` / `admin123`

---

## 📁 Struktur Berkas Proyek

```
e:\SIMAGA\
├── google-apps-script/
│   ├── Code.gs                   # Backend Web App API Google Apps Script (doGet & doPost)
│   └── Setup.gs                  # Skrip inisialisasi otomatis 11 Sheet & Drive Storage
├── server/
│   ├── config/
│   │   └── google.js             # Konfigurasi Google Sheets & Drive API Client
│   ├── scripts/
│   │   └── init_sheets.js        # Setup script CLI via Service Account
│   ├── services/
│   │   ├── sheetsService.js      # Layanan CRUD 11 Sheet & Data Cache
│   │   ├── driveService.js       # Pengelolaan upload & subfolder Google Drive
│   │   └── pdfService.js         # Generator Dokumen PDF Resmi ber-QR Code
│   ├── credentials.example.json  # Template kunci Service Account
│   ├── .env.example              # Template variabel lingkungan
│   └── server.js                 # Express.js REST API Server
├── public/
│   ├── index.html                # Single Page Application Utama SIMAGA
│   ├── css/
│   │   └── style.css             # Tema styling Academic Prestige FILKOM UB
│   └── js/
│       ├── data-mock.js          # Skema data lokal & state offline
│       ├── api.js                # Klien API terpadu (Apps Script / Node / Mock)
│       ├── pdf-generator.js      # Client-side PDF & QR Code Canvas engine
│       ├── auth.js               # Autentikasi sesi & kontrol hak akses
│       ├── mhs.js                # Modul mahasiswa (Katalog, Pendaftaran, Riwayat)
│       ├── alm.js                # Modul alumni (Tracer Study, Bukti QR)
│       ├── min.js                # Modul mitra industri (Publikasi, Review Pelamar)
│       ├── adm.js                # Modul admin (Kurasi, Analitik IKU 1, Validasi)
│       └── app.js                # Router dan pengendali aplikasi
├── docs/
│   ├── PANDUAN_SETUP_GOOGLE_WORKSPACE.md  # Panduan setup langkah-demi-langkah
│   └── ARSITEKTUR_SIMAGA.md               # Dokumentasi arsitektur perangkat lunak
├── package.json
└── README.md
```

---

## 📖 Dokumentasi Lengkap
* Baca [PANDUAN_SETUP_GOOGLE_WORKSPACE.md](file:///e:/SIMAGA/docs/PANDUAN_SETUP_GOOGLE_WORKSPACE.md) untuk panduan integrasi ke Google Spreadsheet dan Google Drive Anda.
* Baca [ARSITEKTUR_SIMAGA.md](file:///e:/SIMAGA/docs/ARSITEKTUR_SIMAGA.md) untuk detail Use Case, Activity Diagram, dan Sequence Diagram sistem.

---
**Pengembang:** Kelompok 8 Praktikum Rekayasa Sistem Informasi (S1 Sistem Informasi, FILKOM UB 2026)
